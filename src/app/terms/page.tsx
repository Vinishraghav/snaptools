import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { SITE_URL } from '@/lib/siteConfig';
import { TOTAL_TOOLS_LABEL } from '@/data/toolsRegistry';

export const metadata: Metadata = {
  title: 'Terms of Service - SnapTools',
  description: 'Read the terms of service and acceptable usage policy for the SnapTools multi-utility platform.',
  alternates: {
    canonical: `${SITE_URL}/terms`,
  },
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 text-neutral-800 dark:text-neutral-200">
      <div className="space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-neutral-950 dark:text-white tracking-tight">
          Terms of Service
        </h1>
        <p className="text-xs text-neutral-500">
          Last updated: November 2026
        </p>
      </div>

      <div className="space-y-6 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-neutral-900 dark:text-white">1. Acceptance of Terms</h2>
          <p>
            By accessing or using SnapTools (&ldquo;the Platform&rdquo;), you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-neutral-900 dark:text-white">2. Use License &amp; Free Access</h2>
          <p>
            Permission is granted to use all {TOTAL_TOOLS_LABEL} micro-tools available on SnapTools for personal, educational, professional, and commercial purposes completely free of charge. You agree not to attempt to reverse engineer, disrupt, scrap excessively, or overload the platform infrastructure.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-neutral-900 dark:text-white">3. Disclaimer of Warranties</h2>
          <p>
            All tools, calculations, PDF manipulation engines, image compressors, and unit conversions provided on SnapTools are provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis without warranties of any kind, whether express or implied. Financial calculations, tax estimators, construction metrics, and medical/health figures should be independently verified for critical accounting or life-safety applications.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-neutral-900 dark:text-white">4. Client-Side Processing Acknowledgment</h2>
          <p>
            You acknowledge that all file processing (PDFs, images, videos, audio) occurs entirely inside your local browser memory using WebAssembly, HTML5 Canvas, and Web APIs. SnapTools does not store, backup, or recover your processed files once your browser session is closed.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-neutral-900 dark:text-white">5. Limitation of Liability</h2>
          <p>
            In no event shall SnapTools or its development team be liable for any indirect, incidental, or consequential damages arising out of the use or inability to use the tools or materials on the platform.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-neutral-900 dark:text-white">6. Inquiries &amp; Support</h2>
          <p>
            For legal inquiries or questions regarding these Terms, please contact our team via the <Link href="/contact" className="text-amber-600 dark:text-amber-400 font-semibold underline">Contact Support Portal</Link>.
          </p>
        </section>
      </div>
    </div>
  );
}
