/**
 * Utility functions for CellBlock
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge class names with Tailwind CSS
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format remaining time in minutes to human-readable format
 */
export function formatTime(seconds: number): string {
  if (seconds < 0) return '0 min left';

  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    const remainingHours = hours % 24;
    return remainingHours > 0 ? `${days}d ${remainingHours}h left` : `${days}d left`;
  }

  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m left` : `${hours}h left`;
  }

  return `${minutes} min left`;
}

/**
 * Get color class based on time remaining (for budget sliders)
 */
export function getTimeBudgetColor(minutes: number): {
  bg: string;
  text: string;
  border: string;
} {
  if (minutes <= 120) {
    return {
      bg: 'bg-success-500',
      text: 'text-success-700 dark:text-success-400',
      border: 'border-success-500',
    };
  } else if (minutes <= 240) {
    return {
      bg: 'bg-accent-500',
      text: 'text-accent-700 dark:text-accent-400',
      border: 'border-accent-500',
    };
  } else {
    return {
      bg: 'bg-danger-500',
      text: 'text-danger-700 dark:text-danger-400',
      border: 'border-danger-500',
    };
  }
}

/**
 * Format date to readable string
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

  return formatDate(d);
}
