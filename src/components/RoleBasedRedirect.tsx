import { Navigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';

export default function RoleBasedRedirect() {
  const { profile, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-gray-600">جاري التحميل...</div>
    </div>;
  }

  // المدير ومساعد المدير يروحوا للوحة التحكم
  if (profile?.role === 'manager' || profile?.role === 'assistant_manager') {
    return <Navigate to="/dashboard" replace />;
  }

  // الشريك يروح لصفحة مهامي
  return <Navigate to="/tasks" replace />;
}
