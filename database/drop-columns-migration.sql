-- Migration to drop columns from tables
-- Run this carefully as it will permanently delete data

-- Example: Drop columns from contracts table
-- ALTER TABLE contracts DROP COLUMN IF EXISTS column_name;

-- Uncomment the lines below to drop specific columns:

-- Drop sub_category column
-- ALTER TABLE contracts DROP COLUMN IF EXISTS sub_category;

-- Drop item column  
-- ALTER TABLE contracts DROP COLUMN IF EXISTS item;

-- Drop department column
-- ALTER TABLE contracts DROP COLUMN IF EXISTS department;

-- Drop pic_user_name column
-- ALTER TABLE contracts DROP COLUMN IF EXISTS pic_user_name;

-- Drop pic_ipm_name column
-- ALTER TABLE contracts DROP COLUMN IF EXISTS pic_ipm_name;

-- Drop vendor column
-- ALTER TABLE contracts DROP COLUMN IF EXISTS vendor;

-- Example for other tables:
-- ALTER TABLE users DROP COLUMN IF EXISTS role;
-- ALTER TABLE contract_files DROP COLUMN IF EXISTS size;
