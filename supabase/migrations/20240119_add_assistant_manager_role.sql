-- Add assistant_manager role to profiles table
-- First, we need to modify the role column to accept the new value

-- Drop the existing check constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add new check constraint with assistant_manager
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('employee', 'manager', 'assistant_manager'));

-- Update the comment
COMMENT ON COLUMN profiles.role IS 'User role: employee (شريك), manager (مدير), or assistant_manager (مساعد المدير)';
