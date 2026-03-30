const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const db = require('../config/db');

// AI Service configuration
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8001';

// Analytics query handler
const handleAnalyticsQuery = async (question) => {
  try {
    const query = `
      SELECT 
        COUNT(*) as total_contracts,
        SUM(ats_amount) as total_ats,
        SUM(jsl_amount) as total_jsl,
        SUM(subscription_amount) as total_subscription,
        category,
        contract_type
      FROM contracts 
      GROUP BY category, contract_type
      ORDER BY SUM(ats_amount + jsl_amount + subscription_amount) DESC
    `;
    
    const result = await db.query(query);
    const stats = result.rows;
    
    if (stats.length === 0) {
      return {
        answer: "Tidak ada data kontrak yang ditemukan.",
        sources: [],
        confidence: 0
      };
    }

    // Calculate totals
    const totalContracts = stats.reduce((sum, row) => sum + parseInt(row.total_contracts), 0);
    const totalATS = stats.reduce((sum, row) => sum + (parseFloat(row.total_ats) || 0), 0);
    const totalJSL = stats.reduce((sum, row) => sum + (parseFloat(row.total_jsl) || 0), 0);
    const totalSubscription = stats.reduce((sum, row) => sum + (parseFloat(row.total_subscription) || 0), 0);
    const grandTotal = totalATS + totalJSL + totalSubscription;

    let answer = `📊 **Analisis Total Kontrak:**\n\n`;
    answer += `📈 **Ringkasan:**\n`;
    answer += `• **Total Kontrak:** ${totalContracts} kontrak\n`;
    answer += `• **Total Nilai ATS:** Rp ${totalATS.toLocaleString('id-ID')}\n`;
    answer += `• **Total Nilai JSL:** Rp ${totalJSL.toLocaleString('id-ID')}\n`;
    
    if (totalSubscription > 0) {
      answer += `• **Total Subscription:** Rp ${totalSubscription.toLocaleString('id-ID')}\n`;
    }
    
    answer += `• **Grand Total:** Rp ${grandTotal.toLocaleString('id-ID')}\n\n`;
    
    answer += `🏷️ **Per Kategori:**\n`;
    stats.forEach((stat, index) => {
      const categoryTotal = (parseFloat(stat.total_ats) || 0) + (parseFloat(stat.total_jsl) || 0) + (parseFloat(stat.total_subscription) || 0);
      answer += `${index + 1}. **${stat.category}** (${stat.contract_type}): ${stat.total_contracts} kontrak - Rp ${categoryTotal.toLocaleString('id-ID')}\n`;
    });

    return {
      answer,
      sources: [{
        contract_number: "ANALYTICS",
        contract_name: "Contract Analytics",
        vendor: "System Analytics",
        contract_type: "Analytics",
        section_type: "analytics",
        similarity: 1.0,
        excerpt: "Contract analytics and statistics"
      }],
      confidence: 1.0
    };

  } catch (error) {
    console.error('Analytics query error:', error);
    return {
      answer: "Maaf, terjadi kesalahan saat menganalisis data kontrak.",
      sources: [],
      confidence: 0
    };
  }
};

// Contract count query handler
const handleContractCountQuery = async (question) => {
  try {
    const query = `
      SELECT 
        COUNT(*) as total_contracts,
        category,
        COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() as percentage
      FROM contracts 
      GROUP BY category
      ORDER BY COUNT(*) DESC
    `;
    
    const result = await db.query(query);
    const counts = result.rows;
    
    const totalContracts = counts.reduce((sum, row) => sum + parseInt(row.total_contracts), 0);
    
    let answer = `📊 **Jumlah Kontrak:**\n\n`;
    answer += `📈 **Total:** ${totalContracts} kontrak\n\n`;
    answer += `🏷️ **Per Kategori:**\n`;
    
    counts.forEach((count, index) => {
      answer += `${index + 1}. **${count.category}:** ${count.total_contracts} kontrak (${parseFloat(count.percentage).toFixed(1)}%)\n`;
    });

    return {
      answer,
      sources: [{
        contract_number: "COUNT_ANALYTICS",
        contract_name: "Contract Count Analytics",
        vendor: "System Analytics",
        contract_type: "Count Analytics",
        section_type: "count_analytics",
        similarity: 1.0,
        excerpt: "Contract count and distribution"
      }],
      confidence: 1.0
    };

  } catch (error) {
    console.error('Count query error:', error);
    return {
      answer: "Maaf, terjadi kesalahan saat menghitung data kontrak.",
      sources: [],
      confidence: 0
    };
  }
};

