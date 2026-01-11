import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { LayoutDashboard, CheckSquare, Users, LogOut, Menu, X, ClipboardList, Layers, Building2, BarChart2, FolderKanban, Eye, Calendar, MessageSquare } from 'lucide-react';
import NotificationDropdown from '@/components/NotificationDropdown';
import { supabase } from '@/lib/supabaseClient';
import clsx from 'clsx';

export default function Layout() {
  const { profile, signOut, user } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  // جلب عدد الرسائل غير المقروءة
  useEffect(() => {
    if (!user) return;

    const fetchUnreadCount = async () => {
      const { count } = await supabase
        .from('messages' as any)
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('is_read', false);
      
      setUnreadMessagesCount(count || 0);
    };

    fetchUnreadCount();

    // الاشتراك في التحديثات الفورية
    const channel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const navigation = [
    { name: 'لوحة التحكم', href: '/dashboard', icon: LayoutDashboard, show: profile?.role === 'manager' },
    { name: 'المشاريع', href: '/projects', icon: FolderKanban, show: profile?.role === 'manager' },
    { name: 'مهامي', href: '/tasks', icon: ClipboardList, show: true },
    { name: 'التقويم', href: '/calendar', icon: Calendar, show: true },
    { name: 'الرسائل', href: '/messages', icon: MessageSquare, show: true },
    { name: 'لوحة المراجعة', href: '/review', icon: Eye, show: true },
    { name: 'جميع المهام', href: '/all-tasks', icon: CheckSquare, show: profile?.role === 'manager' },
    { name: 'أنواع المهام', href: '/task-types', icon: Layers, show: profile?.role === 'manager' },
    { name: 'الشركات', href: '/companies', icon: Building2, show: profile?.role === 'manager' },
    { name: 'الموظفين', href: '/admin', icon: Users, show: profile?.role === 'manager' },
    { name: 'التقارير', href: '/reports', icon: BarChart2, show: profile?.role === 'manager' },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex" dir="rtl">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between bg-white/90 backdrop-blur-sm p-3 border-b border-gray-200 shadow-sm">
        <NotificationDropdown />
        <span className="font-bold text-lg text-[#114fd1]">Wise Tasks</span>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 rounded-md hover:bg-gray-100">
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Sidebar */}
      <div className={clsx(
        "fixed inset-y-0 right-0 z-50 w-72 bg-[#163d67] text-white shadow-xl transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0 lg:flex lg:flex-col",
        mobileMenuOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
      )}>
        <div className="flex h-20 shrink-0 items-center px-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-white/10 text-white flex items-center justify-center shadow-md">
              <span className="text-lg font-bold">W</span>
            </div>
            <span className="font-bold text-lg">Wise Tasks</span>
          </div>
        </div>
        <div className="flex flex-1 flex-col overflow-y-auto px-6 pb-4">
          <nav className="flex-1 space-y-1 mt-6">
            {navigation.filter(item => item.show).map((item) => {
              const isActive = location.pathname === item.href;
              const isMessages = item.href === '/messages';
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={clsx(
                    isActive ? 'bg-white/10 text-white ring-1 ring-white/20' : 'text-white/90 hover:text-white hover:bg-white/5',
                    'group flex gap-x-3 rounded-lg p-3 text-sm leading-6 font-semibold transition-colors relative'
                  )}
                >
                  <item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                  {item.name}
                  {isMessages && unreadMessagesCount > 0 && (
                    <span className="absolute left-2 top-2 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                      {unreadMessagesCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
          
          <div className="mt-auto border-t border-white/10 pt-4">
            <div className="px-3 py-4 rounded-lg bg-white/5">
              <div className="flex items-center gap-x-3 text-sm">
                <div className="flex-1">
                  <div className="font-semibold truncate">{profile?.full_name || 'مدير النظام'}</div>
                  <div className="mt-1 inline-flex items-center rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ring-white/20">
                    {profile?.role === 'manager' ? 'مدير' : 'موظف'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => signOut()}
                className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-md ring-1 ring-inset ring-white/20 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                تسجيل الخروج
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 min-h-screen lg:pt-0 pt-16">
        <main className="h-full p-3 sm:p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto h-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" 
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
