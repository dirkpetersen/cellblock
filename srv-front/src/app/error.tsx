'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Lock, AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16 bg-zinc-50 dark:bg-zinc-900">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="relative w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg">
            <Lock className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-700 p-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-danger-100 dark:bg-danger-900/30 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-10 h-10 text-danger-600 dark:text-danger-400" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-center mb-2">Something Went Wrong</h1>
          <p className="text-center text-zinc-600 dark:text-zinc-400 mb-6">
            We encountered an unexpected error. Don't worry, your data is safe.
          </p>

          {/* Error Details (in development) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-6 p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg">
              <p className="text-xs font-mono text-zinc-600 dark:text-zinc-400 break-all">
                {error.message}
              </p>
              {error.digest && (
                <p className="text-xs text-zinc-500 mt-2">Error ID: {error.digest}</p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-4">
            <button
              onClick={reset}
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-6 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors shadow-md"
            >
              <RefreshCw className="w-5 h-5" />
              Try Again
            </button>
            <Link
              href="/"
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-6 border-2 border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 font-semibold rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
            >
              <Home className="w-5 h-5" />
              Go Home
            </Link>
          </div>

          {/* Support */}
          <div className="mt-8 pt-8 border-t border-zinc-200 dark:border-zinc-700 text-center">
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
              Need help? Contact our support team
            </p>
            <a
              href="mailto:support@cellblock.app"
              className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
            >
              support@cellblock.app
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
