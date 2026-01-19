import clsx from 'clsx';

const statusColors = {
  open: 'bg-blue-100 text-blue-700 ring-blue-200',
  in_progress: 'bg-yellow-100 text-yellow-800 ring-yellow-200',
  done: 'bg-green-100 text-green-700 ring-green-200',
};

const statusLabels: Record<string, string> = {
  open: 'مفتوح',
  in_progress: 'جاري العمل',
  done: 'اكتملت',
};

const priorityColors = {
  low: 'bg-gray-50 text-gray-600 ring-gray-200',
  medium: 'bg-orange-50 text-orange-600 ring-orange-200',
  high: 'bg-red-50 text-red-600 ring-red-200',
  critical: 'bg-red-100 text-red-800 ring-red-300',
};

const priorityLabels: Record<string, string> = {
  low: 'منخفض',
  medium: 'متوسط',
  high: 'عالي',
  critical: 'حرج',
};

export function StatusBadge({ status }: { status: keyof typeof statusColors }) {
  return (
    <span className={clsx(
      statusColors[status] || 'bg-gray-100 text-gray-700',
      'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset'
    )}>
      {statusLabels[status] || status}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: keyof typeof priorityColors }) {
  return (
    <span className={clsx(
      priorityColors[priority] || 'bg-gray-50 text-gray-600',
      'inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ring-inset'
    )}>
      {priorityLabels[priority] || priority}
    </span>
  );
}
