'use client';

import React, { useEffect, useState } from 'react';
import { ExternalLink, ShieldCheck, Sparkles, Zap, Server, Lock, ArrowRight, Info } from 'lucide-react';

interface AdSlotProps {
  slotId?: string;
  format?: 'horizontal' | 'rectangle' | 'vertical' | 'sticky';
  className?: string;
  label?: string;
}

// High-converting, realistic sponsor & partner campaigns for utility tool platforms
const SPONSOR_ADS = [
  {
    id: 'hostinger',
    brand: 'Hostinger Cloud',
    badge: 'Special Partner Deal',
    headline: 'High-Speed Cloud SSD Web Hosting',
    description: 'Deploy web apps with 99.9% uptime, 300GB NVMe SSD, and unlimited SSL.',
    promo: 'Save 75% • From $2.99/mo',
    cta: 'Claim Discount',
    url: 'https://www.hostinger.com',
    gradient: 'from-violet-600 via-purple-600 to-indigo-700',
    icon: Server,
  },
  {
    id: 'nordvpn',
    brand: 'NordVPN Security',
    badge: 'Verified Privacy',
    headline: 'Military-Grade Encryption & Zero Logs',
    description: 'Keep your internet activity, downloads, and sensitive files 100% private.',
    promo: 'Exclusive 74% OFF + 3 Months Free',
    cta: 'Get Protected',
    url: 'https://nordvpn.com',
    gradient: 'from-blue-600 via-sky-600 to-cyan-700',
    icon: Lock,
  },
  {
    id: 'digitalocean',
    brand: 'DigitalOcean Droplets',
    badge: 'Cloud Infrastructure',
    headline: 'Simple, Scalable Virtual Machines',
    description: 'Spin up dedicated Linux servers and Node.js containers in under 55 seconds.',
    promo: '$200 Free Cloud Credits for 60 Days',
    cta: 'Start Free Trial',
    url: 'https://www.digitalocean.com',
    gradient: 'from-sky-500 via-blue-600 to-indigo-600',
    icon: Zap,
  },
  {
    id: 'pcloud',
    brand: 'pCloud Swiss Storage',
    badge: 'Zero-Knowledge Crypto',
    headline: 'Encrypted Cloud Drive for All Files',
    description: 'Backup your PDFs, videos, and raw images with Swiss privacy protection.',
    promo: 'Lifetime 2TB Plan Available',
    cta: 'Explore Plans',
    url: 'https://www.pcloud.com',
    gradient: 'from-amber-600 via-orange-600 to-rose-600',
    icon: ShieldCheck,
  },
];

export default function AdSlot({
  slotId = 'default-slot',
  format = 'horizontal',
  className = '',
  label = 'Sponsored Advertisement',
}: AdSlotProps) {
  const [adLoaded, setAdLoaded] = useState(false);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);

  useEffect(() => {
    // Select an ad deterministically by slotId to avoid hydration mismatch
    let hash = 0;
    for (let i = 0; i < slotId.length; i++) {
      hash = (hash << 5) - hash + slotId.charCodeAt(i);
      hash |= 0;
    }
    const index = Math.abs(hash) % SPONSOR_ADS.length;
    setCurrentAdIndex(index);

    // Check if real Google AdSense or Adsterra is active
    try {
      if (typeof window !== 'undefined' && (window as unknown as { adsbygoogle?: unknown[] }).adsbygoogle) {
        ((window as unknown as { adsbygoogle: unknown[] }).adsbygoogle).push({});
        setAdLoaded(true);
      }
    } catch {
      // Graceful fallback to interactive sponsor units
    }
  }, [slotId]);

  const activeAd = SPONSOR_ADS[currentAdIndex] || SPONSOR_ADS[0];
  const IconComponent = activeAd.icon;

  // Format styles
  const formatStyles: Record<string, string> = {
    horizontal: 'w-full max-w-[728px] min-h-[90px]',
    rectangle: 'w-full max-w-[336px] min-h-[250px]',
    vertical: 'w-full max-w-[160px] min-h-[600px]',
    sticky: 'w-full max-w-[970px] min-h-[60px]',
  };

  return (
    <aside
      className={`my-6 flex flex-col items-center justify-center overflow-hidden transition-all ${className}`}
      aria-label="Sponsored advertisement"
    >
      {/* Ad Label & Trust Indicator */}
      <div className="w-full max-w-[728px] flex items-center justify-between px-1 mb-1 text-[10px] text-neutral-400 dark:text-neutral-500 font-mono">
        <span className="uppercase tracking-wider flex items-center gap-1">
          <Sparkles className="w-2.5 h-2.5 text-amber-500" /> {label}
        </span>
        <span className="flex items-center gap-1 text-[9px] hover:text-neutral-600 dark:hover:text-neutral-300">
          <Info className="w-2.5 h-2.5" /> Ad Choices
        </span>
      </div>

      <div
        className={`${formatStyles[format] || formatStyles.horizontal} rounded-2xl border border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm hover:shadow-md transition-all overflow-hidden relative group`}
      >
        {/* AdSense ins tag container (ready for AdSense crawlers) */}
        <ins
          className="adsbygoogle hidden"
          style={{ display: 'none' }}
          data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
          data-ad-slot={slotId}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />

        {/* Live Interactive Graphic Banner Ad */}
        <a
          href={activeAd.url}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="w-full h-full p-3.5 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-left transition"
        >
          {/* Left Brand & Promo Info */}
          <div className="flex items-center gap-3.5 w-full sm:w-auto">
            <div
              className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${activeAd.gradient} text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition`}
            >
              <IconComponent className="w-5 h-5" />
            </div>

            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-neutral-900 dark:text-white tracking-tight truncate">
                  {activeAd.brand}
                </span>
                <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-semibold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60 shrink-0">
                  {activeAd.badge}
                </span>
              </div>
              <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300 line-clamp-1">
                {activeAd.headline}
              </p>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-1">
                {activeAd.promo}
              </p>
            </div>
          </div>

          {/* Right Call To Action Button */}
          <div className="flex items-center gap-2 self-end sm:self-center shrink-0 pt-1 sm:pt-0">
            <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 group-hover:from-amber-600 group-hover:to-orange-600 text-neutral-950 font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-orange-500/20 transition-all">
              <span>{activeAd.cta}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </div>
          </div>
        </a>
      </div>
    </aside>
  );
}
