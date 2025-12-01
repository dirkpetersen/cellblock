'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { ProgressIndicator } from '@/components/ui/ProgressIndicator';
import { Slider } from '@/components/ui/Slider';

const ONBOARDING_STEPS = [
  { id: 'welcome', label: 'Welcome' },
  { id: 'time-budget', label: 'Time Budget' },
  { id: 'whitelist', label: 'Whitelist' },
  { id: 'warden', label: 'Warden' },
  { id: 'complete', label: 'Complete' },
];

export default function OnboardingTimeBudgetPage() {
  const router = useRouter();
  const [dailyBudget, setDailyBudget] = useState(120); // Default 2 hours
  const [saving, setSaving] = useState(false);

  const handleBack = () => {
    router.push('/onboarding/welcome');
  };

  const handleContinue = async () => {
    setSaving(true);
    try {
      // Save time budget to localStorage for now
      // In a real implementation, this would be saved via API
      localStorage.setItem('onboarding_time_budget', dailyBudget.toString());

      router.push('/onboarding/whitelist');
    } catch (error) {
      console.error('Failed to save time budget:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    router.push('/onboarding/whitelist');
  };

  const hours = Math.floor(dailyBudget / 60);
  const minutes = dailyBudget % 60;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Progress Indicator */}
        <ProgressIndicator steps={ONBOARDING_STEPS} currentStep={1} className="mb-12" />

        {/* Main Content */}
        <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-700 p-8 md:p-12">
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Set Your Daily Time Budget
          </h1>
          <p className="text-lg text-center text-zinc-600 dark:text-zinc-400 mb-12">
            How much time do you want to spend on recreational apps each day?
          </p>

          {/* Time Display */}
          <div className="text-center mb-8">
            <div className="inline-block bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl px-8 py-6 shadow-lg">
              <div className="text-5xl md:text-6xl font-bold text-white mb-2">
                {hours > 0 && `${hours}h`} {minutes}m
              </div>
              <div className="text-primary-100 text-sm">per day</div>
            </div>
          </div>

          {/* Slider */}
          <div className="mb-12">
            <Slider
              value={dailyBudget}
              onChange={(e) => setDailyBudget(parseInt(e.target.value))}
              min={15}
              max={480}
              step={15}
              colorCoded={true}
              showValue={false}
            />
          </div>

          {/* Info */}
          <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-6 mb-8">
            <h3 className="font-semibold mb-3">About Time Budgets</h3>
            <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
              <li className="flex items-start gap-2">
                <span className="text-primary-600 dark:text-primary-400 mt-0.5">•</span>
                <span>
                  This limit applies to <strong>recreational apps</strong> like social media, games,
                  and entertainment.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-600 dark:text-primary-400 mt-0.5">•</span>
                <span>
                  <strong>Healthy apps</strong> (productivity, education, utilities) are always
                  available with no time limit.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-600 dark:text-primary-400 mt-0.5">•</span>
                <span>
                  Your time budget resets daily at midnight. Unused time doesn't roll over.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-600 dark:text-primary-400 mt-0.5">•</span>
                <span>
                  You can adjust this later, but changes require warden approval if you have one.
                </span>
              </li>
            </ul>
          </div>

          {/* Recommendations */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <button
              onClick={() => setDailyBudget(60)}
              className={`p-4 rounded-lg border-2 transition-all ${
                dailyBudget === 60
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
              }`}
            >
              <div className="font-semibold mb-1">Focused</div>
              <div className="text-2xl font-bold text-primary-600 dark:text-primary-400 mb-1">
                1h
              </div>
              <div className="text-xs text-zinc-600 dark:text-zinc-400">Minimal distractions</div>
            </button>

            <button
              onClick={() => setDailyBudget(120)}
              className={`p-4 rounded-lg border-2 transition-all ${
                dailyBudget === 120
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
              }`}
            >
              <div className="font-semibold mb-1">Balanced</div>
              <div className="text-2xl font-bold text-primary-600 dark:text-primary-400 mb-1">
                2h
              </div>
              <div className="text-xs text-zinc-600 dark:text-zinc-400">Recommended</div>
            </button>

            <button
              onClick={() => setDailyBudget(180)}
              className={`p-4 rounded-lg border-2 transition-all ${
                dailyBudget === 180
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
              }`}
            >
              <div className="font-semibold mb-1">Relaxed</div>
              <div className="text-2xl font-bold text-primary-600 dark:text-primary-400 mb-1">
                3h
              </div>
              <div className="text-xs text-zinc-600 dark:text-zinc-400">More flexible</div>
            </button>
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
              disabled={saving}
              className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-zinc-400 text-white font-semibold rounded-lg transition-colors shadow-md flex items-center justify-center gap-2 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Continue'}
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
