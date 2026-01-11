-- ✅ تفعيل صلاحيات المراجع لتحديث المهام
-- قم بتنفيذ هذا الكود في SQL Editor في Supabase

-- 1️⃣ حذف السياسة القديمة إن وجدت
DROP POLICY IF EXISTS "Reviewers can update tasks" ON tasks;

-- 2️⃣ إنشاء سياسة جديدة تسمح للمراجع بتحديث المهام
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

-- 3️⃣ إضافة حقل reviewed_at إذا لم يكن موجوداً
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

-- 4️⃣ Trigger للإشعارات عند اعتماد أو رد المهمة
CREATE OR REPLACE FUNCTION notify_task_reviewed()
RETURNS TRIGGER AS $$
DECLARE
  reviewer_name TEXT;
BEGIN
  -- جلب اسم المراجع
  SELECT full_name INTO reviewer_name 
  FROM profiles 
  WHERE id = auth.uid();
  
  -- إذا تم اعتماد المهمة
  IF NEW.status = 'done' AND OLD.status = 'pending_review' THEN
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
  
  -- إذا تم رد المهمة
  IF NEW.status = 'in_progress' AND OLD.status = 'pending_review' THEN
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

DROP TRIGGER IF EXISTS trigger_notify_task_reviewed ON tasks;
CREATE TRIGGER trigger_notify_task_reviewed
  AFTER UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION notify_task_reviewed();

-- ✅ تم! الآن المراجع يمكنه اعتماد أو رد المهام
