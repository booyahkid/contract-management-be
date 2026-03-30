const express = require('express');
const router = express.Router();
const ragController = require('./rag.controller');
const auth = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');

// Health Check (public)
router.get('/health', ragController.ragHealthCheck);

// RAG Chat Routes
router.post('/ask', auth, ragController.askQuestion);
router.post('/search', auth, ragController.searchDocuments);

// Document Ingestion Routes
router.post('/ingest', auth, upload.single('file'), ragController.ingestDocument);
router.post('/ingest-contract', auth, ragController.ingestContractData);

// Document Management Routes
router.get('/documents', auth, ragController.getIngestedDocuments);
router.delete('/documents/:documentId', auth, ragController.deleteDocument);

module.exports = router;
