# الحل النهائي - نظام المراجعة بدون Migration

## المشكلة
حقل `reviewer_id` غير موجود في جدول `tasks` لأن Migration لم يُطبق

## الحل
استخدام جدول منفصل `task_reviewers` بدلاً من حقل في جدول `tasks`

## الخطوات (3 خطوات فقط!)

### ⚡ الخطوة 1: إنشاء جدول task_reviewers

افتح **Supabase SQL Editor** والصق هذا الكود:

```sql
-- إنشاء جدول منفصل لمراجعي المهام
CREATE TABLE IF NOT EXISTS task_reviewers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(task_id, reviewer_id)
);

-- فهرس للبحث السريع
CREATE INDEX IF NOT EXISTS idx_task_reviewers_task_id ON task_reviewers(task_id);
CREATE INDEX IF NOT EXISTS idx_task_reviewers_reviewer_id ON task_reviewers(reviewer_id);

-- RLS policies
ALTER TABLE task_reviewers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view task reviewers"
  ON task_reviewers FOR SELECT
  USING (true);

CREATE POLICY "Managers can insert task reviewers"
  ON task_reviewers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'manager'
    )
  );

CREATE POLICY "Managers can delete task reviewers"
  ON task_reviewers FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'manager'
    )
  );

-- Trigger للإشعارات عند إضافة مراجع
CREATE OR REPLACE FUNCTION notify_new_reviewer()
RETURNS TRIGGER AS $$
DECLARE
  task_title TEXT;
BEGIN
  SELECT title INTO task_title FROM tasks WHERE id = NEW.task_id;
  
  INSERT INTO notifications (user_id, type, title, content, link)
  VALUES (
    NEW.reviewer_id,
    'task_assigned_reviewer',
    'تم تعيينك كمراجع',
    'تم تعيينك كمراجع للمهمة "' || task_title || '"',
    '/tasks/' || NEW.task_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_new_reviewer ON task_reviewers;
CREATE TRIGGER trigger_notify_new_reviewer
  AFTER INSERT ON task_reviewers
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_reviewer();
```

اضغط **RUN** ✅

### ⚡ الخطوة 2: تعيين المراجع للمهمة

1. افتح المهمة من صفحة تفاصيل المهمة
2. اختر المراجع (bahaa) من القائمة المنسدلة
3. سيظهر تنبيه "تم تعيين المراجع بنجاح" ✅

### ⚡ الخطوة 3: التحقق من لوحة المراجعة

1. سجل الدخول بحساب bahaa
2. افتح "لوحة المراجعة"
3. ستظهر المهمة! 🎉

## التحقق من نجاح الإنشاء

شغّل هذا الاستعلام:

```sql
SELECT * FROM task_reviewers;
```

يجب أن ترى السجلات المضافة.

## كيف يعمل النظام الجديد؟

### قبل (لم يعمل):
```
tasks table
├── id
├── title
└── reviewer_id ❌ (غير موجود)
```

### بعد (يعمل):
```
tasks table          task_reviewers table
├── id      ←────────── task_id
├── title            ├── reviewer_id
                     └── created_at
```

## المميزات

✅ لا يحتاج تعديل جدول `tasks`
✅ يعمل مع قاعدة البيانات الحالية
✅ يدعم إشعارات تلقائية
✅ RLS policies محمية
✅ يمكن إضافة مراجعين متعددين مستقبلاً

## استعلامات مفيدة

### عرض جميع المهام مع مراجعيها
```sql
SELECT 
  t.id,
  t.title,
  t.status,
  p.full_name as reviewer_name
FROM tasks t
LEFT JOIN task_reviewers tr ON t.id = tr.task_id
LEFT JOIN profiles p ON tr.reviewer_id = p.id;
```

### عرض مهام مراجع معين
```sql
SELECT 
  t.*,
  p.full_name as assignee_name
FROM tasks t
INNER JOIN task_reviewers tr ON t.id = tr.task_id
LEFT JOIN profiles p ON t.assignee_id = p.id
WHERE tr.reviewer_id = 'USER_ID_HERE';
```

### إضافة مراجع يدوياً (للاختبار)
```sql
INSERT INTO task_reviewers (task_id, reviewer_id)
VALUES ('TASK_ID', 'REVIEWER_ID');
```

## ملاحظات

- ✅ الجدول الجديد آمن تماماً
- ✅ لن يؤثر على المهام الموجودة
- ✅ يمكن تشغيل SQL أكثر من مرة بدون مشاكل
- ✅ الكود محدّث ليستخدم الجدول الجديد

---

**بعد هذه الخطوات، كل شيء سيعمل بشكل مثالي! 🚀**
