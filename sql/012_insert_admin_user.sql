-- Insert admin user for testing
-- Replace '78220c5c-7d65-43b0-b434-ce58a3124306' with the actual UUID from Supabase Auth > Users

-- First, create the staff record
INSERT INTO staff (id, name, email, password_hash, role, status, avatar)
VALUES (
  '78220c5c-7d65-43b0-b434-ce58a3124306', -- Replace with actual UUID from Auth > Users
  'Admin',
  'admin@gmail.com',
  'N/A', -- Password is handled by Supabase Auth
  'Super Admin',
  'active',
  null
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  status = EXCLUDED.status;

-- Insert permissions for the admin user
INSERT INTO staff_permissions (staff_id, module, can_view, can_add, can_edit, can_delete)
VALUES
  ('78220c5c-7d65-43b0-b434-ce58a3124306', 'dashboard', true, false, false, false),
  ('78220c5c-7d65-43b0-b434-ce58a3124306', 'deposits', true, true, true, true),
  ('78220c5c-7d65-43b0-b434-ce58a3124306', 'bankDeposits', true, true, true, true),
  ('78220c5c-7d65-43b0-b434-ce58a3124306', 'staffManagement', true, true, true, true)
ON CONFLICT (staff_id, module) DO UPDATE SET
  can_view = EXCLUDED.can_view,
  can_add = EXCLUDED.can_add,
  can_edit = EXCLUDED.can_edit,
  can_delete = EXCLUDED.can_delete;

-- Verify the insert
SELECT s.id, s.name, s.email, s.role, s.status, sp.module, sp.can_view, sp.can_add, sp.can_edit, sp.can_delete
FROM staff s
LEFT JOIN staff_permissions sp ON s.id = sp.staff_id
WHERE s.email = 'admin@gmail.com';
