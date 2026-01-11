import { useState, useEffect, FormEvent } from 'react';
import { Plus, Search, FolderKanban, Edit2, Trash2, Users, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { Project, ProjectInsert } from '@/types/database-extended.types';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useAuth } from '@/features/auth/AuthContext';

export default function ProjectsPage() {
  const { profile } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formColor, setFormColor] = useState('#3b82f6');
  const [formStartDate, setFormStartDate] = useState('');
  const [formDueDate, setFormDueDate] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching projects:', error);
    } else {
      setProjects(data || []);
    }
    setLoading(false);
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (editingProject) {
      // Update existing project
      const { error } = await supabase
        .from('projects')
        .update({
          name: formName,
          description: formDescription || null,
          color: formColor,
          start_date: formStartDate || null,
          due_date: formDueDate || null,
        })
        .eq('id', editingProject.id);
      
      if (error) {
        console.error('Error updating project:', error);
        alert('حدث خطأ أثناء تحديث المشروع');
        return;
      }
      
      setEditingProject(null);
    } else {
      // Create new project
      const { data: userData } = await supabase.auth.getUser();
      
      const newProject: ProjectInsert = {
        name: formName,
        description: formDescription || null,
        color: formColor,
        start_date: formStartDate || null,
        due_date: formDueDate || null,
        owner_id: userData.user?.id || null,
        status: 'active',
      };
      
      const { data, error } = await supabase
        .from('projects')
        .insert(newProject)
        .select()
        .single();
      
      if (error) {
        console.error('Error creating project:', error);
        alert('حدث خطأ أثناء إضافة المشروع');
        return;
      }
      
      // Add creator as project member
      if (data && userData.user) {
        await supabase
          .from('project_members')
          .insert({
            project_id: data.id,
            user_id: userData.user.id,
            role: 'owner',
          });
      }
    }
    
    // Reset form and refresh
    resetForm();
    setIsCreating(false);
    await fetchProjects();
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setFormName(project.name);
    setFormDescription(project.description || '');
    setFormColor(project.color);
    setFormStartDate(project.start_date || '');
    setFormDueDate(project.due_date || '');
    setIsCreating(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المشروع؟ سيتم حذف جميع المهام المرتبطة به.')) return;
    
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting project:', error);
      alert('حدث خطأ أثناء حذف المشروع');
      return;
    }
    
    await fetchProjects();
  };

  const resetForm = () => {
    setFormName('');
    setFormDescription('');
    setFormColor('#3b82f6');
    setFormStartDate('');
    setFormDueDate('');
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingProject(null);
    resetForm();
  };

  if (loading) {
    return <div className="text-center text-gray-600" dir="rtl">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">المشاريع</h1>
        {profile?.role === 'manager' && (
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 btn-primary"
          >
            <Plus className="h-4 w-4" /> مشروع جديد
          </button>
        )}
      </div>

      {/* Create/Edit Form */}
      {isCreating && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {editingProject ? 'تعديل المشروع' : 'مشروع جديد'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  اسم المشروع
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="مثال: تطوير الموقع الإلكتروني"
                  className="w-full rounded-md border-0 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm px-3"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الوصف (اختياري)
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="وصف المشروع وأهدافه..."
                  rows={3}
                  className="w-full rounded-md border-0 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm px-3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  تاريخ البداية
                </label>
                <input
                  type="date"
                  value={formStartDate}
                  onChange={(e) => setFormStartDate(e.target.value)}
                  className="w-full rounded-md border-0 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm px-3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  تاريخ الانتهاء
                </label>
                <input
                  type="date"
                  value={formDueDate}
                  onChange={(e) => setFormDueDate(e.target.value)}
                  className="w-full rounded-md border-0 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm px-3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  اللون
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formColor}
                    onChange={(e) => setFormColor(e.target.value)}
                    className="h-10 w-20 rounded-md border border-gray-300 cursor-pointer"
                  />
                  <span className="text-sm text-gray-600">{formColor}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={handleCancel}
                className="btn-secondary"
              >
                إلغاء
              </button>
              <button type="submit" className="btn-primary">
                {editingProject ? 'حفظ التعديلات' : 'إنشاء المشروع'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث في المشاريع..."
            className="w-full rounded-md border-0 py-2 pr-3 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm"
          />
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-400">
            <FolderKanban className="h-8 w-8" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-gray-900">
            لا توجد مشاريع
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            ابدأ بإنشاء مشروع جديد لتنظيم مهامك
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="card p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: project.color }}
                  />
                  <Link
                    to={`/projects/${project.id}`}
                    className="text-lg font-semibold text-gray-900 hover:text-blue-600"
                  >
                    {project.name}
                  </Link>
                </div>
                {profile?.role === 'manager' && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(project)}
                      className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600 hover:text-blue-600"
                      title="تعديل"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(project.id)}
                      className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600 hover:text-red-600"
                      title="حذف"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {project.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {project.description}
                </p>
              )}

              <div className="flex items-center gap-4 text-xs text-gray-500">
                {project.due_date && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{format(new Date(project.due_date), 'dd MMM', { locale: ar })}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  <span>الفريق</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <Link
                  to={`/projects/${project.id}`}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  عرض المشروع ←
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
