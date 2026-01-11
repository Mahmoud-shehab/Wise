import { useState } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { useTasks } from '@/features/tasks/useTasks';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Link } from 'react-router-dom';

export default function CalendarPage() {
  const { profile, user } = useAuth();
  const { tasks, loading } = useTasks();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const isManager = profile?.role === 'manager';

  // فلترة المهام حسب الدور
  const filteredTasks = tasks.filter(task => {
    if (isManager) {
      return true; // المدير يرى كل المهام
    } else {
      return task.assignee_id === user?.id; // الموظف يرى مهامه فقط
    }
  });

  // الحصول على أيام الشهر
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }); // الأحد
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // الحصول على المهام لتاريخ معين
  const getTasksForDate = (date: Date) => {
    return filteredTasks.filter(task => {
      const taskDueDate = task.due_date ? new Date(task.due_date) : null;
      const taskStartDate = task.start_date ? new Date(task.start_date) : null;
      
      return (taskDueDate && isSameDay(taskDueDate, date)) || 
             (taskStartDate && isSameDay(taskStartDate, date));
    });
  };

  const previousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const today = () => setCurrentMonth(new Date());

  if (loading) return <div className="text-center text-gray-600">جاري التحميل...</div>;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">التقويم</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={today}
            className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            اليوم
          </button>
          <div className="flex items-center gap-1 bg-white border border-gray-300 rounded-md">
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-gray-50 rounded-r-md"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            <button
              onClick={previousMonth}
              className="p-2 hover:bg-gray-50 rounded-l-md"
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Month/Year Display */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900">
          {format(currentMonth, 'MMMM yyyy', { locale: ar })}
        </h2>
      </div>

      {/* Calendar */}
      <div className="card overflow-hidden">
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
          {['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'].map(day => (
            <div key={day} className="px-2 py-3 text-center text-sm font-semibold text-gray-700 border-l border-gray-200 last:border-l-0">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day) => {
            const dayTasks = getTasksForDate(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={day.toString()}
                className={`min-h-[120px] border-b border-l border-gray-200 last:border-l-0 p-2 ${
                  !isCurrentMonth ? 'bg-gray-50' : 'bg-white'
                } ${isToday ? 'bg-blue-50' : ''}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-sm font-semibold ${
                      !isCurrentMonth ? 'text-gray-400' : isToday ? 'text-blue-600' : 'text-gray-900'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>
                  {dayTasks.length > 0 && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                      {dayTasks.length}
                    </span>
                  )}
                </div>

                {/* Tasks for this day */}
                <div className="space-y-1">
                  {dayTasks.slice(0, 3).map(task => (
                    <Link
                      key={task.id}
                      to={`/tasks/${task.id}`}
                      className="block p-1.5 rounded text-xs hover:bg-gray-100 transition-colors"
                      style={{
                        backgroundColor: task.priority === 'high' ? '#fed7aa' :
                                       task.priority === 'medium' ? '#dbeafe' : '#f3f4f6',
                        borderLeft: `3px solid ${
                          task.priority === 'high' ? '#ea580c' :
                          task.priority === 'medium' ? '#2563eb' : '#9ca3af'
                        }`
                      }}
                    >
                      <div className="font-semibold text-gray-900 truncate">
                        {task.title}
                      </div>
                      {task.due_date && isSameDay(new Date(task.due_date), day) && (
                        <div className="text-xs text-gray-600 mt-0.5">
                          📅 موعد الانتهاء
                        </div>
                      )}
                      {task.start_date && isSameDay(new Date(task.start_date), day) && !task.due_date && (
                        <div className="text-xs text-gray-600 mt-0.5">
                          🚀 تاريخ البدء
                        </div>
                      )}
                    </Link>
                  ))}
                  {dayTasks.length > 3 && (
                    <div className="text-xs text-gray-500 text-center py-1">
                      +{dayTasks.length - 3} مهمة أخرى
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="card p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">دليل الألوان:</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#fed7aa', borderLeft: '3px solid #ea580c' }}></div>
            <span className="text-sm text-gray-600">عالية</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#dbeafe', borderLeft: '3px solid #2563eb' }}></div>
            <span className="text-sm text-gray-600">متوسطة</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#f3f4f6', borderLeft: '3px solid #9ca3af' }}></div>
            <span className="text-sm text-gray-600">منخفضة</span>
          </div>
        </div>
      </div>
    </div>
  );
}
