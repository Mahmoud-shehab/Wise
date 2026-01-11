import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/features/auth/AuthContext';
import { MessageSquare, Send } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Comment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name: string | null;
  };
}

interface TaskCommentsProps {
  taskId: string;
}

export default function TaskComments({ taskId }: TaskCommentsProps) {
  const { profile } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [taskId]);

  const fetchComments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('task_comments')
      .select(`
        *,
        profiles:user_id (
          full_name
        )
      `)
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
    } else {
      setComments(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !profile) return;

    setSubmitting(true);
    const { error } = await supabase
      .from('task_comments')
      .insert({
        task_id: taskId,
        user_id: profile.id,
        content: newComment.trim(),
      });

    if (error) {
      console.error('Error adding comment:', error);
      alert('حدث خطأ أثناء إضافة التعليق');
    } else {
      setNewComment('');
      await fetchComments();
    }
    setSubmitting(false);
  };

  if (loading) {
    return <div className="text-center text-gray-600 py-4">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center gap-2 text-gray-900 font-semibold">
        <MessageSquare className="h-5 w-5" />
        <h3>التعليقات ({comments.length})</h3>
      </div>

      {/* Comments list */}
      <div className="space-y-3">
        {comments.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            لا توجد تعليقات بعد
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm text-gray-900">
                  {comment.profiles?.full_name || 'مستخدم'}
                </span>
                <span className="text-xs text-gray-500">
                  {format(new Date(comment.created_at), 'dd MMM yyyy, HH:mm', { locale: ar })}
                </span>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {comment.content}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Add comment form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="أضف تعليقاً..."
          rows={3}
          className="w-full rounded-md border-0 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm px-3"
          disabled={submitting}
        />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!newComment.trim() || submitting}
            className="flex items-center gap-2 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
            {submitting ? 'جاري الإرسال...' : 'إرسال'}
          </button>
        </div>
      </form>
    </div>
  );
}
