-- Migration to remove unused tables
-- Run this to clean up your existing database

-- Drop unused tables (in correct order due to foreign key constraints)
DROP TABLE IF EXISTS chat_messages;
DROP TABLE IF EXISTS chat_sessions;
DROP TABLE IF EXISTS contract_files;
DROP TABLE IF EXISTS contract_embeddings;

-- Clean up any related indexes that might still exist
DROP INDEX IF EXISTS idx_contract_embeddings_contract_id;
DROP INDEX IF EXISTS idx_chat_messages_session_id;
DROP INDEX IF EXISTS idx_chat_sessions_user_id;
DROP INDEX IF EXISTS idx_contract_embeddings_vector;

-- Add new indexes for better performance on remaining tables
CREATE INDEX IF NOT EXISTS idx_contracts_category ON contracts(category);
CREATE INDEX IF NOT EXISTS idx_contracts_start_date ON contracts(start_date);
CREATE INDEX IF NOT EXISTS idx_contracts_end_date ON contracts(end_date);

-- Confirm remaining tables
SELECT 
    schemaname,
    tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
