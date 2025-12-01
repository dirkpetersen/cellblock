/**
 * TimeDisplay Component
 * Displays formatted time with optional countdown
 */

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { cn, formatTime } from '@/lib/utils';

export interface TimeDisplayProps {
  seconds: number;
  label?: string;
  showIcon?: boolean;
  countdown?: boolean;
  className?: string;
}

export function TimeDisplay({
  seconds,
  label,
  showIcon = true,
  countdown = false,
  className,
}: TimeDisplayProps) {
  const [displaySeconds, setDisplaySeconds] = useState(seconds);

  useEffect(() => {
    setDisplaySeconds(seconds);

    if (!countdown || seconds <= 0) return;

    const interval = setInterval(() => {
      setDisplaySeconds((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [seconds, countdown]);

  const timeStr = formatTime(displaySeconds);
  const isLow = displaySeconds < 300; // Less than 5 minutes
  const isCritical = displaySeconds < 60; // Less than 1 minute

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {showIcon && (
        <Clock
          className={cn(
            'h-5 w-5',
            isCritical ? 'text-danger-500' : isLow ? 'text-accent-500' : 'text-primary-500'
          )}
        />
      )}
      <div>
        {label && <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-0.5">{label}</p>}
        <p
          className={cn(
            'font-mono text-lg font-semibold',
            isCritical
              ? 'text-danger-600 dark:text-danger-400'
              : isLow
                ? 'text-accent-600 dark:text-accent-400'
                : 'text-zinc-900 dark:text-zinc-100'
          )}
        >
          {timeStr}
        </p>
      </div>
    </div>
  );
}
