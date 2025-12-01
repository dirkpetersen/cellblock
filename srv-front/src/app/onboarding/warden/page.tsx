'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Users, Mail, Shield } from 'lucide-react';
import { ProgressIndicator } from '@/components/ui/ProgressIndicator';
import { useInviteWarden } from '@/lib/hooks/useWarden';

const ONBOARDING_STEPS = [
  { id: 'welcome', label: 'Welcome' },
  { id: 'time-budget', label: 'Time Budget' },
  { id: 'whitelist', label: 'Whitelist' },
  { id: 'warden', label: 'Warden' },
  { id: 'complete', label: 'Complete' },
];

export default function OnboardingWardenPage() {
  const router = useRouter();
  const { mutateAsync: inviteWarden, isPending } = useInviteWarden();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleBack = () => {
    router.push('/onboarding/whitelist');
  };

  const handleContinue = async () => {
    if (!email) {
      router.push('/onboarding/complete');
      return;
    }

    setError('');
    try {
      await inviteWarden({ email, message: message || undefined });
      setSuccess(true);
      localStorage.setItem('onboarding_warden_invited', 'true');
      setTimeout(() => router.push('/onboarding/complete'), 2000);
    } catch (err) {
      setError((err as Error).message || 'Failed to send invitation');
    }
  };

  const handleSkip = () => {
    router.push('/onboarding/complete');
  };

  if (success) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <ProgressIndicator steps={ONBOARDING_STEPS} currentStep={3} className="mb-12" />

          <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-700 p-8 md:p-12 text-center">
            <div className="w-16 h-16 bg-success-100 dark:bg-success-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-success-600 dark:text-success-400" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Invitation Sent!</h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              We've sent an invitation to <strong>{email}</strong>. They'll be your warden once they
              accept.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Progress Indicator */}
        <ProgressIndicator steps={ONBOARDING_STEPS} currentStep={3} className="mb-12" />

        {/* Main Content */}
        <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-700 p-8 md:p-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Users className="w-8 h-8 text-accent-600 dark:text-accent-400" />
            <h1 className="text-3xl md:text-4xl font-bold text-center">Invite Your Warden</h1>
          </div>
          <p className="text-lg text-center text-zinc-600 dark:text-zinc-400 mb-8">
            Choose someone you trust to help keep you accountable (optional but highly recommended)
          </p>

          {/* Info Section */}
          <div className="bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-800 rounded-lg p-6 mb-8">
            <h3 className="font-semibold mb-3 text-accent-900 dark:text-accent-100">
              What is a Warden?
            </h3>
            <ul className="space-y-2 text-sm text-accent-800 dark:text-accent-200">
              <li className="flex items-start gap-2">
                <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  A trusted friend or family member who helps you stay on track with your digital
                  wellbeing goals
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Can approve or deny your requests for temporary access to blocked apps</span>
              </li>
              <li className="flex items-start gap-2">
                <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Must approve changes to your time budget and whitelist settings</span>
              </li>
              <li className="flex items-start gap-2">
                <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Can trigger emergency lockdown if they notice concerning usage patterns</span>
              </li>
            </ul>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-lg text-danger-700 dark:text-danger-300 text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <div className="space-y-6 mb-8">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Warden's Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 border border-zinc-300 dark:border-zinc-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100"
                  placeholder="warden@example.com"
                />
              </div>
              <p className="mt-1.5 text-xs text-zinc-500">
                They'll receive an email invitation to become your warden
              </p>
            </div>

            {/* Optional Message */}
            <div>
              <label htmlFor="message" className="block text-sm font-medium mb-2">
                Personal Message (Optional)
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 border border-zinc-300 dark:border-zinc-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100"
                placeholder="Hey! I'm using CellBlock to improve my digital wellbeing. Would you be my accountability partner?"
              />
              <p className="mt-1.5 text-xs text-zinc-500">Add a personal note to your invitation</p>
            </div>
          </div>

          {/* Alternative Option */}
          <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-4 mb-8">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              <strong>Not ready to invite someone?</strong> You can skip this step and add a warden
              later from your dashboard. However, without a warden, you'll be able to modify your
              own settings, which may reduce accountability.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleBack}
              className="sm:w-auto px-6 py-3 border-2 border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 font-semibold rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
            <button
              onClick={handleSkip}
              className="sm:w-auto px-6 py-3 text-zinc-600 dark:text-zinc-400 font-medium hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              Skip for now
            </button>
            <button
              onClick={handleContinue}
              disabled={isPending}
              className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-zinc-400 text-white font-semibold rounded-lg transition-colors shadow-md flex items-center justify-center gap-2 disabled:cursor-not-allowed"
            >
              {isPending ? 'Sending...' : email ? 'Send Invitation' : 'Continue'}
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
