# دليل إعداد نظام الإشعارات - خطوة بخطوة

## 📋 الخطوات المطلوبة

### الخطوة 1: تشغيل SQL Migration

#### الطريقة الأولى: من Supabase Dashboard (موصى بها)

1. **افتح Supabase Dashboard**
   - اذهب إلى: https://supabase.com/dashboard
   - اختر مشروعك

2. **افتح SQL Editor**
   - من القائمة الجانبية، اضغط على "SQL Editor"
   - أو اذهب مباشرة إلى: `https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql`

3. **انسخ والصق الكود**
   - افتح الملف: `supabase/migrations/20240105_notifications_only.sql`
   - انسخ **كل** محتوى الملف
   - الصقه في SQL Editor

4. **شغل الكود**
   - اضغط زر "Run" أو اضغط `Ctrl + Enter`
   - انتظر حتى يظهر: "Success. No rows returned"

5. **تحقق من النجاح**
   - يجب أن ترى رسالة: "Notifications system created successfully!"

#### الطريقة الثانية: من Terminal (إذا كان لديك Supabase CLI)

```bash
# تأكد من تسجيل الدخول
supabase login

# ربط المشروع
supabase link --project-ref YOUR_PROJECT_ID

# تشغيل Migration
supabase db push
```

### الخطوة 2: التحقق من إنشاء الجدول

1. **افتح Table Editor**
   - من القائمة الجانبية، اضغط على "Table Editor"
   - أو اذهب إلى: `https://supabase.com/dashboard/project/YOUR_PROJECT_ID/editor`

2. **ابحث عن جدول notifications**
   - يجب أن ترى جدول اسمه `notifications` في القائمة
   - اضغط عليه لرؤية الأعمدة

3. **تحقق من الأعمدة**
   يجب أن ترى هذه الأعمدة:
   - ✅ `id` (uuid)
   - ✅ `user_id` (uuid)
   - ✅ `type` (text)
   - ✅ `title` (text)
   - ✅ `content` (text)
   - ✅ `link` (text)
   - ✅ `read` (boolean)
   - ✅ `created_at` (timestamptz)

### الخطوة 3: تفعيل Realtime

1. **افتح Database Settings**
   - اذهب إلى: Database > Replication
   - أو: `https://supabase.com/dashboard/project/YOUR_PROJECT_ID/database/replication`

2. **افتح Publications**
   - ابحث عن `supabase_realtime` publication
   - اضغط عليه

3. **أضف جدول notifications**
   - اضغط "Edit publication"
   - ابحث عن `notifications` في القائمة
   - فعّل الـ checkbox بجانبه
   - اضغط "Save"

4. **تحقق من التفعيل**
   - يجب أن ترى `notifications` في قائمة الجداول المفعلة

### الخطوة 4: التحقق من RLS Policies

1. **افتح Authentication > Policies**
   - اذهب إلى: `https://supabase.com/dashboard/project/YOUR_PROJECT_ID/auth/policies`

2. **ابحث عن notifications**
   - يجب أن ترى 4 policies:
     - ✅ "Users can view their own notifications" (SELECT)
     - ✅ "System can create notifications" (INSERT)
     - ✅ "Users can update their own notifications" (UPDATE)
     - ✅ "Users can delete their own notifications" (DELETE)

### الخطوة 5: التحقق من Triggers

1. **افتح SQL Editor**

2. **شغل هذا الأمر للتحقق:**
```sql
SELECT 
  trigger_name, 
  event_object_table, 
  action_statement
FROM information_schema.triggers 
WHERE trigger_name LIKE '%notify%'
ORDER BY trigger_name;
```

3. **يجب أن ترى:**
   - ✅ `trigger_notify_task_assignment` على جدول `tasks`
   - ✅ `trigger_notify_task_comment` على جدول `task_comments`

### الخطوة 6: اختبار النظام

#### اختبار يدوي - إنشاء إشعار تجريبي

1. **افتح SQL Editor**

2. **شغل هذا الأمر:**
```sql
-- استبدل 'YOUR_USER_ID' بـ ID مستخدم حقيقي من جدول profiles
INSERT INTO notifications (user_id, type, title, content, link)
VALUES (
  'YOUR_USER_ID',  -- ضع ID المستخدم هنا
  'test',
  'إشعار تجريبي',
  'هذا إشعار للاختبار',
  '/tasks'
);
```

3. **للحصول على user_id:**
```sql
-- شغل هذا الأمر أولاً لرؤية المستخدمين
SELECT id, full_name, role FROM profiles LIMIT 5;
```

