import { Database } from '@/types/database.types';
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge';
import { useAuth } from '@/features/auth/AuthContext';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { ChevronLeft, Trash2 } from 'lucide-react';

type Task = Database['public']['Tables']['tasks']['Row'];

interface TaskCardProps {
  task: Task;
  onStatusChange?: (id: string, status: Task['status']) => void;
  onAssignSelf?: (id: string) => void;
  onDelete?: (id: string, title: string) => void;
  showDelete?: boolean;
}

export function TaskCard({ task, onStatusChange, onAssignSelf, onDelete, showDelete = false }: TaskCardProps) {
  const { profile, user } = useAuth();
  const isAssignee = task.assignee_id === user?.id;
  const isManager = profile?.role === 'manager';

  return (
    <div className="px-3 sm:px-6 py-3 sm:py-4 hover:bg-gray-50 transition-colors" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        {/* Task info */}
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
            {task.due_date && (
              <span className="text-xs text-gray-500">
                {format(new Date(task.due_date), 'dd/MM/yyyy')}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 justify-end sm:justify-start">
          {/* Employee Actions */}
          {profile?.role === 'employee' && (
            <>
              {/* Take Task (Unassigned) */}
              {!task.assignee_id && onAssignSelf && (
                <button
                  onClick={() => onAssignSelf(task.id)}
                  className="rounded-md bg-blue-50 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-semibold text-blue-700 hover:bg-blue-100 whitespace-nowrap"
                >
                  استلام
                </button>
              )}
              
              {/* Start Task */}
              {isAssignee && task.status === 'open' && onStatusChange && (
                <button
                  onClick={() => onStatusChange(task.id, 'in_progress')}
                  className="rounded-md bg-blue-600 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-semibold text-white hover:bg-blue-500 whitespace-nowrap"
                >
                  بدء
                </button>
              )}

              {/* Complete Task - Send to Review */}
              {isAssignee && task.status === 'in_progress' && onStatusChange && (
                <button
                  onClick={() => onStatusChange(task.id, 'done')}
                  className="rounded-md bg-purple-600 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-semibold text-white hover:bg-purple-500 whitespace-nowrap"
                >
                  إرسال للمراجعة
                </button>
              )}
            </>
          )}
          
          {/* Delete Button (Manager Only) */}
          {isManager && showDelete && onDelete && (
            <button
              onClick={(e) => {
                e.preventDefault();
                onDelete(task.id, task.title);
              }}
              className="p-1.5 sm:p-2 rounded-md hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
              title="حذف المهمة"
            >
              <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          )}
          
          <Link
             to={`/tasks/${task.id}`}
             className="p-1.5 sm:p-2 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600"
          >
            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
