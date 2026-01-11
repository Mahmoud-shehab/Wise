import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Database } from '@/types/database.types';
import { ActivityLog } from '@/features/tasks/ActivityLog';
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge';
import TaskComments from '@/components/task/TaskComments';
import SubTasks from '@/components/task/SubTasks';
import { ArrowRight, Calendar, User, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useAuth } from '@/features/auth/AuthContext';

type Task = Database['public']['Tables']['tasks']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

export default function TaskDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [assignee, setAssignee] = useState<Profile | null>(null);
  const [reviewer, setReviewer] = useState<Profile | null>(null);
  const [reviewerId, setReviewerId] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Profile[]>([]);

  useEffect(() => {
    if (!id) return;
    const fetchTask = async () => {
      const { data, error } = await supabase.from('tasks').select('*').eq('id', id).single();
      if (error) {
        console.error(error);
        navigate('/tasks');
      } else {
        setTask(data);
        if (data.assignee_id) {
          const { data: emp } = await supabase
            .from('profiles')
            .select('id, full_name, role, created_at')
            .eq('id', data.assignee_id)
            .single();
          setAssignee(emp || null);
        } else {
          setAssignee(null);
        }
        
        // جلب المراجع من جدول task_reviewers
        const { data: reviewerData } = await supabase
          .from('task_reviewers')
          .select('reviewer_id')
          .eq('task_id', data.id)
          .single();

        if (reviewerData && reviewerData.reviewer_id) {
          setReviewerId(reviewerData.reviewer_id);
          const { data: rev } = await supabase
            .from('profiles')
            .select('id, full_name, role, created_at')
            .eq('id', reviewerData.reviewer_id)
            .single();
          setReviewer(rev || null);
        } else {
          setReviewerId(null);
          setReviewer(null);
        }
      }
      setLoading(false);
    };
    
    const fetchEmployees = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, role, created_at')
        .order('full_name', { ascending: true });
      setEmployees(data || []);
    };
    
    fetchTask();
    fetchEmployees();
  }, [id, navigate]);

  const updatePriority = async (newPriority: 'low' | 'medium' | 'high') => {
    if (!task) return;
    const oldPriority = task.priority;
    
    setTask({ ...task, priority: newPriority });

    const { error } = await supabase
      .from('tasks')
      .update({ priority: newPriority })
      .eq('id', task.id);

    if (error) {
      console.error('Error updating priority:', error);
      setTask({ ...task, priority: oldPriority });
    } else {
      await supabase.from('task_activity').insert({
        task_id: task.id,
        action: 'priority_change',
        to_status: newPriority
      });
    }
  };

  const updateStatus = async (newStatus: 'backlog' | 'assigned' | 'in_progress' | 'pending_review' | 'done' | 'blocked') => {
    if (!task) return;
    
    // التحقق من الصلاحيات لحالة "جاري المراجعة"
    if (newStatus === 'pending_review') {
      const isManager = profile?.role === 'manager';
      const isReviewer = user?.id === task.reviewer_id;
      
      if (!isManager && !isReviewer) {
        alert('فقط المدير أو المراجع المحدد يمكنه تغيير الحالة إلى "جاري المراجعة"');
        return;
      }
      
      if (!task.reviewer_id) {
        alert('يجب تعيين مراجع للمهمة أولاً');
        return;
      }
    }
    
    const oldStatus = task.status;
    
    setTask({ ...task, status: newStatus });

    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', task.id);

    if (error) {
      console.error('Error updating status:', error);
      setTask({ ...task, status: oldStatus });
    } else {
      await supabase.from('task_activity').insert({
        task_id: task.id,
        action: 'status_change',
        to_status: newStatus
      });
    }
  };

  const updateReviewer = async (newReviewerId: string | null) => {
    if (!task) return;
    
    console.log('🔧 Updating reviewer to:', newReviewerId);
    
    try {
      // أولاً: حذف جميع المراجعين الحاليين
      const { error: deleteError } = await supabase
        .from('task_reviewers')
        .delete()
        .eq('task_id', task.id);

      if (deleteError) {
        console.error('Error deleting old reviewers:', deleteError);
      }

      // ثانياً: إضافة المراجع الجديد (إذا كان موجوداً)
      if (newReviewerId) {
        const { data: insertData, error: insertError } = await supabase
          .from('task_reviewers')
          .insert({ 
            task_id: task.id, 
            reviewer_id: newReviewerId 
          })
          .select();

        console.log('✅ Insert result:', insertData);
        console.log('❌ Insert error:', insertError);

        if (insertError) {
          console.error('Error adding reviewer:', insertError);
          alert('حدث خطأ أثناء تعيين المراجع: ' + insertError.message);
          return;
        }

        const rev = employees.find(e => e.id === newReviewerId);
        setReviewer(rev || null);
        setReviewerId(newReviewerId);
        alert('✅ تم تعيين المراجع بنجاح!');
      } else {
        setReviewer(null);
        setReviewerId(null);
        alert('تم إزالة المراجع');
      }
    } catch (error) {
      console.error('Error updating reviewer:', error);
      alert('حدث خطأ غير متوقع: ' + error);
    }
  };

  if (loading) return <div className="text-center text-gray-600" dir="rtl">جاري التحميل...</div>;
  if (!task) return <div className="text-center text-gray-600" dir="rtl">المهمة غير موجودة</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6" dir="rtl">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-sm text-gray-500 hover:text-gray-900 mb-4 gap-1"
        >
          <ArrowRight className="w-4 h-4" /> رجوع
        </button>
        
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 break-words">
              {task.title}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StatusBadge status={task.status} />
              <PriorityBadge priority={task.priority} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">الوصف</h3>
            <div className="text-sm text-gray-600 whitespace-pre-wrap">
              {task.description || 'لا يوجد وصف متاح.'}
            </div>
          </div>

          {/* Subtasks */}
          <div className="card p-6">
            <SubTasks taskId={task.id} projectId={task.project_id} />
          </div>

          {/* Comments */}
          <div className="card p-6">
            <TaskComments taskId={task.id} />
          </div>

          {/* Attachments - معطل مؤقتاً حتى يتم إنشاء Storage bucket */}
          {/* <div className="card p-6">
            <TaskAttachments taskId={task.id} />
          </div> */}

          {/* Activity Log */}
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">سجل النشاط</h3>
            </div>
            <div className="p-6">
              <ActivityLog taskId={task.id} />
            </div>
          </div>
        </div>

        {/* Right Column - Info */}
        <div className="space-y-6">
          {/* Status & Priority Controls */}
          <div className="card p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الحالة
              </label>
              <select
                value={task.status}
                onChange={(e) => updateStatus(e.target.value as 'backlog' | 'assigned' | 'in_progress' | 'pending_review' | 'done' | 'blocked')}
                className="w-full rounded-md border-0 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm px-3 bg-white"
              >
                <option value="backlog">متأخرة</option>
                <option value="assigned">مستلمة</option>
                <option value="in_progress">جاري العمل</option>
                {/* فقط المراجع أو المدير يمكنهم تغيير الحالة إلى جاري المراجعة */}
                {(profile?.role === 'manager' || user?.id === task.reviewer_id) && (
                  <option value="pending_review">جاري المراجعة</option>
                )}
                <option value="done">مكتملة</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الأولوية
              </label>
              <select
                value={task.priority}
                onChange={(e) => updatePriority(e.target.value as 'low' | 'medium' | 'high')}
                className="w-full rounded-md border-0 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm px-3 bg-white"
              >
                <option value="low">منخفضة</option>
                <option value="medium">متوسطة</option>
                <option value="high">عالية</option>
              </select>
            </div>
          </div>

          {/* Task Info */}
          <div className="card p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">معلومات المهمة</h3>
            
            {/* Assignee */}
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-50 mt-0.5">
                <User className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-500 mb-1">المسند إليه</div>
                {task.assignee_id ? (
                  <div>
                    <div className="text-sm font-semibold text-gray-900">
                      {assignee?.full_name || 'موظف'}
                    </div>
                    <div className="text-xs text-gray-500 capitalize">
                      {assignee?.role === 'manager' ? 'مدير' : 'موظف'}
                    </div>
                    <div className="text-xs text-gray-400 truncate">
                      ID: {assignee?.id?.slice(0, 20) || task.assignee_id.slice(0, 20)}...
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">غير مسند</div>
                )}
              </div>
            </div>

            {/* Reviewer */}
            {profile?.role === 'manager' && (
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-purple-50 mt-0.5">
                  <User className="h-4 w-4 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-500 mb-1">المراجع</div>
                  <select
                    value={reviewerId || ''}
                    onChange={(e) => updateReviewer(e.target.value || null)}
                    className="w-full rounded-md border-0 py-1.5 text-sm text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 px-2 bg-white"
                  >
                    <option value="">غير محدد</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.full_name || emp.id.slice(0, 8)} ({emp.role === 'manager' ? 'مدير' : 'موظف'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
            
            {/* عرض المراجع للموظفين (للقراءة فقط) */}
            {profile?.role !== 'manager' && reviewerId && (
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-purple-50 mt-0.5">
                  <User className="h-4 w-4 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-500 mb-1">المراجع</div>
                  <div className="text-sm font-medium text-gray-900">
                    {reviewer?.full_name || 'مراجع'}
                  </div>
                </div>
              </div>
            )}

            {/* Due Date */}
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-purple-50 mt-0.5">
                <Calendar className="h-4 w-4 text-purple-600" />
              </div>
              <div className="flex-1">
                <div className="text-xs text-gray-500 mb-1">تاريخ الاستحقاق</div>
                <div className="text-sm font-medium text-gray-900">
                  {task.due_date
                    ? format(new Date(task.due_date), 'dd MMMM yyyy', { locale: ar })
                    : 'غير محدد'}
                </div>
              </div>
            </div>

            {/* Created Date */}
            {task.created_at && (
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-gray-50 mt-0.5">
                  <Clock className="h-4 w-4 text-gray-600" />
                </div>
                <div className="flex-1">
                  <div className="text-xs text-gray-500 mb-1">تاريخ الإنشاء</div>
                  <div className="text-sm font-medium text-gray-900">
                    {format(new Date(task.created_at), 'dd MMMM yyyy - HH:mm', { locale: ar })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
