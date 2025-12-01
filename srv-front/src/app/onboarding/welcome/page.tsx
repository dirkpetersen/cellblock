'use client';

import { useRouter } from 'next/navigation';
import { Lock, Shield, Users, Clock } from 'lucide-react';
import { ProgressIndicator } from '@/components/ui/ProgressIndicator';

const ONBOARDING_STEPS = [
  { id: 'welcome', label: 'Welcome' },
  { id: 'time-budget', label: 'Time Budget' },
  { id: 'whitelist', label: 'Whitelist' },
  { id: 'warden', label: 'Warden' },
  { id: 'complete', label: 'Complete' },
];

export default function OnboardingWelcomePage() {
  const router = useRouter();

  const handleContinue = () => {
    router.push('/onboarding/time-budget');
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Progress Indicator */}
        <ProgressIndicator steps={ONBOARDING_STEPS} currentStep={0} className="mb-12" />

        {/* Main Content */}
        <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-700 p-8 md:p-12">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="relative w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg">
              <Lock className="w-10 h-10 text-white" />
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-center mb-4">Welcome to CellBlock!</h1>
          <p className="text-lg text-center text-zinc-600 dark:text-zinc-400 mb-12">
            Let's get you set up for digital wellbeing success. This will only take a few minutes.
          </p>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="text-center p-6 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="font-semibold mb-2">Time Budgets</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Set healthy limits for your daily screen time
              </p>
            </div>

            <div className="text-center p-6 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
              <div className="w-12 h-12 bg-success-100 dark:bg-success-900/30 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-success-600 dark:text-success-400" />
              </div>
              <h3 className="font-semibold mb-2">Smart Whitelist</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Choose which apps are healthy and always available
              </p>
            </div>

            <div className="text-center p-6 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
              <div className="w-12 h-12 bg-accent-100 dark:bg-accent-900/30 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-accent-600 dark:text-accent-400" />
              </div>
              <h3 className="font-semibold mb-2">Warden System</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Invite a friend for accountability and support
              </p>
            </div>
          </div>

          {/* Key Points */}
          <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-6 mb-8">
            <h3 className="font-semibold mb-3 text-primary-900 dark:text-primary-100">
              How CellBlock Works
            </h3>
            <ul className="space-y-2 text-sm text-primary-800 dark:text-primary-200">
              <li className="flex items-start gap-2">
                <span className="text-primary-600 dark:text-primary-400 mt-0.5">•</span>
                <span>
                  <strong>Default Deny:</strong> All apps are blocked by default. Only your
                  whitelisted apps are accessible.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-600 dark:text-primary-400 mt-0.5">•</span>
                <span>
                  <strong>Time Budgets:</strong> Set daily limits for recreational apps. Healthy
                  apps are always available.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-600 dark:text-primary-400 mt-0.5">•</span>
                <span>
                  <strong>Warden Accountability:</strong> Your warden can approve temporary access
                  and help you stay on track.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-600 dark:text-primary-400 mt-0.5">•</span>
                <span>
                  <strong>Cross-Platform:</strong> Works on mobile, desktop, and web to keep you
                  consistent.
                </span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleContinue}
              className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors shadow-md"
            >
              Let's Get Started
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
