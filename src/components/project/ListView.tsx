import { useState } from 'react';
import { Plus, MoreVertical, Calendar, User } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { Section } from '@/types/database-extended.types';
import { Database } from '@/types/database.types';
import { Link } from 'react-router-dom';
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

type Task = Database['public']['Tables']['tasks']['Row'];

interface ListViewProps {
  projectId: string;
  sections: Section[];
  tasks: Task[];
  onRefresh: () => void;
}

export default function ListView({ projectId, sections, tasks, onRefresh }: ListViewProps) {
  const [newTaskSection, setNewTaskSection] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const getTasksBySection = (sectionId: string) => {
    return tasks.filter(task => task.section_id === sectionId);
  };

  const getTasksWithoutSection = () => {
    return tasks.filter(task => !task.section_id);
  };

  const handleAddTask = async (sectionId: string | null) => {
    if (!newTaskTitle.trim()) return;
    
    const { error } = await supabase
      .from('tasks')
      .insert({
        title: newTaskTitle,
        project_id: projectId,
        section_id: sectionId,
        status: 'open' as any,
        priority: 'medium',
        position: sectionId ? getTasksBySection(sectionId).length : getTasksWithoutSection().length,
      });
    
    if (error) {
      console.error('Error creating task:', error);
      alert('حدث خطأ أثناء إنشاء المهمة');
      return;
    }
    
    setNewTaskTitle('');
    setNewTaskSection(null);
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Tasks without section */}
      {getTasksWithoutSection().length > 0 && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">بدون قسم</h3>
            <span className="text-xs text-gray-500">
              {getTasksWithoutSection().length} مهمة
            </span>
          </div>

          <div className="space-y-2">
            {getTasksWithoutSection().map((task) => (
              <Link
                key={task.id}
                to={`/tasks/${task.id}`}
                className="block p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow bg-white"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 mb-2">
                      {task.title}
                    </h4>
                    <div className="flex items-center gap-3 flex-wrap">
                      <StatusBadge status={task.status} />
                      <PriorityBadge priority={task.priority} />
                      {task.due_date && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{format(new Date(task.due_date), 'dd MMM', { locale: ar })}</span>
                        </div>
                      )}
                      {task.assignee_id && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <User className="h-3.5 w-3.5" />
                          <span>معين</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {newTaskSection === 'no-section' ? (
            <div className="mt-3">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddTask(null);
                  }
                }}
                onBlur={() => {
                  if (newTaskTitle.trim()) {
                    handleAddTask(null);
                  } else {
                    setNewTaskSection(null);
                  }
                }}
                placeholder="اسم المهمة..."
                className="w-full rounded-md border-0 py-2 text-sm text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 px-3"
                autoFocus
              />
            </div>
          ) : (
            <button
              onClick={() => setNewTaskSection('no-section')}
              className="mt-3 w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
            >
              <Plus className="h-4 w-4" />
              إضافة مهمة
            </button>
          )}
        </div>
      )}

      {/* Sections */}
      {sections.map((section) => (
        <div key={section.id} className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">{section.name}</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">
                {getTasksBySection(section.id).length} مهمة
              </span>
              <button className="p-1 rounded hover:bg-gray-100">
                <MoreVertical className="h-4 w-4 text-gray-400" />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {getTasksBySection(section.id).map((task) => (
              <Link
                key={task.id}
                to={`/tasks/${task.id}`}
                className="block p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow bg-white"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 mb-2">
                      {task.title}
                    </h4>
                    <div className="flex items-center gap-3 flex-wrap">
                      <StatusBadge status={task.status} />
                      <PriorityBadge priority={task.priority} />
                      {task.due_date && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{format(new Date(task.due_date), 'dd MMM', { locale: ar })}</span>
                        </div>
                      )}
                      {task.assignee_id && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <User className="h-3.5 w-3.5" />
                          <span>معين</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {newTaskSection === section.id ? (
            <div className="mt-3">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddTask(section.id);
                  }
                }}
                onBlur={() => {
                  if (newTaskTitle.trim()) {
                    handleAddTask(section.id);
                  } else {
                    setNewTaskSection(null);
                  }
                }}
                placeholder="اسم المهمة..."
                className="w-full rounded-md border-0 py-2 text-sm text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 px-3"
                autoFocus
              />
            </div>
          ) : (
            <button
              onClick={() => setNewTaskSection(section.id)}
              className="mt-3 w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
            >
              <Plus className="h-4 w-4" />
              إضافة مهمة
            </button>
          )}
        </div>
      ))}

      {/* Empty state */}
      {sections.length === 0 && getTasksWithoutSection().length === 0 && (
        <div className="card p-12 text-center">
          <h3 className="text-lg font-semibold text-gray-900">
            لا توجد مهام بعد
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            ابدأ بإضافة مهام جديدة أو إنشاء أقسام لتنظيم المشروع
          </p>
        </div>
      )}
    </div>
  );
}
