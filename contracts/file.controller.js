const path = require("path");
const fs = require("fs");
const axios = require("axios");
const FormData = require('form-data');

// AI Service Configuration
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8001';

// File metadata storage
const METADATA_FILE = path.join(__dirname, "../uploads", "file_metadata.json");

// Helper functions for metadata management
function loadFileMetadata() {
  try {
    if (fs.existsSync(METADATA_FILE)) {
      const data = fs.readFileSync(METADATA_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading file metadata:', error);
  }
  return {};
}

function saveFileMetadata(metadata) {
  try {
    const uploadsDir = path.dirname(METADATA_FILE);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    fs.writeFileSync(METADATA_FILE, JSON.stringify(metadata, null, 2));
  } catch (error) {
    console.error('Error saving file metadata:', error);
  }
}

function addFileToMetadata(fileId, originalName, contractId) {
  const metadata = loadFileMetadata();
  metadata[fileId] = {
    original_name: originalName,
    contract_id: parseInt(contractId), // Ensure contract_id is stored as integer
    uploaded_at: new Date().toISOString(),
    rag_status: {
      ingested: false,
      document_id: null,
      ingestion_date: null,
      error: null
    }
  };
  saveFileMetadata(metadata);
}

// Enhanced function to update RAG status in metadata
function updateFileRAGStatus(fileId, ragStatus) {
  const metadata = loadFileMetadata();
  if (metadata[fileId]) {
    metadata[fileId].rag_status = {
      ...metadata[fileId].rag_status,
      ...ragStatus
    };
    saveFileMetadata(metadata);
  }
}

// File management without database (files stored only in filesystem)
exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const contractId = req.params.contractId;
    
    if (!contractId || isNaN(parseInt(contractId))) {
      return res.status(400).json({ message: "Invalid contract ID" });
    }
    
    // Store file metadata
    addFileToMetadata(req.file.filename, req.file.originalname, contractId);
    
    // Get file metadata and analysis
    const fileInfo = await getFileMetadata(req.file, contractId);
    
    // Analyze PDF if it's a PDF file
    if (req.file.mimetype === 'application/pdf') {
      try {
        console.log(`📄 Processing PDF upload: ${req.file.originalname}`);
        
        // 1. Analyze PDF structure
        const analysis = await analyzePDF(req.file.path);
        fileInfo.pdf_analysis = analysis;
        
        // 2. Extract text content for RAG
        console.log(`🔍 Extracting text from PDF for RAG ingestion...`);
        const textExtraction = await extractPDFText(req.file.path, req.file.filename);
        
        if (textExtraction.success && textExtraction.extracted_text) {
          // 3. Add extracted content to RAG system
          console.log(`🚀 Adding PDF content to RAG system...`);
          const ragIngestion = await addPDFToRAG({
            fileId: req.file.filename,
            contractId: contractId,
            originalName: req.file.originalname,
            extractedText: textExtraction.extracted_text,
            analysis: analysis
          });
          
          fileInfo.rag_integration = ragIngestion;
          
          // Update metadata with RAG status
          if (ragIngestion.success) {
            updateFileRAGStatus(req.file.filename, {
              ingested: true,
              document_id: ragIngestion.document_id,
              ingestion_date: new Date().toISOString(),
              text_length: textExtraction.extracted_text.length
            });
            console.log(`✅ PDF successfully added to RAG system: ${ragIngestion.document_id}`);
          } else {
            updateFileRAGStatus(req.file.filename, {
              ingested: false,
              error: ragIngestion.error,
              ingestion_date: new Date().toISOString()
            });
            console.log(`❌ Failed to add PDF to RAG: ${ragIngestion.error}`);
          }
        } else {
          console.log(`⚠️ Text extraction failed, PDF not added to RAG`);
          updateFileRAGStatus(req.file.filename, {
            ingested: false,
            error: 'Text extraction failed',
            ingestion_date: new Date().toISOString()
          });
        }
        
      } catch (error) {
        console.log('PDF processing failed:', error.message);
        fileInfo.pdf_analysis = { error: 'Analysis failed' };
        fileInfo.rag_integration = { success: false, error: error.message };
        
        updateFileRAGStatus(req.file.filename, {
          ingested: false,
          error: error.message,
          ingestion_date: new Date().toISOString()
        });
      }
    }

    res.status(200).json({ 
      message: "File uploaded successfully", 
      file: fileInfo 
    });
  } catch (err) {
    console.error("Upload file error:", err);
    res.status(500).json({ message: "Upload failed", error: err.message });
  }
};

