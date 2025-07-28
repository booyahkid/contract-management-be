const fileModel = require("./file.model");
const path = require("path");
const fs = require("fs");

exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const contractId = req.params.contractId;
    
    if (!contractId || isNaN(parseInt(contractId))) {
      return res.status(400).json({ message: "Invalid contract ID" });
    }
    
    const fileData = {
      contract_id: contractId,
      file_path: req.file.path,
      original_name: req.file.originalname,
      mime_type: req.file.mimetype,
      size: req.file.size,
    };

    const saved = await fileModel.saveFile(fileData);
    res.status(200).json({ message: "File uploaded", file: saved });
  } catch (err) {
    console.error("Upload file error:", err);
    res.status(500).json({ message: "Upload failed", error: err.message });
  }
};

exports.listFiles = async (req, res) => {
  try {
    const contractId = req.params.contractId;
    const files = await fileModel.getFilesByContract(contractId);
    res.status(200).json(files);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch files" });
  }
};

exports.downloadFile = async (req, res) => {
  try {
    const fileId = req.params.fileId;
    const file = await fileModel.getFileById(fileId);
    if (!file) return res.status(404).json({ message: "File not found" });
    
    const filePath = path.resolve(file.file_path);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "Physical file not found" });
    }
    
    // Set headers for file download
    res.set({
      'Content-Type': file.mime_type || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${file.original_name}"`,
      'Content-Length': file.size
    });
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Download failed" });
  }
};

exports.getFile = async (req, res) => {
  try {
    const fileId = req.params.fileId;
    const file = await fileModel.getFileById(fileId);
    if (!file) return res.status(404).json({ message: "File not found" });
    res.status(200).json(file);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch file" });
  }
};

exports.deleteFile = async (req, res) => {
  try {
    const fileId = req.params.fileId;
    
    if (!fileId || isNaN(parseInt(fileId))) {
      return res.status(400).json({ message: "Invalid file ID" });
    }
    
    // Get file info first to delete the physical file
    const file = await fileModel.getFileById(fileId);
    if (!file) return res.status(404).json({ message: "File not found" });
    
    // Delete from database
    const deletedFile = await fileModel.deleteFile(fileId);
    
    // Delete physical file from filesystem
    try {
      if (fs.existsSync(file.file_path)) {
        fs.unlinkSync(file.file_path);
      }
    } catch (fsError) {
      console.error("Error deleting physical file:", fsError);
      // Continue even if physical file deletion fails
    }
    
    res.status(200).json({ message: "File deleted successfully", file: deletedFile });
  } catch (err) {
    console.error("Delete file error:", err);
    res.status(500).json({ message: "Failed to delete file", error: err.message });
  }
};
