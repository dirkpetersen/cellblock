'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Shield, Smartphone, Check } from 'lucide-react';
import { ProgressIndicator } from '@/components/ui/ProgressIndicator';

const ONBOARDING_STEPS = [
  { id: 'welcome', label: 'Welcome' },
  { id: 'time-budget', label: 'Time Budget' },
  { id: 'whitelist', label: 'Whitelist' },
  { id: 'warden', label: 'Warden' },
  { id: 'complete', label: 'Complete' },
];

// Sample healthy apps - in a real implementation, these would come from the API
const SAMPLE_HEALTHY_APPS = [
  { id: '1', name: 'Phone', category: 'Communication', isHealthy: true },
  { id: '2', name: 'Messages', category: 'Communication', isHealthy: true },
  { id: '3', name: 'Calendar', category: 'Productivity', isHealthy: true },
  { id: '4', name: 'Notes', category: 'Productivity', isHealthy: true },
  { id: '5', name: 'Clock', category: 'Utilities', isHealthy: true },
  { id: '6', name: 'Maps', category: 'Navigation', isHealthy: true },
  { id: '7', name: 'Camera', category: 'Utilities', isHealthy: true },
  { id: '8', name: 'Settings', category: 'System', isHealthy: true },
  { id: '9', name: 'Email', category: 'Communication', isHealthy: true },
  { id: '10', name: 'Files', category: 'Utilities', isHealthy: true },
  { id: '11', name: 'Calculator', category: 'Utilities', isHealthy: true },
  { id: '12', name: 'Weather', category: 'Information', isHealthy: true },
];

export default function OnboardingWhitelistPage() {
  const router = useRouter();
  const [enabledApps, setEnabledApps] = useState<Set<string>>(
    new Set(SAMPLE_HEALTHY_APPS.map((app) => app.id))
  );
  const [saving, setSaving] = useState(false);

  const handleBack = () => {
    router.push('/onboarding/time-budget');
  };

  const handleContinue = async () => {
    setSaving(true);
    try {
      // Save enabled apps to localStorage for now
      // In a real implementation, this would be saved via API
      localStorage.setItem('onboarding_whitelist', JSON.stringify(Array.from(enabledApps)));

      router.push('/onboarding/warden');
    } catch (error) {
      console.error('Failed to save whitelist:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    router.push('/onboarding/warden');
  };

  const toggleApp = (appId: string) => {
    setEnabledApps((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(appId)) {
        newSet.delete(appId);
      } else {
        newSet.add(appId);
      }
      return newSet;
    });
  };

  const enableAll = () => {
    setEnabledApps(new Set(SAMPLE_HEALTHY_APPS.map((app) => app.id)));
  };

  const disableAll = () => {
    setEnabledApps(new Set());
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Progress Indicator */}
        <ProgressIndicator steps={ONBOARDING_STEPS} currentStep={2} className="mb-12" />

        {/* Main Content */}
        <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-700 p-8 md:p-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-success-600 dark:text-success-400" />
            <h1 className="text-3xl md:text-4xl font-bold text-center">Review Healthy Apps</h1>
          </div>
          <p className="text-lg text-center text-zinc-600 dark:text-zinc-400 mb-8">
            These are essential apps that will always be available, regardless of your time budget.
          </p>

          {/* Info Banner */}
          <div className="bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <Smartphone className="w-5 h-5 text-success-600 dark:text-success-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-success-800 dark:text-success-200">
                <strong>Healthy apps</strong> are always accessible with no time limit. These
                typically include communication, productivity, and essential utilities. You can
                customize this list anytime.
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={enableAll}
              className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
            >
              Enable All
            </button>
            <button
              onClick={disableAll}
              className="text-sm text-zinc-600 dark:text-zinc-400 hover:underline"
            >
              Disable All
            </button>
            <div className="flex-1" />
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              {enabledApps.size} of {SAMPLE_HEALTHY_APPS.length} enabled
            </div>
          </div>

          {/* Apps Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8 max-h-96 overflow-y-auto border border-zinc-200 dark:border-zinc-700 rounded-lg p-4">
            {SAMPLE_HEALTHY_APPS.map((app) => {
              const isEnabled = enabledApps.has(app.id);
              return (
                <button
                  key={app.id}
                  onClick={() => toggleApp(app.id)}
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left ${
                    isEnabled
                      ? 'border-success-500 bg-success-50 dark:bg-success-900/20'
                      : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                      isEnabled
                        ? 'border-success-500 bg-success-500'
                        : 'border-zinc-300 dark:border-zinc-600'
                    }`}
                  >
                    {isEnabled && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{app.name}</div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                      {app.category}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Note */}
          <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-4 mb-8">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              <strong>Note:</strong> After onboarding, you can add more apps to your whitelist. All
              other apps will be blocked by default until you explicitly whitelist them or your
              warden approves access.
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