4. **تحقق من الإشعار في الواجهة**
   - سجل دخول بحساب المستخدم
   - انظر إلى أيقونة الجرس 🔔
   - يجب أن ترى رقم "1" أحمر
   - اضغط على الجرس
   - يجب أن ترى "إشعار تجريبي"

#### اختبار حقيقي - تعيين مهمة

1. **سجل دخول كمدير**

2. **اذهب إلى "جميع المهام"**

3. **أنشئ مهمة جديدة أو افتح مهمة موجودة**

4. **عين المهمة لموظف**
   - اختر موظف من القائمة المنسدلة
   - احفظ التغييرات

5. **سجل دخول بحساب الموظف**
   - يجب أن ترى إشعار جديد فوراً!
   - "تم تعيين مهمة جديدة لك"

## ✅ قائمة التحقق النهائية

قبل الانتهاء، تأكد من:

- [ ] تم تشغيل SQL migration بنجاح
- [ ] جدول `notifications` موجود في Database
- [ ] جدول `notifications` يحتوي على 8 أعمدة
- [ ] Realtime مفعل للجدول `notifications`
- [ ] 4 RLS Policies موجودة
- [ ] 2 Triggers موجودة (assignment, comment)
- [ ] اختبار يدوي نجح (إشعار تجريبي ظهر)
- [ ] اختبار حقيقي نجح (إشعار تعيين مهمة ظهر)

## 🐛 استكشاف الأخطاء

### خطأ: "relation notifications does not exist"

**الحل:**
- الجدول لم يتم إنشاؤه
- شغل SQL migration مرة أخرى
- تأكد من عدم وجود أخطاء في SQL Editor

### خطأ: "permission denied for table notifications"

**الحل:**
- RLS Policies غير موجودة أو خاطئة
- شغل SQL migration مرة أخرى
- تحقق من Policies في Dashboard

### الإشعارات لا تظهر في الواجهة

**الحل:**
1. تحقق من Console المتصفح (F12)
2. ابحث عن أخطاء JavaScript
3. تأكد من أن Realtime مفعل
4. جرب تحديث الصفحة (F5)

### الإشعارات لا تتحدث فورياً

**الحل:**
1. تأكد من تفعيل Realtime للجدول
2. تحقق من Console للأخطاء
3. تأكد من وجود Realtime subscription في الكود

### Trigger لا يعمل

**الحل:**
```sql
-- تحقق من وجود Trigger
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'trigger_notify_task_assignment';

-- إذا لم يكن موجود، شغل SQL migration مرة أخرى
```

## 📞 إذا واجهت مشاكل

1. **تحقق من Supabase Logs**
   - اذهب إلى: Logs > Postgres Logs
   - ابحث عن أخطاء

2. **تحقق من SQL Editor**
   - شغل الأوامر أعلاه للتحقق
   - تأكد من وجود كل شيء

3. **تحقق من Console المتصفح**
   - افتح Developer Tools (F12)
   - ابحث عن أخطاء في Console

4. **أعد تشغيل Migration**
   - احذف الجدول إذا كان موجود:
   ```sql
   DROP TABLE IF EXISTS notifications CASCADE;
   ```
   - شغل SQL migration مرة أخرى

## 🎉 النجاح!

إذا رأيت إشعار عند تعيين مهمة، فالنظام يعمل بنجاح! 🎊

الآن:
- ✅ جدول notifications موجود
- ✅ Triggers تعمل تلقائياً
- ✅ Realtime يعمل
- ✅ الإشعارات تظهر فوراً

**نظام الإشعارات جاهز للاستخدام!** 🔔✨

---

## 📝 ملاحظات إضافية

### حذف بيانات الاختبار

بعد الاختبار، يمكنك حذف الإشعارات التجريبية:

```sql
DELETE FROM notifications WHERE type = 'test';
```

### مراقبة الإشعارات

لرؤية جميع الإشعارات في قاعدة البيانات:

```sql
SELECT 
  n.id,
  p.full_name as user_name,
  n.type,
  n.title,
  n.content,
  n.read,
  n.created_at
FROM notifications n
JOIN profiles p ON n.user_id = p.id
ORDER BY n.created_at DESC
LIMIT 20;
```

### إحصائيات الإشعارات

```sql
-- عدد الإشعارات لكل مستخدم
SELECT 
  p.full_name,
  COUNT(*) as total_notifications,
  COUNT(*) FILTER (WHERE n.read = false) as unread_count
FROM notifications n
JOIN profiles p ON n.user_id = p.id
GROUP BY p.full_name
ORDER BY total_notifications DESC;
```

---

**اتبع هذه الخطوات بالترتيب وسيعمل نظام الإشعارات بنجاح!** 🚀
