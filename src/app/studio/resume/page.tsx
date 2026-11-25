import React from 'react';
import type { Metadata } from 'next';
import ResumeStudio from '@/components/studios/ResumeStudio';
import { SITE_URL, SITE_NAME } from '@/lib/siteConfig';

export const metadata: Metadata = {
  title: 'Free ATS-Friendly Resume & CV PDF Builder Studio',
  description:
    'Create clean single-column ATS resumes with custom accent themes, dynamic experience blocks, and instant client-side PDF export.',
  alternates: { canonical: `${SITE_URL}/studio/resume` },
  openGraph: {
    title: `Free ATS Resume PDF Builder | ${SITE_NAME}`,
    description: 'Build and download crisp ATS-friendly PDF resumes 100% locally in browser.',
    url: `${SITE_URL}/studio/resume`,
    siteName: SITE_NAME,
    type: 'website',
  },
};

export default function ResumeStudioPage() {
  return <ResumeStudio />;
}
