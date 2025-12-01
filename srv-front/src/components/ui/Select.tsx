/**
 * Select Component
 */

import { SelectHTMLAttributes, forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helperText, options, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={inputId}
            className={cn(
              'w-full px-4 py-2 pr-10 rounded-lg border transition-all appearance-none',
              'bg-white dark:bg-zinc-800',
              'text-zinc-900 dark:text-zinc-100',
              'focus:outline-none focus:ring-2 focus:ring-offset-1',
              error
                ? 'border-danger-500 focus:ring-danger-500'
                : 'border-zinc-300 dark:border-zinc-600 focus:ring-primary-500',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              className
            )}
            {...props}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400 pointer-events-none" />
        </div>
        {error && <p className="mt-1.5 text-sm text-danger-600 dark:text-danger-400">{error}</p>}
        {helperText && !error && (
          <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400">{helperText}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
