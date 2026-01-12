-- إيقاف RLS تماماً على جدول messages
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- حذف جميع الـ policies القديمة
DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'messages'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON messages', policy_record.policyname);
    END LOOP;
END $$;

-- تأكيد أن RLS معطل
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'messages';
