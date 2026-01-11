-- إضافة حقل username لجدول profiles
-- شغل هذا في Supabase SQL Editor

-- 1. إضافة عمود username
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- 2. إنشاء index للبحث السريع
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- 3. تحديث usernames للمستخدمين الموجودين (اختياري)
-- يمكنك تشغيل هذا لإضافة usernames تلقائية
UPDATE profiles 
SET username = LOWER(REPLACE(full_name, ' ', ''))
WHERE username IS NULL AND full_name IS NOT NULL;

-- 4. رسالة نجاح
SELECT 'Username field added successfully!' as message;

-- ملاحظة: الآن يمكنك إضافة username عند إنشاء مستخدم جديد
-- مثال:
-- INSERT INTO profiles (id, full_name, username, role)
-- VALUES ('user-id', 'أحمد محمد', 'ahmed', 'employee');
