import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/features/auth/AuthContext';
import { Bell, Check, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  content: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
}

export default function NotificationDropdown() {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (profile) {
      fetchNotifications();
      
      // Subscribe to new notifications
      const channel = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${profile.id}`,
          },
          () => {
            fetchNotifications();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [profile]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    if (!profile) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching notifications:', error);
    } else {
      setNotifications(data || []);
    }
    setLoading(false);
  };

  const markAsRead = async (id: string) => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id);
    
    await fetchNotifications();
  };

  const markAllAsRead = async () => {
    if (!profile) return;
    
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', profile.id)
      .eq('read', false);
    
    await fetchNotifications();
  };

  const deleteNotification = async (id: string) => {
    await supabase
      .from('notifications')
      .delete()
      .eq('id', id);
    
    await fetchNotifications();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-md hover:bg-gray-100 lg:hover:bg-white/10 text-gray-700 lg:text-white transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute left-0 lg:right-0 mt-2 w-[90vw] sm:w-80 max-w-sm bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-50" dir="rtl" style={{ top: '100%' }}>
          <div className="p-3 sm:p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">الإشعارات</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 whitespace-nowrap"
                >
                  تحديد الكل كمقروء
                </button>
              )}
            </div>
          </div>

          <div className="max-h-[60vh] sm:max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                جاري التحميل...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">
                لا توجد إشعارات
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 sm:p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      {notification.link ? (
                        <Link
                          to={notification.link}
                          onClick={() => {
                            markAsRead(notification.id);
                            setIsOpen(false);
                          }}
                          className="block"
                        >
                          <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-1">
                            {notification.title}
                          </h4>
                          {notification.content && (
                            <p className="text-xs sm:text-sm text-gray-600 mb-2 line-clamp-2">
                              {notification.content}
                            </p>
                          )}
                          <p className="text-xs text-gray-400">
                            {format(new Date(notification.created_at), 'dd MMM yyyy, HH:mm', { locale: ar })}
                          </p>
                        </Link>
                      ) : (
                        <>
                          <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-1">
                            {notification.title}
                          </h4>
                          {notification.content && (
                            <p className="text-xs sm:text-sm text-gray-600 mb-2 line-clamp-2">
                              {notification.content}
                            </p>
                          )}
                          <p className="text-xs text-gray-400">
                            {format(new Date(notification.created_at), 'dd MMM yyyy, HH:mm', { locale: ar })}
                          </p>
                        </>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="p-1.5 rounded hover:bg-gray-200 text-blue-600"
                          title="تحديد كمقروء"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="p-1.5 rounded hover:bg-gray-200 text-gray-600 hover:text-red-600"
                        title="حذف"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
