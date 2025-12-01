/**
 * Toast Notification System
 */

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (toast: Omit<Toast, 'id'>) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(7);
    const newToast: Toast = { ...toast, id };

    setToasts((prev) => [...prev, newToast]);

    // Auto-hide after duration (default 5s)
    const duration = toast.duration ?? 5000;
    if (duration > 0) {
      setTimeout(() => {
        hideToast(id);
      }, duration);
    }
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {typeof window !== 'undefined' &&
        createPortal(<ToastContainer toasts={toasts} onClose={hideToast} />, document.body)}
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, onClose }: { toasts: Toast[]; onClose: (id: string) => void }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: (id: string) => void }) {
  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
    warning: AlertTriangle,
  };

  const styles = {
    success: {
      bg: 'bg-success-50 dark:bg-success-900/30',
      border: 'border-success-500',
      icon: 'text-success-500',
      text: 'text-success-900 dark:text-success-100',
    },
    error: {
      bg: 'bg-danger-50 dark:bg-danger-900/30',
      border: 'border-danger-500',
      icon: 'text-danger-500',
      text: 'text-danger-900 dark:text-danger-100',
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-900/30',
      border: 'border-blue-500',
      icon: 'text-blue-500',
      text: 'text-blue-900 dark:text-blue-100',
    },
    warning: {
      bg: 'bg-accent-50 dark:bg-accent-900/30',
      border: 'border-accent-500',
      icon: 'text-accent-500',
      text: 'text-accent-900 dark:text-accent-100',
    },
  };

  const Icon = icons[toast.type];
  const style = styles[toast.type];

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg border-l-4 shadow-lg',
        'animate-in slide-in-from-right duration-300',
        style.bg,
        style.border
      )}
    >
      <Icon className={cn('h-5 w-5 mt-0.5 flex-shrink-0', style.icon)} />
      <div className="flex-1 min-w-0">
        <p className={cn('font-semibold text-sm', style.text)}>{toast.title}</p>
        {toast.message && (
          <p className={cn('text-sm mt-1', style.text, 'opacity-90')}>{toast.message}</p>
        )}
      </div>
      <button
        onClick={() => onClose(toast.id)}
        className={cn(
          'flex-shrink-0 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors'
        )}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
