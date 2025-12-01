/**
 * Slider Component with color-coding
 */

import { InputHTMLAttributes, forwardRef } from 'react';
import { cn, getTimeBudgetColor } from '@/lib/utils';

export interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  showValue?: boolean;
  colorCoded?: boolean;
  helperText?: string;
}

export const Slider = forwardRef<HTMLInputElement, SliderProps>(
  (
    {
      className,
      label,
      value,
      min = 0,
      max = 300,
      step = 5,
      showValue = true,
      colorCoded = true,
      helperText,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const percentage = ((value - min) / (max - min)) * 100;
    const colors = colorCoded ? getTimeBudgetColor(value) : null;

    return (
      <div className="w-full">
        {(label || showValue) && (
          <div className="flex items-center justify-between mb-2">
            {label && (
              <label
                htmlFor={inputId}
                className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                {label}
              </label>
            )}
            {showValue && (
              <span
                className={cn(
                  'text-sm font-semibold',
                  colors ? colors.text : 'text-zinc-900 dark:text-zinc-100'
                )}
              >
                {value} min
              </span>
            )}
          </div>
        )}

        <div className="relative">
          <input
            ref={ref}
            type="range"
            id={inputId}
            value={value}
            min={min}
            max={max}
            step={step}
            className={cn(
              'w-full h-2 rounded-lg appearance-none cursor-pointer',
              'bg-zinc-200 dark:bg-zinc-700',
              'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
              '[&::-webkit-slider-thumb]:appearance-none',
              '[&::-webkit-slider-thumb]:w-5',
              '[&::-webkit-slider-thumb]:h-5',
              '[&::-webkit-slider-thumb]:rounded-full',
              '[&::-webkit-slider-thumb]:bg-white',
              '[&::-webkit-slider-thumb]:border-2',
              '[&::-webkit-slider-thumb]:shadow-md',
              '[&::-webkit-slider-thumb]:cursor-pointer',
              '[&::-webkit-slider-thumb]:transition-all',
              '[&::-moz-range-thumb]:w-5',
              '[&::-moz-range-thumb]:h-5',
              '[&::-moz-range-thumb]:rounded-full',
              '[&::-moz-range-thumb]:bg-white',
              '[&::-moz-range-thumb]:border-2',
              '[&::-moz-range-thumb]:shadow-md',
              '[&::-moz-range-thumb]:cursor-pointer',
              '[&::-moz-range-thumb]:transition-all',
              colors && `[&::-webkit-slider-thumb]:${colors.border}`,
              colors && `[&::-moz-range-thumb]:${colors.border}`,
              className
            )}
            style={{
              background: colors
                ? `linear-gradient(to right, ${
                    colors.bg === 'bg-success-500'
                      ? '#10B981'
                      : colors.bg === 'bg-accent-500'
                      ? '#F59E0B'
                      : '#F43F5E'
                  } 0%, ${
                    colors.bg === 'bg-success-500'
                      ? '#10B981'
                      : colors.bg === 'bg-accent-500'
                      ? '#F59E0B'
                      : '#F43F5E'
                  } ${percentage}%, rgb(228 228 231) ${percentage}%, rgb(228 228 231) 100%)`
                : undefined,
            }}
            {...props}
          />
        </div>

        {helperText && (
          <p className="mt-1.5 text-xs text-zinc-600 dark:text-zinc-400">{helperText}</p>
        )}
      </div>
    );
  }
);

Slider.displayName = 'Slider';
