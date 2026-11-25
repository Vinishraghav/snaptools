import React from 'react';
import { Metadata } from 'next';
import { ShieldCheck, Lock, EyeOff, Cookie, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { SITE_URL } from '@/lib/siteConfig';
import { TOTAL_TOOLS_LABEL } from '@/data/toolsRegistry';

export const metadata: Metadata = {
  title: 'Privacy Policy - SnapTools',
  description:
    'Read the official SnapTools Privacy Policy. Detailed explanation of our 100% client-side zero-upload data architecture, advertising cookies, GDPR & CCPA compliance.',
  alternates: {
    canonical: `${SITE_URL}/privacy-policy`,
  },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 text-neutral-800 dark:text-neutral-200">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
          <ShieldCheck className="w-3.5 h-3.5" /> 100% Client-Side Privacy Guarantee
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-neutral-950 dark:text-white tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-xs text-neutral-500">
          Effective Date: November 2026 | Compliant with GDPR &amp; CCPA
        </p>
      </div>

      <div className="p-6 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-start gap-4">
        <Lock className="w-6 h-6 text-emerald-600 mt-1 shrink-0" />
        <div className="text-xs leading-relaxed text-emerald-900 dark:text-emerald-200">
          <strong className="block text-sm font-bold mb-1">Our Core Commitment to Your Privacy</strong>
          SnapTools operates with a strict zero-database, zero-server-upload architecture. When you upload a PDF, image, audio file, or text payload into any of our {TOTAL_TOOLS_LABEL} micro-tools, that file is processed strictly inside your device&apos;s local web browser memory (RAM) using HTML5 Canvas, WebAssembly, and native Web APIs. Your files and confidential data never leave your computer and are never transmitted to our servers or third-party clouds.
        </div>
      </div>

      <div className="space-y-8 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-neutral-900 dark:text-white">1. Information We Do Not Collect</h2>
          <p>
            Because SnapTools requires zero user accounts, zero logins, and maintains no backend databases, we do not collect:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Personal identifiers (names, physical addresses, phone numbers).</li>
            <li>Uploaded files, PDFs, spreadsheets, images, audio, or video files.</li>
            <li>Financial inputs entered into calculators (salaries, mortgage values, loan amounts, GST figures).</li>
            <li>Plaintext passwords, cryptographic keys, or generated secret credentials.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-neutral-900 dark:text-white">2. Browser Local Storage</h2>
          <p>
            We use your browser&apos;s local storage (<code>localStorage</code>) exclusively for client-side user experience preferences:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Preserving your list of &ldquo;Recently Used Tools&rdquo; and &ldquo;Saved Favorites&rdquo; locally on your machine.</li>
            <li>Storing your dark/light theme preference.</li>
            <li>Remembering your Cookie Consent preference.</li>
          </ul>
          <p>
            This data remains entirely on your physical device and can be cleared at any time via your browser settings.
          </p>
        </section>

        <section className="space-y-3 p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2 text-sm font-bold text-neutral-900 dark:text-white">
            <Cookie className="w-4 h-4 text-amber-500" />
            <h3>3. Third-Party Advertising &amp; Cookies Disclosure</h3>
          </div>
          <p>
            This website displays third-party advertisements (including Adsterra display banners and sponsored links) to keep all {TOTAL_TOOLS_LABEL} micro-tools 100% free forever:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <strong>Third-Party Ad Networks:</strong> Third-party advertising partners may use cookies, web beacons, or standard browser identifiers when serving banner or native ads on SnapTools to measure ad delivery and prevent fraud.
            </li>
            <li>
              <strong>Opting Out of Personalized Advertising:</strong> Users can manage or opt out of interest-based advertising across participating ad networks by visiting <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer" className="text-amber-600 dark:text-amber-400 font-semibold underline">www.aboutads.info</a> or <a href="https://www.networkadvertising.org/choices/" target="_blank" rel="noopener noreferrer" className="text-amber-600 dark:text-amber-400 font-semibold underline">Network Advertising Initiative (NAI)</a>.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-neutral-900 dark:text-white">4. GDPR and CCPA / CPRA Privacy Rights</h2>
          <p>
            Under the European Union General Data Protection Regulation (GDPR) and California Consumer Privacy Act (CCPA / CPRA):
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>You have the right to request deletion of personal information (since we store none, your privacy is preserved by architecture).</li>
            <li>We do not sell, rent, or trade user personal information to any third parties.</li>
            <li>You can manage or decline advertising cookies at any time via our Cookie Consent banner.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-neutral-900 dark:text-white">5. Children&apos;s Information Protection (COPPA)</h2>
          <p>
            SnapTools does not knowingly collect any personally identifiable information from children under the age of 13. All educational utilities (calculators, unit converters, citation generators) process data entirely client-side without registration.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-neutral-900 dark:text-white">6. Changes to this Privacy Policy</h2>
          <p>
            We may update our Privacy Policy periodically. Any modifications will be reflected on this page with an updated revision date.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-neutral-900 dark:text-white">7. Contact &amp; Inquiries</h2>
          <p>
            If you have questions regarding this Privacy Policy or advertising disclosures, reach out directly via our <Link href="/contact" className="text-amber-600 dark:text-amber-400 font-semibold underline">Contact Support Portal</Link>.
          </p>
        </section>
      </div>
    </div>
  );
}
