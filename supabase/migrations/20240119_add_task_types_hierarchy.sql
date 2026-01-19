-- Add parent_id to task_types for hierarchical structure
ALTER TABLE task_types ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES task_types(id) ON DELETE CASCADE;

-- Add index for parent_id
CREATE INDEX IF NOT EXISTS idx_task_types_parent_id ON task_types(parent_id);

-- Insert main task types (9 types)
INSERT INTO task_types (name, description, color, parent_id) VALUES
  ('إقرارات ضريبية', 'إقرارات ضريبية متنوعة', '#ef4444', NULL),
  ('فحص ضريبي', 'فحص ضريبي بأنواعه', '#f59e0b', NULL),
  ('استشارات', 'استشارات مختلفة', '#10b981', NULL),
  ('تسجيل محاسبي', 'تسجيل محاسبي', '#3b82f6', NULL),
  ('مراجعة', 'مراجعة', '#8b5cf6', NULL),
  ('تأسيس شركات', 'تأسيس شركات', '#ec4899', NULL),
  ('دراسات جدوى', 'دراسات جدوى', '#14b8a6', NULL),
  ('خدمات إدارية', 'خدمات إدارية', '#f97316', NULL),
  ('خدمات أخرى', 'خدمات أخرى', '#6366f1', NULL)
ON CONFLICT (name) DO NOTHING;

-- Insert sub-types for "إقرارات ضريبية"
INSERT INTO task_types (name, description, color, parent_id)
SELECT 
  sub.name,
  sub.description,
  '#ef4444',
  parent.id
FROM (VALUES
  ('إقرار دخل', 'إقرار دخل'),
  ('إقرار قيمة مضافة', 'إقرار قيمة مضافة'),
  ('إقرار مرتبات', 'إقرار مرتبات'),
  ('نموذج 41 خصم وتحصيل', 'نموذج 41 خصم وتحصيل')
) AS sub(name, description)
CROSS JOIN task_types parent
WHERE parent.name = 'إقرارات ضريبية' AND parent.parent_id IS NULL
ON CONFLICT (name) DO NOTHING;

-- Insert sub-types for "فحص ضريبي"
INSERT INTO task_types (name, description, color, parent_id)
SELECT 
  sub.name,
  sub.description,
  '#f59e0b',
  parent.id
FROM (VALUES
  ('دخل', 'فحص ضريبي - دخل'),
  ('قيمة مضافة', 'فحص ضريبي - قيمة مضافة'),
  ('كسب عمل', 'فحص ضريبي - كسب عمل'),
  ('دمغة', 'فحص ضريبي - دمغة'),
  ('خصم وتحصيل', 'فحص ضريبي - خصم وتحصيل')
) AS sub(name, description)
CROSS JOIN task_types parent
WHERE parent.name = 'فحص ضريبي' AND parent.parent_id IS NULL
ON CONFLICT (name) DO NOTHING;

-- Add comment
COMMENT ON COLUMN task_types.parent_id IS 'Parent task type ID for hierarchical structure';
