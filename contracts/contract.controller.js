const Contract = require('./contract.model');
const RAGService = require('./rag.service');

exports.getAll = async (req, res, next) => {
  try {
    const data = await Contract.getAllContracts();
    res.json(data);
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const data = await Contract.getContractById(req.params.id);
    if (!data) return res.status(404).json({ message: 'Not found' });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    // Create contract in database
    const data = await Contract.createContract(req.body);
    console.log('Contract created in database:', data.id);
    
    // Add to RAG system asynchronously (don't wait for completion)
    RAGService.addToRAG(data).then(ragResult => {
      if (ragResult) {
        console.log('Contract added to RAG system:', data.contract_number);
      }
    }).catch(error => {
      console.error('RAG integration warning:', error.message);
    });
    
    // Return success response
    res.status(201).json({
      ...data,
      rag_integration: 'initiated' // Indicate RAG integration was started
    });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    // Update contract in database
    const data = await Contract.updateContract(req.params.id, req.body);
    if (!data) return res.status(404).json({ message: 'Not found' });
    
    console.log('Contract updated in database:', req.params.id);
    
    // Update in RAG system asynchronously
    RAGService.updateRAG(data).then(ragResult => {
      if (ragResult) {
        console.log('Contract updated in RAG system:', data.contract_number);
      }
    }).catch(error => {
      console.error('RAG update warning:', error.message);
    });
    
    // Return success response
    res.json({
      ...data,
      rag_integration: 'updated'
    });
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    // Get contract data before deletion (for RAG cleanup)
    const contractData = await Contract.getContractById(req.params.id);
    if (!contractData) {
      return res.status(404).json({ message: 'Contract not found' });
    }
    
    // Delete from database
    await Contract.deleteContract(req.params.id);
    console.log('✅ Contract deleted from database:', req.params.id);
    
    // Remove from RAG system asynchronously
    RAGService.deleteFromRAG(contractData.contract_number).then(ragResult => {
      if (ragResult) {
        console.log('✅ Contract removed from RAG system:', contractData.contract_number);
      }
    }).catch(error => {
      console.error('⚠️ RAG deletion warning:', error.message);
    });
    
    res.json({ 
      message: 'Deleted successfully',
      rag_integration: 'removed'
    });
  } catch (err) {
    next(err);
  }
};

// RAG Management Endpoints
exports.syncToRAG = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Get specific contract or all contracts
    let contracts;
    if (id) {
      const contract = await Contract.getContractById(id);
      if (!contract) {
        return res.status(404).json({ message: 'Contract not found' });
      }
      contracts = [contract];
    } else {
      contracts = await Contract.getAllContracts();
    }
    
    // Sync to RAG
    const result = await RAGService.bulkSyncToRAG(contracts);
    
    res.json({
      message: id ? 'Contract synced to RAG' : 'All contracts synced to RAG',
      ...result
    });
    
  } catch (err) {
    next(err);
  }
};

exports.testRAGConnection = async (req, res, next) => {
  try {
    const isConnected = await RAGService.testConnection();
    
    res.json({
      rag_service: isConnected ? 'connected' : 'disconnected',
      ai_service_url: process.env.AI_SERVICE_URL || 'http://127.0.0.1:8001',
      timestamp: new Date().toISOString()
    });
    
  } catch (err) {
    next(err);
  }
};