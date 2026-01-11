-- إضافة trigger للإشعارات عند استلام رسالة جديدة
-- شغل هذا الأمر في Supabase SQL Editor

-- حذف الـ trigger القديم إن وجد
DROP TRIGGER IF EXISTS trigger_notify_new_message ON messages;
DROP FUNCTION IF EXISTS notify_new_message();

-- إنشاء function للإشعارات
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
DECLARE
  sender_name TEXT;
BEGIN
  -- جلب اسم المرسل
  SELECT COALESCE(full_name, 'مستخدم') INTO sender_name
  FROM profiles
  WHERE id = NEW.sender_id;
  
  -- إنشاء إشعار للمستلم
  INSERT INTO notifications (user_id, type, title, content, link, read)
  VALUES (
    NEW.receiver_id,
    'message',
    'رسالة جديدة',
    'لديك رسالة جديدة من ' || sender_name || ': ' || NEW.subject,
    '/messages',
    false
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء trigger
CREATE TRIGGER trigger_notify_new_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_message();

-- رسالة نجاح
SELECT 'تم إضافة trigger الإشعارات بنجاح! ✅' as status;

-- التحقق من الـ trigger
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_notify_new_message';
