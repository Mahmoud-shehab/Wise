-- ===================================
-- استعلامات للتحقق من البيانات
-- ===================================

-- 1. التحقق من وجود حقل reviewer_id
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'tasks' 
AND column_name IN ('reviewer_id', 'reviewed_at')
ORDER BY column_name;

-- النتيجة المتوقعة:
-- reviewer_id  | uuid                     | YES
-- reviewed_at  | timestamp with time zone | YES


-- 2. عرض جميع المهام مع المراجع
SELECT 
    id,
    title,
    status,
    assignee_id,
    reviewer_id,
    created_at
FROM tasks
ORDER BY created_at DESC
LIMIT 10;


-- 3. عرض المهام التي لها مراجع محدد
SELECT 
    t.id,
    t.title,
    t.status,
    t.reviewer_id,
    p.full_name as reviewer_name,
    p.id as reviewer_profile_id
FROM tasks t
LEFT JOIN profiles p ON t.reviewer_id = p.id
WHERE t.reviewer_id IS NOT NULL;


-- 4. عرض معلومات المستخدم bahaa
SELECT id, full_name, role, created_at
FROM profiles
WHERE full_name LIKE '%bahaa%' OR full_name LIKE '%بهاء%';


-- 5. تحديث مراجع لمهمة معينة (استبدل TASK_ID و USER_ID)
-- استخدم هذا فقط للاختبار
/*
UPDATE tasks
SET reviewer_id = 'USER_ID_من_الاستعلام_4'
WHERE id = 'TASK_ID_من_الاستعلام_2';
*/


-- 6. التحقق من حالة المهام
SELECT 
    status,
    COUNT(*) as count
FROM tasks
GROUP BY status
ORDER BY count DESC;


-- 7. عرض المهام في حالة pending_review
SELECT 
    id,
    title,
    status,
    reviewer_id,
    assignee_id,
    created_at
FROM tasks
WHERE status = 'pending_review';


-- ===================================
-- خطوات التشخيص:
-- ===================================

-- الخطوة 1: شغّل الاستعلام رقم 1
-- إذا لم يظهر reviewer_id، فالـ Migration لم يُطبق

-- الخطوة 2: شغّل الاستعلام رقم 4
-- احفظ الـ id الخاص بـ bahaa

-- الخطوة 3: شغّل الاستعلام رقم 2
-- احفظ الـ id الخاص بالمهمة

-- الخطوة 4: شغّل الاستعلام رقم 3
-- تحقق من أن المهمة لها reviewer_id

-- الخطوة 5: إذا لم يكن هناك reviewer_id
-- استخدم الاستعلام رقم 5 لتعيينه يدوياً

-- الخطوة 6: ارجع للتطبيق وحدّث الصفحة
