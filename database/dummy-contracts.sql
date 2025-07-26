-- Insert dummy contract data
INSERT INTO contracts (
  contract_type, contract_number, contract_name,
  category, sub_category, item,
  contract_date, start_date, end_date,
  ats_amount, jsl_amount, subscription_amount,
  notes, department, pic_user_name, pic_ipm_name, vendor
) VALUES 

-- IT Contracts
('Kontrak', 'CN-2024-003', 'Pengadaan Server dan Storage', 
 'IT', 'Infrastructure', 'Dell PowerEdge Server, EMC Storage',
 '2024-02-15', '2024-03-01', '2025-02-28',
 25000000, 5000000, 0,
 'Upgrade infrastruktur server untuk mendukung aplikasi baru', 'IT Department', 'Ahmad Rizki', 'Maria IPM', 'PT. Dell Indonesia'),

('PO', 'PO-2024-004', 'Lisensi Microsoft Office 365',
 'Software', 'Productivity', 'Office 365 Business Premium - 100 Users',
 '2024-03-10', '2024-04-01', '2025-03-31',
 0, 0, 8500000,
 'Langganan tahunan Microsoft Office untuk semua karyawan', 'IT Department', 'Ahmad Rizki', 'David IPM', 'Microsoft Indonesia'),

('Kontrak', 'CN-2024-005', 'Maintenance Jaringan WiFi',
 'IT', 'Network', 'Cisco Access Points, Switch Management',
 '2024-01-20', '2024-02-01', '2025-01-31',
 15000000, 3000000, 0,
 'Pemeliharaan dan monitoring jaringan WiFi kampus', 'IT Department', 'Budi Setiawan', 'Lisa IPM', 'PT. Cisco Networks'),

-- Finance & Admin Contracts
('PO', 'PO-2024-006', 'Software Akuntansi MYOB',
 'Software', 'Finance', 'MYOB Accounting Plus - Multi User',
 '2024-03-05', '2024-03-15', '2025-03-14',
 0, 0, 12000000,
 'Software akuntansi untuk departemen keuangan', 'Finance', 'Siti Aminah', 'Robert IPM', 'MYOB Technology'),

('Kontrak', 'CN-2024-007', 'Pengadaan Furniture Kantor',
 'Facility', 'Office Equipment', 'Meja Kerja, Kursi, Lemari Filing',
 '2024-02-01', '2024-02-15', '2024-05-15',
 18000000, 2000000, 0,
 'Furniture untuk ekspansi kantor lantai 3', 'General Affairs', 'Indra Kusuma', 'Sarah IPM', 'PT. Indachi Furniture'),

-- Security Contracts
('Kontrak', 'CN-2024-008', 'Sistem Keamanan CCTV',
 'Security', 'Surveillance', 'IP Camera, NVR, Monitor',
 '2024-01-10', '2024-01-25', '2025-01-24',
 22000000, 3000000, 0,
 'Instalasi CCTV untuk area parkir dan lobby', 'Security', 'Dedi Supriadi', 'Michael IPM', 'PT. Hikvision Security'),

('PO', 'PO-2024-009', 'Layanan Security Guard',
 'Security', 'Personnel', 'Security Guard 24/7',
 '2024-01-01', '2024-01-01', '2024-12-31',
 0, 36000000, 0,
 'Layanan keamanan 24 jam untuk gedung kantor', 'Security', 'Dedi Supriadi', 'Jennifer IPM', 'PT. Securindo Guard'),

-- Marketing Contracts
('PO', 'PO-2024-010', 'Digital Marketing Platform',
 'Marketing', 'Digital', 'Google Ads, Facebook Ads, Analytics',
 '2024-03-01', '2024-03-15', '2025-03-14',
 0, 0, 24000000,
 'Platform digital marketing untuk promosi online', 'Marketing', 'Rina Sari', 'Kevin IPM', 'Google Indonesia'),

