import { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Inbox, Send, Mail, MailOpen, Trash2, Plus, X, User, Reply } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  subject: string;
  body: string;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
  sender?: {
    full_name: string | null;
    role: string;
  };
  receiver?: {
    full_name: string | null;
    role: string;
  };
}

interface Profile {
  id: string;
  full_name: string | null;
  role: string;
}

export default function MessagesPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'inbox' | 'outbox'>('inbox');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [users, setUsers] = useState<Profile[]>([]);
  
  // نموذج إرسال رسالة
  const [newMessage, setNewMessage] = useState({
    receiver_id: '',
    subject: '',
    body: ''
  });

  // جلب المستخدمين
  useEffect(() => {
    fetchUsers();
  }, []);

  // جلب الرسائل
  useEffect(() => {
    if (user) {
      fetchMessages();
    }
  }, [user, activeTab]);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .neq('id', user?.id || '')
      .order('full_name');
    
    if (!error && data) {
      setUsers(data);
    }
  };

  const fetchMessages = async () => {
    setLoading(true);
    
    try {
      let query = supabase
        .from('messages' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (activeTab === 'inbox') {
        query = query.eq('receiver_id', user?.id);
      } else {
        query = query.eq('sender_id', user?.id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching messages:', error);
      } else if (data) {
        // جلب معلومات المرسل والمستقبل لكل رسالة
        const messagesWithProfiles = await Promise.all(
          data.map(async (msg: any) => {
            // جلب معلومات المرسل
            const { data: senderData } = await supabase
              .from('profiles')
              .select('full_name, role')
              .eq('id', msg.sender_id)
              .single();
            
            // جلب معلومات المستقبل
            const { data: receiverData } = await supabase
              .from('profiles')
              .select('full_name, role')
              .eq('id', msg.receiver_id)
              .single();
            
            return {
              ...msg,
              sender: senderData,
              receiver: receiverData
            };
          })
        );
        
        setMessages(messagesWithProfiles as any);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    }
    
    setLoading(false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.receiver_id || !newMessage.subject.trim() || !newMessage.body.trim()) {
      alert('الرجاء ملء جميع الحقول');
      return;
    }

    try {
      const { error } = await supabase
        .from('messages' as any)
        .insert({
          sender_id: user?.id,
          receiver_id: newMessage.receiver_id,
          subject: newMessage.subject,
          body: newMessage.body
        });

      if (error) {
        console.error('Error sending message:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        
        // تحقق من نوع الخطأ
        if (error.message.includes('relation "messages" does not exist') || 
            error.message.includes('does not exist') ||
            error.code === '42P01') {
          alert(`⚠️ جدول الرسائل غير موجود في قاعدة البيانات.

الرجاء تطبيق ملف create_messages_simple.sql في Supabase SQL Editor أولاً.

الخطوات:
1. افتح Supabase SQL Editor
2. انسخ محتوى ملف create_messages_simple.sql
3. شغل الأمر
4. حاول مرة أخرى

للمزيد من التفاصيل، راجع ملف: خطوات_حل_مشكلة_الرسائل_النهائية.md`);
        } else if (error.message.includes('permission denied') || 
                   error.message.includes('policy') ||
                   error.code === '42501') {
          alert(`⚠️ لا توجد صلاحيات كافية (RLS Policy).

الحل السريع:
1. افتح Supabase SQL Editor
2. شغل هذا الأمر:
   ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
3. حاول إرسال الرسالة مرة أخرى

⚠️ تحذير: هذا للاختبار فقط!`);
        } else {
          alert(`❌ حدث خطأ أثناء إرسال الرسالة:

الخطأ: ${error.message}
الكود: ${error.code || 'غير معروف'}

الرجاء مراجعة Console للمزيد من التفاصيل.`);
        }
      } else {
        alert('✅ تم إرسال الرسالة بنجاح');
        setShowCompose(false);
        setNewMessage({ receiver_id: '', subject: '', body: '' });
        // تحديث قائمة الرسائل
        fetchMessages();
      }
    } catch (err: any) {
      console.error('Unexpected error:', err);
      alert(`❌ حدث خطأ غير متوقع:\n${err.message || 'خطأ غير معروف'}`);
    }
  };

  const handleMarkAsRead = async (messageId: string) => {
    if (!user?.id) return;
    
    const { error } = await supabase
      .from('messages' as any)
      .update({ 
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', messageId);

    if (!error) {
      // تحديث الإشعار المرتبط بالرسالة ليصبح مقروءاً
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('link', '/messages?msg=' + messageId)
        .eq('type', 'message')
        .eq('user_id', user.id);
      
      fetchMessages();
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الرسالة؟')) {
      return;
    }

    const { error } = await supabase
      .from('messages' as any)
      .delete()
      .eq('id', messageId);

    if (!error) {
      setSelectedMessage(null);
      fetchMessages();
      alert('✅ تم حذف الرسالة');
    } else {
      alert('❌ حدث خطأ أثناء حذف الرسالة');
    }
  };

  const handleSelectMessage = (message: Message) => {
    setSelectedMessage(message);
    
    // تحديث حالة القراءة إذا كانت رسالة واردة غير مقروءة
    if (activeTab === 'inbox' && !message.is_read) {
      handleMarkAsRead(message.id);
    }
  };

  // التحقق من وجود معرف رسالة في URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const msgId = urlParams.get('msg');
    
    if (msgId && messages.length > 0) {
      const message = messages.find(m => m.id === msgId);
      if (message) {
        setSelectedMessage(message);
        if (activeTab === 'inbox' && !message.is_read) {
          handleMarkAsRead(message.id);
        }
      }
    }
  }, [messages, activeTab]);

  const handleReply = () => {
    if (!selectedMessage) return;
    
    // تحديد المستلم (المرسل الأصلي)
    const replyToId = activeTab === 'inbox' 
      ? selectedMessage.sender_id 
      : selectedMessage.receiver_id;
    
    // تحديد الموضوع مع "Re:"
    const replySubject = selectedMessage.subject.startsWith('Re: ')
      ? selectedMessage.subject
      : `Re: ${selectedMessage.subject}`;
    
    // ملء نموذج الرسالة الجديدة
    setNewMessage({
      receiver_id: replyToId,
      subject: replySubject,
      body: ''
    });
    
    setShowCompose(true);
  };

  const unreadCount = messages.filter(m => !m.is_read && activeTab === 'inbox').length;

  if (loading) {
    return <div className="text-center text-gray-600" dir="rtl">جاري التحميل...</div>;
  }

  return (
    <div className="h-full flex flex-col" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">الرسائل</h1>
        <button
          onClick={() => setShowCompose(true)}
          className="flex items-center gap-2 btn-primary"
        >
          <Plus className="h-4 w-4" />
          رسالة جديدة
        </button>
      </div>

      {/* Compose Modal */}
      {showCompose && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">رسالة جديدة</h2>
                <button
                  onClick={() => setShowCompose(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSendMessage} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    إلى
                  </label>
                  <select
                    value={newMessage.receiver_id}
                    onChange={(e) => setNewMessage({ ...newMessage, receiver_id: e.target.value })}
                    className="w-full rounded-md border-0 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm px-3 bg-white"
                    required
                    disabled={newMessage.subject.startsWith('Re: ')}
                  >
                    <option value="">اختر المستلم...</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.full_name || u.id.slice(0, 8)} ({u.role === 'manager' ? 'مدير' : 'موظف'})
                      </option>
                    ))}
                  </select>
                  {newMessage.subject.startsWith('Re: ') && newMessage.receiver_id && (
                    <p className="text-xs text-gray-500 mt-1">
                      📧 الرد سيُرسل إلى المرسل الأصلي
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    الموضوع
                  </label>
                  <input
                    type="text"
                    value={newMessage.subject}
                    onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
                    placeholder="موضوع الرسالة..."
                    className="w-full rounded-md border-0 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm px-3"
                    required
                    disabled={newMessage.subject.startsWith('Re: ')}
                  />
                  {newMessage.subject.startsWith('Re: ') && (
                    <p className="text-xs text-gray-500 mt-1">
                      💡 هذا رد على رسالة سابقة
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    الرسالة
                  </label>
                  <textarea
                    value={newMessage.body}
                    onChange={(e) => setNewMessage({ ...newMessage, body: e.target.value })}
                    placeholder="اكتب رسالتك هنا..."
                    rows={8}
                    className="w-full rounded-md border-0 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm px-3"
                    required
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowCompose(false)}
                    className="btn-secondary"
                  >
                    إلغاء
                  </button>
                  <button type="submit" className="btn-primary flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    إرسال
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-gray-200">
        <button
          onClick={() => {
            setActiveTab('inbox');
            setSelectedMessage(null);
          }}
          className={`flex items-center gap-2 px-4 py-2 font-semibold border-b-2 transition-colors ${
            activeTab === 'inbox'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <Inbox className="h-5 w-5" />
          الوارد
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </button>
        <button
          onClick={() => {
            setActiveTab('outbox');
            setSelectedMessage(null);
          }}
          className={`flex items-center gap-2 px-4 py-2 font-semibold border-b-2 transition-colors ${
            activeTab === 'outbox'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <Send className="h-5 w-5" />
          الصادر
        </button>
      </div>

      {/* Messages Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">
        {/* Messages List */}
        <div className="lg:col-span-1 card overflow-y-auto">
          {messages.length === 0 ? (
            <div className="p-8 text-center">
              <Mail className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">لا توجد رسائل</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {messages.map((message) => (
                <button
                  key={message.id}
                  onClick={() => handleSelectMessage(message)}
                  className={`w-full text-right p-4 hover:bg-gray-50 transition-colors ${
                    selectedMessage?.id === message.id ? 'bg-blue-50' : ''
                  } ${!message.is_read && activeTab === 'inbox' ? 'bg-blue-50/30' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      {!message.is_read && activeTab === 'inbox' ? (
                        <Mail className="h-5 w-5 text-blue-600" />
                      ) : (
                        <MailOpen className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className={`text-sm truncate ${
                          !message.is_read && activeTab === 'inbox' ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'
                        }`}>
                          {activeTab === 'inbox' 
                            ? (message.sender?.full_name || 'مستخدم')
                            : (message.receiver?.full_name || 'مستخدم')
                          }
                        </p>
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(message.created_at), { 
                            addSuffix: true, 
                            locale: ar 
                          })}
                        </span>
                      </div>
                      <p className={`text-sm truncate ${
                        !message.is_read && activeTab === 'inbox' ? 'font-semibold text-gray-900' : 'text-gray-600'
                      }`}>
                        {message.subject}
                      </p>
                      <p className="text-xs text-gray-500 truncate mt-1">
                        {message.body}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Message Details */}
        <div className="lg:col-span-2 card overflow-y-auto">
          {selectedMessage ? (
            <div className="p-6">
              <div className="flex items-start justify-between mb-6 pb-4 border-b border-gray-200">
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    {selectedMessage.subject}
                  </h2>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>
                        {activeTab === 'inbox' ? 'من: ' : 'إلى: '}
                        <span className="font-semibold">
                          {activeTab === 'inbox'
                            ? (selectedMessage.sender?.full_name || 'مستخدم')
                            : (selectedMessage.receiver?.full_name || 'مستخدم')
                          }
                        </span>
                      </span>
                    </div>
                    <span>
                      {formatDistanceToNow(new Date(selectedMessage.created_at), {
                        addSuffix: true,
                        locale: ar
                      })}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleReply}
                    className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors font-semibold"
                    title="رد على الرسالة"
                  >
                    <Reply className="h-5 w-5" />
                    رد
                  </button>
                  <button
                    onClick={() => handleDeleteMessage(selectedMessage.id)}
                    className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-md transition-colors"
                    title="حذف الرسالة"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {selectedMessage.body}
                </p>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Mail className="h-16 w-16 mx-auto mb-4" />
                <p>اختر رسالة لعرضها</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
