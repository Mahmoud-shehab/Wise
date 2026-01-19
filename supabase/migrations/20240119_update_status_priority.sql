-- Update task status and priority check constraints

-- First, update existing data to match new values
UPDATE tasks SET status = 'open' WHERE status IN ('backlog', 'assigned');
UPDATE tasks SET status = 'done' WHERE status IN ('pending_review', 'blocked');
-- in_progress stays the same

-- Drop old check constraints
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_priority_check;

-- Add new check constraints with updated values
ALTER TABLE tasks ADD CONSTRAINT tasks_status_check 
  CHECK (status IN ('open', 'in_progress', 'done'));

ALTER TABLE tasks ADD CONSTRAINT tasks_priority_check 
  CHECK (priority IN ('low', 'medium', 'high', 'critical'));

-- Update default value for status
ALTER TABLE tasks ALTER COLUMN status SET DEFAULT 'open';


