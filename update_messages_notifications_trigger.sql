-- تحديث trigger الإشعارات ليربط الإشعار بالرسالة
-- شغل هذا الأمر في Supabase SQL Editor

-- حذف الـ trigger القديم
DROP TRIGGER IF EXISTS trigger_notify_new_message ON messages;
DROP FUNCTION IF EXISTS notify_new_message();

-- إنشاء function محسّنة للإشعارات
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
DECLARE
  sender_name TEXT;
  notification_id UUID;
BEGIN
  -- جلب اسم المرسل
  SELECT COALESCE(full_name, 'مستخدم') INTO sender_name
  FROM profiles
  WHERE id = NEW.sender_id;
  
  -- إنشاء إشعار للمستلم مع ربطه بـ ID الرسالة
  INSERT INTO notifications (user_id, type, title, content, link, read)
  VALUES (
    NEW.receiver_id,
    'message',
    'رسالة جديدة',
    'لديك رسالة جديدة من ' || sender_name || ': ' || NEW.subject,
    '/messages?msg=' || NEW.id::text,
    false
  )
  RETURNING id INTO notification_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء trigger
CREATE TRIGGER trigger_notify_new_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_message();

-- إنشاء trigger لتحديث الإشعار عند قراءة الرسالة
DROP TRIGGER IF EXISTS trigger_mark_notification_read ON messages;
DROP FUNCTION IF EXISTS mark_notification_read();

CREATE OR REPLACE FUNCTION mark_notification_read()
RETURNS TRIGGER AS $$
BEGIN
  -- عند تحديث الرسالة لتصبح مقروءة، حدّث الإشعار المرتبط
  IF NEW.is_read = true AND OLD.is_read = false THEN
    UPDATE notifications
    SET read = true
    WHERE link = '/messages?msg=' || NEW.id::text
      AND user_id = NEW.receiver_id
      AND type = 'message';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_mark_notification_read
  AFTER UPDATE ON messages
  FOR EACH ROW
  WHEN (NEW.is_read = true AND OLD.is_read = false)
  EXECUTE FUNCTION mark_notification_read();

-- رسالة نجاح
SELECT 'تم تحديث triggers الإشعارات بنجاح! ✅' as status;

-- التحقق من الـ triggers
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE trigger_name IN ('trigger_notify_new_message', 'trigger_mark_notification_read')
ORDER BY trigger_name;
