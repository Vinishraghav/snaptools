'use client';

import React from 'react';
import Link from 'next/link';
import { TOTAL_TOOLS_LABEL } from '@/data/toolsRegistry';

interface LogoProps {
  className?: string;
  showTagline?: boolean;
}

export default function Logo({ className = '', showTagline = false }: LogoProps) {
  return (
    <Link href="/" className={`flex items-center gap-3 group ${className}`}>
      {/* Bespoke Handcrafted Geometric Brandmark */}
      <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 p-0.5 shadow-md shadow-orange-500/20 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-orange-500/30 transition-all duration-300">
        <div className="w-full h-full bg-neutral-950 rounded-[14px] flex items-center justify-center p-2">
          {/* Custom interlocking craft icon (S-fold + precision tool notch) */}
          <svg
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
          >
            {/* Top folded ribbon */}
            <path
              d="M6 10C6 7.79086 7.79086 6 10 6H22C24.2091 6 26 7.79086 26 10V14C26 16.2091 24.2091 18 22 18H14"
              stroke="url(#snapGrad1)"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Bottom interlocking ribbon */}
            <path
              d="M26 22C26 24.2091 24.2091 26 22 26H10C7.79086 26 6 24.2091 6 22V18C6 15.7909 7.79086 14 10 14H18"
              stroke="url(#snapGrad2)"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Center spark / precision craft accent */}
            <circle cx="16" cy="16" r="2.2" fill="#FBBF24" />
            <defs>
              <linearGradient
                id="snapGrad1"
                x1="6"
                y1="6"
                x2="26"
                y2="18"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#F59E0B" />
                <stop offset="1" stopColor="#EF4444" />
              </linearGradient>
              <linearGradient
                id="snapGrad2"
                x1="26"
                y1="26"
                x2="6"
                y2="14"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#EF4444" />
                <stop offset="1" stopColor="#F59E0B" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Brand Wordmark */}
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className="font-extrabold text-xl tracking-tight text-neutral-900 dark:text-white font-sans">
            Snap<span className="text-amber-500">Tools</span>
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1" />
        </div>
        {showTagline ? (
          <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">
            {TOTAL_TOOLS_LABEL} Fast &amp; Private Micro-Tools
          </span>
        ) : (
          <span className="text-[10px] text-neutral-400 font-mono tracking-wider uppercase">
            100% Private &bull; No Uploads
          </span>
        )}
      </div>
    </Link>
  );
}
