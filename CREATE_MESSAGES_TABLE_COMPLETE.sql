-- ============================================
-- إنشاء جدول الرسائل من الصفر
-- ============================================

-- 1. حذف الجدول القديم إذا كان موجوداً
DROP TABLE IF EXISTS public.messages CASCADE;

-- 2. إنشاء الجدول الجديد
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. إنشاء indexes للأداء
CREATE INDEX idx_messages_sender ON public.messages(sender_id);
CREATE INDEX idx_messages_receiver ON public.messages(receiver_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX idx_messages_is_read ON public.messages(is_read) WHERE is_read = false;

-- 4. إيقاف RLS تماماً
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;

-- 5. إعطاء صلاحيات كاملة
GRANT ALL ON public.messages TO authenticated;
GRANT ALL ON public.messages TO anon;

-- 6. إنشاء trigger للـ updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_messages_updated_at 
    BEFORE UPDATE ON public.messages 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 7. التحقق من النتيجة
SELECT 
    tablename,
    rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE tablename = 'messages' AND schemaname = 'public';

-- 8. عرض structure الجدول
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'messages' AND table_schema = 'public'
ORDER BY ordinal_position;
