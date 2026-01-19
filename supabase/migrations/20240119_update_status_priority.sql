-- Update task status and priority enums

-- First, add the new values to the enum types
ALTER TYPE task_status ADD VALUE IF NOT EXISTS 'open';
ALTER TYPE task_priority ADD VALUE IF NOT EXISTS 'critical';

-- Update existing tasks to map old statuses to new ones
UPDATE tasks SET status = 'open' WHERE status IN ('backlog', 'assigned');
UPDATE tasks SET status = 'in_progress' WHERE status = 'in_progress';
UPDATE tasks SET status = 'done' WHERE status IN ('done', 'pending_review', 'blocked');

-- Note: We cannot remove enum values in PostgreSQL without recreating the type
-- So we'll keep the old values but they won't be used in the UI
-- If you want to completely remove old values, you need to:
-- 1. Create new enum types
-- 2. Alter the column to use the new type
-- 3. Drop the old type

-- For now, we'll just ensure the application uses only: open, in_progress, done
-- And for priority: low, medium, high, critical
