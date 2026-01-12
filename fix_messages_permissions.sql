-- الحل البديل: إعطاء صلاحيات كاملة لجميع المستخدمين المسجلين

-- 1. إيقاف RLS
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- 2. حذف جميع الـ policies
DROP POLICY IF EXISTS messages_select_policy ON messages;
DROP POLICY IF EXISTS messages_insert_policy ON messages;
DROP POLICY IF EXISTS messages_update_policy ON messages;
DROP POLICY IF EXISTS messages_delete_policy ON messages;

-- 3. إعطاء صلاحيات مباشرة
GRANT ALL ON messages TO authenticated;
GRANT ALL ON messages TO anon;

-- 4. التأكد من الصلاحيات
SELECT 
    grantee, 
    privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'messages';
