-- Clean schema with only used tables
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role VARCHAR(20) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contracts table (main table - actively used)
CREATE TABLE IF NOT EXISTS contracts (
  id SERIAL PRIMARY KEY,
  contract_type VARCHAR(50) NOT NULL,
  contract_number VARCHAR(100) NOT NULL,
  contract_name TEXT NOT NULL,
  category VARCHAR(50),
  contract_date DATE,
  start_date DATE,
  end_date DATE,
  ats_amount NUMERIC(18,2),
  jsl_amount NUMERIC(18,2),
  subscription_amount NUMERIC(18,2),
  notes TEXT,
  sub_category VARCHAR(100),
  item VARCHAR(100),
  department VARCHAR(100),
  pic_user_name VARCHAR(100),
  pic_ipm_name VARCHAR(100),
  vendor VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_contracts_contract_number ON contracts(contract_number);
CREATE INDEX IF NOT EXISTS idx_contracts_vendor ON contracts(vendor);
CREATE INDEX IF NOT EXISTS idx_contracts_category ON contracts(category);
CREATE INDEX IF NOT EXISTS idx_contracts_start_date ON contracts(start_date);
CREATE INDEX IF NOT EXISTS idx_contracts_end_date ON contracts(end_date);

-- Insert sample data
INSERT INTO users (name, email, password, role)
VALUES
  ('Admin User', 'admin@example.com', '$2b$10$8Cq7n0W9pHxQ5Dd1zZ3Oje0zT2vZu3uwPdqqpsJbVZMxGz6FkaKGW', 'admin'),
  ('Staff User', 'staff@example.com', '$2b$10$uZKpmwrFOxZJY4FZ3G0kqekV5O6m2DJHEx0I6NO9gW3j.HW1nHf.i', 'user')
ON CONFLICT (email) DO NOTHING;

INSERT INTO contracts (
  contract_type, contract_number, contract_name,
  category, sub_category, item,
  contract_date, start_date, end_date,
  ats_amount, jsl_amount, subscription_amount,
  notes, department, pic_user_name, pic_ipm_name, vendor
) VALUES
  ('Kontrak', 'CN-2024-001', 'Pengadaan Jaringan LAN',
   'IT', 'Network', 'Switch, Router, Kabel',
   '2024-01-10', '2024-02-01', '2025-01-31',
   10000000, 2000000, 0,
   'Untuk kebutuhan jaringan kampus', 'IT Department', 'Budi Setiawan', 'Rina IPM', 'PT Teknologi Nusantara'),

  ('PO', 'PO-2024-002', 'Lisensi Software Akuntansi',
   'Software', 'Accounting', 'Software Akuntansi Tahunan',
   '2024-03-01', '2024-03-15', '2025-03-14',
   0, 0, 15000000,
   'Langganan software keuangan', 'Finance', 'Siti Aminah', 'Doni IPM', 'PT Software Solutions'),

  ('Kontrak', 'CN-2024-003', 'Maintenance Server',
   'IT', 'Hardware', 'Server Maintenance',
   '2024-02-15', '2024-03-01', '2025-02-28',
   5000000, 1000000, 0,
   'Pemeliharaan server data center', 'IT Department', 'Ahmad Rahman', 'Lisa IPM', 'PT Server Care')
ON CONFLICT DO NOTHING;
