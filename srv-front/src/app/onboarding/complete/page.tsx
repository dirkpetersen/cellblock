'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, CheckCircle2, Sparkles } from 'lucide-react';
import { ProgressIndicator } from '@/components/ui/ProgressIndicator';

const ONBOARDING_STEPS = [
  { id: 'welcome', label: 'Welcome' },
  { id: 'time-budget', label: 'Time Budget' },
  { id: 'whitelist', label: 'Whitelist' },
  { id: 'warden', label: 'Warden' },
  { id: 'complete', label: 'Complete' },
];

export default function OnboardingCompletePage() {
  const router = useRouter();

  useEffect(() => {
    // Mark onboarding as complete in localStorage
    localStorage.setItem('onboarding_complete', 'true');
  }, []);

  const handleGoToDashboard = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Progress Indicator */}
        <ProgressIndicator steps={ONBOARDING_STEPS} currentStep={4} className="mb-12" />

        {/* Main Content */}
        <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-700 p-8 md:p-12 text-center">
          {/* Logo with animation */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl blur-xl opacity-50 animate-pulse" />
              <div className="relative w-24 h-24 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg">
                <Lock className="w-12 h-12 text-white" />
              </div>
            </div>
          </div>

          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-accent-500 animate-pulse" />
              <Sparkles className="absolute -bottom-2 -left-2 w-5 h-5 text-accent-500 animate-pulse" style={{ animationDelay: '0.5s' }} />
              <div className="w-20 h-20 bg-success-100 dark:bg-success-900/30 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-12 h-12 text-success-600 dark:text-success-400" />
              </div>
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold mb-4">You're All Set!</h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-8">
            Welcome to your digital wellbeing journey with CellBlock
          </p>

          {/* Summary */}
          <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-6 mb-8 text-left max-w-md mx-auto">
            <h3 className="font-semibold mb-4 text-center">What's Next?</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-primary-600 dark:text-primary-400 font-semibold text-xs">
                    1
                  </span>
                </div>
                <span className="text-zinc-600 dark:text-zinc-400">
                  <strong className="text-zinc-900 dark:text-zinc-100">Install the app</strong> on
                  your mobile device to start blocking distractions
                </span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-primary-600 dark:text-primary-400 font-semibold text-xs">
                    2
                  </span>
                </div>
                <span className="text-zinc-600 dark:text-zinc-400">
                  <strong className="text-zinc-900 dark:text-zinc-100">Review your settings</strong>{' '}
                  and customize your whitelist as needed
                </span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-primary-600 dark:text-primary-400 font-semibold text-xs">
                    3
                  </span>
                </div>
                <span className="text-zinc-600 dark:text-zinc-400">
                  <strong className="text-zinc-900 dark:text-zinc-100">Track your progress</strong>{' '}
                  and celebrate your wins in the dashboard
                </span>
              </li>
            </ul>
          </div>

          {/* Key Reminders */}
          <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4 mb-8 text-left max-w-md mx-auto">
            <p className="text-sm text-primary-800 dark:text-primary-200">
              <strong>Remember:</strong> CellBlock works best when you're honest with yourself
              and lean on your warden for support. We're here to help you build healthier digital
              habits, not punish you.
            </p>
          </div>

          {/* Action Button */}
          <button
            onClick={handleGoToDashboard}
            className="w-full max-w-md mx-auto py-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors shadow-lg text-lg"
          >
            Go to Dashboard
          </button>

          {/* Support Links */}
          <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm">
            <a
              href="https://docs.cellblock.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 dark:text-primary-400 hover:underline"
            >
              View Documentation
            </a>
            <span className="text-zinc-300 dark:text-zinc-700">•</span>
            <a
              href="https://support.cellblock.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 dark:text-primary-400 hover:underline"
            >
              Get Help
            </a>
            <span className="text-zinc-300 dark:text-zinc-700">•</span>
            <a
              href="https://community.cellblock.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 dark:text-primary-400 hover:underline"
            >
              Join Community
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