// Helper function to get enhanced file metadata
async function getFileMetadata(file, contractId) {
  const stats = fs.statSync(file.path);
  
  return {
    id: file.filename,
    contract_id: contractId,
    file_path: file.path,
    original_name: file.originalname,
    mime_type: file.mimetype,
    size: file.size,
    size_formatted: formatFileSize(file.size),
    uploaded_at: new Date().toISOString(),
    file_extension: path.extname(file.originalname).toLowerCase(),
    is_pdf: file.mimetype === 'application/pdf',
    is_image: file.mimetype.startsWith('image/'),
    created_at: stats.birthtime,
    modified_at: stats.mtime
  };
}

// Helper function to analyze PDF
async function analyzePDF(filePath) {
  try {
    const formData = new FormData();
    const fileStream = fs.createReadStream(filePath);
    formData.append('file', fileStream, path.basename(filePath));

    const response = await axios.post(`${AI_SERVICE_URL}/api/analyze-pdf`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      timeout: 30000
    });

    return response.data;
  } catch (error) {
    console.error('PDF analysis error:', error.message);
    return { error: 'PDF analysis failed', message: error.message };
  }
}

// Helper function to extract text from PDF for RAG
async function extractPDFText(filePath, fileName) {
  try {
    console.log(`🔍 Extracting text from: ${fileName}`);
    
    const formData = new FormData();
    const fileStream = fs.createReadStream(filePath);
    formData.append('file', fileStream, fileName);

    const response = await axios.post(`${AI_SERVICE_URL}/api/test-ocr`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      timeout: 60000
    });

    if (response.data && response.data.extracted_text) {
      console.log(`✅ Text extracted successfully: ${response.data.character_count} characters`);
      return {
        success: true,
        extracted_text: response.data.extracted_text,
        extraction_method: response.data.extraction_method,
        character_count: response.data.character_count,
        pages_processed: response.data.pages_processed
      };
    } else {
      return {
        success: false,
        error: 'No text extracted from PDF'
      };
    }

  } catch (error) {
    console.error('PDF text extraction error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Helper function to add PDF content to RAG system
async function addPDFToRAG({ fileId, contractId, originalName, extractedText, analysis }) {
  try {
    console.log(`🚀 Adding PDF to RAG: ${originalName} (Contract: ${contractId})`);
    
    // Create document ID for tracking
    const documentId = `contract_${contractId}_file_${fileId}`;
    
    // Prepare metadata for RAG ingestion
    const metadata = {
      document_id: documentId,
      contract_id: parseInt(contractId),
      file_id: fileId,
      original_filename: originalName,
      document_type: "pdf_file",
      source: "file_upload",
      ingestion_date: new Date().toISOString(),
      file_extension: ".pdf",
      character_count: extractedText.length,
      extraction_method: analysis?.extraction_method || 'unknown',
      searchable_text: `${originalName} ${extractedText.substring(0, 500)}...` // First 500 chars for search
    };
    
    // Prepare text content for RAG
    const ragText = `Document: ${originalName}
Contract ID: ${contractId}
File Type: PDF Document
Upload Date: ${new Date().toISOString()}

Document Content:
${extractedText}`;

    // Send to enhanced ChromaDB ingestion endpoint
    const ragData = {
      text: ragText,
      metadata: metadata,
      document_id: documentId
    };

    const response = await axios.post(`${AI_SERVICE_URL}/api/chroma/ingest-chroma`, ragData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    if (response.data && response.data.success) {
      console.log(`✅ PDF successfully ingested to RAG: ${documentId}`);
      return {
        success: true,
        document_id: documentId,
        message: 'PDF content successfully added to RAG system',
        text_length: extractedText.length,
        rag_response: response.data
      };
    } else {
      return {
        success: false,
        error: 'RAG ingestion returned unsuccessful response',
        response: response.data
      };
    }

  } catch (error) {
    console.error('RAG ingestion error:', error.message);
    return {
      success: false,
      error: error.message,
      details: error.response?.data || 'Unknown error'
    };
  }
}

// Helper function to format file size
function formatFileSize(bytes) {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

exports.listFiles = async (req, res) => {
  try {
    const contractId = parseInt(req.params.contractId);
    const uploadsDir = path.join(__dirname, "../uploads");
    
    if (!fs.existsSync(uploadsDir)) {
      return res.status(200).json([]);
    }
    
    // Load file metadata
    const fileMetadata = loadFileMetadata();
    
    // Read all files from uploads directory and filter by contract ID
    const files = fs.readdirSync(uploadsDir)
      .filter(filename => filename !== 'file_metadata.json' && filename.includes('file-')) // Exclude metadata file and only include uploaded files
      .map(filename => {
        const filePath = path.join(uploadsDir, filename);
        const stats = fs.statSync(filePath);
        const ext = path.extname(filename).toLowerCase();
        
        // Get original name from metadata, fallback to filename
        const metadata = fileMetadata[filename];
        const originalName = metadata ? metadata.original_name : filename;
        const uploadedAt = metadata ? metadata.uploaded_at : stats.birthtime.toISOString();
        const fileContractId = metadata ? metadata.contract_id : null;
        
        return {
          id: filename,
          contract_id: fileContractId,
          file_path: filePath,
          original_name: originalName,
          display_name: originalName, // Add display name for UI
          mime_type: getMimeType(ext),
          size: stats.size,
          size_formatted: formatFileSize(stats.size),
          uploaded_at: uploadedAt,
          modified_at: stats.mtime.toISOString(),
          file_extension: ext,
          is_pdf: ext === '.pdf',
          is_image: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'].includes(ext),
          is_document: ['.pdf', '.doc', '.docx', '.txt', '.rtf'].includes(ext),
          can_preview: ext === '.pdf' || ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'].includes(ext)
        };
      })
      .filter(file => file.contract_id === contractId) // Filter by the requested contract ID
      .sort((a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at)); // Sort by newest first
    
    res.status(200).json(files);
  } catch (err) {
    console.error("List files error:", err);
    res.status(500).json({ message: "Failed to fetch files", error: err.message });
  }
};

// Helper function to get MIME type by extension
function getMimeType(extension) {
  const mimeTypes = {
    '.pdf': 'application/pdf',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.bmp': 'image/bmp',
    '.webp': 'image/webp',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.txt': 'text/plain',
    '.rtf': 'application/rtf'
  };
  return mimeTypes[extension] || 'application/octet-stream';
}

exports.downloadFile = async (req, res) => {
  try {
    const fileId = req.params.fileId;
    const filePath = path.join(__dirname, "../uploads", fileId);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found" });
    }
    
    const stats = fs.statSync(filePath);
    const ext = path.extname(fileId).toLowerCase();
    const mimeType = getMimeType(ext);
    
    // Get original filename or use fileId
    const originalName = fileId.startsWith('file-') ? fileId : fileId;
    
    // Set headers for file download
    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${originalName}"`,
      'Content-Length': stats.size,
      'Cache-Control': 'no-cache',
      'X-File-Size': stats.size,
      'X-File-Type': ext
    });
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    
    fileStream.on('error', (error) => {
      console.error('File stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({ message: 'File streaming failed' });
      }
    });
    
    fileStream.pipe(res);
    
  } catch (err) {
    console.error("Download file error:", err);
    res.status(500).json({ message: "Download failed", error: err.message });
  }
};

exports.getFile = async (req, res) => {
  try {
    const fileId = req.params.fileId;
    const filePath = path.join(__dirname, "../uploads", fileId);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found" });
    }
    
    const stats = fs.statSync(filePath);
    const ext = path.extname(fileId).toLowerCase();
    
    const fileInfo = {
      id: fileId,
      file_path: filePath,
      original_name: fileId,
      mime_type: getMimeType(ext),
      size: stats.size,
      size_formatted: formatFileSize(stats.size),
      uploaded_at: stats.birthtime.toISOString(),
      modified_at: stats.mtime.toISOString(),
      file_extension: ext,
      is_pdf: ext === '.pdf',
      is_image: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'].includes(ext),
      can_preview: ext === '.pdf' || ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'].includes(ext),
      download_url: `/api/contracts/files/${fileId}/download`,
      view_url: `/api/contracts/files/${fileId}/view`
    };
    
    // Add PDF analysis if available and it's a PDF
    if (ext === '.pdf') {
      try {
        const analysis = await analyzePDF(filePath);
        fileInfo.pdf_analysis = analysis;
      } catch (error) {
        fileInfo.pdf_analysis = { error: 'Analysis failed' };
      }
    }
    
    res.status(200).json(fileInfo);
  } catch (err) {
    console.error("Get file error:", err);
    res.status(500).json({ message: "Failed to fetch file", error: err.message });
  }
};

