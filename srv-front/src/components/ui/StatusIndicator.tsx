/**
 * StatusIndicator Component
 * Shows status with color-coded indicator
 */

import { cn } from '@/lib/utils';
import { Circle } from 'lucide-react';

export type Status = 'active' | 'locked' | 'offline' | 'warning' | 'parole';

export interface StatusIndicatorProps {
  status: Status;
  label?: string;
  showDot?: boolean;
  className?: string;
}

const statusConfig: Record<
  Status,
  {
    label: string;
    color: string;
    bgColor: string;
    dotColor: string;
  }
> = {
  active: {
    label: 'Active',
    color: 'text-success-700 dark:text-success-400',
    bgColor: 'bg-success-100 dark:bg-success-900/30',
    dotColor: 'text-success-500',
  },
  locked: {
    label: 'Locked',
    color: 'text-danger-700 dark:text-danger-400',
    bgColor: 'bg-danger-100 dark:bg-danger-900/30',
    dotColor: 'text-danger-500',
  },
  offline: {
    label: 'Offline',
    color: 'text-zinc-700 dark:text-zinc-400',
    bgColor: 'bg-zinc-100 dark:bg-zinc-900/30',
    dotColor: 'text-zinc-500',
  },
  warning: {
    label: 'Warning',
    color: 'text-accent-700 dark:text-accent-400',
    bgColor: 'bg-accent-100 dark:bg-accent-900/30',
    dotColor: 'text-accent-500',
  },
  parole: {
    label: 'Parole',
    color: 'text-blue-700 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    dotColor: 'text-blue-500',
  },
};

export function StatusIndicator({
  status,
  label,
  showDot = true,
  className,
}: StatusIndicatorProps) {
  const config = statusConfig[status];
  const displayLabel = label || config.label;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium',
        config.bgColor,
        config.color,
        className
      )}
    >
      {showDot && <Circle className={cn('h-2 w-2 fill-current', config.dotColor)} />}
      <span>{displayLabel}</span>
    </div>
  );
}