('Kontrak', 'CN-2024-011', 'Website Development',
 'Marketing', 'Web Development', 'Company Website, CMS, Hosting',
 '2024-02-10', '2024-03-01', '2024-08-31',
 35000000, 5000000, 0,
 'Pengembangan website corporate dan sistem CMS', 'Marketing', 'Rina Sari', 'Daniel IPM', 'PT. Digital Creative'),

-- Facilities Contracts
('Kontrak', 'CN-2024-012', 'Renovasi Ruang Meeting',
 'Facility', 'Construction', 'Interior Design, Furniture, AV Equipment',
 '2024-01-15', '2024-02-01', '2024-04-30',
 28000000, 7000000, 0,
 'Renovasi dan upgrade ruang meeting dengan teknologi terbaru', 'General Affairs', 'Indra Kusuma', 'Grace IPM', 'PT. Modern Interior'),

('PO', 'PO-2024-013', 'Layanan Cleaning Service',
 'Facility', 'Maintenance', 'Daily Cleaning, Deep Cleaning Monthly',
 '2024-01-01', '2024-01-01', '2024-12-31',
 0, 18000000, 0,
 'Layanan kebersihan harian untuk seluruh gedung', 'General Affairs', 'Indra Kusuma', 'Tony IPM', 'PT. Clean Pro Services'),

-- Training & Development
('PO', 'PO-2024-014', 'Platform E-Learning',
 'Training', 'Digital Learning', 'LMS Subscription, Course Content',
 '2024-02-01', '2024-02-15', '2025-02-14',
 0, 0, 15000000,
 'Platform pembelajaran online untuk karyawan', 'HR', 'Maya Sari', 'Alex IPM', 'Skillsoft Indonesia'),

('Kontrak', 'CN-2024-015', 'Leadership Training Program',
 'Training', 'Professional Development', 'Workshop, Seminar, Certification',
 '2024-03-01', '2024-03-15', '2024-09-15',
 20000000, 5000000, 0,
 'Program pelatihan kepemimpinan untuk manager', 'HR', 'Maya Sari', 'Emma IPM', 'PT. Leadership Institute'),

-- Near Expiry Contracts (for testing expiry notifications)
('Kontrak', 'CN-2024-016', 'Maintenance AC Central',
 'Facility', 'HVAC', 'AC Maintenance, Spare Parts',
 '2024-01-01', '2024-01-15', '2025-08-15',
 12000000, 3000000, 0,
 'Pemeliharaan AC central dan sistem ventilasi', 'General Affairs', 'Indra Kusuma', 'Chris IPM', 'PT. Cool Air Services'),

-- Expired Contract (for testing)
('PO', 'PO-2024-017', 'Expired Software License',
 'Software', 'Legacy', 'Old System License',
 '2023-12-01', '2023-12-15', '2024-06-15',
 0, 0, 5000000,
 'Lisensi software lama yang sudah expired', 'IT Department', 'Ahmad Rizki', 'Sam IPM', 'Legacy Software Corp');


INSERT INTO contracts (
  contract_type, contract_number, contract_name,
  category, sub_category, item,
  contract_date, start_date, end_date,
  ats_amount, jsl_amount, subscription_amount,
  notes, department, pic_user_name, pic_ipm_name, vendor
) VALUES 

-- Additional dummy contracts for testing
('Kontrak', 'CN-2024-018', 'Pengadaan Laptop Baru',
 'IT', 'Hardware', 'Dell Latitude 5000 Series - 50 Units',
 '2024-04-01', '2024-04-15', '2025-04-14',
 30000000, 0, 0,
 'Pengadaan laptop baru untuk karyawan baru', 'IT Department', 'Ahmad Rizki', 'Maria IPM', 'PT. Dell Indonesia'),

('PO', 'PO-2024-019', 'Layanan Cloud Storage',
 'IT', 'Cloud Services', 'Google Cloud Storage - 10TB',
 '2024-05-01', '2024-05-15', '2025-05-14',
 20000000, 1000000000, 12000000,
 'Layanan penyimpanan cloud untuk data perusahaan', 'IT Department', 'Ahmad Rizki', 'David IPM', 'Google Indonesia');