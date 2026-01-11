# دليل نظام الإشعارات

## 🔔 كيف يعمل نظام الإشعارات

### الإشعارات التلقائية

نظام الإشعارات يعمل تلقائياً عبر Database Triggers في Supabase. لا تحتاج لكتابة كود إضافي!

#### 1. إشعار عند تعيين مهمة

**متى يحدث:**
- عند إنشاء مهمة جديدة وتعيينها لموظف
- عند تغيير المسند إليه لمهمة موجودة

**الكود في قاعدة البيانات:**
```sql
CREATE OR REPLACE FUNCTION notify_task_assignment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.assignee_id IS NOT NULL AND 
     (OLD.assignee_id IS NULL OR OLD.assignee_id != NEW.assignee_id) THEN
    PERFORM create_notification(
      NEW.assignee_id,
      'task_assigned',
      'تم تعيين مهمة جديدة لك',
      NEW.title,
      '/tasks/' || NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**مثال:**
```typescript
// عند تعيين مهمة لموظف
await supabase
  .from('tasks')
  .update({ assignee_id: employeeId })
  .eq('id', taskId);

// سيتم إرسال إشعار تلقائياً للموظف! ✅
```

#### 2. إشعار عند إضافة تعليق

**متى يحدث:**
- عند إضافة تعليق على مهمة

**الكود في قاعدة البيانات:**
```sql
CREATE OR REPLACE FUNCTION notify_task_comment()
RETURNS TRIGGER AS $$
DECLARE
  task_record RECORD;
BEGIN
  SELECT * INTO task_record FROM tasks WHERE id = NEW.task_id;
  
  -- إشعار للمسند إليه
  IF task_record.assignee_id IS NOT NULL AND 
     task_record.assignee_id != NEW.user_id THEN
    PERFORM create_notification(
      task_record.assignee_id,
      'task_comment',
      'تعليق جديد على مهمتك',
      NEW.content,
      '/tasks/' || NEW.task_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**مثال:**
```typescript
// عند إضافة تعليق
await supabase
  .from('task_comments')
  .insert({
    task_id: taskId,
    user_id: userId,
    content: 'تعليق جديد'
  });

// سيتم إرسال إشعار تلقائياً للمسند إليه! ✅
```

### الإشعارات في الواجهة

#### عرض الإشعارات

```typescript
// في NotificationDropdown.tsx
const { data, error } = await supabase
  .from('notifications')
  .select('*')
  .eq('user_id', profile.id)
  .order('created_at', { ascending: false })
  .limit(10);
```

#### التحديث الفوري (Realtime)

```typescript
// الاشتراك في الإشعارات الجديدة
const channel = supabase
  .channel('notifications')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${profile.id}`,
    },
    () => {
      fetchNotifications(); // تحديث القائمة
    }
  )
  .subscribe();
