'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ExternalLink, Sparkles, Zap, Info } from 'lucide-react';

interface AdSlotProps {
  slotId?: string;
  format?: 'horizontal' | 'rectangle' | 'vertical' | 'sticky';
  className?: string;
  label?: string;
}

const ADSTERRA_NATIVE_ID = 'container-91fc2708b09d3eb38f09f2b6ff418d43';
const ADSTERRA_NATIVE_SRC = 'https://bauval.org/21/91fc2708b09d3eb38f09f2b6ff418d43';
const ADSTERRA_BANNER_KEY = 'bd81ad821a00722a4e8125eb5f5d5c2c';
const ADSTERRA_BANNER_SRC = 'https://bauval.org/22/bd81ad821a00722a4e8125eb5f5d5c2c';
const ADSTERRA_SMARTLINK_URL = 'https://araplhn.org/4/c46eadbbc026df8e5b3964738f24cbd2';

export default function AdSlot({
  slotId = 'default-slot',
  format = 'horizontal',
  className = '',
  label = 'Sponsored Advertisement',
}: AdSlotProps) {
  // Mid/bottom slots render Adsterra Native Banner (4:1 grid); top/leaderboard slots render Banner 728x90
  const isNativeSlot = slotId.includes('mid') || slotId.includes('bot');

  const bannerRef = useRef<HTMLDivElement | null>(null);
  const nativeContainerRef = useRef<HTMLDivElement | null>(null);
  const [showFallback, setShowFallback] = useState(false);

  // Banner 728x90 Injection (executes cleanly on every page & route change)
  useEffect(() => {
    if (isNativeSlot) return;
    const container = bannerRef.current;
    if (!container) return;

    container.innerHTML = '';
    setShowFallback(false);

    (window as unknown as { atOptions?: Record<string, unknown> }).atOptions = {
      key: ADSTERRA_BANNER_KEY,
      format: 'iframe',
      height: 90,
      width: 728,
      params: {},
    };

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.setAttribute('data-cfasync', 'false');
    script.src = ADSTERRA_BANNER_SRC;
    script.onerror = () => setShowFallback(true);
    container.appendChild(script);

    // Fallback to Smartlink card if ad script is blocked or has zero fill after timeout
    const fillTimer = window.setTimeout(() => {
      const hasIframe = container.querySelector('iframe');
      if (!hasIframe) {
        setShowFallback(true);
      }
    }, 3500);

    return () => {
      window.clearTimeout(fillTimer);
      container.innerHTML = '';
    };
  }, [isNativeSlot, slotId]);

  // Native Banner Injection (loaded once globally; Adsterra's pushState observer handles SPA updates)
  useEffect(() => {
    if (!isNativeSlot) return;
    const container = nativeContainerRef.current;
    if (!container) return;

    setShowFallback(false);

    const win = window as unknown as { __adsterraNativeLoaded?: boolean };
    if (!win.__adsterraNativeLoaded) {
      win.__adsterraNativeLoaded = true;
      const script = document.createElement('script');
      script.async = true;
      script.setAttribute('fetchpriority', 'high');
      script.setAttribute('data-cfasync', 'false');
      script.setAttribute('data-adsterra-native', 'true');
      script.src = ADSTERRA_NATIVE_SRC;
      script.onerror = () => setShowFallback(true);
      document.body.appendChild(script);
    }

    // Fallback to Smartlink card if AdBlocker prevents native fill
    const fillTimer = window.setTimeout(() => {
      if (container.children.length === 0) {
        setShowFallback(true);
      }
    }, 3500);

    return () => {
      window.clearTimeout(fillTimer);
    };
  }, [isNativeSlot, slotId]);

  const formatMaxWidth = format === 'sticky' ? 'max-w-[970px]' : 'max-w-4xl';

  return (
    <aside
      className={`my-6 flex flex-col items-center justify-center w-full transition-all ${className}`}
      aria-label="Sponsored advertisement"
    >
      {/* Ad Label & Direct Smartlink Header */}
      <div
        className={`w-full ${
          isNativeSlot ? formatMaxWidth : 'max-w-[728px]'
        } flex items-center justify-between px-1 mb-1.5 text-[10px] text-neutral-400 dark:text-neutral-500 font-mono`}
      >
        <span className="uppercase tracking-wider flex items-center gap-1">
          <Sparkles className="w-2.5 h-2.5 text-amber-500" /> {label}
        </span>
        <a
          href={ADSTERRA_SMARTLINK_URL}
          target="_blank"
          rel="noopener noreferrer sponsored nofollow"
          className="flex items-center gap-1 text-[10px] hover:text-amber-500 dark:hover:text-amber-400 transition-colors"
        >
          <Info className="w-2.5 h-2.5" /> Partner Deals &rarr;
        </a>
      </div>

      {/* Active Adsterra Placement Container */}
      {!showFallback ? (
        isNativeSlot ? (
          <div
            className={`w-full ${formatMaxWidth} min-h-[100px] rounded-2xl border border-neutral-200/70 dark:border-neutral-800/80 bg-white/60 dark:bg-neutral-900/60 p-2 sm:p-3 overflow-hidden`}
          >
            <div id={ADSTERRA_NATIVE_ID} ref={nativeContainerRef} className="w-full" />
          </div>
        ) : (
          <div className="w-full flex justify-start md:justify-center overflow-x-auto no-scrollbar py-1">
            <div
              ref={bannerRef}
              className="w-[728px] min-w-[728px] h-[90px] min-h-[90px] rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white/60 dark:bg-neutral-900/60 flex items-center justify-center overflow-hidden shrink-0"
            />
          </div>
        )
      ) : (
        /* Graceful Smartlink Sponsor Card when AdBlocker is enabled or zero-fill */
        <div
          className={`w-full ${
            isNativeSlot ? formatMaxWidth : 'max-w-[728px]'
          } min-h-[90px] rounded-2xl border border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm hover:shadow-md transition-all overflow-hidden group`}
        >
          <a
            href={ADSTERRA_SMARTLINK_URL}
            target="_blank"
            rel="noopener noreferrer sponsored nofollow"
            className="w-full h-full p-3.5 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-left transition"
          >
            <div className="flex items-center gap-3.5 w-full sm:w-auto">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition">
                <Zap className="w-5 h-5" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-neutral-900 dark:text-white tracking-tight truncate">
                    SnapTools Partner Offers
                  </span>
                  <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-semibold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60 shrink-0">
                    Sponsored
                  </span>
                </div>
                <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300 line-clamp-1">
                  Discover exclusive developer tools, cloud hosting &amp; software deals
                </p>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-1">
                  Supports keeping all 1,005 SnapTools free forever
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-center shrink-0 pt-1 sm:pt-0">
              <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 group-hover:from-amber-600 group-hover:to-orange-600 text-neutral-950 font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-orange-500/20 transition-all">
                <span>Explore Offer</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </div>
            </div>
          </a>
        </div>
      )}
    </aside>
  );
}
