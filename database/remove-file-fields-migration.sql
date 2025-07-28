-- Migration to remove redundant file fields from contracts table
-- Run this only if you have existing data with file_path/file_name

-- Step 1: Create contract_files table if not exists
CREATE TABLE IF NOT EXISTS contract_files (
  id SERIAL PRIMARY KEY,
  contract_id INTEGER REFERENCES contracts(id) ON DELETE CASCADE,
  file_path VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100),
  size INTEGER,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Step 2: Migrate existing file data (if any)
INSERT INTO contract_files (contract_id, file_path, original_name, uploaded_at)
SELECT 
  id,
  file_path,
  COALESCE(file_name, 'Unknown File'),
  created_at
FROM contracts 
WHERE file_path IS NOT NULL AND file_path != '';

-- Step 3: Remove redundant columns
ALTER TABLE contracts DROP COLUMN IF EXISTS file_path;
ALTER TABLE contracts DROP COLUMN IF EXISTS file_name;

-- Verification query
SELECT 'Migration completed successfully' as status;
