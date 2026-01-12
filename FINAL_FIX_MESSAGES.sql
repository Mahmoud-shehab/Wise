-- ============================================
-- الحل النهائي لمشكلة الرسائل
-- ============================================

-- 1. التأكد من وجود الجدول
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'messages'
);

-- 2. إيقاف RLS تماماً
ALTER TABLE IF EXISTS public.messages DISABLE ROW LEVEL SECURITY;

-- 3. حذف جميع الـ policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'messages' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.messages';
    END LOOP;
END $$;

-- 4. إعطاء صلاحيات كاملة
GRANT ALL ON public.messages TO authenticated;
GRANT ALL ON public.messages TO anon;
GRANT USAGE, SELECT ON SEQUENCE messages_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE messages_id_seq TO anon;

-- 5. التحقق من النتيجة
SELECT 
    tablename,
    rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE tablename = 'messages' AND schemaname = 'public';

-- 6. عرض الصلاحيات
SELECT 
    grantee, 
    privilege_type,
    table_name
FROM information_schema.role_table_grants 
WHERE table_name = 'messages' AND table_schema = 'public';
