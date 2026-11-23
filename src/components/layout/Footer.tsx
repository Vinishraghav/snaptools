'use client';

import React from 'react';
import Link from 'next/link';
import { CATEGORIES } from '@/data/categories';
import { Shield, Zap, Lock, Heart, Coffee } from 'lucide-react';
import Logo from '@/components/brand/Logo';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-600 dark:text-neutral-400 text-xs">
      {/* Top Highlights */}
      <div className="border-b border-neutral-200 dark:border-neutral-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold text-neutral-900 dark:text-white">100% Client-Side Privacy</div>
              <div className="text-neutral-500 text-[11px]">Zero file uploads. Everything runs locally in your browser.</div>
            </div>
          </div>
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold text-neutral-900 dark:text-white">Blazing Fast & Zero Limits</div>
              <div className="text-neutral-500 text-[11px]">No signups, no queues, no paywalls, completely free forever.</div>
            </div>
          </div>
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold text-neutral-900 dark:text-white">1,005 Specialized Micro-Tools</div>
              <div className="text-neutral-500 text-[11px]">Calculators, converters, PDF editors, image optimizers & more.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Categories Link Matrix */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {CATEGORIES.map((cat) => (
            <div key={cat.slug} className="space-y-2">
              <Link
                href={`/category/${cat.slug}`}
                className="font-semibold text-neutral-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition block text-xs"
              >
                {cat.name}
              </Link>
              <div className="text-[11px] text-neutral-500">
                {cat.count} micro-tools
              </div>
            </div>
          ))}
        </div>

        {/* Legal & Policy Links */}
        <div className="mt-12 pt-8 border-t border-neutral-200 dark:border-neutral-800 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Logo showTagline={true} />
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <Link href="/about" className="hover:text-neutral-900 dark:hover:text-white transition">
              About Us
            </Link>
            <Link href="/privacy-policy" className="hover:text-neutral-900 dark:hover:text-white transition">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-neutral-900 dark:hover:text-white transition">
              Terms of Service
            </Link>
            <Link href="/contact" className="hover:text-neutral-900 dark:hover:text-white transition">
              Contact &amp; Feedback
            </Link>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-neutral-200/60 dark:border-neutral-800/60 flex flex-col sm:flex-row items-center justify-between text-[11px] text-neutral-400 gap-2">
          <div className="flex items-center gap-1.5">
            <span>Crafted with care by the SnapTools Team</span>
            <span>&bull;</span>
            <span>&copy; 2026 SnapTools. All rights reserved.</span>
          </div>
          <div>
            <Link href="/contact" className="text-amber-600 dark:text-amber-400 hover:underline font-medium">
              Have questions or suggestions? Contact Support &rarr;
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
