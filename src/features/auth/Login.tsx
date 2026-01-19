import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { User as UserIcon, Lock, AlertCircle } from 'lucide-react';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const { loginDemo } = useAuth();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (!isSupabaseConfigured) {
        const allowed = ['manager@wise.com', 'employee@wise.com', 'manager', 'employee'];
        const ok = allowed.includes(usernameOrEmail.toLowerCase()) && password === 'Wise12345!';
        if (!ok) {
          setMessage('بيانات الدخول غير صحيحة فى وضع التجربة');
        } else {
          const email = usernameOrEmail.includes('@') ? usernameOrEmail : `${usernameOrEmail}@wise.com`;
          await loginDemo?.(email);
          
          // انتظر قليلاً لتحميل الـ profile
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // جلب الـ profile للتحقق من الدور
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', user.id)
              .single();
            
            if (profile?.role === 'manager' || profile?.role === 'assistant_manager') {
              navigate('/dashboard');
            } else {
              navigate('/tasks');
            }
          } else {
            navigate('/');
          }
        }
      } else {
        let email = usernameOrEmail;
        
        // إذا لم يكن email (لا يحتوي على @)، ابحث عن المستخدم من username
        if (!usernameOrEmail.includes('@')) {
          // جرب تسجيل الدخول مباشرة بإضافة @wise.com
          email = `${usernameOrEmail}@wise.com`;
        }
        
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) {
          // إذا فشل، جرب البحث في profiles
          if (!usernameOrEmail.includes('@')) {
            setMessage('اسم المستخدم أو كلمة المرور غير صحيحة');
          } else {
            throw error;
          }
        } else {
          // انتظر قليلاً لتحميل الـ profile
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // جلب الـ profile للتحقق من الدور
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', user.id)
              .single();
            
            if (profile?.role === 'manager' || profile?.role === 'assistant_manager') {
              navigate('/dashboard');
            } else {
              navigate('/tasks');
            }
          } else {
            navigate('/');
          }
        }
      }
    } catch (error: any) {
      setMessage(error.message || 'حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-[#0E3BBE]">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-6" dir="rtl">
        <div className="flex flex-col items-center text-center">
          <div className="h-12 w-12 rounded-lg bg-[#114fd1] text-white flex items-center justify-center shadow-md">
            <span className="text-xl font-bold">W</span>
          </div>
          <h2 className="mt-3 text-2xl font-bold text-gray-900">Wise</h2>
          <p className="mt-1 text-sm text-gray-500">نظام إدارة المهام</p>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleAuth}>
          {message && (
            <div className="flex items-center gap-2 rounded-md bg-red-50 text-red-700 px-3 py-2 ring-1 ring-red-200">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{message}</span>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">اسم المستخدم</label>
            <div className="relative">
              <input
                type="text"
                required
                className="block w-full rounded-md border-0 py-2 pr-10 text-right text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm px-3"
                placeholder="ادخل اسم المستخدم"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
              />
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">كلمة السر</label>
            <div className="relative">
              <input
                type="password"
                required
                className="block w-full rounded-md border-0 py-2 pr-10 text-right text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm px-3"
                placeholder="ادخل كلمة السر"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-[#114fd1] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#0e44b7] transition-colors disabled:opacity-50"
          >
            {loading ? 'جارٍ المعالجة...' : 'تسجيل الدخول'}
          </button>

          <div className="text-center text-sm text-gray-500">إنشاء الحسابات يتم بواسطة المدير فقط</div>
        </form>
      </div>
    </div>
  );
}
