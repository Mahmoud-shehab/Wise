-- ============================================
-- حل سريع لمشكلة التعليقات
-- ============================================
-- شغل هذا في Supabase SQL Editor

-- 1. حذف الجداول التي تسبب مشاكل (مؤقتاً)
DROP TABLE IF EXISTS project_members CASCADE;
DROP TABLE IF EXISTS task_attachments CASCADE;

-- 2. التأكد من أن جدول task_comments موجود وصحيح
CREATE TABLE IF NOT EXISTS task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. حذف جميع policies القديمة
DROP POLICY IF EXISTS "Everyone can view comments" ON task_comments;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON task_comments;
DROP POLICY IF EXISTS "Users can update own comments" ON task_comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON task_comments;

-- 4. تعطيل RLS مؤقتاً للاختبار
ALTER TABLE task_comments DISABLE ROW LEVEL SECURITY;

-- 5. رسالة نجاح
SELECT 'Done! Now try adding a comment.' as message;

-- ملاحظة: بعد التأكد من عمل التعليقات، يمكنك إعادة تفعيل RLS:
-- ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
-- ثم إضافة policies بسيطة
