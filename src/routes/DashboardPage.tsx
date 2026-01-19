import { useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, CalendarDays, Clock3, TrendingUp, Calendar } from 'lucide-react';

export default function DashboardPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>({});
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const dateText = new Intl.DateTimeFormat('ar-EG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'}).format(new Date());

  useEffect(() => {
    if (!profile) return;
    
    if (profile.role === 'employee') {
        // Employee dashboard could just be tasks page or specific view
        // For MVP, let's redirect or show simple greeting
        setLoading(false);
        return;
    }

    const fetchStats = async () => {
        const { data: tasks } = await supabase.from('tasks').select('status, priority');
        if (tasks) {
            const statusCounts = tasks.reduce((acc: any, task) => {
                acc[task.status] = (acc[task.status] || 0) + 1;
                return acc;
            }, {});
            setStats(statusCounts);
        }
        
        // جلب آخر 5 مهام
        const { data: recent } = await supabase
            .from('tasks')
            .select('id, title, status, priority, created_at')
            .order('created_at', { ascending: false })
            .limit(5);
        
        setRecentTasks(recent || []);
        setLoading(false);
    };

    fetchStats();
    
    // Realtime for stats
    const channel = supabase.channel('dashboard-stats')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
            fetchStats();
        })
        .subscribe();
        
    return () => { supabase.removeChannel(channel); };

  }, [profile]);

  if (profile?.role === 'employee') {
      return (
          <div className="space-y-6" dir="rtl">
              <div className="card p-6">
                  <h1 className="text-2xl font-bold text-gray-900">
                      مرحباً، {profile.full_name || 'شريك'}!
                  </h1>
                  <p className="mt-2 text-gray-600">
                      ابدأ من صفحة
                      <button onClick={() => navigate('/tasks')} className="mx-1 text-[#114fd1] underline">
                        المهام
                      </button>
                  </p>
              </div>
          </div>
      );
  }

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div className="space-y-6" dir="rtl">
      <div className="w-full text-right">
        <div className="text-xl font-bold text-gray-900">
          مرحباً، {profile?.full_name || 'مدير النظام'}! 👋
        </div>
        <div className="text-sm text-gray-500">{dateText}</div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4 h-24">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">مهام مكتملة</div>
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-900">{stats.done || 0}</div>
        </div>
        <div className="card p-4 h-24">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">جارى العمل</div>
            <CalendarDays className="h-5 w-5 text-purple-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-900">{stats.in_progress || 0}</div>
        </div>
        <div className="card p-4 h-24">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">مهام مفتوحة</div>
            <Clock3 className="h-5 w-5 text-yellow-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-900">{(stats.backlog || 0) + (stats.assigned || 0)}</div>
        </div>
        <div className="card p-4 h-24">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">إجمالى المهام</div>
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-900">{Object.values(stats).reduce((a: number, b: any) => a + (b as number), 0)}</div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="text-lg font-semibold text-gray-900">آخر المهام</div>
        </div>
        {recentTasks.length === 0 ? (
          <div className="h-60 flex items-center justify-center text-center text-gray-600">
            <div>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-700 ring-1 ring-gray-200">
                <Calendar className="h-6 w-6" />
              </div>
              <div className="mt-2 font-semibold">لا توجد مهام</div>
              <div className="text-sm">لم يتم إضافة أي مهام بعد</div>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {recentTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => navigate(`/tasks/${task.id}`)}
                className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {task.title}
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        task.status === 'done' ? 'bg-green-100 text-green-700' :
                        task.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                        task.status === 'blocked' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {task.status === 'done' ? 'مكتملة' :
                         task.status === 'in_progress' ? 'جاري العمل' :
                         task.status === 'blocked' ? 'محظورة' :
                         task.status === 'assigned' ? 'مستلمة' : 'متأخرة'}
                      </span>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        task.priority === 'high' ? 'bg-red-50 text-red-600' :
                        task.priority === 'medium' ? 'bg-orange-50 text-orange-600' :
                        'bg-gray-50 text-gray-600'
                      }`}>
                        {task.priority === 'high' ? 'عالية' :
                         task.priority === 'medium' ? 'متوسطة' : 'منخفضة'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
  