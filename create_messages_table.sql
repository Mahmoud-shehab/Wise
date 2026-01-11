-- إنشاء جدول الرسائل
-- شغل هذا الأمر في Supabase SQL Editor

-- ===== الخطوة 1: إنشاء الجدول =====
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  
  -- فهرسة للبحث السريع
  CONSTRAINT messages_sender_receiver_check CHECK (sender_id != receiver_id)
);

-- ===== الخطوة 2: إنشاء الفهارس =====
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);

-- ===== الخطوة 3: تفعيل RLS =====
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- ===== الخطوة 4: حذف السياسات القديمة (إن وجدت) =====
DROP POLICY IF EXISTS "Users can view their own messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Receivers can mark messages as read" ON messages;
DROP POLICY IF EXISTS "Users can delete their messages" ON messages;

-- ===== الخطوة 5: إنشاء سياسات الأمان =====

-- سياسة القراءة: المستخدم يمكنه قراءة الرسائل المرسلة إليه أو منه
CREATE POLICY "Users can view their own messages"
  ON messages FOR SELECT
  USING (
    auth.uid() = sender_id OR 
    auth.uid() = receiver_id
  );

-- سياسة الإنشاء: المستخدم يمكنه إرسال رسائل
CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- سياسة التحديث: المستلم فقط يمكنه تحديث حالة القراءة
CREATE POLICY "Receivers can mark messages as read"
  ON messages FOR UPDATE
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

-- سياسة الحذف: المرسل والمستلم يمكنهم حذف الرسالة
CREATE POLICY "Users can delete their messages"
  ON messages FOR DELETE
  USING (
    auth.uid() = sender_id OR 
    auth.uid() = receiver_id
  );

-- ===== الخطوة 6: حذف الـ trigger القديم (إن وجد) =====
DROP TRIGGER IF EXISTS trigger_notify_new_message ON messages;
DROP FUNCTION IF EXISTS notify_new_message();

-- ===== الخطوة 7: إنشاء trigger للإشعارات =====
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, message, related_id)
  VALUES (
    NEW.receiver_id,
    'message',
    'رسالة جديدة',
    'لديك رسالة جديدة من ' || COALESCE((SELECT full_name FROM profiles WHERE id = NEW.sender_id), 'مستخدم'),
    NEW.id::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_new_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_message();

-- ===== رسالة نجاح =====
SELECT 'تم إنشاء جدول الرسائل بنجاح! ✅' as message;

-- ===== التحقق من الجدول =====
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'messages'
ORDER BY ordinal_position;
