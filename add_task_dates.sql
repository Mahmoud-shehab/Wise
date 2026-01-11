-- إضافة حقول التواريخ لجدول المهام
-- شغل هذا الأمر في Supabase SQL Editor

-- إضافة حقل تاريخ البدء
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS start_date DATE;

-- إضافة حقل تاريخ الانتهاء (إذا لم يكن موجوداً)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_date DATE;

-- رسالة نجاح
SELECT 'تم إضافة حقول التواريخ بنجاح!' as message;

-- التحقق من الحقول
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tasks' 
AND column_name IN ('start_date', 'due_date');
