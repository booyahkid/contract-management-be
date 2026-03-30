const express = require('express');
const cors = require('cors');
const app = express();

const authRoutes = require('./auth/auth.routes');
const contractRoutes = require('./contracts/contract.routes');
const fileRoutes = require('./contracts/file.routes');
const extractRoutes = require('./contracts/extract.routes');
const contractDashboardRoutes = require("./contracts/dashboard.routes");
const ragRoutes = require('./rag/rag.routes');
const emailRoutes = require('./emails/email.routes');

const errorHandler = require('./middlewares/errorhandler');

// Enable CORS for all origins in development
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3002', 'http://127.0.0.1:3000'], // Add both possible frontend ports
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200 // For legacy browser support
}));

// Add request logging middleware for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  if (req.method === 'POST' && req.path.includes('/files')) {
    console.log('📁 File upload request received');
    console.log('Headers:', req.headers.authorization ? 'Auth present' : 'No auth');
  }
  next();
});

app.use(express.json());
app.use('/api/auth', authRoutes);

// Import contract routes - Order matters!
app.use('/api/contracts', contractDashboardRoutes); // Dashboard routes first
app.use('/api/contracts', fileRoutes);
app.use('/api/contracts', extractRoutes);
app.use('/api/contracts', contractRoutes); // Generic routes last

// RAG routes
app.use('/api/rag', ragRoutes);

// Email management routes
app.use('/api/emails', emailRoutes);

app.use(errorHandler);

module.exports = app;