import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/features/auth/AuthContext';
import { Paperclip, Download, Trash2, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Attachment {
  id: string;
  task_id: string;
  user_id: string;
  file_name: string;
  file_url: string;
  file_size: number;
  file_type: string;
  created_at: string;
  profiles?: {
    full_name: string | null;
  };
}

interface TaskAttachmentsProps {
  taskId: string;
}

export default function TaskAttachments({ taskId }: TaskAttachmentsProps) {
  const { profile } = useAuth();
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchAttachments();
  }, [taskId]);

  const fetchAttachments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('task_attachments')
      .select(`
        *,
        profiles:user_id (
          full_name
        )
      `)
      .eq('task_id', taskId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching attachments:', error);
    } else {
      setAttachments(data || []);
    }
    setLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    setUploading(true);

    try {
      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `task-attachments/${taskId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('attachments')
        .getPublicUrl(filePath);

      // Save attachment record
      const { error: dbError } = await supabase
        .from('task_attachments')
        .insert({
          task_id: taskId,
          user_id: profile.id,
          file_name: file.name,
          file_url: publicUrl,
          file_size: file.size,
          file_type: file.type,
        });

      if (dbError) throw dbError;

      await fetchAttachments();
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('حدث خطأ أثناء رفع الملف. تأكد من إنشاء bucket باسم "attachments" في Supabase Storage');
    }

    setUploading(false);
    e.target.value = '';
  };

  const handleDelete = async (id: string, fileUrl: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المرفق؟')) return;

    try {
      // Extract file path from URL
      const urlParts = fileUrl.split('/');
      const filePath = urlParts.slice(urlParts.indexOf('attachments')).join('/');

      // Delete from storage
      await supabase.storage
        .from('attachments')
        .remove([filePath]);

      // Delete from database
      const { error } = await supabase
        .from('task_attachments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchAttachments();
    } catch (error) {
      console.error('Error deleting attachment:', error);
      alert('حدث خطأ أثناء حذف المرفق');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (loading) {
    return <div className="text-center text-gray-600 py-4">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-900 font-semibold">
          <Paperclip className="h-5 w-5" />
          <h3>المرفقات ({attachments.length})</h3>
        </div>
        
        <label className="flex items-center gap-2 btn-secondary cursor-pointer">
          <Upload className="h-4 w-4" />
          {uploading ? 'جاري الرفع...' : 'رفع ملف'}
          <input
            type="file"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      {/* Attachments list */}
      <div className="space-y-2">
        {attachments.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            لا توجد مرفقات بعد
          </p>
        ) : (
          attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Paperclip className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {attachment.file_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(attachment.file_size)} • {' '}
                    {attachment.profiles?.full_name || 'مستخدم'} • {' '}
                    {format(new Date(attachment.created_at), 'dd MMM yyyy', { locale: ar })}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <a
                  href={attachment.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-md hover:bg-gray-200 text-gray-600 hover:text-blue-600"
                  title="تحميل"
                >
                  <Download className="h-4 w-4" />
                </a>
                {profile?.role === 'manager' && (
                  <button
                    onClick={() => handleDelete(attachment.id, attachment.file_url)}
                    className="p-2 rounded-md hover:bg-gray-200 text-gray-600 hover:text-red-600"
                    title="حذف"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
