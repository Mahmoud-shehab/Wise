import { useState, FormEvent, useEffect } from 'react';
import { Plus, Search, Layers, Edit2, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { Database } from '@/types/database.types';

type TaskType = Database['public']['Tables']['task_types']['Row'];

export default function TaskTypesPage() {
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingType, setEditingType] = useState<TaskType | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formColor, setFormColor] = useState('#3b82f6');

  useEffect(() => {
    fetchTaskTypes();
  }, []);

  const fetchTaskTypes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('task_types')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) {
      console.error('Error fetching task types:', error);
    } else {
      setTaskTypes(data || []);
    }
    setLoading(false);
  };

  const filteredTypes = taskTypes.filter(type =>
    type.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (editingType) {
      // Update existing type
      const { error } = await supabase
        .from('task_types')
        .update({
          name: formName,
          description: formDescription || null,
          color: formColor,
        })
        .eq('id', editingType.id);
      
      if (error) {
        console.error('Error updating task type:', error);
        alert('حدث خطأ أثناء تحديث نوع المهمة');
        return;
      }
      
      setEditingType(null);
    } else {
      // Create new type
      const { error } = await supabase
        .from('task_types')
        .insert({
          name: formName,
          description: formDescription || null,
          color: formColor,
        });
      
      if (error) {
        console.error('Error creating task type:', error);
        alert('حدث خطأ أثناء إضافة نوع المهمة');
        return;
      }
    }
    
    // Reset form and refresh
    resetForm();
    setIsCreating(false);
    await fetchTaskTypes();
  };

  const handleEdit = (type: TaskType) => {
    setEditingType(type);
    setFormName(type.name);
    setFormDescription(type.description || '');
    setFormColor(type.color);
    setIsCreating(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا النوع؟')) return;
    
    const { error } = await supabase
      .from('task_types')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting task type:', error);
      alert('حدث خطأ أثناء حذف نوع المهمة');
      return;
    }
    
    await fetchTaskTypes();
  };

  const resetForm = () => {
    setFormName('');
    setFormDescription('');
    setFormColor('#3b82f6');
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingType(null);
    resetForm();
  };

  if (loading) {
    return <div className="text-center text-gray-600" dir="rtl">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">أنواع المهام</h1>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 btn-primary"
        >
          <Plus className="h-4 w-4" /> إضافة نوع جديد
        </button>
      </div>

      {/* Create/Edit Form */}
      {isCreating && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {editingType ? 'تعديل نوع المهمة' : 'نوع مهمة جديد'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                اسم النوع
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="مثال: تطوير، تصميم، اختبار..."
                className="w-full rounded-md border-0 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm px-3"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الوصف (اختياري)
              </label>
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="وصف مختصر لنوع المهمة..."
                rows={3}
                className="w-full rounded-md border-0 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm px-3"
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

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={handleCancel}
                className="btn-secondary"
              >
                إلغاء
              </button>
              <button type="submit" className="btn-primary">
                {editingType ? 'حفظ التعديلات' : 'إضافة النوع'}
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
            placeholder="بحث في أنواع المهام..."
            className="w-full rounded-md border-0 py-2 pr-3 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm"
          />
        </div>
        <div className="mt-2 text-sm text-gray-500">
          إجمالي الأنواع: {taskTypes.length}
        </div>
      </div>

      {/* Task Types List */}
      <div className="card">
        {filteredTypes.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-400">
              <Layers className="h-8 w-8" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">
              لا توجد أنواع مهام
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              ابدأ بإضافة أنواع المهام لتتمكن من إنشاء مهام جديدة
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredTypes.map((type) => (
              <div
                key={type.id}
                className="px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between gap-4">
                  {/* Right side - Type info */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: type.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-gray-900 truncate">
                        {type.name}
                      </h3>
                      {type.description && (
                        <p className="mt-1 text-sm text-gray-600 line-clamp-1">
                          {type.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Left side - Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(type)}
                      className="p-2 rounded-md hover:bg-gray-100 text-gray-600 hover:text-blue-600 transition-colors"
                      title="تعديل"
                    >
                      <Edit2 className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(type.id)}
                      className="p-2 rounded-md hover:bg-gray-100 text-gray-600 hover:text-red-600 transition-colors"
                      title="حذف"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
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
