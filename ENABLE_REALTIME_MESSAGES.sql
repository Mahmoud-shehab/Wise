-- تفعيل Realtime على جدول messages
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- التحقق من التفعيل
SELECT 
    schemaname,
    tablename,
    pubname
FROM pg_publication_tables
WHERE tablename = 'messages';