// Fallback contract search when AI service is unavailable
const searchContractsDirectly = async (question) => {
  try {
    const lowerQuestion = question.toLowerCase();
    
    // Handle analytics queries first
    if (lowerQuestion.includes('total') && (lowerQuestion.includes('nilai') || lowerQuestion.includes('value'))) {
      return await handleAnalyticsQuery(question);
    }
    
    if (lowerQuestion.includes('berapa') && lowerQuestion.includes('kontrak')) {
      return await handleAnalyticsQuery(question);
    }
    
    // Handle contract count queries
    if (lowerQuestion.includes('jumlah kontrak') || lowerQuestion.includes('total kontrak')) {
      return await handleContractCountQuery(question);
    }

    // Simple keyword-based search in contracts
    const searchTerms = question.toLowerCase()
      .split(/\s+/)
      .filter(term => term.length > 2)
      .filter(term => !['apa', 'yang', 'adalah', 'dari', 'untuk', 'dan', 'atau', 'dengan', 'pada', 'di', 'ke', 'dalam', 'tentang', 'berapa', 'total', 'nilai'].includes(term));

    if (searchTerms.length === 0) {
      return {
        answer: "Silakan berikan pertanyaan yang lebih spesifik tentang kontrak.",
        sources: [],
        confidence: 0
      };
    }

    // Search in contracts table using ILIKE for better compatibility
    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;

    searchTerms.forEach(term => {
      const likePattern = `%${term}%`;
      whereConditions.push(`(
        LOWER(contract_name) ILIKE $${paramIndex} OR
        LOWER(vendor) ILIKE $${paramIndex} OR
        LOWER(contract_number) ILIKE $${paramIndex} OR
        LOWER(category) ILIKE $${paramIndex} OR
        LOWER(notes) ILIKE $${paramIndex}
      )`);
      queryParams.push(likePattern);
      paramIndex++;
    });

    const query = `
      SELECT 
        id, contract_number, contract_name, contract_type, vendor, category,
        department, start_date, end_date, ats_amount, jsl_amount, subscription_amount, notes
      FROM contracts 
      WHERE ${whereConditions.join(' OR ')}
      ORDER BY 
        CASE 
          WHEN LOWER(contract_number) ILIKE $1 THEN 1
          WHEN LOWER(vendor) ILIKE $1 THEN 2
          WHEN LOWER(contract_name) ILIKE $1 THEN 3
          ELSE 4
        END
      LIMIT 5
    `;

    const result = await db.query(query, queryParams);
    const contracts = result.rows;

    if (contracts.length === 0) {
      return {
        answer: `Maaf, saya tidak menemukan kontrak yang relevan dengan "${question}". Coba gunakan kata kunci seperti nomor kontrak, nama vendor, atau kategori.`,
        sources: [],
        confidence: 0
      };
    }

    // Format response
    let answer = `🔍 **Hasil pencarian untuk "${question}":**\n\n`;
    
    if (contracts.length === 1) {
      const contract = contracts[0];
      answer += `📋 **${contract.contract_name}**\n`;
      answer += `🔹 **Nomor:** ${contract.contract_number}\n`;
      answer += `🔹 **Vendor:** ${contract.vendor}\n`;
      answer += `🔹 **Kategori:** ${contract.category}\n`;
      answer += `🔹 **Jenis:** ${contract.contract_type}\n`;
      
      // Format dates properly
      const startDate = contract.start_date ? new Date(contract.start_date).toLocaleDateString('id-ID') : 'N/A';
      const endDate = contract.end_date ? new Date(contract.end_date).toLocaleDateString('id-ID') : 'N/A';
      answer += `🔹 **Periode:** ${startDate} s/d ${endDate}\n`;
      
      answer += `🔹 **Nilai ATS:** Rp ${(contract.ats_amount || 0).toLocaleString('id-ID')}\n`;
      answer += `🔹 **Nilai JSL:** Rp ${(contract.jsl_amount || 0).toLocaleString('id-ID')}\n`;
      if (contract.subscription_amount && contract.subscription_amount > 0) {
        answer += `🔹 **Nilai Subscription:** Rp ${contract.subscription_amount.toLocaleString('id-ID')}\n`;
      }
      answer += `🔹 **Departemen:** ${contract.department || 'N/A'}\n`;
      if (contract.notes) {
        answer += `🔹 **Catatan:** ${contract.notes}\n`;
      }
    } else {
      answer += `📊 **Ditemukan ${contracts.length} kontrak:**\n\n`;
      contracts.forEach((contract, index) => {
        const totalValue = (contract.ats_amount || 0) + (contract.jsl_amount || 0) + (contract.subscription_amount || 0);
        answer += `${index + 1}. **${contract.contract_name}**\n`;
        answer += `   • Vendor: ${contract.vendor}\n`;
        answer += `   • Nomor: ${contract.contract_number}\n`;
        answer += `   • Nilai Total: Rp ${totalValue.toLocaleString('id-ID')}\n\n`;
      });
    }

    const sources = contracts.map(contract => ({
      contract_number: contract.contract_number,
      contract_name: contract.contract_name,
      vendor: contract.vendor,
      contract_type: contract.contract_type,
      section_type: "database_search",
      similarity: 0.8,
      excerpt: `Kontrak dari ${contract.vendor} - ${contract.category}`
    }));

    return {
      answer,
      sources,
      confidence: 0.8
    };

  } catch (error) {
    console.error('Direct search error:', error);
    return {
      answer: "Maaf, terjadi kesalahan saat mencari data kontrak.",
      sources: [],
      confidence: 0
    };
  }
};

