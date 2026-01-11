-- ============================================
-- تقييد التعليقات على المدير والموظف المكلف والمراجع فقط
-- ============================================
-- شغل هذا الأمر في Supabase SQL Editor

-- 1. حذف السياسات القديمة
DROP POLICY IF EXISTS "Everyone can view comments" ON task_comments;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON task_comments;
DROP POLICY IF EXISTS "Users can update own comments" ON task_comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON task_comments;

-- 2. سياسة القراءة: فقط المدير أو الموظف المكلف أو المراجع
CREATE POLICY "Only task members can view comments"
  ON task_comments FOR SELECT
  USING (
    -- المدير يستطيع رؤية كل التعليقات
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'manager'
    )
    OR
    -- الموظف المكلف بالمهمة
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_comments.task_id
      AND tasks.assignee_id = auth.uid()
    )
    OR
    -- المراجع المعين للمهمة
    EXISTS (
      SELECT 1 FROM task_reviewers
      WHERE task_reviewers.task_id = task_comments.task_id
      AND task_reviewers.reviewer_id = auth.uid()
    )
    OR
    -- منشئ المهمة
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_comments.task_id
      AND tasks.created_by = auth.uid()
    )
  );

-- 3. سياسة الإضافة: فقط المدير أو الموظف المكلف أو المراجع
CREATE POLICY "Only task members can create comments"
  ON task_comments FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND (
      -- المدير يستطيع إضافة تعليقات
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'manager'
      )
      OR
      -- الموظف المكلف بالمهمة
      EXISTS (
        SELECT 1 FROM tasks
        WHERE tasks.id = task_comments.task_id
        AND tasks.assignee_id = auth.uid()
      )
      OR
      -- المراجع المعين للمهمة
      EXISTS (
        SELECT 1 FROM task_reviewers
        WHERE task_reviewers.task_id = task_comments.task_id
        AND task_reviewers.reviewer_id = auth.uid()
      )
      OR
      -- منشئ المهمة
      EXISTS (
        SELECT 1 FROM tasks
        WHERE tasks.id = task_comments.task_id
        AND tasks.created_by = auth.uid()
      )
    )
  );

-- 4. سياسة التحديث: فقط صاحب التعليق
CREATE POLICY "Users can update own comments"
  ON task_comments FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 5. سياسة الحذف: صاحب التعليق أو المدير
CREATE POLICY "Users can delete own comments or managers can delete any"
  ON task_comments FOR DELETE
  USING (
    user_id = auth.uid() 
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'manager'
    )
  );

-- رسالة نجاح
SELECT 'تم تحديث سياسات التعليقات بنجاح! الآن التعليقات خاصة بالمدير والموظف المكلف والمراجع فقط.' as message;
