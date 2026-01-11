-- ============================================
-- Task Comments Table - Standalone Migration
-- ============================================

-- 1. Create task_comments table
CREATE TABLE IF NOT EXISTS task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create indexes
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_user_id ON task_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_created_at ON task_comments(created_at DESC);

-- 3. Enable RLS
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Everyone can view comments
DROP POLICY IF EXISTS "Everyone can view comments" ON task_comments;
CREATE POLICY "Everyone can view comments"
  ON task_comments FOR SELECT
  USING (true);

-- Authenticated users can create comments
DROP POLICY IF EXISTS "Authenticated users can create comments" ON task_comments;
CREATE POLICY "Authenticated users can create comments"
  ON task_comments FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own comments
DROP POLICY IF EXISTS "Users can update own comments" ON task_comments;
CREATE POLICY "Users can update own comments"
  ON task_comments FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own comments, managers can delete any
DROP POLICY IF EXISTS "Users can delete own comments" ON task_comments;
CREATE POLICY "Users can delete own comments"
  ON task_comments FOR DELETE
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'manager'
    )
  );

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Task comments table created successfully!';
END $$;
