-- Add new fields to profiles table for partner information

-- Add job title field
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS job_title TEXT;

-- Add national ID field
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS national_id TEXT;

-- Add hire date field
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hire_date DATE;

-- Add social insurance date field
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS social_insurance_date DATE;

-- Add insurance number field
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS insurance_number TEXT;

-- Add personal email field
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS personal_email TEXT;

-- Add personal phone field
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS personal_phone TEXT;

-- Add work phone field
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS work_phone TEXT;

-- Add comments
COMMENT ON COLUMN profiles.job_title IS 'المسمى الوظيفي';
COMMENT ON COLUMN profiles.national_id IS 'الرقم القومي';
COMMENT ON COLUMN profiles.hire_date IS 'تاريخ التعيين';
COMMENT ON COLUMN profiles.social_insurance_date IS 'تاريخ التأمين الاجتماعي';
COMMENT ON COLUMN profiles.insurance_number IS 'الرقم التأميني';
COMMENT ON COLUMN profiles.personal_email IS 'البريد الإلكتروني الشخصي';
COMMENT ON COLUMN profiles.work_phone IS 'رقم تليفون العمل';
COMMENT ON COLUMN profiles.personal_phone IS 'رقم التليفون الشخصي';
