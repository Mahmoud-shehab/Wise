-- Update task status and priority check constraints

-- Step 1: Drop old check constraints first
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_priority_check;

-- Step 2: Update existing data to match new values
-- Update status values
UPDATE tasks SET status = 'open' WHERE status IN ('backlog', 'assigned');
UPDATE tasks SET status = 'done' WHERE status IN ('pending_review', 'blocked');
-- in_progress stays the same

-- Update any NULL or invalid status values to 'open'
UPDATE tasks SET status = 'open' WHERE status IS NULL OR status NOT IN ('open', 'in_progress', 'done');

-- Update any NULL or invalid priority values to 'medium'
UPDATE tasks SET priority = 'medium' WHERE priority IS NULL OR priority NOT IN ('low', 'medium', 'high', 'critical');

-- Step 3: Add new check constraints with updated values
ALTER TABLE tasks ADD CONSTRAINT tasks_status_check 
  CHECK (status IN ('open', 'in_progress', 'done'));

ALTER TABLE tasks ADD CONSTRAINT tasks_priority_check 
  CHECK (priority IN ('low', 'medium', 'high', 'critical'));

-- Step 4: Update default values
ALTER TABLE tasks ALTER COLUMN status SET DEFAULT 'open';
ALTER TABLE tasks ALTER COLUMN priority SET DEFAULT 'medium';