```

## 📋 أنواع الإشعارات

### 1. task_assigned
- **العنوان**: "تم تعيين مهمة جديدة لك"
- **المحتوى**: اسم المهمة
- **الرابط**: `/tasks/{task_id}`

### 2. task_comment
- **العنوان**: "تعليق جديد على مهمتك"
- **المحتوى**: نص التعليق
- **الرابط**: `/tasks/{task_id}`

### 3. task_status_changed (يمكن إضافته)
- **العنوان**: "تم تغيير حالة المهمة"
- **المحتوى**: الحالة الجديدة
- **الرابط**: `/tasks/{task_id}`

## 🎯 كيفية الاستخدام

### للمطورين

#### إضافة نوع إشعار جديد

1. **إنشاء Function في قاعدة البيانات:**
```sql
CREATE OR REPLACE FUNCTION notify_custom_event()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_notification(
    target_user_id,
    'event_type',
    'عنوان الإشعار',
    'محتوى الإشعار',
    '/link/to/page'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

2. **إنشاء Trigger:**
```sql
CREATE TRIGGER trigger_notify_custom_event
  AFTER INSERT OR UPDATE ON your_table
  FOR EACH ROW
  EXECUTE FUNCTION notify_custom_event();
```

#### إرسال إشعار يدوياً

```typescript
// في حالات خاصة، يمكنك إرسال إشعار مباشرة
await supabase
  .from('notifications')
  .insert({
    user_id: targetUserId,
    type: 'custom_notification',
    title: 'عنوان الإشعار',
    content: 'محتوى الإشعار',
    link: '/link/to/page'
  });
```

### للمستخدمين

#### عرض الإشعارات
1. اضغط على أيقونة الجرس 🔔 في الـ sidebar
2. ستظهر قائمة بآخر 10 إشعارات

#### قراءة الإشعارات
- اضغط على الإشعار للانتقال للمهمة
- سيتم تحديده تلقائياً كمقروء

#### إدارة الإشعارات
- **تحديد كمقروء**: اضغط ✓
- **حذف**: اضغط ×
- **تحديد الكل كمقروء**: اضغط الزر في الأعلى

## 🔧 استكشاف الأخطاء

### الإشعارات لا تظهر

**1. تحقق من تشغيل Migration:**
```sql
-- في Supabase SQL Editor
SELECT * FROM notifications LIMIT 1;
```

**2. تحقق من وجود Triggers:**
```sql
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name LIKE '%notify%';
```

**3. تحقق من RLS Policies:**
```sql
-- يجب أن يكون هناك policy للقراءة
SELECT * FROM pg_policies 
WHERE tablename = 'notifications';
```

### الإشعارات لا تتحدث فورياً

**1. تحقق من تفعيل Realtime:**
- اذهب إلى Supabase Dashboard
- Settings > API > Realtime
- تأكد من تفعيل Realtime للجدول `notifications`

**2. تحقق من الاشتراك:**
```typescript
// تأكد من وجود هذا الكود في NotificationDropdown
const channel = supabase
  .channel('notifications')
  .on('postgres_changes', {...})
  .subscribe();
```

### الإشعارات تظهر لجميع المستخدمين

**تحقق من RLS Policy:**
```sql
-- يجب أن تكون Policy محددة للمستخدم الحالي
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());
```

## 📊 إحصائيات الإشعارات

### عدد الإشعارات غير المقروءة

```typescript
const { count } = await supabase
  .from('notifications')
  .select('*', { count: 'exact', head: true })
  .eq('user_id', userId)
  .eq('read', false);
```

### آخر إشعار

```typescript
const { data } = await supabase
  .from('notifications')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(1)
  .single();
```

## 🚀 ميزات مستقبلية

### 1. إشعارات البريد الإلكتروني
```typescript
// إرسال بريد إلكتروني عند الإشعار
await sendEmail({
  to: user.email,
  subject: notification.title,
  body: notification.content
});
```

### 2. إشعارات Push
```typescript
// إرسال push notification للموبايل
await sendPushNotification({
  userId: user.id,
  title: notification.title,
  body: notification.content
});
```

### 3. تجميع الإشعارات
```typescript
// تجميع الإشعارات المتشابهة
"لديك 5 تعليقات جديدة على مهامك"
```

### 4. إعدادات الإشعارات
```typescript
// السماح للمستخدم بتخصيص الإشعارات
{
  task_assigned: true,
  task_comment: true,
  task_status_changed: false
}
```

## 📝 ملاحظات مهمة

1. **الأداء**: الإشعارات محدودة بـ 10 في القائمة المنسدلة
2. **الأمان**: جميع الإشعارات محمية بـ RLS
3. **التحديث الفوري**: يعمل فقط إذا كان Realtime مفعل
4. **الحذف التلقائي**: يمكن إضافة job لحذف الإشعارات القديمة

## 🎉 الخلاصة

نظام الإشعارات يعمل تلقائياً! فقط:
1. ✅ شغل migration `20240104_asana_features.sql`
2. ✅ تأكد من تفعيل Realtime
3. ✅ استخدم النظام بشكل طبيعي

الإشعارات ستظهر تلقائياً عند:
- تعيين مهمة لموظف
- إضافة تعليق على مهمة
- أي حدث آخر تضيفه!

---

**نظام الإشعارات جاهز للاستخدام! 🔔**
