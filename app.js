const express = require('express');
const cors = require('cors');
const app = express();

const authRoutes = require('./auth/auth.routes');
const contractRoutes = require('./contracts/contract.routes');
const fileRoutes = require('./contracts/file.routes');
const extractRoutes = require('./contracts/extract.routes');
const contractDashboardRoutes = require("./contracts/dashboard.routes");

const errorHandler = require('./middlewares/errorhandler');

// Enable CORS for all origins in development
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3002'], // Add both possible frontend ports
  credentials: true
}));

app.use(express.json());
app.use('/api/auth', authRoutes);

// Import contract routes
app.use('/api/contracts', contractRoutes);
app.use('/api/contracts', fileRoutes);
app.use('/api/contracts', extractRoutes);
app.use("/api/contracts", contractDashboardRoutes);

app.use(errorHandler);

module.exports = app;