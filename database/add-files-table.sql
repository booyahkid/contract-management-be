-- Migration to add contract_files table and vendor column
-- Run this if you already have an existing database

-- Add vendor column to contracts table if it doesn't exist
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS vendor VARCHAR(100),
ADD COLUMN IF NOT EXISTS file_path VARCHAR(255),
ADD COLUMN IF NOT EXISTS file_name VARCHAR(255);

-- Create contract_files table
CREATE TABLE IF NOT EXISTS contract_files (
  id SERIAL PRIMARY KEY,
  contract_id INTEGER REFERENCES contracts(id) ON DELETE CASCADE,
  file_path VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100),
  size INTEGER,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_contract_files_contract_id ON contract_files(contract_id);
