import Link from 'next/link';
import { Lock, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
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
        <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-700 p-8 text-center">
          <div className="text-8xl font-bold text-primary-600 dark:text-primary-400 mb-4">404</div>
          <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/"
              className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-6 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors"
            >
              <Home className="w-5 h-5" />
              Go Home
            </Link>
            <button
              onClick={() => window.history.back()}
              className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-6 border-2 border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 font-semibold rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Go Back
            </button>
          </div>

          {/* Quick Links */}
          <div className="mt-8 pt-8 border-t border-zinc-200 dark:border-zinc-700">
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">Quick Links</p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <Link
                href="/login"
                className="text-primary-600 dark:text-primary-400 hover:underline"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="text-primary-600 dark:text-primary-400 hover:underline"
              >
                Sign Up
              </Link>
              <Link
                href="/dashboard"
                className="text-primary-600 dark:text-primary-400 hover:underline"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
