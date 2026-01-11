-- إضافة سياسة RLS للسماح للمراجع بتحديث المهام
-- هذه السياسة تسمح للمراجع بتحديث حالة المهمة وتاريخ المراجعة

-- حذف السياسة القديمة إن وجدت
DROP POLICY IF EXISTS "Reviewers can update tasks" ON tasks;

-- إنشاء سياسة جديدة تسمح للمراجع بتحديث المهام المسندة له
CREATE POLICY "Reviewers can update tasks"
  ON tasks FOR UPDATE
  USING (
    -- المراجع يمكنه تحديث المهام المسندة له
    EXISTS (
      SELECT 1 FROM task_reviewers
      WHERE task_reviewers.task_id = tasks.id
      AND task_reviewers.reviewer_id = auth.uid()
    )
  )
  WITH CHECK (
    -- المراجع يمكنه تحديث المهام المسندة له
    EXISTS (
      SELECT 1 FROM task_reviewers
      WHERE task_reviewers.task_id = tasks.id
      AND task_reviewers.reviewer_id = auth.uid()
    )
  );

-- إضافة حقل reviewed_at إذا لم يكن موجوداً
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' 
    AND column_name = 'reviewed_at'
  ) THEN
    ALTER TABLE tasks ADD COLUMN reviewed_at TIMESTAMPTZ;
  END IF;
END $$;

-- Trigger للإشعارات عند اعتماد المهمة
CREATE OR REPLACE FUNCTION notify_task_approved()
RETURNS TRIGGER AS $$
DECLARE
  task_assignee UUID;
  reviewer_name TEXT;
BEGIN
  -- التحقق من أن الحالة تغيرت إلى done
  IF NEW.status = 'done' AND OLD.status != 'done' THEN
    -- جلب معلومات المراجع
    SELECT full_name INTO reviewer_name 
    FROM profiles 
    WHERE id = auth.uid();
    
    -- إرسال إشعار للموظف المسند له المهمة
    IF NEW.assignee_id IS NOT NULL THEN
      INSERT INTO notifications (user_id, type, title, content, link)
      VALUES (
        NEW.assignee_id,
        'task_approved',
        'تم اعتماد المهمة',
        'تم اعتماد المهمة "' || NEW.title || '" من قبل ' || COALESCE(reviewer_name, 'المراجع'),
        '/tasks/' || NEW.id
      );
    END IF;
  END IF;
  
  -- التحقق من أن الحالة تغيرت إلى in_progress (رد المهمة)
  IF NEW.status = 'in_progress' AND OLD.status = 'pending_review' THEN
    -- جلب معلومات المراجع
    SELECT full_name INTO reviewer_name 
    FROM profiles 
    WHERE id = auth.uid();
    
    -- إرسال إشعار للموظف المسند له المهمة
    IF NEW.assignee_id IS NOT NULL THEN
      INSERT INTO notifications (user_id, type, title, content, link)
      VALUES (
        NEW.assignee_id,
        'task_returned',
        'تم رد المهمة',
        'تم رد المهمة "' || NEW.title || '" من قبل ' || COALESCE(reviewer_name, 'المراجع') || ' لإعادة العمل عليها',
        '/tasks/' || NEW.id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_task_approved ON tasks;
CREATE TRIGGER trigger_notify_task_approved
  AFTER UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION notify_task_approved();
