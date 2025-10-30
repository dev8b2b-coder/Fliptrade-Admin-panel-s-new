-- Add needs_password_reset field to staff table
ALTER TABLE staff ADD COLUMN IF NOT EXISTS needs_password_reset BOOLEAN DEFAULT TRUE;

-- Update existing users to not need password reset (they already have passwords)
UPDATE staff SET needs_password_reset = FALSE WHERE id = '78220c5c-7d65-43b0-b434-ce58a3124306';

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_staff_needs_password_reset ON staff(needs_password_reset);
