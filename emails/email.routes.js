const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const emailController = require('./email.controller');
const authenticateToken = require('../middlewares/auth.middleware');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/email-attachments/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|txt|zip|rar/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('File type not allowed'));
    }
  }
});

// Email management routes
router.post('/send', authenticateToken, upload.array('attachments', 5), emailController.sendEmail);

// Templates - Must come before /:emailId routes
router.get('/templates', authenticateToken, emailController.getTemplates);
router.post('/templates', authenticateToken, emailController.createTemplate);
router.put('/templates/:templateId', authenticateToken, emailController.updateTemplate);
router.delete('/templates/:templateId', authenticateToken, emailController.deleteTemplate);

// Email history and management
router.get('/history/contract/:contractId', authenticateToken, emailController.getEmailHistory);
router.get('/history', authenticateToken, emailController.getAllEmailHistory);
router.get('/:emailId', authenticateToken, emailController.getEmailById);
router.put('/:emailId', authenticateToken, emailController.updateEmail);
router.put('/:emailId/send', authenticateToken, upload.array('attachments', 5), emailController.updateAndSendDraft);
router.delete('/:emailId', authenticateToken, emailController.deleteEmail);

// Contract due notifications
router.get('/contracts/due-soon', authenticateToken, emailController.getContractsDueSoon);
router.post('/contracts/:contractId/due-reminder', authenticateToken, emailController.sendDueReminder);

// User preferences and stats
router.put('/preferences', authenticateToken, emailController.updateNotificationPreferences);
router.get('/stats', authenticateToken, emailController.getEmailStats);

module.exports = router;
