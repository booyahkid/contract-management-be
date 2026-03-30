# 🚀 IGW Backend API Server

Clean and organized Express.js backend for the Intelligent Gateway contract management system.

## 📁 Project Structure

```
BE/
├── 📄 app.js                    # Express application setup
├── 📄 server.js                 # Server startup configuration
├── 📄 package.json              # Dependencies and scripts
├── 📄 .env                      # Environment variables
│
├── 🔐 auth/                     # Authentication System
│   ├── auth.controller.js       # Login/logout handlers
│   ├── auth.service.js          # JWT token management
│   ├── auth.routes.js           # Auth API endpoints
│   └── auth.validation.js       # Input validation
│
├── 📋 contracts/                # Contract Management
│   ├── contract.controller.js   # CRUD operations
│   ├── contract.model.js        # Database queries
│   ├── contract.routes.js       # Contract endpoints
│   ├── contract.validation.js   # Validation rules
│   ├── dashboard.controller.js  # Analytics & reports
│   ├── dashboard.model.js       # Dashboard queries
│   ├── dashboard.routes.js      # Dashboard endpoints
│   ├── extract.controller.js    # AI text extraction
│   ├── extract.routes.js        # Extraction endpoints
│   ├── extract.service.js       # Extraction logic
│   ├── file.controller.js       # File upload/management
│   ├── file.routes.js           # File endpoints
│   └── rag.service.js           # RAG integration
│
├── 🤖 rag/                      # RAG System Integration
│   ├── rag.controller.js        # RAG chat handlers
│   └── rag.routes.js            # RAG API endpoints
│
├── 🔧 middlewares/              # Express Middlewares
│   ├── auth.middleware.js       # JWT authentication
│   ├── errorHandler.js          # Global error handling
│   └── upload.middleware.js     # File upload handling
│
├── 💾 config/                   # Configuration
│   └── db.js                    # PostgreSQL connection
│
├── 🗃️ database/                 # Database Scripts
│   ├── schema.sql               # Complete database schema
│   ├── dummy-contracts.sql      # Test data
│   └── *.sql                    # Migration scripts
│
├── 🛠️ scripts/                  # Utility Scripts
│   ├── reset-users.js           # User management
│   ├── sync-contracts-to-rag.js # RAG synchronization
│   └── fix-contract-id-types.js # Database maintenance
│
├── 📁 uploads/                  # File Storage
│   ├── contract files (PDFs)
│   └── file_metadata.json
│
└── 📁 docs/                     # Documentation
    └── (moved documentation files)
```

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start production server  
npm start
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Contracts
- `GET /api/contracts` - List contracts
- `GET /api/contracts/:id` - Get contract details
- `POST /api/contracts` - Create contract
- `PUT /api/contracts/:id` - Update contract
- `DELETE /api/contracts/:id` - Delete contract

### Files
- `POST /api/contracts/:id/files` - Upload file
- `GET /api/contracts/:id/files` - List files
- `GET /api/files/:id/download` - Download file

### RAG System
- `POST /api/rag/ask` - Query contracts with AI
- `GET /api/rag/sources` - Get document sources

### Analytics
- `GET /api/contracts/analytics/summary` - Dashboard data

## 🛡️ Security Features

- JWT-based authentication
- Role-based access control (admin, manager, staff, user)
- File upload validation
- Input sanitization
- CORS protection

## 🔧 Configuration

Required environment variables in `.env`:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=igw_contracts
DB_USER=your_user
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret
PORT=3001
```

## 🧪 Testing

Essential scripts for development:
- `scripts/reset-users.js` - Reset user accounts
- `scripts/sync-contracts-to-rag.js` - Sync with AI service

---

**Status:** ✅ Production Ready | **Last Updated:** September 2025
