import Link from 'next/link';
import { Lock, ArrowLeft } from 'lucide-react';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:underline mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center shadow-md">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">Terms of Service</h1>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                Last updated:{' '}
                {new Date().toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-700 p-8 md:p-12 prose prose-zinc dark:prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              By accessing and using CellBlock ("the Service"), you accept and agree to be bound by
              the terms and provision of this agreement. If you do not agree to these terms, please
              do not use the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">2. Description of Service</h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              CellBlock is a digital wellbeing application that helps users manage their screen time
              through:
            </p>
            <ul className="list-disc pl-6 text-zinc-600 dark:text-zinc-400 space-y-2">
              <li>Time budget management for recreational applications</li>
              <li>Default-deny whitelisting system for application access</li>
              <li>Warden-based accountability system</li>
              <li>Cross-platform usage tracking and enforcement</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">3. User Responsibilities</h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">You agree to:</p>
            <ul className="list-disc pl-6 text-zinc-600 dark:text-zinc-400 space-y-2">
              <li>Provide accurate and complete information during registration</li>
              <li>Maintain the security of your account credentials</li>
              <li>Use the Service only for lawful purposes</li>
              <li>Respect the privacy and rights of other users</li>
              <li>Not attempt to circumvent or bypass the Service's enforcement mechanisms</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">4. Warden System</h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              The warden system is designed to provide accountability. By inviting a warden, you
              grant them the ability to:
            </p>
            <ul className="list-disc pl-6 text-zinc-600 dark:text-zinc-400 space-y-2">
              <li>Approve or deny access requests</li>
              <li>View your usage statistics</li>
              <li>Modify your time budgets and settings</li>
              <li>Trigger emergency lockdowns</li>
            </ul>
            <p className="text-zinc-600 dark:text-zinc-400 mt-4">
              You may remove a warden at any time through the dashboard.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">5. Data Collection and Privacy</h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              We collect and process data as described in our{' '}
              <Link
                href="/privacy"
                className="text-primary-600 dark:text-primary-400 hover:underline"
              >
                Privacy Policy
              </Link>
              . This includes usage data, device information, and application access patterns
              necessary for the Service to function.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">6. Service Availability</h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              We strive to provide consistent service availability but cannot guarantee
              uninterrupted access. The Service may be temporarily unavailable due to maintenance,
              updates, or circumstances beyond our control.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">7. Limitation of Liability</h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              CellBlock is provided "as is" without warranties of any kind. We are not liable for:
            </p>
            <ul className="list-disc pl-6 text-zinc-600 dark:text-zinc-400 space-y-2">
              <li>Any damages resulting from use or inability to use the Service</li>
              <li>Loss of data or access to applications</li>
              <li>Actions taken by wardens on your behalf</li>
              <li>Emergency situations where access to critical applications may be needed</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">8. Break Glass Feature</h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              The "break glass" emergency override feature is provided for genuine emergencies.
              Abuse of this feature may result in account suspension or termination.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">9. Termination</h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              We reserve the right to suspend or terminate your account if you violate these terms
              or engage in abusive behavior. You may delete your account at any time through the
              account settings.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">10. Changes to Terms</h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              We may update these terms from time to time. Significant changes will be communicated
              via email or in-app notification. Continued use of the Service after changes
              constitutes acceptance of the new terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">11. Contact Information</h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              For questions about these terms, please contact us at:
            </p>
            <p className="text-zinc-600 dark:text-zinc-400">
              Email:{' '}
              <a
                href="mailto:legal@cellblock.app"
                className="text-primary-600 dark:text-primary-400 hover:underline"
              >
                legal@cellblock.app
              </a>
            </p>
          </section>
        </div>

        {/* Footer Links */}
        <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm">
          <Link href="/privacy" className="text-primary-600 dark:text-primary-400 hover:underline">
            Privacy Policy
          </Link>
          <span className="text-zinc-300 dark:text-zinc-700">•</span>
          <Link href="/login" className="text-primary-600 dark:text-primary-400 hover:underline">
            Login
          </Link>
          <span className="text-zinc-300 dark:text-zinc-700">•</span>
          <Link href="/signup" className="text-primary-600 dark:text-primary-400 hover:underline">
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
