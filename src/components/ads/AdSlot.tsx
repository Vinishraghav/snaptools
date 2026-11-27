'use client';

import React, { useEffect, useRef } from 'react';
import { ADSENSE_CLIENT_ID } from '@/lib/siteConfig';

interface AdSlotProps {
  slotId?: string;
  adSlotId?: string;
  format?: 'horizontal' | 'rectangle' | 'vertical' | 'sticky';
  className?: string;
  label?: string;
}

const DEFAULT_ADSENSE_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT_DEFAULT || '';

export default function AdSlot({
  adSlotId,
  format = 'horizontal',
  className = '',
  label = 'Advertisement',
}: AdSlotProps) {
  const insRef = useRef<HTMLModElement | null>(null);
  const resolvedSlot = adSlotId || DEFAULT_ADSENSE_SLOT;

  useEffect(() => {
    if (!ADSENSE_CLIENT_ID || !resolvedSlot) return;
    const insEl = insRef.current;
    if (!insEl) return;

    // Guard against duplicate AdSense push on React strict/SPA navigation
    if (insEl.getAttribute('data-adsbygoogle-status')) return;

    try {
      const win = window as unknown as { adsbygoogle?: unknown[] };
      win.adsbygoogle = win.adsbygoogle || [];
      win.adsbygoogle.push({});
    } catch {
      // ignore ad-blocker / async script timing errors cleanly
    }
  }, [resolvedSlot]);

  if (!ADSENSE_CLIENT_ID || !resolvedSlot) {
    return null;
  }

  const maxWidth = format === 'sticky' ? 'max-w-[970px]' : 'max-w-4xl';

  return (
    <aside
      className={`my-6 flex flex-col items-center justify-center w-full ${className}`}
      aria-label="Advertisement"
    >
      <div className={`w-full ${maxWidth} px-1 mb-1 text-[10px] text-neutral-400 dark:text-neutral-500 font-mono uppercase tracking-wider`}>
        {label}
      </div>
      <div className={`w-full ${maxWidth} overflow-hidden rounded-xl`}>
        <ins
          ref={insRef}
          className="adsbygoogle block w-full"
          data-ad-client={ADSENSE_CLIENT_ID}
          data-ad-slot={resolvedSlot}
          data-ad-format={format === 'rectangle' ? 'rectangle' : 'auto'}
          data-full-width-responsive="true"
        />
      </div>
    </aside>
  );
}
