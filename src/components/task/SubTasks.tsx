import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Database } from '@/types/database.types';
import { Plus, CheckCircle2, Circle, Trash2, User } from 'lucide-react';
import { Link } from 'react-router-dom';

type Task = Database['public']['Tables']['tasks']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

interface SubTasksProps {
  taskId: string;
  projectId?: string | null;
}

export default function SubTasks({ taskId, projectId }: SubTasksProps) {
  const [subTasks, setSubTasks] = useState<Task[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  useEffect(() => {
    fetchSubTasks();
    fetchProfiles();
  }, [taskId]);

  const fetchProfiles = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name');
    
    setProfiles(data || []);
  };

  const fetchSubTasks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('parent_task_id', taskId)
      .order('position', { ascending: true });

    if (error) {
      console.error('Error fetching subtasks:', error);
    } else {
      setSubTasks(data || []);
    }
    setLoading(false);
  };

  const handleAddSubTask = async () => {
    if (!newTaskTitle.trim()) return;

    const { error } = await supabase
      .from('tasks')
      .insert({
        title: newTaskTitle,
        parent_task_id: taskId,
        project_id: projectId,
        status: 'open' as any,
        priority: 'medium',
        position: subTasks.length,
      });

    if (error) {
      console.error('Error creating subtask:', error);
      alert('حدث خطأ أثناء إنشاء المهمة الفرعية');
      return;
    }

    setNewTaskTitle('');
    setIsAdding(false);
    await fetchSubTasks();
  };

  const handleToggleStatus = async (subTask: Task) => {
    const newStatus = subTask.status === 'done' ? 'backlog' : 'done';
    
    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', subTask.id);

    if (error) {
      console.error('Error updating subtask:', error);
      return;
    }

    await fetchSubTasks();
  };

  const handleAssigneeChange = async (subTaskId: string, assigneeId: string | null) => {
    const { error } = await supabase
      .from('tasks')
      .update({ assignee_id: assigneeId || null })
      .eq('id', subTaskId);

    if (error) {
      console.error('Error updating assignee:', error);
      alert('حدث خطأ أثناء تعيين المهمة');
      return;
    }

    await fetchSubTasks();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه المهمة الفرعية؟')) return;

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting subtask:', error);
      alert('حدث خطأ أثناء حذف المهمة الفرعية');
      return;
    }

    await fetchSubTasks();
  };

  const completedCount = subTasks.filter(t => t.status === 'done').length;
  const totalCount = subTasks.length;

  if (loading) {
    return <div className="text-center text-gray-600 py-4">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900">المهام الفرعية</h3>
          {totalCount > 0 && (
            <span className="text-sm text-gray-500">
              ({completedCount}/{totalCount})
            </span>
          )}
        </div>
        
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
          >
            <Plus className="h-4 w-4" />
            إضافة
          </button>
        )}
      </div>

      {/* Progress bar */}
      {totalCount > 0 && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${(completedCount / totalCount) * 100}%` }}
          />
        </div>
      )}

      {/* Add subtask form */}
      {isAdding && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleAddSubTask();
              } else if (e.key === 'Escape') {
                setIsAdding(false);
                setNewTaskTitle('');
              }
            }}
            placeholder="اسم المهمة الفرعية..."
            className="flex-1 rounded-md border-0 py-2 text-sm text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 px-3"
            autoFocus
          />
          <button
            onClick={handleAddSubTask}
            className="btn-primary text-sm"
          >
            إضافة
          </button>
          <button
            onClick={() => {
              setIsAdding(false);
              setNewTaskTitle('');
            }}
            className="btn-secondary text-sm"
          >
            إلغاء
          </button>
        </div>
      )}

      {/* Subtasks list */}
      <div className="space-y-2">
        {subTasks.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            لا توجد مهام فرعية بعد
          </p>
        ) : (
          subTasks.map((subTask) => (
            <div
              key={subTask.id}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
            >
              <button
                onClick={() => handleToggleStatus(subTask)}
                className="flex-shrink-0"
              >
                {subTask.status === 'done' ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <Circle className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                )}
              </button>
              
              <div className="flex-1 min-w-0">
                <Link
                  to={`/tasks/${subTask.id}`}
                  className={`block text-sm font-medium ${
                    subTask.status === 'done'
                      ? 'text-gray-500 line-through'
                      : 'text-gray-900 hover:text-blue-600'
                  }`}
                >
                  {subTask.title}
                </Link>
                
                {/* Assignee dropdown */}
                <div className="flex items-center gap-2 mt-1">
                  <User className="h-3.5 w-3.5 text-gray-400" />
                  <select
                    value={subTask.assignee_id || ''}
                    onChange={(e) => handleAssigneeChange(subTask.id, e.target.value || null)}
                    className="text-xs border-0 bg-transparent text-gray-600 focus:ring-1 focus:ring-blue-500 rounded px-1 py-0.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <option value="">غير مسند</option>
                    {profiles.map((profile) => (
                      <option key={profile.id} value={profile.id}>
                        {profile.full_name || 'بدون اسم'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <button
                onClick={() => handleDelete(subTask.id)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-200 text-gray-600 hover:text-red-600 transition-opacity"
                title="حذف"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
