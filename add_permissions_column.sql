-- Add permissions column to staff table
-- Run this in your Supabase SQL Editor

-- 1. Add permissions column to staff table
ALTER TABLE staff 
ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{
  "dashboard": {"view": true, "add": false, "edit": false, "delete": false},
  "deposits": {"view": true, "add": true, "edit": true, "delete": true},
  "bankDeposits": {"view": true, "add": true, "edit": true, "delete": true},
  "staffManagement": {"view": false, "add": false, "edit": false, "delete": false},
  "activityLogs": {"view": false, "add": false, "edit": false, "delete": false}
}'::jsonb;

-- 2. Update existing staff records with default permissions based on their role
UPDATE staff 
SET permissions = CASE 
  WHEN role = 'Super Admin' THEN '{
    "dashboard": {"view": true, "add": false, "edit": false, "delete": false},
    "deposits": {"view": true, "add": true, "edit": true, "delete": true},
    "bankDeposits": {"view": true, "add": true, "edit": true, "delete": true},
    "staffManagement": {"view": true, "add": true, "edit": true, "delete": true},
    "activityLogs": {"view": true, "add": false, "edit": false, "delete": false}
  }'::jsonb
  WHEN role = 'Admin' THEN '{
    "dashboard": {"view": true, "add": true, "edit": true, "delete": false},
    "deposits": {"view": true, "add": true, "edit": true, "delete": true},
    "bankDeposits": {"view": true, "add": true, "edit": true, "delete": true},
    "staffManagement": {"view": true, "add": true, "edit": true, "delete": false},
    "activityLogs": {"view": true, "add": true, "edit": true, "delete": false}
  }'::jsonb
  WHEN role = 'Manager' THEN '{
    "dashboard": {"view": true, "add": false, "edit": false, "delete": false},
    "deposits": {"view": true, "add": true, "edit": true, "delete": true},
    "bankDeposits": {"view": true, "add": true, "edit": true, "delete": true},
    "staffManagement": {"view": true, "add": false, "edit": false, "delete": false},
    "activityLogs": {"view": false, "add": false, "edit": false, "delete": false}
  }'::jsonb
  WHEN role = 'Accountant' THEN '{
    "dashboard": {"view": true, "add": false, "edit": false, "delete": false},
    "deposits": {"view": true, "add": true, "edit": true, "delete": false},
    "bankDeposits": {"view": true, "add": true, "edit": true, "delete": false},
    "staffManagement": {"view": false, "add": false, "edit": false, "delete": false},
    "activityLogs": {"view": false, "add": false, "edit": false, "delete": false}
  }'::jsonb
  ELSE '{
    "dashboard": {"view": true, "add": false, "edit": false, "delete": false},
    "deposits": {"view": true, "add": false, "edit": false, "delete": false},
    "bankDeposits": {"view": true, "add": false, "edit": false, "delete": false},
    "staffManagement": {"view": false, "add": false, "edit": false, "delete": false},
    "activityLogs": {"view": false, "add": false, "edit": false, "delete": false}
  }'::jsonb
END
WHERE permissions IS NULL OR permissions = '{}'::jsonb;

-- 3. Create an index on the permissions column for better performance
CREATE INDEX IF NOT EXISTS idx_staff_permissions ON staff USING GIN (permissions);

-- 4. Verify the update
SELECT id, name, role, permissions FROM staff LIMIT 5;

-- Success message
SELECT 'Permissions column added successfully to staff table!' as message;
