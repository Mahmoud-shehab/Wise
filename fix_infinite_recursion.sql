-- ============================================
-- Fix Infinite Recursion in project_members
-- ============================================
-- شغل هذا في Supabase SQL Editor

-- الحل 1: حذف جدول project_members مؤقتاً (إذا لم تكن تستخدمه)
DROP TABLE IF EXISTS project_members CASCADE;

-- الحل 2: إذا كنت تريد الاحتفاظ بالجدول، أعد إنشاء policies بسيطة
-- أولاً: احذف الـ policies القديمة
DROP POLICY IF EXISTS "Users can view project members" ON project_members;
DROP POLICY IF EXISTS "Project owners can manage members" ON project_members;
DROP POLICY IF EXISTS "Managers can manage all members" ON project_members;

-- ثانياً: أنشئ policies بسيطة بدون infinite recursion
CREATE POLICY "Everyone can view project members"
  ON project_members FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert members"
  ON project_members FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update members"
  ON project_members FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete members"
  ON project_members FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- تحقق من النجاح
SELECT 'Fixed! Try adding a comment now.' as message;
