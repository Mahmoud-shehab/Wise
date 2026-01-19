import { useState } from 'react';
import { Plus, MoreVertical } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { Section } from '@/types/database-extended.types';
import { Database } from '@/types/database.types';
import { Link } from 'react-router-dom';
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge';

type Task = Database['public']['Tables']['tasks']['Row'];

interface BoardViewProps {
  projectId: string;
  sections: Section[];
  tasks: Task[];
  onRefresh: () => void;
}

export default function BoardView({ projectId, sections, tasks, onRefresh }: BoardViewProps) {
  const [newTaskSection, setNewTaskSection] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const getTasksBySection = (sectionId: string) => {
    return tasks.filter(task => task.section_id === sectionId);
  };

  const getTasksWithoutSection = () => {
    return tasks.filter(task => !task.section_id);
  };

  const handleAddTask = async (sectionId: string) => {
    if (!newTaskTitle.trim()) return;
    
    const { error } = await supabase
      .from('tasks')
      .insert({
        title: newTaskTitle,
        project_id: projectId,
        section_id: sectionId,
        status: 'open' as any,
        priority: 'medium',
        position: getTasksBySection(sectionId).length,
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

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, sectionId: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    
    const { error } = await supabase
      .from('tasks')
      .update({ section_id: sectionId })
      .eq('id', taskId);
    
    if (error) {
      console.error('Error moving task:', error);
      return;
    }
    
    onRefresh();
  };

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-max">
        {/* Sections */}
        {sections.map((section) => (
          <div
            key={section.id}
            className="flex-shrink-0 w-80"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, section.id)}
          >
            <div className="card p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">{section.name}</h3>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-500">
                    {getTasksBySection(section.id).length}
                  </span>
                  <button className="p-1 rounded hover:bg-gray-100">
                    <MoreVertical className="h-4 w-4 text-gray-400" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {getTasksBySection(section.id).map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    className="bg-white p-3 rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-move"
                  >
                    <Link
                      to={`/tasks/${task.id}`}
                      className="block"
                    >
                      <h4 className="font-medium text-gray-900 text-sm mb-2">
                        {task.title}
                      </h4>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={task.status} />
                        <PriorityBadge priority={task.priority} />
                      </div>
                    </Link>
                  </div>
                ))}
              </div>

              {newTaskSection === section.id ? (
                <div className="mt-2">
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyPress={(e) => {
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
                  className="mt-2 w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  إضافة مهمة
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Tasks without section */}
        {getTasksWithoutSection().length > 0 && (
          <div className="flex-shrink-0 w-80">
            <div className="card p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">بدون قسم</h3>
                <span className="text-xs text-gray-500">
                  {getTasksWithoutSection().length}
                </span>
              </div>

              <div className="space-y-2">
                {getTasksWithoutSection().map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    className="bg-white p-3 rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-move"
                  >
                    <Link to={`/tasks/${task.id}`} className="block">
                      <h4 className="font-medium text-gray-900 text-sm mb-2">
                        {task.title}
                      </h4>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={task.status} />
                        <PriorityBadge priority={task.priority} />
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
