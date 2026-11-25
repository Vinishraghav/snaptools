import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import ArcadeHub from '@/components/arcade/ArcadeHub';
import { SITE_URL, SITE_NAME } from '@/lib/siteConfig';

export const metadata: Metadata = {
  title: 'SnapTools Arcade — 6 Free Client-Side Mini-Games',
  description:
    'Play Neon Snake, 2048, Typing Speed Blitz, Lightning Reflex Test, Emoji Memory Flip, and Unbeatable Tic-Tac-Toe AI directly in your browser with local high scores.',
  alternates: {
    canonical: `${SITE_URL}/arcade`,
  },
  openGraph: {
    title: `SnapTools Arcade — Free Browser Mini-Games | ${SITE_NAME}`,
    description:
      'Six zero-lag browser mini-games with retro Web Audio SFX and personal high scores.',
    url: `${SITE_URL}/arcade`,
    siteName: SITE_NAME,
    type: 'website',
  },
};

export default function ArcadePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-16 text-center text-sm text-neutral-500">
          Loading SnapTools Arcade...
        </div>
      }
    >
      <ArcadeHub />
    </Suspense>
  );
}
