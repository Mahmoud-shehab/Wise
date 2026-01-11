import { useState, useEffect } from 'react';
import { useTasks } from '../features/tasks/useTasks';
import { supabase } from '@/lib/supabaseClient';
import { Database } from '@/types/database.types';
import { Download, BarChart3, CheckCircle2, Filter, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

type Profile = Database['public']['Tables']['profiles']['Row'];

export default function ReportsPage() {
  const { tasks } = useTasks();
  const [employees, setEmployees] = useState<Profile[]>([]);
  
  // Filters
  const [reportType, setReportType] = useState('weekly');
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const fetchEmployees = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'employee')
        .order('full_name', { ascending: true });
      if (data) setEmployees(data);
    };
    fetchEmployees();

    // Set default date range (last 7 days)
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 7);
    setEndDate(format(today, 'yyyy-MM-dd'));
    setStartDate(format(lastWeek, 'yyyy-MM-dd'));
  }, []);

  // Filter tasks based on criteria
  const filteredTasks = tasks.filter(task => {
    // Employee filter
    if (selectedEmployee !== 'all' && task.assignee_id !== selectedEmployee) return false;
    
    // Priority filter
    if (selectedPriority !== 'all' && task.priority !== selectedPriority) return false;
    
    // Date range filter
    if (startDate && task.created_at) {
      const taskDate = new Date(task.created_at);
      const start = new Date(startDate);
      if (taskDate < start) return false;
    }
    if (endDate && task.created_at) {
      const taskDate = new Date(task.created_at);
      const end = new Date(endDate);
      end.setHours(23, 59, 59);
      if (taskDate > end) return false;
    }
    
    return true;
  });

  // Calculate statistics
  const stats = {
    total: filteredTasks.length,
    completed: filteredTasks.filter(t => t.status === 'done').length,
    inProgress: filteredTasks.filter(t => t.status === 'in_progress').length,
    pending: filteredTasks.filter(t => t.status === 'assigned' || t.status === 'backlog').length,
    completionRate: filteredTasks.length > 0 
      ? Math.round((filteredTasks.filter(t => t.status === 'done').length / filteredTasks.length) * 100)
      : 0,
  };

  // Priority distribution
  const priorityStats = {
    high: filteredTasks.filter(t => t.priority === 'high').length,
    medium: filteredTasks.filter(t => t.priority === 'medium').length,
    low: filteredTasks.filter(t => t.priority === 'low').length,
  };

  const handleExport = () => {
    // Create CSV content
    const headers = ['العنوان', 'الحالة', 'الأولوية', 'المسند إليه', 'تاريخ الإنشاء'];
    const rows = filteredTasks.map(task => [
      task.title,
      task.status,
      task.priority,
      task.assignee_id || 'غير مسند',
      task.created_at ? format(new Date(task.created_at), 'yyyy-MM-dd') : '',
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Create and download file
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `تقرير_المهام_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const dateRangeText = startDate && endDate
    ? `${format(new Date(startDate), 'dd MMMM yyyy', { locale: ar })} - ${format(new Date(endDate), 'dd MMMM yyyy', { locale: ar })}`
    : 'اختر نطاق التاريخ';

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">بيانات التقارير</h1>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 btn-primary"
        >
          <Download className="h-4 w-4" /> تصدير Excel
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Report Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              نوع التقرير
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full rounded-md border-0 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm px-3 bg-white"
            >
              <option value="weekly">أسبوعي</option>
              <option value="monthly">شهري</option>
              <option value="custom">مخصص</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              الأولوية
            </label>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-full rounded-md border-0 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm px-3 bg-white"
            >
              <option value="all">الكل</option>
              <option value="high">عالية</option>
              <option value="medium">متوسطة</option>
              <option value="low">منخفضة</option>
            </select>
          </div>

          {/* Employee Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              جميع الموظفين
            </label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="w-full rounded-md border-0 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm px-3 bg-white"
            >
              <option value="all">الكل</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.full_name || emp.id.slice(0, 8)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Date Range Info */}
      <div className="card p-4 bg-blue-50 border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-blue-600" />
            <div>
              <div className="text-sm font-semibold text-blue-900">فترة التقرير</div>
              <div className="text-xs text-blue-700">{dateRangeText}</div>
            </div>
          </div>
          <div className="flex gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-md border-0 py-1.5 text-sm text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 px-2"
            />
            <span className="text-gray-500">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-md border-0 py-1.5 text-sm text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 px-2"
            />
          </div>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-gray-600">إجمالي المهام</div>
            <div className="p-2 rounded-lg bg-blue-50">
              <BarChart3 className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-gray-600">مهام مكتملة</div>
            <div className="p-2 rounded-lg bg-green-50">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.completed}</div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-gray-600">جاري العمل</div>
            <div className="p-2 rounded-lg bg-purple-50">
              <Filter className="h-5 w-5 text-purple-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.inProgress}</div>
        </div>

        <div className="card p-6 bg-red-50 border-red-200">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-red-700">معدل الإنجاز</div>
          </div>
          <div className="text-3xl font-bold text-red-900">{stats.completionRate}%</div>
        </div>
      </div>

      {/* Priority Distribution */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">توزيع الأولويات</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-3xl font-bold text-gray-900">{priorityStats.high}</div>
            <div className="text-sm text-gray-600 mt-1">حرج</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-3xl font-bold text-gray-900">{priorityStats.medium}</div>
            <div className="text-sm text-gray-600 mt-1">متوسط</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-3xl font-bold text-gray-900">{priorityStats.low}</div>
            <div className="text-sm text-gray-600 mt-1">عالي</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-3xl font-bold text-gray-900">{priorityStats.low}</div>
            <div className="text-sm text-gray-600 mt-1">منخفض</div>
          </div>
        </div>
      </div>
    </div>
  );
}
