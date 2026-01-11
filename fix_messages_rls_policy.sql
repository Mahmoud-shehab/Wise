-- إصلاح صلاحيات جدول الرسائل (RLS Policy)
-- شغل هذا الأمر في Supabase SQL Editor

-- 1. حذف جميع الـ policies الموجودة على جدول messages
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'messages') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON messages';
    END LOOP;
END $$;

-- 2. تعطيل RLS مؤقتاً
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- 3. إعادة تفعيل RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 4. إنشاء policy للقراءة (المستخدم يقدر يشوف الرسائل اللي هو مرسلها أو مستقبلها)
CREATE POLICY "messages_select_policy"
ON messages
FOR SELECT
TO authenticated
USING (
  auth.uid() = sender_id OR auth.uid() = receiver_id
);

-- 5. إنشاء policy للإضافة (أي مستخدم يقدر يبعت رسالة)
CREATE POLICY "messages_insert_policy"
ON messages
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = sender_id
);

-- 6. إنشاء policy للتحديث (المستخدم يقدر يحدث الرسائل اللي هو مستقبلها فقط - علشان يعلمها مقروءة)
CREATE POLICY "messages_update_policy"
ON messages
FOR UPDATE
TO authenticated
USING (
  auth.uid() = receiver_id
)
WITH CHECK (
  auth.uid() = receiver_id
);

-- 7. إنشاء policy للحذف (المستخدم يقدر يحذف الرسائل اللي هو مرسلها أو مستقبلها)
CREATE POLICY "messages_delete_policy"
ON messages
FOR DELETE
TO authenticated
USING (
  auth.uid() = sender_id OR auth.uid() = receiver_id
);

-- 8. التحقق من الـ policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'messages'
ORDER BY policyname;

-- رسالة نجاح
SELECT '✅ تم إصلاح صلاحيات جدول الرسائل بنجاح!' as status;
