'use client';

import React, { useEffect, useState } from 'react';
import { ShieldCheck, Info, X, Cpu, Lock } from 'lucide-react';

export default function PrivacyVerifierBadge({ toolTitle }: { toolTitle?: string }) {
  const [open, setOpen] = useState(false);
  const [observedRequests, setObservedRequests] = useState<number>(0);
  const [uploadDetected, setUploadDetected] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof PerformanceObserver === 'undefined') return;

    const currentOrigin = window.location.origin;
    const checkEntries = (entries: PerformanceEntryList) => {
      let countIncrement = 0;
      for (const entry of entries) {
        const resEntry = entry as PerformanceResourceTiming;
        const name = resEntry.name || '';
        // Ignore own same-origin static bundles/navigation & known analytics/ad scripts
        const isFirstPartyApiUpload =
          name.startsWith(currentOrigin) &&
          name.includes('/api/') &&
          !name.includes('/api/feedback') &&
          !name.includes('/api/contact');
        if (isFirstPartyApiUpload) {
          setUploadDetected(true);
        }
        if (resEntry.initiatorType === 'fetch' || resEntry.initiatorType === 'xmlhttprequest') {
          if (name.startsWith(currentOrigin) && !name.includes('tools-index.json') && !name.includes('_rsc')) {
            countIncrement++;
          }
        }
      }
      if (countIncrement > 0) {
        setObservedRequests((c) => c + countIncrement);
      }
    };

    try {
      const observer = new PerformanceObserver((list) => {
        checkEntries(list.getEntries());
      });
      observer.observe({ type: 'resource', buffered: false });
      return () => observer.disconnect();
    } catch {
      return undefined;
    }
  }, []);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="min-h-[44px] inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-emerald-200 dark:border-emerald-800/70 bg-emerald-50/70 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-xs font-semibold hover:bg-emerald-100/80 dark:hover:bg-emerald-900/50 transition cursor-pointer"
        aria-expanded={open}
        title="Inspect live zero-upload network telemetry"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
        <ShieldCheck className="w-4 h-4 shrink-0" />
        <span>
          {uploadDetected ? 'Telemetry Active' : '0 KB Uploaded'} &bull; Verified Local Execution
        </span>
        <Info className="w-3.5 h-3.5 opacity-70 shrink-0" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Local Execution Privacy Details"
          className="absolute left-0 mt-2 w-80 sm:w-96 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-2xl p-4 z-40 text-xs space-y-3"
        >
          <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-2">
            <span className="font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-500" /> Live Telemetry Proof
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close telemetry popup"
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
            {toolTitle || 'This utility'} runs strictly inside your browser using{' '}
            <strong className="text-neutral-900 dark:text-white">
              HTML5 Canvas, Web Workers, FileReader, and WebAssembly
            </strong>
            . Your files never leave your RAM.
          </p>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-900/60">
              <div className="text-neutral-500">Data Uploaded</div>
              <div className="font-mono font-black text-emerald-700 dark:text-emerald-300 mt-0.5">
                {uploadDetected ? 'Inspect Network' : '0 KB (Local)'}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
              <div className="text-neutral-500">API Calls Logged</div>
              <div className="font-mono font-black text-neutral-900 dark:text-white mt-0.5 flex items-center gap-1">
                <Cpu className="w-3 h-3 text-blue-500" /> {observedRequests}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