// New endpoint for viewing/previewing files in browser
exports.viewFile = async (req, res) => {
  try {
    const fileId = req.params.fileId;
    const filePath = path.join(__dirname, "../uploads", fileId);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found" });
    }
    
    const stats = fs.statSync(filePath);
    const ext = path.extname(fileId).toLowerCase();
    const mimeType = getMimeType(ext);
    
    // Set headers for viewing in browser
    res.set({
      'Content-Type': mimeType,
      'Content-Length': stats.size,
      'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      'X-File-Name': fileId,
      'X-File-Size': stats.size
    });
    
    // For PDFs and images, allow inline viewing
    if (ext === '.pdf' || mimeType.startsWith('image/')) {
      res.set('Content-Disposition', `inline; filename="${fileId}"`);
    } else {
      res.set('Content-Disposition', `attachment; filename="${fileId}"`);
    }
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    
    fileStream.on('error', (error) => {
      console.error('File stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({ message: 'File streaming failed' });
      }
    });
    
    fileStream.pipe(res);
    
  } catch (err) {
    console.error("View file error:", err);
    res.status(500).json({ message: "File viewing failed", error: err.message });
  }
};

exports.deleteFile = async (req, res) => {
  try {
    const fileId = req.params.fileId;
    const filePath = path.join(__dirname, "../uploads", fileId);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found" });
    }
    
    // Delete physical file from filesystem
    fs.unlinkSync(filePath);
    
    // Remove from metadata
    const metadata = loadFileMetadata();
    delete metadata[fileId];
    saveFileMetadata(metadata);
    
    res.status(200).json({ 
      message: "File deleted successfully", 
      fileId,
      deleted_at: new Date().toISOString()
    });
  } catch (err) {
    console.error("Delete file error:", err);
    res.status(500).json({ message: "Failed to delete file", error: err.message });
  }
};

