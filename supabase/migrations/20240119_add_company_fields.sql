-- Add new fields to companies table based on Excel requirements

-- Add address field
ALTER TABLE companies ADD COLUMN IF NOT EXISTS address TEXT;

-- Add phone field
ALTER TABLE companies ADD COLUMN IF NOT EXISTS phone TEXT;

-- Add contact person field
ALTER TABLE companies ADD COLUMN IF NOT EXISTS contact_person TEXT;

-- Add mobile field
ALTER TABLE companies ADD COLUMN IF NOT EXISTS mobile TEXT;

-- Add emails field (can store multiple emails as JSON array or comma-separated)
ALTER TABLE companies ADD COLUMN IF NOT EXISTS emails TEXT;

-- Add tax portal data as JSONB for structured data
ALTER TABLE companies ADD COLUMN IF NOT EXISTS tax_portal_data JSONB;

-- Add comments
COMMENT ON COLUMN companies.address IS 'عنوان الشركة';
COMMENT ON COLUMN companies.phone IS 'رقم تليفون';
COMMENT ON COLUMN companies.contact_person IS 'شخص التواصل';
COMMENT ON COLUMN companies.mobile IS 'رقم موبايل';
COMMENT ON COLUMN companies.emails IS 'البريد الإلكتروني (يمكن إضافة أكثر من بريد)';
COMMENT ON COLUMN companies.tax_portal_data IS 'بيانات بوابة الضرائب: {tax_registration_number, tax_file_number, tax_office, registered_email, registered_phone, username, password, other_data}';
