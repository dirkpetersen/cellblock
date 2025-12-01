/**
 * Progress Indicator Component for multi-step flows
 */

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ProgressStep {
  id: string;
  label: string;
  description?: string;
}

export interface ProgressIndicatorProps {
  steps: ProgressStep[];
  currentStep: number;
  className?: string;
}

export function ProgressIndicator({ steps, currentStep, className }: ProgressIndicatorProps) {
  return (
    <div className={cn('w-full', className)}>
      {/* Desktop View */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            const isLast = index === steps.length - 1;

            return (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  {/* Circle */}
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all',
                      isCompleted && 'bg-primary-600 text-white dark:bg-primary-500',
                      isCurrent &&
                        'bg-primary-600 text-white dark:bg-primary-500 ring-4 ring-primary-200 dark:ring-primary-900',
                      !isCompleted &&
                        !isCurrent &&
                        'bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400'
                    )}
                  >
                    {isCompleted ? <Check className="w-5 h-5" /> : <span>{index + 1}</span>}
                  </div>
                  {/* Label */}
                  <div className="mt-2 text-center">
                    <p
                      className={cn(
                        'text-sm font-medium',
                        isCompleted || isCurrent
                          ? 'text-zinc-900 dark:text-zinc-100'
                          : 'text-zinc-500 dark:text-zinc-500'
                      )}
                    >
                      {step.label}
                    </p>
                    {step.description && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-600 mt-0.5">
                        {step.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Line */}
                {!isLast && (
                  <div className="flex-1 h-0.5 mx-4 -mt-10">
                    <div
                      className={cn(
                        'h-full transition-all',
                        isCompleted
                          ? 'bg-primary-600 dark:bg-primary-500'
                          : 'bg-zinc-200 dark:bg-zinc-700'
                      )}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile View */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Step {currentStep + 1} of {steps.length}
          </p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{steps[currentStep].label}</p>
        </div>
        <div className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-600 dark:bg-primary-500 transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
