'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheck, X } from 'lucide-react';

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('snaptools_cookie_consent');
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('snaptools_cookie_consent', 'accepted');
    setShowBanner(false);
  };

  const handleDecline = () => {
    localStorage.setItem('snaptools_cookie_consent', 'declined');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <aside
      aria-label="Cookie consent banner"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 p-5 rounded-2xl bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md shadow-2xl border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 transition-all animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="flex-1 text-xs leading-relaxed">
          <p className="font-semibold text-sm mb-1 text-neutral-900 dark:text-white">
            Privacy & Cookie Preferences
          </p>
          <p className="text-neutral-600 dark:text-neutral-400">
            We use cookies and local storage solely to save your recent tools, personalize advertising via Google AdSense, and ensure fast, private client-side processing. Your tool files never leave your browser.
          </p>
          <div className="mt-2 text-xs">
            <Link
              href="/privacy-policy"
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              Learn more in Privacy Policy
            </Link>
          </div>
        </div>
        <button
          onClick={handleDecline}
          aria-label="Close cookie banner"
          className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1 rounded-lg"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-4 flex items-center justify-end gap-2 text-xs">
        <button
          onClick={handleDecline}
          className="px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
        >
          Decline Optional
        </button>
        <button
          onClick={handleAccept}
          className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm transition"
        >
          Accept All
        </button>
      </div>
    </aside>
  );
}
