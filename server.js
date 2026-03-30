require('dotenv').config();
const app = require('./app');

// Initialize email scheduler
require('./scheduler/email-scheduler');

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Backend API Server running on http://localhost:${PORT}`);
  console.log(`📊 Dashboard endpoints available at http://localhost:${PORT}/api/contracts`);
  console.log(`📧 Email management available at http://localhost:${PORT}/api/emails`);
  console.log(`🔧 AI Extraction service should be running on http://127.0.0.1:8000`);
});