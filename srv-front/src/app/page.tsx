import Link from 'next/link';
import { Lock, Shield, Users, Clock } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Logo */}
          <div className="flex justify-center">
            <div className="relative w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center shadow-lg">
              <Lock className="w-10 h-10 text-white" />
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold text-balance bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-primary-800 dark:from-primary-400 dark:to-primary-600">
              CellBlock
            </h1>
            <p className="text-xl md:text-2xl text-zinc-600 dark:text-zinc-400 text-balance">
              Digital Wellbeing with High-Accountability
            </p>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <div className="p-6 bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700">
              <Shield className="w-8 h-8 text-primary-600 dark:text-primary-400 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Default Deny</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Block everything by default. Only allow essential apps and websites.
              </p>
            </div>

            <div className="p-6 bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700">
              <Clock className="w-8 h-8 text-primary-600 dark:text-primary-400 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Shared Budget</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Time usage syncs across all devices. 30 min on iPhone = 30 min on laptop.
              </p>
            </div>

            <div className="p-6 bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700">
              <Users className="w-8 h-8 text-primary-600 dark:text-primary-400 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Friend Enforcement</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                A trusted Warden approves changes and can grant emergency time.
              </p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-12">
            <Link
              href="/signup"
              className="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg shadow-md transition-colors"
            >
              Get Started
            </Link>
            <Link
              href="/login"
              className="px-8 py-3 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-semibold rounded-lg border border-zinc-300 dark:border-zinc-600 shadow-sm transition-colors"
            >
              Sign In
            </Link>
          </div>

          {/* Footer */}
          <div className="mt-16 text-sm text-zinc-500 dark:text-zinc-400">
            <p>Open Source | MIT License</p>
            <Link
              href="https://github.com/dirkpetersen/cellblock"
              className="text-primary-600 dark:text-primary-400 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              View on GitHub
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
