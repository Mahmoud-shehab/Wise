# Database Migrations

## كيفية تطبيق الـ Migrations

### الطريقة 1: استخدام Supabase CLI (موصى بها)

1. تثبيت Supabase CLI:
```bash
npm install -g supabase
```

2. ربط المشروع بـ Supabase:
```bash
supabase link --project-ref your-project-ref
```

3. تطبيق الـ migrations:
```bash
supabase db push
```

### الطريقة 2: نسخ ولصق SQL يدوياً

1. افتح Supabase Dashboard
2. اذهب إلى SQL Editor
3. انسخ محتوى ملف `20240102_companies_and_task_types.sql`
4. الصقه في SQL Editor
5. اضغط Run

## الجداول المضافة

### 1. جدول `companies` (الشركات)
- `id`: UUID (Primary Key)
- `name`: TEXT (اسم الشركة)
- `legal_name`: TEXT (الاسم القانوني)
- `sector`: TEXT (القطاع)
- `required_fields`: TEXT (المطلوبات)
- `notes`: TEXT (ملاحظات)
- `created_at`: TIMESTAMPTZ
- `updated_at`: TIMESTAMPTZ

### 2. جدول `task_types` (أنواع المهام)
- `id`: UUID (Primary Key)
- `name`: TEXT (اسم النوع - فريد)
- `description`: TEXT (الوصف)
- `color`: TEXT (اللون)
- `created_at`: TIMESTAMPTZ
- `updated_at`: TIMESTAMPTZ

### 3. تحديثات على جدول `tasks`
- إضافة `company_id`: UUID (Foreign Key إلى companies)
- إضافة `task_type_id`: UUID (Foreign Key إلى task_types)

## الصلاحيات (RLS Policies)

### للشركات (companies):
- **القراءة**: جميع المستخدمين المصادق عليهم
- **الإضافة/التعديل/الحذف**: المدراء فقط

### لأنواع المهام (task_types):
- **القراءة**: جميع المستخدمين المصادق عليهم
- **الإضافة/التعديل/الحذف**: المدراء فقط

## ملاحظات مهمة

1. تأكد من أن لديك صلاحيات المدير في Supabase
2. قم بعمل backup للبيانات قبل تطبيق الـ migrations
3. الـ migrations تستخدم `IF NOT EXISTS` لتجنب الأخطاء عند التطبيق المتكرر
4. تم إضافة indexes لتحسين الأداء
5. تم إضافة triggers لتحديث `updated_at` تلقائياً
