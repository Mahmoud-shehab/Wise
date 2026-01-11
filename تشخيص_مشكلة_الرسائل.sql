-- ملف تشخيص مشكلة الرسائل
-- شغل هذه الأوامر واحداً تلو الآخر لمعرفة المشكلة

-- 1. التحقق من وجود جدول messages
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'messages'
    ) 
    THEN '✅ جدول messages موجود'
    ELSE '❌ جدول messages غير موجود'
  END as status;

-- 2. التحقق من أعمدة الجدول (إذا كان موجوداً)
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'messages'
ORDER BY ordinal_position;

-- 3. التحقق من سياسات RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'messages';

-- 4. التحقق من وجود جدول profiles (مطلوب للـ foreign key)
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'profiles'
    ) 
    THEN '✅ جدول profiles موجود'
    ELSE '❌ جدول profiles غير موجود'
  END as status;

-- 5. التحقق من وجود جدول notifications (مطلوب للـ trigger)
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'notifications'
    ) 
    THEN '✅ جدول notifications موجود'
    ELSE '⚠️ جدول notifications غير موجود (الـ trigger لن يعمل)'
  END as status;

-- 6. عرض جميع الجداول الموجودة
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 7. محاولة إدراج رسالة تجريبية (سيفشل إذا كان هناك مشكلة)
-- لا تشغل هذا إلا إذا كنت متأكداً من وجود الجدول
-- INSERT INTO messages (sender_id, receiver_id, subject, body)
-- VALUES (
--   auth.uid(),
--   auth.uid(),
--   'رسالة تجريبية',
--   'هذه رسالة للاختبار'
-- );
