-- Fix task_comments INSERT policy
-- شغل هذا الأمر في Supabase SQL Editor

-- حذف Policy القديمة
DROP POLICY IF EXISTS "Authenticated users can create comments" ON task_comments;

-- إنشاء Policy جديدة صحيحة
CREATE POLICY "Authenticated users can create comments"
  ON task_comments FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- تحقق من النجاح
SELECT 'Policy updated successfully!' as message;

-- اختبار: حاول إضافة تعليق تجريبي
-- استبدل task_id بـ ID مهمة حقيقية
-- INSERT INTO task_comments (task_id, user_id, content)
-- VALUES ('your-task-id-here', auth.uid(), 'تعليق تجريبي');
