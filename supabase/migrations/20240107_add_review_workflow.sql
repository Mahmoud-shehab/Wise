-- إضافة حقل المراجع وحالة المراجعة
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS reviewer_id UUID REFERENCES profiles(id);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- تحديث نوع الحالة لإضافة pending_review
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_status_check 
  CHECK (status IN ('backlog', 'assigned', 'in_progress', 'pending_review', 'done', 'blocked'));

-- Trigger لإرسال المهمة للمراجع تلقائياً عند تحديد الحالة كـ pending_review
CREATE OR REPLACE FUNCTION notify_reviewer_on_task_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- إذا تم تغيير الحالة إلى pending_review وهناك مراجع
  IF NEW.status = 'pending_review' AND NEW.reviewer_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, content, link)
    VALUES (
      NEW.reviewer_id,
      'task_review',
      'مهمة جاهزة للمراجعة',
      'المهمة "' || NEW.title || '" جاهزة للمراجعة',
      '/tasks/' || NEW.id
    );
  END IF;
  
  -- إذا تم رد المهمة (من pending_review إلى in_progress)
  IF OLD.status = 'pending_review' AND NEW.status = 'in_progress' AND NEW.assignee_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, content, link)
    VALUES (
      NEW.assignee_id,
      'task_returned',
      'تم رد المهمة',
      'تم رد المهمة "' || NEW.title || '" لإعادة العمل عليها',
      '/tasks/' || NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_reviewer ON tasks;
CREATE TRIGGER trigger_notify_reviewer
  AFTER UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION notify_reviewer_on_task_completion();

-- إضافة فهرس للمراجع
CREATE INDEX IF NOT EXISTS idx_tasks_reviewer_id ON tasks(reviewer_id);
