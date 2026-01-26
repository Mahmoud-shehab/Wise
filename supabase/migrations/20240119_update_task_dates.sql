-- Update task dates structure
-- Replace start_date and end_date with estimated_end_date, actual_start_date, actual_end_date

-- Add new columns
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS estimated_end_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS actual_start_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS actual_end_date TIMESTAMPTZ;

-- Copy existing data to new columns
-- end_date -> estimated_end_date (what was planned)
-- start_date -> actual_start_date (when work actually started)
UPDATE tasks
SET estimated_end_date = end_date,
    actual_start_date = start_date
WHERE end_date IS NOT NULL OR start_date IS NOT NULL;

-- Drop old columns
ALTER TABLE tasks
DROP COLUMN IF EXISTS start_date,
DROP COLUMN IF EXISTS end_date;

-- Add helpful comment
COMMENT ON COLUMN tasks.estimated_end_date IS 'التاريخ المقدر للانتهاء - يحدده المدير عند إنشاء المهمة';
COMMENT ON COLUMN tasks.actual_start_date IS 'تاريخ البداية الفعلي - يحدده الشريك عند بدء العمل';
COMMENT ON COLUMN tasks.actual_end_date IS 'تاريخ النهاية الفعلي - يحدده الشريك عند إنهاء المهمة';
