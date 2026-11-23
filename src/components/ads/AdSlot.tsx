'use client';

import React, { useEffect, useState } from 'react';

interface AdSlotProps {
  slotId?: string;
  format?: 'horizontal' | 'rectangle' | 'vertical' | 'sticky';
  className?: string;
  label?: string;
}

export default function AdSlot({
  slotId = 'default-slot',
  format = 'horizontal',
  className = '',
  label = 'Advertisement'
}: AdSlotProps) {
  const [adLoaded, setAdLoaded] = useState(false);

  useEffect(() => {
    // Check if adsbygoogle is available in production
    try {
      if (typeof window !== 'undefined' && (window as unknown as { adsbygoogle?: unknown[] }).adsbygoogle) {
        ((window as unknown as { adsbygoogle: unknown[] }).adsbygoogle).push({});
        setAdLoaded(true);
      }
    } catch {
      // Ignore if ads blocked or in local dev
    }
  }, []);

  // CLS-safe height configurations
  const formatStyles: Record<string, string> = {
    horizontal: 'min-h-[90px] max-h-[100px] w-full max-w-[728px] mx-auto',
    rectangle: 'min-h-[250px] max-h-[280px] w-full max-w-[336px] mx-auto',
    vertical: 'min-h-[600px] w-full max-w-[160px] mx-auto',
    sticky: 'min-h-[60px] w-full max-w-[970px] mx-auto',
  };

  return (
    <div
      className={`my-6 flex flex-col items-center justify-center overflow-hidden transition-all ${className}`}
      aria-label="Sponsored advertisement"
    >
      <span className="text-[10px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-1 font-mono">
        {label}
      </span>
      <div
        className={`${formatStyles[format] || formatStyles.horizontal} rounded-lg border border-neutral-200/60 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-900/40 p-2 flex items-center justify-center text-center relative`}
      >
        {/* Placeholder / Ad container */}
        <ins
          className="adsbygoogle block w-full h-full text-center"
          style={{ display: 'block' }}
          data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
          data-ad-slot={slotId}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />

        {/* Fallback visual indicator when ad script isn't live */}
        {!adLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-neutral-400 dark:text-neutral-500 pointer-events-none">
            <span className="text-xs font-medium">Google AdSense Partner Slot</span>
            <span className="text-[10px] text-neutral-400/80 mt-0.5">High-Speed Responsive Placement</span>
          </div>
        )}
      </div>
    </div>
  );
}
