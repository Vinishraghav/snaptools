import React from 'react';
import type { Metadata } from 'next';
import DirectoryExplorer from '@/components/directory/DirectoryExplorer';
import { SITE_URL, SITE_NAME } from '@/lib/siteConfig';
import { TOTAL_TOOLS_LABEL } from '@/data/catalogMeta';

export const metadata: Metadata = {
  title: `Complete A–Z Directory (${TOTAL_TOOLS_LABEL} Free Tools)`,
  description: `Browse all ${TOTAL_TOOLS_LABEL} SnapTools utilities alphabetically, by category, or by client-side engine type.`,
  alternates: { canonical: `${SITE_URL}/directory` },
  openGraph: {
    title: `Complete A–Z Tool Directory | ${SITE_NAME}`,
    description: `Explore ${TOTAL_TOOLS_LABEL} instant browser utilities.`,
    url: `${SITE_URL}/directory`,
    siteName: SITE_NAME,
    type: 'website',
  },
};

export default function DirectoryPage() {
  return <DirectoryExplorer />;
}
