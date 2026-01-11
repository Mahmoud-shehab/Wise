import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Project, Section } from '@/types/database-extended.types';
import { Database } from '@/types/database.types';
import { ArrowRight, Plus, LayoutList, LayoutGrid, Calendar as CalendarIcon, Users, Settings } from 'lucide-react';
import BoardView from '@/components/project/BoardView';
import ListView from '@/components/project/ListView';

type Task = Database['public']['Tables']['tasks']['Row'];

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'board' | 'calendar'>('board');

  useEffect(() => {
    if (id) {
      fetchProjectData();
    }
  }, [id]);

  const fetchProjectData = async () => {
    if (!id) return;
    
    setLoading(true);
    
    // Fetch project
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();
    
    if (projectError) {
      console.error('Error fetching project:', projectError);
      navigate('/projects');
      return;
    }
    
    setProject(projectData);
    
    // Fetch sections
    const { data: sectionsData } = await supabase
      .from('sections')
      .select('*')
      .eq('project_id', id)
      .order('position', { ascending: true });
    
    setSections(sectionsData || []);
    
    // Fetch tasks
    const { data: tasksData } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', id)
      .order('position', { ascending: true });
    
    setTasks(tasksData || []);
    
    setLoading(false);
  };

  const handleAddSection = async () => {
    if (!id) return;
    
    const sectionName = prompt('اسم القسم الجديد:');
    if (!sectionName) return;
    
    const { error } = await supabase
      .from('sections')
      .insert({
        project_id: id,
        name: sectionName,
        position: sections.length,
      });
    
    if (error) {
      console.error('Error creating section:', error);
      alert('حدث خطأ أثناء إنشاء القسم');
      return;
    }
    
    await fetchProjectData();
  };

  if (loading) {
    return <div className="text-center text-gray-600" dir="rtl">جاري التحميل...</div>;
  }

  if (!project) {
    return <div className="text-center text-gray-600" dir="rtl">المشروع غير موجود</div>;
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate('/projects')}
          className="flex items-center text-sm text-gray-500 hover:text-gray-900 mb-4 gap-1"
        >
          <ArrowRight className="w-4 h-4" /> رجوع إلى المشاريع
        </button>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: project.color }}
            />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {project.name}
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-md hover:bg-gray-100 text-gray-600">
              <Users className="h-5 w-5" />
            </button>
            <button className="p-2 rounded-md hover:bg-gray-100 text-gray-600">
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        {project.description && (
          <p className="mt-2 text-gray-600">{project.description}</p>
        )}
      </div>

      {/* View Switcher */}
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView('list')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                view === 'list'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <LayoutList className="h-4 w-4" />
              قائمة
            </button>
            <button
              onClick={() => setView('board')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                view === 'board'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
              لوحة
            </button>
            <button
              onClick={() => setView('calendar')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                view === 'calendar'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <CalendarIcon className="h-4 w-4" />
              تقويم
            </button>
          </div>
          
          <button
            onClick={handleAddSection}
            className="flex items-center gap-2 btn-primary"
          >
            <Plus className="h-4 w-4" />
            قسم جديد
          </button>
        </div>
      </div>

      {/* Content */}
      {view === 'board' && (
        <BoardView
          projectId={id!}
          sections={sections}
          tasks={tasks}
          onRefresh={fetchProjectData}
        />
      )}
      
      {view === 'list' && (
        <ListView
          projectId={id!}
          sections={sections}
          tasks={tasks}
          onRefresh={fetchProjectData}
        />
      )}
      
      {view === 'calendar' && (
        <div className="card p-12 text-center">
          <CalendarIcon className="h-16 w-16 mx-auto text-gray-400" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900">
            عرض التقويم قريباً
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            سيتم إضافة عرض التقويم في التحديث القادم
          </p>
        </div>
      )}
    </div>
  );
}
