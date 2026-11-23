import React from 'react';
import { Metadata } from 'next';
import { Wrench, Shield, Zap, Lock, Globe, Cpu } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Us - OmniTools Multi-Utility Platform',
  description:
    'Learn about OmniTools, the high-speed 100% client-side multi-utility platform built with Next.js, WebAssembly, and modern Web APIs.',
};

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="space-y-4">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-neutral-950 dark:text-white tracking-tight">
          About OmniTools
        </h1>
        <p className="text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
          OmniTools was conceived with a single guiding mission: to provide the world with a blazing-fast, completely free, and radically private suite of everyday digital utilities without requiring logins, paywalls, or server file uploads.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-neutral-900 dark:text-white text-sm">100% Client-Side Privacy</h3>
          <p className="text-xs text-neutral-500 leading-relaxed">
            Every document, photo, video, or data string stays inside your device browser memory. Nothing is ever sent to our servers.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
            <Cpu className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-neutral-900 dark:text-white text-sm">Hardware-Accelerated Speed</h3>
          <p className="text-xs text-neutral-500 leading-relaxed">
            Powered by HTML5 Canvas, WebAssembly (WASM), and the Web Crypto API to achieve near-instant execution speed without network lag.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center">
            <Globe className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-neutral-900 dark:text-white text-sm">1,005 Comprehensive Tools</h3>
          <p className="text-xs text-neutral-500 leading-relaxed">
            Covering 20 categories from PDF merging to Indian taxation, engineering physics, unit conversion, and hardware profiling.
          </p>
        </div>
      </div>

      <div className="p-8 rounded-3xl bg-neutral-100 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 space-y-4 text-xs leading-relaxed text-neutral-700 dark:text-neutral-300">
        <h2 className="text-base font-bold text-neutral-950 dark:text-white">Our Technology Stack</h2>
        <p>
          OmniTools is engineered using modern Next.js App Router, TypeScript, and Tailwind CSS. The entire platform is statically generated (SSG) across all 1,005 micro-tools to ensure instantaneous page loads, perfect Core Web Vitals, and optimal performance across mobile phones and desktop computers.
        </p>
        <p>
          We believe high-quality tools should be universally accessible without intrusive sign-ups or subscription fees. We support our free hosting operations strictly through non-intrusive Google AdSense advertising.
        </p>
      </div>
    </div>
  );
}