exports.askQuestion = async (req, res) => {
  try {
    console.log('RAG Ask request received');
    
    const { question, session_id, max_results = 5, contract_id } = req.body;
    
    if (!question) {
      return res.status(400).json({ message: "Question is required" });
    }

    // First try AI service
    try {
      console.log('Attempting to forward question to AI service...');
      
      const aiResponse = await axios.post(`${AI_SERVICE_URL}/api/ask`, {
        question,
        session_id,
        max_results,
        contract_id
      }, {
        timeout: 10000, // 10 second timeout
      });

      console.log('AI service response received');
      return res.json(aiResponse.data);

    } catch (aiError) {
      console.log('AI service unavailable, using fallback search...');
      
      // Fallback to direct database search
      const fallbackResult = await searchContractsDirectly(question);
      
      return res.json({
        ...fallbackResult,
        session_id: session_id || null,
        fallback_mode: true,
        message: "Using direct database search (AI service unavailable)"
      });
    }

  } catch (error) {
    console.error('RAG Ask error:', error);
    
    return res.status(500).json({ 
      message: "Request failed", 
      error: error.message,
      answer: "Maaf, terjadi kesalahan saat memproses pertanyaan Anda.",
      sources: []
    });
  }
};

exports.searchDocuments = async (req, res) => {
  try {
    console.log('RAG Search request received');
    
    const { query, limit = 5, contract_id } = req.body;
    
    if (!query) {
      return res.status(400).json({ message: "Query is required" });
    }

    console.log('Forwarding search to AI service...');
    
    const aiResponse = await axios.post(`${AI_SERVICE_URL}/api/search`, {
      query,
      limit,
      contract_id
    }, {
      timeout: 30000,
    });

    console.log('AI service search response received');
    
    return res.json(aiResponse.data);

  } catch (aiError) {
    console.error('AI search service error:', aiError.message);
    
    return res.status(500).json({ 
      message: "Search service unavailable", 
      error: aiError.message,
      results: []
    });
  }
};

