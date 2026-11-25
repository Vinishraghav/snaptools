'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Sparkles } from 'lucide-react';

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

export default function AdSlot({
  slotId = 'default-slot',
  format = 'horizontal',
  className = '',
  label = 'Advertisement',
}: AdSlotProps) {
  const isNativeSlot = slotId.includes('mid') || slotId.includes('bot');

  const bannerShellRef = useRef<HTMLDivElement | null>(null);
  const bannerRef = useRef<HTMLDivElement | null>(null);
  const nativeWrapperRef = useRef<HTMLDivElement | null>(null);
  const nativeContainerRef = useRef<HTMLDivElement | null>(null);

  const [adLoaded, setAdLoaded] = useState(false);
  const [adUnavailable, setAdUnavailable] = useState(false);
  const [bannerScale, setBannerScale] = useState(1);

  // Measure container width so 728x90 scales cleanly on mobile/narrow viewports
  useEffect(() => {
    if (isNativeSlot || adUnavailable) return;
    const shell = bannerShellRef.current;
    if (!shell) return;

    const updateScale = () => {
      const avail = shell.clientWidth;
      if (avail > 0) {
        setBannerScale(Math.min(1, avail / 728));
      }
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(shell);
    return () => observer.disconnect();
  }, [isNativeSlot, adUnavailable]);

  // Adsterra Banner 728x90 Injection
  useEffect(() => {
    if (isNativeSlot) return;
    const container = bannerRef.current;
    if (!container) return;

    container.innerHTML = '';
    setAdLoaded(false);
    setAdUnavailable(false);

    (window as unknown as { atOptions?: Record<string, unknown> }).atOptions = {
      key: ADSTERRA_BANNER_KEY,
      format: 'iframe',
      height: 90,
      width: 728,
      params: {},
    };

    const observer = new MutationObserver(() => {
      if (container.querySelector('iframe')) {
        setAdLoaded(true);
        setAdUnavailable(false);
        observer.disconnect();
      }
    });
    observer.observe(container, { childList: true, subtree: true });

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.setAttribute('data-cfasync', 'false');
    script.src = ADSTERRA_BANNER_SRC;
    script.onerror = () => setAdUnavailable(true);
    container.appendChild(script);

    const fillTimer = window.setTimeout(() => {
      if (!container.querySelector('iframe')) {
        setAdUnavailable(true);
      }
    }, 6000);

    return () => {
      window.clearTimeout(fillTimer);
      observer.disconnect();
      container.innerHTML = '';
    };
  }, [isNativeSlot, slotId]);

  // Adsterra Native Banner Injection (re-executes cleanly across client-side navigations)
  useEffect(() => {
    if (!isNativeSlot) return;
    const wrapper = nativeWrapperRef.current;
    const container = nativeContainerRef.current;
    if (!wrapper || !container) return;

    container.innerHTML = '';
    setAdLoaded(false);
    setAdUnavailable(false);

    document
      .querySelectorAll('script[data-adsterra-native="true"]')
      .forEach((old) => old.remove());

    const observer = new MutationObserver(() => {
      if (container.children.length > 0) {
        setAdLoaded(true);
        setAdUnavailable(false);
        observer.disconnect();
      }
    });
    observer.observe(container, { childList: true, subtree: true });

    const script = document.createElement('script');
    script.async = true;
    script.setAttribute('fetchpriority', 'high');
    script.setAttribute('data-cfasync', 'false');
    script.setAttribute('data-adsterra-native', 'true');
    script.src = ADSTERRA_NATIVE_SRC;
    script.onerror = () => setAdUnavailable(true);
    wrapper.appendChild(script);

    const fillTimer = window.setTimeout(() => {
      if (container.children.length === 0) {
        setAdUnavailable(true);
      }
    }, 6000);

    return () => {
      window.clearTimeout(fillTimer);
      observer.disconnect();
      script.remove();
      container.innerHTML = '';
    };
  }, [isNativeSlot, slotId]);

  if (adUnavailable) {
    return null;
  }

  const formatMaxWidth = format === 'sticky' ? 'max-w-[970px]' : 'max-w-4xl';

  return (
    <aside
      className={`my-6 flex flex-col items-center justify-center w-full transition-all ${className}`}
      aria-label="Advertisement"
    >
      {adLoaded && (
        <div
          className={`w-full ${
            isNativeSlot ? formatMaxWidth : 'max-w-[728px]'
          } flex items-center justify-start px-1 mb-1.5 text-[10px] text-neutral-400 dark:text-neutral-500 font-mono`}
        >
          <span className="uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5 text-amber-500" /> {label}
          </span>
        </div>
      )}

      {isNativeSlot ? (
        <div
          ref={nativeWrapperRef}
          className={`w-full ${formatMaxWidth} rounded-2xl overflow-hidden transition-colors ${
            adLoaded
              ? 'min-h-[100px] border border-neutral-200/70 dark:border-neutral-800/80 bg-white/60 dark:bg-neutral-900/60 p-2 sm:p-3'
              : 'min-h-[1px]'
          }`}
        >
          <div id={ADSTERRA_NATIVE_ID} ref={nativeContainerRef} className="w-full" />
        </div>
      ) : (
        <div
          ref={bannerShellRef}
          className="w-full max-w-[728px] overflow-hidden flex justify-center mx-auto"
          style={{ height: adLoaded ? `${Math.ceil(90 * bannerScale)}px` : '1px' }}
        >
          <div
            ref={bannerRef}
            style={{
              width: '728px',
              height: '90px',
              transform: `scale(${bannerScale})`,
              transformOrigin: 'top center',
            }}
            className={`rounded-xl flex items-center justify-center overflow-hidden shrink-0 ${
              adLoaded
                ? 'border border-neutral-200/80 dark:border-neutral-800/80 bg-white/60 dark:bg-neutral-900/60'
                : 'border-0 bg-transparent'
            }`}
          />
        </div>
      )}
    </aside>
  );
}
