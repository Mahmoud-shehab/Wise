-- التحقق من وجود حقل reviewer_id في جدول tasks
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tasks' 
AND column_name = 'reviewer_id';

-- عرض جميع المهام مع المراجع
SELECT id, title, assignee_id, reviewer_id, status, created_at
FROM tasks
ORDER BY created_at DESC
LIMIT 10;

-- عرض المهام التي لها مراجع محدد
SELECT id, title, reviewer_id, status
FROM tasks
WHERE reviewer_id IS NOT NULL;
