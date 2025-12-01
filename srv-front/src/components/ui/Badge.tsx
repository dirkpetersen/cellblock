/**
 * Badge Component
 */

import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'info' | 'primary';
  size?: 'sm' | 'md' | 'lg';
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-full';

    const variants = {
      default: 'bg-secondary-100 text-secondary-700 dark:bg-secondary-800 dark:text-secondary-300',
      success: 'bg-success-100 text-success-700 dark:bg-success-900 dark:text-success-300',
      danger: 'bg-danger-100 text-danger-700 dark:bg-danger-900 dark:text-danger-300',
      warning: 'bg-accent-100 text-accent-700 dark:bg-accent-900 dark:text-accent-300',
      info: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      primary: 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300',
    };

    const sizes = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-1 text-sm',
      lg: 'px-3 py-1.5 text-base',
    };

    return (
      <span
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
