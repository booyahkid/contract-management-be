# BE Service Notes

## Overview
This is an Express.js backend for contract management, file uploads, extraction, auth, dashboard, and email/scheduler related features.

## Requirements
- Node.js 18+
- PostgreSQL
- npm

## Install
```bash
npm install
```

## Environment
Create a `.env` file in project root with your database and app settings, for example:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=contract_management
JWT_SECRET=your_secret
```

## Run
Development:
```bash
npm run dev
```

Production-like local run:
```bash
npm start
```

## Test
Run all tests:
```bash
npm test
```

Watch mode:
```bash
npm run test:watch
```

Coverage:
```bash
npm run test:coverage
```

## Database
Main schema file:
- `database/schema.sql`

Apply schema to your database before running the API.

## Main Folders
- `auth/` - authentication logic (controller, routes, service, validation)
- `contracts/` - contracts APIs, dashboard, extract, file handling
- `config/` - database connection config
- `middlewares/` - auth, error handling, upload middleware
- `database/` - schema and migration SQL files
- `uploads/` - uploaded files (ignored in git)

## Entry Points
- `server.js`
- `app.js`

## Notes
- File extraction uses `pdf-parse` and `mammoth`.
- AI extraction calls Ollama endpoint at `http://localhost:11434`.
