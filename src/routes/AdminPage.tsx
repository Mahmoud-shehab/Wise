import { useEffect, useState, FormEvent } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Database } from '@/types/database.types';
import { Plus, Search, Users, Edit2, Trash2 } from 'lucide-react';

type Profile = Database['public']['Tables']['profiles']['Row'];

export default function AdminPage() {
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Profile | null>(null);
  
  // Form state
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'employee' | 'manager'>('employee');
  
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    const { data } = await supabase.from('profiles').select('*').order('full_name', { ascending: true });
    if (data) setEmployees(data);
  };

  const filteredEmployees = employees.filter(emp =>
    emp.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setMessage('');
    
    try {
      if (editingEmployee) {
        // Update existing employee
        const { error } = await supabase
          .from('profiles')
          .update({ full_name: fullName, role })
          .eq('id', editingEmployee.id);
        
        if (error) {
          console.error('Error updating employee:', error);
          setMessage(`خطأ في التحديث: ${error.message}`);
          return;
        }
        setMessage('تم تحديث الموظف بنجاح');
      } else {
        // Create new employee
        // We'll use signUp but immediately restore the admin session
        
        // Get current admin session before creating new user
        const { data: { session: adminSession } } = await supabase.auth.getSession();
        
        if (!adminSession) {
          setMessage('خطأ: لم يتم العثور على جلسة المدير');
          return;
        }
        
        // Create new user (this will auto-login the new user)
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { 
              full_name: fullName,
              role: role  // Pass role in metadata
            }
          }
        });
        
        if (error) {
          console.error('Error creating user:', error);
          setMessage(`خطأ في إنشاء المستخدم: ${error.message}`);
          return;
        }
        
        if (data.user) {
          // Update profile with correct role (trigger already created it with default role)
          // Use a small delay to ensure trigger has completed
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const { error: updateErr } = await supabase
            .from('profiles')
            .update({ full_name: fullName, role })
            .eq('id', data.user.id);
          
          if (updateErr) {
            console.error('Error updating profile:', updateErr);
            setMessage(`تم إنشاء المستخدم لكن حدث خطأ في تحديث الصلاحية: ${updateErr.message}`);
          }
          
          // IMPORTANT: Immediately restore admin session
          // This prevents the UI from redirecting to login
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: adminSession.access_token,
            refresh_token: adminSession.refresh_token
          });
          
          if (sessionError) {
            console.error('Error restoring session:', sessionError);
            setMessage('تم إنشاء الموظف لكن حدث خطأ في استعادة جلستك. الرجاء تسجيل الدخول مرة أخرى.');
          } else {
            setMessage('تم إضافة الموظف بنجاح');
          }
        }
      }
      
      // Reset form and refresh
      resetForm();
      setIsCreating(false);
      setEditingEmployee(null);
      await fetchEmployees();
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = (employee: Profile) => {
    setEditingEmployee(employee);
    setFullName(employee.full_name || '');
    setUsername(employee.id.slice(0, 8));
    setRole(employee.role as 'employee' | 'manager');
    setIsCreating(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الموظف؟ سيتم إلغاء تعيين جميع المهام المرتبطة به.')) return;
    
    try {
      setMessage('جاري الحذف...');
      
      // Step 1: Unassign all tasks assigned to this user
      const { error: unassignError } = await supabase
        .from('tasks')
        .update({ assignee_id: null })
        .eq('assignee_id', id);
      
      if (unassignError) {
        console.error('Error unassigning tasks:', unassignError);
        setMessage(`خطأ في إلغاء تعيين المهام: ${unassignError.message}`);
        return;
      }
      
      // Step 2: Update tasks created by this user to null
      const { error: creatorError } = await supabase
        .from('tasks')
        .update({ created_by: null })
        .eq('created_by', id);
      
      if (creatorError) {
        console.error('Error updating task creator:', creatorError);
      }
      
      // Step 3: Delete user's comments
      const { error: commentsError } = await supabase
        .from('comments')
        .delete()
        .eq('user_id', id);
      
      if (commentsError) {
        console.error('Error deleting comments:', commentsError);
      }
      
      // Step 4: Delete user's notifications
      const { error: notificationsError } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', id);
      
      if (notificationsError) {
        console.error('Error deleting notifications:', notificationsError);
      }
      
      // Step 5: Delete task reviewers
      const { error: reviewersError } = await supabase
        .from('task_reviewers')
        .delete()
        .eq('reviewer_id', id);
      
      if (reviewersError) {
        console.error('Error deleting task reviewers:', reviewersError);
      }
      
      // Step 6: Delete project members
      const { error: membersError } = await supabase
        .from('project_members')
        .delete()
        .eq('user_id', id);
      
      if (membersError) {
        console.error('Error deleting project members:', membersError);
      }
      
      // Step 7: Finally delete the profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);
      
      if (profileError) {
        console.error('Error deleting profile:', profileError);
        setMessage(`خطأ في حذف الموظف: ${profileError.message}`);
        return;
      }
      
      await fetchEmployees();
      setMessage('تم حذف الموظف بنجاح');
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      console.error('Delete error:', err);
      setMessage(`خطأ: ${err.message}`);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const resetForm = () => {
    setEmail('');
    setFullName('');
    setUsername('');
    setPassword('');
    setRole('employee');
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingEmployee(null);
    resetForm();
    setMessage('');
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">إدارة الموظفين</h1>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 btn-primary"
        >
          <Plus className="h-4 w-4" /> إضافة موظف
        </button>
      </div>

      {/* Create/Edit Form */}
      {isCreating && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {editingEmployee ? 'تعديل الموظف' : 'موظف جديد'}
          </h2>
          
          {message && (
            <div className={`mb-4 p-3 rounded-md text-sm ${
              message.includes('نجاح') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              {message}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الاسم الكامل
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="مثال: أحمد محمد"
                  className="w-full rounded-md border-0 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm px-3"
                  required
                />
              </div>

              {!editingEmployee && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      اسم المستخدم
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="مثال: ahmed.mohamed"
                      className="w-full rounded-md border-0 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm px-3"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      البريد الإلكتروني
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="مثال: ahmed@company.com"
                      className="w-full rounded-md border-0 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm px-3"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      كلمة المرور
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="********"
                      className="w-full rounded-md border-0 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm px-3"
                      required
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الصلاحية
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'employee' | 'manager')}
                  className="w-full rounded-md border-0 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm px-3 bg-white"
                >
                  <option value="employee">موظف</option>
                  <option value="manager">مدير</option>
                </select>
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
              <button type="submit" disabled={creating} className="btn-primary">
                {creating ? 'جاري الحفظ...' : editingEmployee ? 'حفظ التعديلات' : 'إضافة الموظف'}
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
            placeholder="بحث عن موظف..."
            className="w-full rounded-md border-0 py-2 pr-3 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm"
          />
        </div>
      </div>

      {/* Employees List */}
      <div className="space-y-3">
        {filteredEmployees.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-400">
              <Users className="h-8 w-8" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">
              لا يوجد موظفين
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              ابدأ بإضافة الموظفين لإدارة المهام
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        الاسم
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        اسم المستخدم
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        الصلاحية
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        الإجراءات
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredEmployees.map((employee) => (
                      <tr key={employee.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            {employee.full_name || 'غير محدد'}
                          </div>
                          <div className="text-xs text-gray-500">{employee.id.slice(0, 20)}...</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{employee.id.slice(0, 8)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            employee.role === 'manager' 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {employee.role === 'manager' ? 'مدير' : 'موظف'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(employee)}
                              className="p-2 rounded-md hover:bg-gray-100 text-gray-600 hover:text-blue-600 transition-colors"
                              title="تعديل"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(employee.id)}
                              className="p-2 rounded-md hover:bg-gray-100 text-gray-600 hover:text-red-600 transition-colors"
                              title="حذف"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {filteredEmployees.map((employee) => (
                <div key={employee.id} className="card p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="text-base font-semibold text-gray-900 mb-1">
                        {employee.full_name || 'غير محدد'}
                      </div>
                      <div className="text-xs text-gray-500 mb-2">
                        {employee.id.slice(0, 8)}
                      </div>
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        employee.role === 'manager' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {employee.role === 'manager' ? 'مدير' : 'موظف'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(employee)}
                        className="p-2 rounded-md hover:bg-gray-100 text-gray-600 hover:text-blue-600 transition-colors"
                        title="تعديل"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(employee.id)}
                        className="p-2 rounded-md hover:bg-gray-100 text-gray-600 hover:text-red-600 transition-colors"
                        title="حذف"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
