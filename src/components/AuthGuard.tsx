import { useAuth } from '@/features/auth/AuthContext';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

export default function AuthGuard({ requireManager = false }: { requireManager?: boolean }) {
  const { session, loading, profile } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireManager && profile?.role !== 'manager') {
    return <div className="p-8 text-center text-red-600">Access Denied: Managers only.</div>;
  }

  return <Outlet />;
}
