-- إنشاء جدول منفصل لمراجعي المهام (بديل لحقل reviewer_id)
CREATE TABLE IF NOT EXISTS task_reviewers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(task_id, reviewer_id)
);

-- فهرس للبحث السريع
CREATE INDEX IF NOT EXISTS idx_task_reviewers_task_id ON task_reviewers(task_id);
CREATE INDEX IF NOT EXISTS idx_task_reviewers_reviewer_id ON task_reviewers(reviewer_id);

-- RLS policies
ALTER TABLE task_reviewers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view task reviewers"
  ON task_reviewers FOR SELECT
  USING (true);

CREATE POLICY "Managers can insert task reviewers"
  ON task_reviewers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'manager'
    )
  );

CREATE POLICY "Managers can delete task reviewers"
  ON task_reviewers FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'manager'
    )
  );

-- Trigger للإشعارات عند إضافة مراجع
CREATE OR REPLACE FUNCTION notify_new_reviewer()
RETURNS TRIGGER AS $$
DECLARE
  task_title TEXT;
BEGIN
  -- جلب عنوان المهمة
  SELECT title INTO task_title FROM tasks WHERE id = NEW.task_id;
  
  -- إرسال إشعار للمراجع
  INSERT INTO notifications (user_id, type, title, content, link)
  VALUES (
    NEW.reviewer_id,
    'task_assigned_reviewer',
    'تم تعيينك كمراجع',
    'تم تعيينك كمراجع للمهمة "' || task_title || '"',
    '/tasks/' || NEW.task_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_new_reviewer ON task_reviewers;
CREATE TRIGGER trigger_notify_new_reviewer
  AFTER INSERT ON task_reviewers
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_reviewer();