// Extract text content from document (PDF)
exports.extractText = async (req, res) => {
  try {
    const fileId = req.params.fileId;
    const filePath = path.join(__dirname, "../uploads", fileId);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found" });
    }
    
    const ext = path.extname(fileId).toLowerCase();
    
    if (ext !== '.pdf') {
      return res.status(400).json({ message: "Text extraction only supported for PDF files" });
    }
    
    try {
      // Use AI service for text extraction
      const formData = new FormData();
      const fileBuffer = fs.readFileSync(filePath);
      const blob = new Blob([fileBuffer], { type: 'application/pdf' });
      formData.append('file', blob, fileId);

      const response = await axios.post(`${AI_SERVICE_URL}/api/test-ocr`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000
      });

      res.status(200).json({
        file_id: fileId,
        extracted_text: response.data.extracted_text,
        extraction_method: response.data.extraction_method,
        character_count: response.data.character_count,
        pages_processed: response.data.pages_processed,
        analysis: response.data.analysis,
        extracted_at: new Date().toISOString()
      });

    } catch (aiError) {
      console.error('AI service extraction error:', aiError.message);
      res.status(500).json({ 
        message: "Text extraction failed", 
        error: aiError.message,
        ai_service_available: false
      });
    }
    
  } catch (err) {
    console.error("Extract text error:", err);
    res.status(500).json({ message: "Text extraction failed", error: err.message });
  }
};

