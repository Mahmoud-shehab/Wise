-- ============================================
-- Notifications System - Standalone Migration
-- ============================================
-- يمكنك تشغيل هذا الملف مباشرة في Supabase SQL Editor

-- 1. Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  link TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- 3. Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies
-- Users can view their own notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

-- System can create notifications (for triggers)
DROP POLICY IF EXISTS "System can create notifications" ON notifications;
CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- Users can update their own notifications (mark as read)
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own notifications
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;
CREATE POLICY "Users can delete their own notifications"
  ON notifications FOR DELETE
  USING (user_id = auth.uid());

-- 5. Create helper function to create notifications
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_content TEXT DEFAULT NULL,
  p_link TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, type, title, content, link)
  VALUES (p_user_id, p_type, p_title, p_content, p_link)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create trigger function for task assignment
CREATE OR REPLACE FUNCTION notify_task_assignment()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify if assignee is set and changed
  IF NEW.assignee_id IS NOT NULL AND 
     (OLD.assignee_id IS NULL OR OLD.assignee_id != NEW.assignee_id) THEN
    PERFORM create_notification(
      NEW.assignee_id,
      'task_assigned',
      'تم تعيين مهمة جديدة لك',
      NEW.title,
      '/tasks/' || NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger for task assignment
DROP TRIGGER IF EXISTS trigger_notify_task_assignment ON tasks;
CREATE TRIGGER trigger_notify_task_assignment
  AFTER INSERT OR UPDATE OF assignee_id ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION notify_task_assignment();

-- 8. Create trigger function for task comments
CREATE OR REPLACE FUNCTION notify_task_comment()
RETURNS TRIGGER AS $$
DECLARE
  task_record RECORD;
BEGIN
  -- Get task details
  SELECT * INTO task_record FROM tasks WHERE id = NEW.task_id;
  
  -- Notify task assignee (if not the commenter)
  IF task_record.assignee_id IS NOT NULL AND 
     task_record.assignee_id != NEW.user_id THEN
    PERFORM create_notification(
      task_record.assignee_id,
      'task_comment',
      'تعليق جديد على مهمتك',
      LEFT(NEW.content, 100),  -- First 100 characters
      '/tasks/' || NEW.task_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Create trigger for task comments
DROP TRIGGER IF EXISTS trigger_notify_task_comment ON task_comments;
CREATE TRIGGER trigger_notify_task_comment
  AFTER INSERT ON task_comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_task_comment();

-- 10. Enable Realtime for notifications table
-- Note: You need to enable this in Supabase Dashboard > Database > Replication
-- Or run this command if you have the right permissions:
-- ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Notifications system created successfully!';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Enable Realtime for notifications table in Supabase Dashboard';
  RAISE NOTICE '2. Go to Database > Replication > Publications';
  RAISE NOTICE '3. Add "notifications" table to supabase_realtime publication';
END $$;
