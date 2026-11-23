import React from 'react';
import { Metadata } from 'next';
import { ShieldCheck, Lock, EyeOff } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy - OmniTools',
  description:
    'Read the official OmniTools Privacy Policy. Detailed explanation of our 100% client-side zero-upload data architecture and Google AdSense cookie guidelines.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 text-neutral-800 dark:text-neutral-200">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
          <ShieldCheck className="w-3.5 h-3.5" /> Zero Data Storage Guarantee
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-neutral-950 dark:text-white tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-xs text-neutral-500">
          Last updated: November 2026
        </p>
      </div>

      <div className="p-6 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-start gap-4">
        <Lock className="w-6 h-6 text-emerald-600 mt-1 shrink-0" />
        <div className="text-xs leading-relaxed text-emerald-900 dark:text-emerald-200">
          <strong className="block text-sm font-bold mb-1">Our Core Commitment to Your Privacy</strong>
          OmniTools operates with a zero-database, zero-server-upload architecture. When you upload a PDF, image, audio file, or text payload into any of our 1,005 micro-tools, that file is processed strictly inside your device&apos;s local web browser memory. Your files and data never touch our servers or any third-party clouds.
        </div>
      </div>

      <div className="space-y-6 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-neutral-900 dark:text-white">1. Information We Do Not Collect</h2>
          <p>
            Because we require zero user accounts and maintain no user databases, we do not collect:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Names, home addresses, or phone numbers</li>
            <li>Uploaded PDF files, images, documents, or video files</li>
            <li>Calculated financial inputs (salaries, loan amounts, GST figures)</li>
            <li>Plaintext passwords, cryptographic keys, or generated secrets</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-neutral-900 dark:text-white">2. Local Storage Usage</h2>
          <p>
            We use your browser&apos;s standard <code>localStorage</code> solely for convenience features:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Saving your list of &ldquo;Recently Used Tools&rdquo; and &ldquo;Saved Favorites&rdquo; locally on your computer.</li>
            <li>Remembering your Cookie Consent preference.</li>
          </ul>
          <p>
            This data never leaves your browser and can be cleared at any time through your browser settings.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-neutral-900 dark:text-white">3. Google AdSense &amp; Third-Party Cookies</h2>
          <p>
            We partner with Google AdSense to serve advertisements when you visit our website. Google, as a third-party vendor, uses cookies to serve ads based on your prior visits to our website or other websites on the internet.
          </p>
          <p>
            Google&apos;s use of advertising cookies enables it and its partners to serve ads to you based on your visit to our sites and/or other sites on the Internet. Users may opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline">Google Ads Settings</a>.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-neutral-900 dark:text-white">4. GDPR and CCPA Compliance</h2>
          <p>
            Under GDPR (General Data Protection Regulation) and CCPA (California Consumer Privacy Act), users have the right to access, delete, or limit the collection of personal information. Because OmniTools does not collect, sell, or store personal identifiers or user content, your privacy is intrinsically safeguarded by design.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-neutral-900 dark:text-white">5. Contact Regarding Privacy</h2>
          <p>
            If you have questions regarding this Privacy Policy, please contact our privacy compliance team via our <a href="/contact" className="text-blue-600 dark:text-blue-400 underline">Contact Page</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
