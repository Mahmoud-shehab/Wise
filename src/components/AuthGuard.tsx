import { useAuth } from '@/features/auth/AuthContext';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

export default function AuthGuard({ requireManager = false, requireFullManager = false }: { requireManager?: boolean; requireFullManager?: boolean }) {
  const { session, loading, profile } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // requireFullManager: للصفحات اللي المدير فقط يقدر يوصلها (الشركاء والشركات)
  if (requireFullManager && profile?.role !== 'manager') {
    return <div className="p-8 text-center text-red-600">صلاحية المدير فقط</div>;
  }

  // requireManager: للصفحات اللي المدير ومساعد المدير يقدروا يوصلوها
  if (requireManager && profile?.role !== 'manager' && profile?.role !== 'assistant_manager') {
    return <div className="p-8 text-center text-red-600">صلاحية المدير أو مساعد المدير فقط</div>;
  }

  return <Outlet />;
}
