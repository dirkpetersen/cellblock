import Link from 'next/link';
import { Lock, ArrowLeft, Shield } from 'lucide-react';

export default function PrivacyPolicyPage() {
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
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">Privacy Policy</h1>
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
            <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              At CellBlock, we take your privacy seriously. This Privacy Policy explains how we
              collect, use, disclose, and safeguard your information when you use our digital
              wellbeing application and services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">2. Information We Collect</h2>

            <h3 className="text-xl font-semibold mb-3 mt-6">2.1 Account Information</h3>
            <ul className="list-disc pl-6 text-zinc-600 dark:text-zinc-400 space-y-2">
              <li>Email address</li>
              <li>Display name (optional)</li>
              <li>Password (encrypted)</li>
              <li>Profile preferences</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">2.2 Usage Data</h3>
            <ul className="list-disc pl-6 text-zinc-600 dark:text-zinc-400 space-y-2">
              <li>Application usage statistics (time spent, frequency)</li>
              <li>Whitelist and time budget settings</li>
              <li>Access requests and approval history</li>
              <li>Break glass events and comments</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">2.3 Device Information</h3>
            <ul className="list-disc pl-6 text-zinc-600 dark:text-zinc-400 space-y-2">
              <li>Device type and operating system</li>
              <li>Device fingerprint for authentication</li>
              <li>App version and configuration</li>
              <li>IP address and general location (for security)</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">2.4 Warden Relationship Data</h3>
            <ul className="list-disc pl-6 text-zinc-600 dark:text-zinc-400 space-y-2">
              <li>Warden email addresses</li>
              <li>Invitation and acceptance status</li>
              <li>Communication between inmates and wardens</li>
              <li>Approval decisions and comments</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">3. How We Use Your Information</h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              We use collected information to:
            </p>
            <ul className="list-disc pl-6 text-zinc-600 dark:text-zinc-400 space-y-2">
              <li>Provide and maintain the CellBlock service</li>
              <li>Enforce time budgets and whitelist restrictions</li>
              <li>Facilitate warden-inmate accountability relationships</li>
              <li>Generate usage reports and analytics</li>
              <li>Improve service functionality and user experience</li>
              <li>Communicate important updates and notifications</li>
              <li>Detect and prevent fraudulent or abusive behavior</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">4. Information Sharing</h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              We do not sell your personal information. We may share information:
            </p>
            <ul className="list-disc pl-6 text-zinc-600 dark:text-zinc-400 space-y-2">
              <li>
                <strong>With Your Wardens:</strong> Usage statistics and settings are shared with
                wardens you've invited for accountability purposes
              </li>
              <li>
                <strong>Service Providers:</strong> With trusted third parties who assist in
                operating our service (hosting, analytics, email delivery)
              </li>
              <li>
                <strong>Legal Requirements:</strong> When required by law or to protect our rights
                and safety
              </li>
              <li>
                <strong>Business Transfers:</strong> In connection with a merger, acquisition, or
                sale of assets
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">5. Data Security</h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              We implement industry-standard security measures to protect your data:
            </p>
            <ul className="list-disc pl-6 text-zinc-600 dark:text-zinc-400 space-y-2">
              <li>Encryption in transit (TLS/SSL) and at rest</li>
              <li>Secure password hashing (bcrypt)</li>
              <li>Regular security audits and updates</li>
              <li>Access controls and authentication mechanisms</li>
              <li>Automated backup systems</li>
            </ul>
            <p className="text-zinc-600 dark:text-zinc-400 mt-4">
              However, no method of transmission over the internet is 100% secure. We cannot
              guarantee absolute security.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">6. Data Retention</h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              We retain your information for as long as your account is active or as needed to
              provide services. Usage logs are retained for:
            </p>
            <ul className="list-disc pl-6 text-zinc-600 dark:text-zinc-400 space-y-2">
              <li>Detailed logs: 90 days</li>
              <li>Aggregated statistics: Indefinitely (anonymized)</li>
              <li>Account data: Until account deletion (with 30-day grace period)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">7. Your Privacy Rights</h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 text-zinc-600 dark:text-zinc-400 space-y-2">
              <li>Access your personal data</li>
              <li>Correct inaccurate information</li>
              <li>Request deletion of your account and data</li>
              <li>Export your data in a portable format</li>
              <li>Opt out of non-essential communications</li>
              <li>Revoke warden access at any time</li>
            </ul>
            <p className="text-zinc-600 dark:text-zinc-400 mt-4">
              To exercise these rights, contact us at{' '}
              <a
                href="mailto:privacy@cellblock.app"
                className="text-primary-600 dark:text-primary-400 hover:underline"
              >
                privacy@cellblock.app
              </a>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">8. Children's Privacy</h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              CellBlock is not intended for children under 13. We do not knowingly collect
              information from children. For users aged 13-17, we recommend parental oversight
              through the warden system.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">9. International Users</h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              Your information may be transferred to and processed in countries other than your own.
              We ensure appropriate safeguards are in place for international data transfers.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">10. Cookies and Tracking</h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              We use cookies and similar technologies for:
            </p>
            <ul className="list-disc pl-6 text-zinc-600 dark:text-zinc-400 space-y-2">
              <li>Authentication and session management</li>
              <li>User preferences and settings</li>
              <li>Analytics and performance monitoring</li>
              <li>Security and fraud prevention</li>
            </ul>
            <p className="text-zinc-600 dark:text-zinc-400 mt-4">
              You can control cookies through your browser settings, but this may limit service
              functionality.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">11. Changes to This Policy</h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              We may update this Privacy Policy periodically. Significant changes will be
              communicated via email or in-app notification. The "Last updated" date at the top
              reflects the most recent revision.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">12. Contact Us</h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              For questions about this Privacy Policy or our data practices:
            </p>
            <p className="text-zinc-600 dark:text-zinc-400">
              Email:{' '}
              <a
                href="mailto:privacy@cellblock.app"
                className="text-primary-600 dark:text-primary-400 hover:underline"
              >
                privacy@cellblock.app
              </a>
            </p>
          </section>
        </div>

        {/* Footer Links */}
        <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm">
          <Link href="/terms" className="text-primary-600 dark:text-primary-400 hover:underline">
            Terms of Service
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
