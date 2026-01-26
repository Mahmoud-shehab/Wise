-- Update task dates structure
-- Add estimated_end_date, actual_start_date, actual_end_date

-- Add new columns
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS estimated_end_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS actual_start_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS actual_end_date TIMESTAMPTZ;

-- Copy existing due_date to estimated_end_date if not already set
UPDATE tasks
SET estimated_end_date = due_date
WHERE estimated_end_date IS NULL AND due_date IS NOT NULL;

-- Add helpful comments
COMMENT ON COLUMN tasks.estimated_end_date IS 'التاريخ المقدر للانتهاء - يحدده المدير عند إنشاء المهمة';
COMMENT ON COLUMN tasks.actual_start_date IS 'تاريخ البداية الفعلي - يحدده الشريك عند بدء العمل';
COMMENT ON COLUMN tasks.actual_end_date IS 'تاريخ النهاية الفعلي - يحدده الشريك عند إنهاء المهمة';
