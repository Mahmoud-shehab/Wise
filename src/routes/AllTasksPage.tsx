import { useEffect, useState, FormEvent } from 'react';
import { useTasks } from '../features/tasks/useTasks';
import { TaskCard } from '../features/tasks/TaskCard';
import { useAuth } from '../features/auth/AuthContext';
import { Plus, Calendar, Search } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { Database } from '@/types/database.types';

export default function AllTasksPage() {
  const { tasks, loading, updateTaskStatus, assignTask, createTask, deleteTask } = useTasks();
  const { profile, user } = useAuth();
  const isManager = profile?.role === 'manager';
  type Profile = Database['public']['Tables']['profiles']['Row'];
  type Company = Database['public']['Tables']['companies']['Row'];
  type TaskType = Database['public']['Tables']['task_types']['Row'];
  
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [assigneeId, setAssigneeId] = useState<string | ''>('');
  const [reviewerId, setReviewerId] = useState<string | ''>('');
  const [companyId, setCompanyId] = useState<string | ''>('');
  const [taskTypeId, setTaskTypeId] = useState<string | ''>('');
  const [period, setPeriod] = useState('');
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Create modal
  const [isCreating, setIsCreating] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newTaskStartDate, setNewTaskStartDate] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!isSupabaseConfigured) {
        setEmployees([]);
        setCompanies([]);
        setTaskTypes([]);
        return;
      }
      
      // Fetch employees
      const { data: employeesData, error: employeesError } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name', { ascending: true });
      if (employeesError) {
        console.error('Error fetching employees:', employeesError);
      } else {
        setEmployees(employeesData || []);
      }
      
      // Fetch companies
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('*')
        .order('name', { ascending: true });
      if (companiesError) {
        console.error('Error fetching companies:', companiesError);
      } else {
        setCompanies(companiesData || []);
      }
      
      // Fetch task types (only parent types for now)
      const { data: taskTypesData, error: taskTypesError } = await supabase
        .from('task_types')
        .select('*')
        .is('parent_id', null)
        .order('name', { ascending: true });
      if (taskTypesError) {
        console.error('Error fetching task types:', taskTypesError);
      } else {
        setTaskTypes(taskTypesData || []);
      }
    };
    fetchData();
  }, []);

  const filteredTasks = tasks.filter(task => {
    // Status filter
    if (statusFilter !== 'all' && task.status !== statusFilter) return false;
    
    // Priority filter
    if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
    
    // Assignee filter
    if (assigneeFilter !== 'all') {
      if (assigneeFilter === 'unassigned' && task.assignee_id) return false;
      if (assigneeFilter !== 'unassigned' && task.assignee_id !== assigneeFilter) return false;
    }
    
    // Search query
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    
    return true;
  });

  const handleAssignSelf = async (taskId: string) => {
    if (user) {
      await assignTask(taskId, user.id);
    }
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    
    try {
      const newTask = await createTask({
        title: newTaskTitle,
        description: newTaskDescription || null,
        created_by: user?.id ?? null,
        status: assigneeId ? 'assigned' : 'backlog',
        priority: newTaskPriority,
        assignee_id: assigneeId || null,
        company_id: companyId || null,
        task_type_id: taskTypeId || null,
        start_date: newTaskStartDate || null,
        due_date: newTaskDueDate || null
      });
      
      // إضافة المراجع إلى جدول task_reviewers إذا تم تحديده
      if (reviewerId && newTask) {
        try {
          const { error: reviewerError } = await supabase
            .from('task_reviewers' as any)
            .insert({
              task_id: newTask.id,
              reviewer_id: reviewerId
            });
          
          if (reviewerError) {
            console.error('Error assigning reviewer:', reviewerError);
          }
        } catch (err) {
          console.error('Reviewer assignment error:', err);
        }
      }
      
      setIsCreating(false);
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskPriority('medium');
      setNewTaskStartDate('');
      setNewTaskDueDate('');
      setAssigneeId('');
      setReviewerId('');
      setCompanyId('');
      setTaskTypeId('');
      setPeriod('');
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (taskId: string, taskTitle: string) => {
    if (!confirm(`هل أنت متأكد من حذف المهمة "${taskTitle}"؟\n\nسيتم حذف جميع التعليقات والمرفقات المرتبطة بها.`)) {
      return;
    }
    
    try {
      await deleteTask(taskId);
      alert('✅ تم حذف المهمة بنجاح');
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('❌ حدث خطأ أثناء حذف المهمة');
    }
  };

  if (loading) return <div className="text-center text-gray-600">جاري التحميل...</div>;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">إدارة المهام</h1>
        {isManager && (
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center justify-center gap-2 btn-primary text-sm sm:text-base"
          >
            <Plus className="h-4 w-4" /> إضافة مهمة جديدة
          </button>
        )}
      </div>

      {/* Create Task Modal */}
      {isCreating && (
        <div className="card p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">إضافة مهمة</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            {/* Row 1: Company, Task Type, Period */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  اختر الشركة <span className="text-red-500">*</span>
                </label>
                <select
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                  className="w-full rounded-md border-0 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm px-3 bg-white"
                  required
                >
                  <option value="">قائمة منسدلة</option>
                  {companies.map(company => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  نوع المهمة <span className="text-red-500">*</span>
                </label>
                <select
                  value={taskTypeId}
                  onChange={(e) => setTaskTypeId(e.target.value)}
                  className="w-full rounded-md border-0 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm px-3 bg-white"
                  required
                >
                  <option value="">قائمة منسدلة</option>
                  {taskTypes.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الفترة
                </label>
                <input
                  type="text"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  placeholder="قائمة منسدلة"
                  className="w-full rounded-md border-0 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm px-3"
                />
              </div>
            </div>

            {/* Row 2: Task Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                وصف المهمة
              </label>
              <textarea 
                value={newTaskDescription}
                onChange={e => setNewTaskDescription(e.target.value)}
                placeholder="خانة كتابة"
                rows={3}
                className="w-full rounded-md border-0 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm px-3"
              />
            </div>

            {/* Row 3: Priority, Estimated Time, Assignee */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الأولوية
                </label>
                <select
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value as 'low' | 'medium' | 'high')}
                  className="w-full rounded-md border-0 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm px-3 bg-white"
                >
                  <option value="">قائمة منسدلة</option>
                  <option value="low">منخفضة</option>
                  <option value="medium">متوسطة</option>
                  <option value="high">عالية</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الوقت المقدر
                </label>
                <input
                  type="date"
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                  placeholder="نتيجة تقويم"
                  className="w-full rounded-md border-0 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm px-3"
                />
              </div>

              {isManager && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    القائم بالتنفيذ
                  </label>
                  <select
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
                    className="w-full rounded-md border-0 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm px-3 bg-white"
                  >
                    <option value="">قائمة منسدلة</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.full_name || emp.id.slice(0,8)}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Row 4: Reviewer, Notes, Attachments */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {isManager && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    القائم بالمراجعة
                  </label>
                  <select
                    value={reviewerId}
                    onChange={(e) => setReviewerId(e.target.value)}
                    className="w-full rounded-md border-0 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm px-3 bg-white"
                  >
                    <option value="">قائمة منسدلة</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.full_name || emp.id.slice(0,8)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ملاحظات
                </label>
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  placeholder="خانة كتابة"
                  className="w-full rounded-md border-0 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm px-3"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  مرفق
                </label>
                <div className="flex items-center justify-center w-full h-10 rounded-md border-2 border-dashed border-gray-300 hover:border-gray-400 cursor-pointer">
                  <span className="text-sm text-gray-500">علامة الارفاق</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-2 justify-end pt-2 border-t">
              <button type="button" onClick={() => setIsCreating(false)} className="btn-secondary text-sm sm:text-base">
                إلغاء
              </button>
              <button type="submit" className="btn-primary text-sm sm:text-base">
                حفظ المهمة
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="card p-3 sm:p-4">
        {/* Search */}
        <div className="mb-3 sm:mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث عن مهمة..."
              className="w-full rounded-md border-0 py-2 pr-3 pl-10 text-sm sm:text-base text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600"
            />
          </div>
        </div>

        {/* Filter dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Status Filter */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">الحالة</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-md border-0 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm px-3 bg-white"
            >
              <option value="all">الكل</option>
              <option value="backlog">متأخرة</option>
              <option value="assigned">مستلمة</option>
              <option value="in_progress">جاري العمل</option>
              <option value="done">مكتملة</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">الأولوية</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full rounded-md border-0 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm px-3 bg-white"
            >
              <option value="all">الكل</option>
              <option value="low">منخفضة</option>
              <option value="medium">متوسطة</option>
              <option value="high">عالية</option>
              <option value="urgent">عاجلة</option>
            </select>
          </div>

          {/* Assignee Filter */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">المستلم</label>
            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="w-full rounded-md border-0 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm px-3 bg-white"
            >
              <option value="all">الكل</option>
              <option value="unassigned">غير مسندة</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.full_name || emp.id.slice(0,8)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="card">
        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-400">
              <Calendar className="h-8 w-8" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">لا توجد مهام</h3>
            <p className="mt-2 text-sm text-gray-500">لم يتم العثور على مهام مطابقة لمعايير البحث</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredTasks.map(task => (
              <TaskCard 
                key={task.id} 
                task={task} 
                onStatusChange={updateTaskStatus}
                onAssignSelf={handleAssignSelf}
                onDelete={handleDelete}
                showDelete={isManager}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
