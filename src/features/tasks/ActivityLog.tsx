import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Database } from '@/types/database.types';
import { format } from 'date-fns';

type Activity = Database['public']['Tables']['task_activity']['Row'];

export function ActivityLog({ taskId }: { taskId: string }) {
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    const fetchActivity = async () => {
      const { data } = await supabase
        .from('task_activity')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: false });
      
      if (data) setActivities(data);
    };

    fetchActivity();

    const channel = supabase
      .channel(`activity-${taskId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'task_activity', filter: `task_id=eq.${taskId}` }, 
      (payload) => {
        setActivities(prev => [payload.new as Activity, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [taskId]);

  return (
    <div className="flow-root">
      <ul role="list" className="-mb-8">
        {activities.map((activity, activityIdx) => (
          <li key={activity.id}>
            <div className="relative pb-8">
              {activityIdx !== activities.length - 1 ? (
                <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
              ) : null}
              <div className="relative flex space-x-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-400 ring-8 ring-white">
                  <span className="h-2.5 w-2.5 rounded-full bg-white" />
                </div>
                <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                  <div>
                    <p className="text-sm text-gray-500">
                      Action: <span className="font-medium text-gray-900">{activity.action}</span>
                      {activity.from_status && activity.to_status && (
                          <span className="ml-1">
                              ({activity.from_status} &rarr; {activity.to_status})
                          </span>
                      )}
                    </p>
                  </div>
                  <div className="whitespace-nowrap text-right text-sm text-gray-500">
                    <time dateTime={activity.created_at}>{format(new Date(activity.created_at), 'MMM d, p')}</time>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
        {activities.length === 0 && <p className="text-sm text-gray-500">No activity yet.</p>}
      </ul>
    </div>
  );
}
