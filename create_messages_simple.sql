-- إنشاء جدول الرسائل (نسخة مبسطة بدون trigger)
-- شغل هذا الأمر في Supabase SQL Editor

-- الخطوة 1: إنشاء الجدول
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- الخطوة 2: إنشاء الفهارس
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- الخطوة 3: تفعيل RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- الخطوة 4: حذف السياسات القديمة
DROP POLICY IF EXISTS "Users can view their own messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Receivers can mark messages as read" ON messages;
DROP POLICY IF EXISTS "Users can delete their messages" ON messages;

-- الخطوة 5: إنشاء السياسات
CREATE POLICY "Users can view their own messages"
  ON messages FOR SELECT
  USING (
    auth.uid()::text = sender_id::text OR 
    auth.uid()::text = receiver_id::text
  );

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (auth.uid()::text = sender_id::text);

CREATE POLICY "Receivers can mark messages as read"
  ON messages FOR UPDATE
  USING (auth.uid()::text = receiver_id::text);

CREATE POLICY "Users can delete their messages"
  ON messages FOR DELETE
  USING (
    auth.uid()::text = sender_id::text OR 
    auth.uid()::text = receiver_id::text
  );

-- رسالة نجاح
SELECT 'تم إنشاء جدول الرسائل بنجاح! ✅' as status;

-- التحقق
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'messages'
ORDER BY ordinal_position;
