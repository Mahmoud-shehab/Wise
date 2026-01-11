import { useEffect, useState } from 'react';
import { useTasks } from '../features/tasks/useTasks';
import { TaskCard } from '../features/tasks/TaskCard';
import { useAuth } from '../features/auth/AuthContext';
import { CheckCircle2, Clock, PlayCircle, Calendar } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { Database } from '@/types/database.types';

export default function TasksPage() {
  const { tasks, loading, updateTaskStatus, assignTask } = useTasks();
  const { profile, user } = useAuth();
  const [filter, setFilter] = useState('all');
  const isManager = profile?.role === 'manager';
  type Profile = Database['public']['Tables']['profiles']['Row'];
  const [employees, setEmployees] = useState<Profile[]>([]);

  useEffect(() => {
    const fetchEmployees = async () => {
      if (!isManager) return;
      if (!isSupabaseConfigured) {
        setEmployees([]);
        return;
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role, created_at')
        .order('full_name', { ascending: true });
      if (error) {
        console.error('Error fetching employees:', error);
      } else {
        setEmployees(data || []);
      }
    };
    fetchEmployees();
  }, [isManager]);

  const filteredTasks = tasks.filter(task => {
    // للموظفين: عرض مهامهم فقط
    if (profile?.role === 'employee' && task.assignee_id !== user?.id) {
      return false;
    }
    
    // للمدير: تطبيق الفلاتر
    if (filter === 'all') return true;
    if (filter === 'my_tasks') return task.assignee_id === user?.id;
    if (filter === 'unassigned') return !task.assignee_id;
    return task.status === filter;
  });

  // فصل المهام النشطة عن المكتملة
  const activeTasks = filteredTasks.filter(task => task.status !== 'done');
  const completedTasks = filteredTasks.filter(task => task.status === 'done');

  const handleAssignSelf = async (taskId: string) => {
    if (user) {
        await assignTask(taskId, user.id);
    }
  };

  // Calculate stats
  const stats = {
    done: tasks.filter(t => t.status === 'done').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    assigned: tasks.filter(t => t.status === 'assigned').length,
    pending_review: tasks.filter(t => t.status === 'pending_review').length,
  };

  if (loading) return <div className="text-center text-gray-600">جاري التحميل...</div>;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">مهامي</h1>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-sm font-semibold text-gray-700">الحالة:</span>
          <div className="flex gap-2 overflow-x-auto">
            {isManager && (
              <>
                <button
                  onClick={() => setFilter('all')}
                  className={`chip ${filter === 'all' ? 'chip-active' : ''}`}
                >
                  جميع المهام
                </button>
                <button
                  onClick={() => setFilter('my_tasks')}
                  className={`chip ${filter === 'my_tasks' ? 'chip-active' : ''}`}
                >
                  مهامي
                </button>
                <button
                  onClick={() => setFilter('unassigned')}
                  className={`chip ${filter === 'unassigned' ? 'chip-active' : ''}`}
                >
                  غير مسندة
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards - Manager Only */}
      {isManager && (
        <div className="grid grid-cols-4 gap-4">
          <div className="card p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <div className="p-2 rounded-lg bg-yellow-50">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.assigned}</div>
            <div className="text-sm text-gray-600">مستلمة</div>
          </div>
          <div className="card p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <div className="p-2 rounded-lg bg-purple-50">
                <PlayCircle className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.in_progress}</div>
            <div className="text-sm text-gray-600">جاري العمل</div>
          </div>
          <div className="card p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <div className="p-2 rounded-lg bg-blue-50">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.pending_review}</div>
            <div className="text-sm text-gray-600">جاري المراجعة</div>
          </div>
          <div className="card p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <div className="p-2 rounded-lg bg-green-50">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.done}</div>
            <div className="text-sm text-gray-600">مكتملة</div>
          </div>
        </div>
      )}

      {/* Tasks List */}
      <div className="card">
        {activeTasks.length === 0 && completedTasks.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-400">
              <Calendar className="h-8 w-8" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">لا توجد مهام</h3>
            <p className="mt-2 text-sm text-gray-500">لم يتم تخصيص أي مهام بعد</p>
          </div>
        ) : (
          <>
            {/* المهام النشطة */}
            {activeTasks.length > 0 && (
              <div className="divide-y divide-gray-200">
                {activeTasks.map(task => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    onStatusChange={updateTaskStatus}
                    onAssignSelf={handleAssignSelf}
                  />
                ))}
              </div>
            )}
            
            {/* المهام المكتملة */}
            {completedTasks.length > 0 && (
              <div className="mt-6 border-t-2 border-gray-200">
                <div className="px-6 py-3 bg-gray-50">
                  <h3 className="text-sm font-semibold text-gray-700">المهام المكتملة</h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {completedTasks.map(task => (
                    <div key={task.id} className="relative">
                      {/* خط طولي على المهمة المكتملة */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-full h-0.5 bg-gray-300"></div>
                      </div>
                      <div className="opacity-60">
                        <TaskCard 
                          task={task} 
                          onStatusChange={updateTaskStatus}
                          onAssignSelf={handleAssignSelf}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
