import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { Database } from '@/types/database.types';
import { useAuth } from '@/features/auth/AuthContext';

type Task = Database['public']['Tables']['tasks']['Row'];
type TaskInsert = Database['public']['Tables']['tasks']['Insert'];

export function useTasks() {
  const { profile } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    setLoading(true);
    if (!isSupabaseConfigured) {
      setTasks([]);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching tasks:', error);
    } else {
      setTasks(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (profile) {
      fetchTasks();

      // Realtime subscription
      const channel = supabase
        .channel('tasks-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'tasks',
          },
          (_payload) => {
            // For simplicity in this MVP, we just refetch or optimistically update.
            // Let's refetch to be safe with RLS policies and triggers.
            fetchTasks();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [profile]);

  const updateTaskStatus = async (taskId: string, newStatus: Task['status']) => {
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));

    const updates: any = { status: newStatus };
    if (newStatus === 'in_progress') updates.started_at = new Date().toISOString();
    if (newStatus === 'done') {
      updates.completed_at = new Date().toISOString();
      updates.reviewed_at = new Date().toISOString();
    }

    if (!isSupabaseConfigured) return;
    const { error } = await supabase.from('tasks').update(updates).eq('id', taskId);

    if (error) {
      console.error('Error updating task:', error);
      fetchTasks(); // Revert
    } else {
        // Log activity
        await supabase.from('task_activity').insert({
            task_id: taskId,
            action: 'status_change',
            from_status: tasks.find(t => t.id === taskId)?.status,
            to_status: newStatus
        });
    }
  };

  const assignTask = async (taskId: string, assigneeId: string) => {
    if (!isSupabaseConfigured) {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, assignee_id: assigneeId, status: 'open' as any } : t));
      return;
    }
    const { error } = await supabase.from('tasks').update({ assignee_id: assigneeId, status: 'assigned' }).eq('id', taskId);
      
    if (error) console.error('Error assigning task:', error);
    else {
         await supabase.from('task_activity').insert({
            task_id: taskId,
            action: 'assignment',
            to_status: 'assigned'
        });
        fetchTasks();
    }
  };

  const createTask = async (task: TaskInsert) => {
    const { data, error } = await supabase.from('tasks').insert([task]).select().single();
    if (error) throw error;
    fetchTasks();
    return data;
  };

  const updateTaskPriority = async (taskId: string, newPriority: Task['priority']) => {
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, priority: newPriority } : t));

    if (!isSupabaseConfigured) return;
    const { error } = await supabase.from('tasks').update({ priority: newPriority as any }).eq('id', taskId);

    if (error) {
      console.error('Error updating priority:', error);
      fetchTasks(); // Revert
    } else {
        // Log activity
        await supabase.from('task_activity').insert({
            task_id: taskId,
            action: 'priority_change',
            to_status: newPriority // Reusing column for priority value
        });
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!isSupabaseConfigured) {
      setTasks(prev => prev.filter(t => t.id !== taskId));
      return;
    }
    
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);
    
    if (error) {
      console.error('Error deleting task:', error);
      throw error;
    } else {
      setTasks(prev => prev.filter(t => t.id !== taskId));
    }
  };

  return {
    tasks,
    loading,
    fetchTasks,
    updateTaskStatus,
    updateTaskPriority,
    assignTask,
    createTask,
    deleteTask
  };
}
