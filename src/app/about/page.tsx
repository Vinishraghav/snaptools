import React from 'react';
import { Metadata } from 'next';
import { Shield, Zap, Lock, Heart, Coffee, UserCheck, Sparkles, Mail, Users } from 'lucide-react';
import Link from 'next/link';
import Logo from '@/components/brand/Logo';
import { SITE_URL } from '@/lib/siteConfig';
import { TOTAL_TOOLS_LABEL } from '@/data/catalogMeta';

export const metadata: Metadata = {
  title: 'About SnapTools - 100% Client-Side Web Utilities',
  description:
    `The story behind SnapTools. Built to provide ${TOTAL_TOOLS_LABEL} free, lightning-fast, and completely private browser tools with zero tracking.`,
  alternates: {
    canonical: `${SITE_URL}/about`,
  },
};

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12 text-neutral-800 dark:text-neutral-200">
      {/* Human Introduction */}
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
          <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
          <span>The Human Story Behind SnapTools</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-neutral-950 dark:text-white tracking-tight leading-tight">
          Why We Built <span className="text-amber-600 dark:text-amber-400">SnapTools</span>
        </h1>
        <p className="text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
          Like millions of students, creators, and professionals around the world, our team was constantly frustrated by the state of modern web utilities.
        </p>
      </div>

      {/* Creator Note Card */}
      <div className="p-8 rounded-3xl bg-amber-50/40 dark:bg-neutral-900 border border-amber-200/80 dark:border-neutral-800 space-y-4 leading-relaxed text-sm text-neutral-700 dark:text-neutral-300 relative overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 text-white font-bold text-lg flex items-center justify-center shadow-md">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="font-bold text-neutral-900 dark:text-white text-base">The SnapTools Engineering Collective</div>
            <div className="text-xs text-neutral-500">Privacy Advocates &amp; Independent Software Engineers</div>
          </div>
        </div>

        <p>
          &ldquo;Have you ever tried to compress a simple PDF or resize a picture for a government form, only to be forced to create an account, enter a credit card, or wait in a fake 60-second &apos;processing queue&apos; while your personal documents get uploaded to a server you know nothing about?
        </p>
        <p>
          We believed there had to be a better, more respectful way. Modern browsers are incredibly powerful computing environments equipped with WebAssembly, Canvas rendering, and Web Audio APIs. There is absolutely no reason for a server to touch your bank statements, passport photos, or spreadsheets.
        </p>
        <p>
          So, we built <strong>SnapTools</strong> as a pure client-side utility suite. Every single one of these {TOTAL_TOOLS_LABEL} micro-tools executes 100% inside your browser memory. Nothing ever leaves your computer. No accounts, no paywalls, no nonsense.&rdquo;
        </p>
      </div>

      {/* Core Principles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-neutral-900 dark:text-white text-sm">Radical Privacy</h3>
          <p className="text-xs text-neutral-500 leading-relaxed">
            We don&apos;t possess a database. When you close the tab, your processed files vanish from memory. Your confidentiality is mathematically guaranteed.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-neutral-900 dark:text-white text-sm">Zero Latency</h3>
          <p className="text-xs text-neutral-500 leading-relaxed">
            Because calculations take place on your CPU/GPU rather than waiting for distant servers, tools execute instantaneously in under 50 milliseconds.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center">
            <Coffee className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-neutral-900 dark:text-white text-sm">Always Free</h3>
          <p className="text-xs text-neutral-500 leading-relaxed">
            Supported responsibly through privacy-friendly Google AdSense advertising so the entire platform remains freely accessible to everyone worldwide.
          </p>
        </div>
      </div>

      {/* Direct Contact Invitation */}
      <div className="p-8 rounded-3xl bg-neutral-900 text-white space-y-4 text-center">
        <h2 className="text-xl font-bold">Have an idea or spotted a bug?</h2>
        <p className="text-xs text-neutral-400 max-w-md mx-auto leading-relaxed">
          Our engineering team reviews feedback daily and actively implements requested micro-tools. Reach out anytime through our secure portal.
        </p>
        <div>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold text-xs transition shadow-md"
          >
            <Mail className="w-4 h-4" /> Contact Engineering Team
          </Link>
        </div>
      </div>
    </div>
  );
}