// Manually sync existing PDF to RAG system
exports.syncToRAG = async (req, res) => {
  try {
    const fileId = req.params.fileId;
    const filePath = path.join(__dirname, "../uploads", fileId);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found" });
    }
    
    const ext = path.extname(fileId).toLowerCase();
    if (ext !== '.pdf') {
      return res.status(400).json({ message: "Only PDF files can be synced to RAG" });
    }
    
    // Get file metadata
    const fileMetadata = loadFileMetadata();
    const metadata = fileMetadata[fileId];
    
    if (!metadata) {
      return res.status(404).json({ message: "File metadata not found" });
    }
    
    try {
      console.log(`🔄 Manual RAG sync requested for: ${metadata.original_name}`);
      
      // Extract text content
      const textExtraction = await extractPDFText(filePath, fileId);
      
      if (!textExtraction.success || !textExtraction.extracted_text) {
        return res.status(400).json({ 
          message: "Text extraction failed", 
          error: textExtraction.error 
        });
      }
      
      // Add to RAG system
      const ragIngestion = await addPDFToRAG({
        fileId: fileId,
        contractId: metadata.contract_id,
        originalName: metadata.original_name,
        extractedText: textExtraction.extracted_text,
        analysis: { extraction_method: textExtraction.extraction_method }
      });
      
      // Update metadata with RAG status
      if (ragIngestion.success) {
        updateFileRAGStatus(fileId, {
          ingested: true,
          document_id: ragIngestion.document_id,
          ingestion_date: new Date().toISOString(),
          text_length: textExtraction.extracted_text.length
        });
        
        res.status(200).json({
          message: "File successfully synced to RAG system",
          file_id: fileId,
          rag_status: ragIngestion,
          text_extraction: textExtraction
        });
      } else {
        updateFileRAGStatus(fileId, {
          ingested: false,
          error: ragIngestion.error,
          ingestion_date: new Date().toISOString()
        });
        
        res.status(500).json({
          message: "RAG sync failed",
          error: ragIngestion.error
        });
      }
      
    } catch (error) {
      console.error('Manual RAG sync error:', error);
      res.status(500).json({ 
        message: "RAG sync failed", 
        error: error.message 
      });
    }
    
  } catch (err) {
    console.error("Sync to RAG error:", err);
    res.status(500).json({ message: "RAG sync failed", error: err.message });
  }
};

// Get RAG status for a file
exports.getRAGStatus = async (req, res) => {
  try {
    const fileId = req.params.fileId;
    const fileMetadata = loadFileMetadata();
    const metadata = fileMetadata[fileId];
    
    if (!metadata) {
      return res.status(404).json({ message: "File not found" });
    }
    
    res.status(200).json({
      file_id: fileId,
      original_name: metadata.original_name,
      contract_id: metadata.contract_id,
      rag_status: metadata.rag_status || {
        ingested: false,
        document_id: null,
        ingestion_date: null,
        error: 'Status not available'
      }
    });
    
  } catch (err) {
    console.error("Get RAG status error:", err);
    res.status(500).json({ message: "Failed to get RAG status", error: err.message });
  }
};

// Get document thumbnail/preview (for images and PDFs)
exports.getThumbnail = async (req, res) => {
  try {
    const fileId = req.params.fileId;
    const filePath = path.join(__dirname, "../uploads", fileId);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found" });
    }
    
    const ext = path.extname(fileId).toLowerCase();
    
    // For images, return the image itself as thumbnail
    if (['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'].includes(ext)) {
      const stats = fs.statSync(filePath);
      const mimeType = getMimeType(ext);
      
      res.set({
        'Content-Type': mimeType,
        'Content-Length': stats.size,
        'Cache-Control': 'public, max-age=31536000',
        'Content-Disposition': 'inline'
      });
      
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
      return;
    }
    
    // For PDFs, we could generate thumbnails using AI service in the future
    if (ext === '.pdf') {
      return res.status(501).json({ 
        message: "PDF thumbnail generation not yet implemented",
        suggestion: "Use the view endpoint to display the PDF"
      });
    }
    
    res.status(400).json({ message: "Thumbnail not available for this file type" });
    
  } catch (err) {
    console.error("Get thumbnail error:", err);
    res.status(500).json({ message: "Thumbnail generation failed", error: err.message });
  }
};