exports.ingestDocument = async (req, res) => {
  try {
    console.log('RAG Ingest request received');
    
    if (!req.file) {
      console.log('No file uploaded');
      return res.status(400).json({ message: "No file uploaded" });
    }
    
    const { contract_id } = req.body;

    console.log('Forwarding document to AI service for ingestion...');
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream(req.file.path), {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });
    
    if (contract_id) {
      formData.append('contract_id', contract_id);
    }

    const aiResponse = await axios.post(`${AI_SERVICE_URL}/api/ingest`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      timeout: 60000, // 60 second timeout for ingestion
    });

    console.log('AI service ingestion response received');
    
    return res.json(aiResponse.data);

  } catch (aiError) {
    console.error('AI ingestion service error:', aiError.message);
    
    return res.status(500).json({ 
      message: "Document ingestion failed", 
      error: aiError.message 
    });
  }
};

exports.ingestContractData = async (req, res) => {
  try {
    console.log('RAG Contract data ingest request received');
    
    const contractData = req.body;
    
    if (!contractData.contract_id) {
      return res.status(400).json({ message: "Contract ID is required" });
    }

    console.log('Forwarding contract data to AI service...');
    
    const aiResponse = await axios.post(`${AI_SERVICE_URL}/api/ingest-contract`, contractData, {
      timeout: 30000,
    });

    console.log('AI service contract ingestion response received');
    
    return res.json(aiResponse.data);

  } catch (aiError) {
    console.error('AI contract ingestion error:', aiError.message);
    
    return res.status(500).json({ 
      message: "Contract data ingestion failed", 
      error: aiError.message 
    });
  }
};

exports.getIngestedDocuments = async (req, res) => {
  try {
    console.log('RAG Get documents request received');
    
    const aiResponse = await axios.get(`${AI_SERVICE_URL}/api/documents`, {
      timeout: 30000,
    });

    console.log('AI service documents response received');
    
    return res.json(aiResponse.data);

  } catch (aiError) {
    console.error('AI documents service error:', aiError.message);
    
    return res.status(500).json({ 
      message: "Failed to retrieve documents", 
      error: aiError.message,
      documents: []
    });
  }
};

exports.deleteDocument = async (req, res) => {
  try {
    console.log('RAG Delete document request received');
    
    const { documentId } = req.params;
    
    if (!documentId) {
      return res.status(400).json({ message: "Document ID is required" });
    }

    console.log('Forwarding delete request to AI service...');
    
    const aiResponse = await axios.delete(`${AI_SERVICE_URL}/api/documents/${documentId}`, {
      timeout: 30000,
    });

    console.log('AI service delete response received');
    
    return res.json(aiResponse.data);

  } catch (aiError) {
    console.error('AI delete service error:', aiError.message);
    
    return res.status(500).json({ 
      message: "Failed to delete document", 
      error: aiError.message 
    });
  }
};

exports.ragHealthCheck = async (req, res) => {
  try {
    console.log('RAG Health check request received');
    
    const aiResponse = await axios.get(`${AI_SERVICE_URL}/health`, {
      timeout: 10000, // 10 second timeout for health check
    });

    console.log('AI service health response received');
    
    return res.json(aiResponse.data);

  } catch (aiError) {
    console.error('AI health service error:', aiError.message);
    
    return res.status(500).json({ 
      status: "unhealthy",
      message: "AI service unavailable", 
      error: aiError.message,
      services: {
        ollama: { status: "unknown" },
        vector_db: { status: "unknown" },
        ocr: "unknown",
        pdf_converter: "unknown"
      }
    });
  }
};
