import { useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Database } from '@/types/database.types';
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge';
import { Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Calendar, Eye } from 'lucide-react';
import { format } from 'date-fns';

type Task = Database['public']['Tables']['tasks']['Row'];

interface TaskWithProfile extends Task {
  assignee?: { full_name: string | null };
}

export default function ReviewPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchReviewTasks();

    // Realtime subscription
    const channel = supabase
      .channel('review-tasks')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'task_reviewers'
      }, () => {
        fetchReviewTasks();
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'tasks'
      }, () => {
        fetchReviewTasks();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const fetchReviewTasks = async () => {
    if (!user) return;
    
    console.log('🔍 Fetching review tasks for user:', user.id);
    
    // جلب المهام من جدول task_reviewers
    const { data: reviewerData, error: reviewerError } = await supabase
      .from('task_reviewers')
      .select('task_id')
      .eq('reviewer_id', user.id);

    console.log('📋 Reviewer data:', reviewerData);
    console.log('❌ Reviewer error:', reviewerError);

    if (reviewerError) {
      console.error('Error fetching reviewer data:', reviewerError);
      setLoading(false);
      return;
    }

    if (!reviewerData || reviewerData.length === 0) {
      console.log('⚠️ No tasks assigned to this reviewer');
      setTasks([]);
      setLoading(false);
      return;
    }

    const taskIds = reviewerData.map(r => r.task_id);
    console.log('📝 Task IDs:', taskIds);
    console.log('📝 Task IDs length:', taskIds.length);
    console.log('📝 First task ID:', taskIds[0]);

    // جلب تفاصيل المهام
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        assignee:profiles!tasks_assignee_id_fkey(full_name)
      `)
      .in('id', taskIds)
      .order('updated_at', { ascending: false });

    console.log('📊 Review tasks data:', data);
    console.log('❌ Review tasks error:', error);
    console.log('📊 Tasks count:', data?.length || 0);

    if (error) {
      console.error('Error fetching review tasks:', error);
    } else {
      setTasks(data as TaskWithProfile[] || []);
    }
    setLoading(false);
  };

  const handleApprove = async (taskId: string) => {
    console.log('🟢 Approving task:', taskId);
    
    const { data, error } = await supabase
      .from('tasks')
      .update({ 
        status: 'done',
        completed_at: new Date().toISOString(),
        reviewed_at: new Date().toISOString()
      })
      .eq('id', taskId)
      .select();

    console.log('✅ Approve result:', data);
    console.log('❌ Approve error:', error);

    if (error) {
      console.error('Error approving task:', error);
      alert('حدث خطأ أثناء اعتماد المهمة: ' + error.message);
    } else {
      alert('✅ تم اعتماد المهمة بنجاح!');
      fetchReviewTasks(); // تحديث القائمة
    }
  };

  const handleReturn = async (taskId: string) => {
    console.log('🔴 Returning task:', taskId);
    
    const { data, error } = await supabase
      .from('tasks')
      .update({ 
        status: 'in_progress',
        reviewed_at: new Date().toISOString()
      })
      .eq('id', taskId)
      .select();

    console.log('✅ Return result:', data);
    console.log('❌ Return error:', error);

    if (error) {
      console.error('Error returning task:', error);
      alert('حدث خطأ أثناء رد المهمة: ' + error.message);
    } else {
      alert('✅ تم رد المهمة بنجاح!');
      fetchReviewTasks(); // تحديث القائمة
    }
  };

  const pendingTasks = tasks.filter(t => t.status === 'pending_review');
  const approvedTasks = tasks.filter(t => t.status === 'done');
  const otherTasks = tasks.filter(t => t.status !== 'pending_review' && t.status !== 'done');

  if (loading) return <div className="text-center text-gray-600">جاري التحميل...</div>;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">لوحة المراجعة</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="card p-3 sm:p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <div className="p-1.5 sm:p-2 rounded-lg bg-purple-50">
              <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-gray-900">{pendingTasks.length}</div>
          <div className="text-xs sm:text-sm text-gray-600">جاري المراجعة</div>
        </div>
        <div className="card p-3 sm:p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <div className="p-1.5 sm:p-2 rounded-lg bg-blue-50">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-gray-900">{otherTasks.length}</div>
          <div className="text-xs sm:text-sm text-gray-600">قيد التنفيذ</div>
        </div>
        <div className="card p-3 sm:p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <div className="p-1.5 sm:p-2 rounded-lg bg-green-50">
              <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-gray-900">{approvedTasks.length}</div>
          <div className="text-xs sm:text-sm text-gray-600">معتمدة</div>
        </div>
      </div>

      {/* Pending Review Tasks */}
      {pendingTasks.length > 0 && (
        <div className="card">
          <div className="px-3 sm:px-6 py-2 sm:py-3 border-b border-gray-200 bg-purple-50">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">مهام تحتاج للمراجعة</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {pendingTasks.map(task => (
              <div key={task.id} className="px-3 sm:px-6 py-3 sm:py-4 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <Link to={`/tasks/${task.id}`} className="text-sm sm:text-base font-semibold text-gray-900 hover:text-blue-700 block">
                      {task.title}
                    </Link>
                    {task.description && (
                      <p className="mt-1 text-xs sm:text-sm text-gray-600 line-clamp-2 sm:line-clamp-1">
                        {task.description}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <StatusBadge status={task.status} />
                      <PriorityBadge priority={task.priority} />
                      {task.assignee && (
                        <span className="text-xs text-gray-500">
                          بواسطة: {task.assignee.full_name || 'غير معروف'}
                        </span>
                      )}
                      {task.updated_at && (
                        <span className="text-xs text-gray-500">
                          {format(new Date(task.updated_at), 'dd/MM/yyyy HH:mm')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 justify-end sm:justify-start">
                    <button
                      onClick={() => handleApprove(task.id)}
                      className="rounded-md bg-green-600 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-semibold text-white hover:bg-green-500 flex items-center gap-1 whitespace-nowrap"
                    >
                      <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      اعتماد
                    </button>
                    <button
                      onClick={() => handleReturn(task.id)}
                      className="rounded-md bg-red-600 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-semibold text-white hover:bg-red-500 flex items-center gap-1 whitespace-nowrap"
                    >
                      <XCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                      رد
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Approved Tasks */}
      {approvedTasks.length > 0 && (
        <div className="card">
          <div className="px-3 sm:px-6 py-2 sm:py-3 border-b border-gray-200 bg-green-50">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">المهام المعتمدة</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {approvedTasks.map(task => (
              <div key={task.id} className="px-3 sm:px-6 py-3 sm:py-4 hover:bg-gray-50 transition-colors opacity-70">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <Link to={`/tasks/${task.id}`} className="text-sm sm:text-base font-semibold text-gray-900 hover:text-blue-700 block">
                      {task.title}
                    </Link>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <StatusBadge status={task.status} />
                      <PriorityBadge priority={task.priority} />
                      {task.assignee && (
                        <span className="text-xs text-gray-500">
                          بواسطة: {task.assignee.full_name || 'غير معروف'}
                        </span>
                      )}
                      {task.reviewed_at && (
                        <span className="text-xs text-gray-500">
                          تم الاعتماد: {format(new Date(task.reviewed_at), 'dd/MM/yyyy HH:mm')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Other Tasks (In Progress) */}
      {otherTasks.length > 0 && (
        <div className="card">
          <div className="px-3 sm:px-6 py-2 sm:py-3 border-b border-gray-200 bg-blue-50">
            <h2 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">مهام قيد التنفيذ (لم تُرسل للمراجعة بعد)</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {otherTasks.map(task => (
              <div key={task.id} className="px-3 sm:px-6 py-3 sm:py-4 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <Link to={`/tasks/${task.id}`} className="text-sm sm:text-base font-semibold text-gray-900 hover:text-blue-700 block">
                      {task.title}
                    </Link>
                    {task.description && (
                      <p className="mt-1 text-xs sm:text-sm text-gray-600 line-clamp-2 sm:line-clamp-1">
                        {task.description}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <StatusBadge status={task.status} />
                      <PriorityBadge priority={task.priority} />
                      {task.assignee && (
                        <span className="text-xs text-gray-500">
                          بواسطة: {task.assignee.full_name || 'غير معروف'}
                        </span>
                      )}
                      {task.updated_at && (
                        <span className="text-xs text-gray-500">
                          {format(new Date(task.updated_at), 'dd/MM/yyyy HH:mm')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {tasks.length === 0 && (
        <div className="card p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-400">
            <Calendar className="h-8 w-8" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-gray-900">لا توجد مهام مسندة لك كمراجع</h3>
          <p className="mt-2 text-sm text-gray-500">لم يتم تعيينك كمراجع لأي مهام بعد</p>
        </div>
      )}
    </div>
  );
}
