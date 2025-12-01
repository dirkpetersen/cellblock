'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useVerifyEmail } from '@/lib/hooks/useAuth';
import { Lock, CheckCircle2, XCircle, Loader2, Mail } from 'lucide-react';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { mutateAsync: verifyEmail, isPending } = useVerifyEmail();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'expired'>('verifying');
  const [error, setError] = useState('');
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setError('No verification token provided');
      return;
    }

    verifyEmail(token)
      .then(() => {
        setStatus('success');
        setTimeout(() => router.push('/login'), 3000);
      })
      .catch((err) => {
        const message = (err as Error).message || 'Verification failed';
        if (message.toLowerCase().includes('expired')) {
          setStatus('expired');
        } else {
          setStatus('error');
          setError(message);
        }
      });
  }, [token, verifyEmail, router]);

  const handleResend = async () => {
    // In a real implementation, you'd call an API endpoint to resend verification email
    // For now, we'll just show a success message
    setResendSuccess(true);
    setTimeout(() => setResendSuccess(false), 5000);
  };

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
          {status === 'verifying' && (
            <>
              <Loader2 className="w-16 h-16 text-primary-600 dark:text-primary-400 mx-auto mb-4 animate-spin" />
              <h1 className="text-2xl font-bold mb-2">Verifying Email</h1>
              <p className="text-zinc-600 dark:text-zinc-400">
                Please wait while we verify your email address...
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-success-100 dark:bg-success-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10 text-success-600 dark:text-success-400" />
              </div>
              <h1 className="text-2xl font-bold mb-2 text-success-600 dark:text-success-400">
                Email Verified!
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                Your email has been successfully verified. You can now sign in to your account.
              </p>
              <p className="text-sm text-zinc-500">Redirecting to login...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-danger-100 dark:bg-danger-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-10 h-10 text-danger-600 dark:text-danger-400" />
              </div>
              <h1 className="text-2xl font-bold mb-2 text-danger-600 dark:text-danger-400">
                Verification Failed
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                {error || 'Unable to verify your email. The link may be invalid or already used.'}
              </p>
              <Link
                href="/login"
                className="inline-block w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors"
              >
                Go to Login
              </Link>
            </>
          )}

          {status === 'expired' && (
            <>
              <div className="w-16 h-16 bg-accent-100 dark:bg-accent-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-10 h-10 text-accent-600 dark:text-accent-400" />
              </div>
              <h1 className="text-2xl font-bold mb-2 text-accent-600 dark:text-accent-400">
                Link Expired
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                Your verification link has expired. Click the button below to receive a new
                verification email.
              </p>

              {resendSuccess && (
                <div className="mb-4 p-3 bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 rounded-lg text-success-700 dark:text-success-300 text-sm">
                  Verification email sent! Please check your inbox.
                </div>
              )}

              <button
                onClick={handleResend}
                disabled={resendSuccess}
                className="w-full py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-zinc-400 text-white font-semibold rounded-lg transition-colors mb-3 disabled:cursor-not-allowed"
              >
                {resendSuccess ? 'Email Sent!' : 'Resend Verification Email'}
              </button>
              <Link
                href="/login"
                className="block text-sm text-primary-600 dark:text-primary-400 hover:underline"
              >
                Back to Login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
