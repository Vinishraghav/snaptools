import React from 'react';
import type { Metadata } from 'next';
import SignatureStudio from '@/components/studios/SignatureStudio';
import { SITE_URL, SITE_NAME } from '@/lib/siteConfig';

export const metadata: Metadata = {
  title: 'Free Digital Signature Pad & PDF Signer Studio',
  description:
    'Draw or type digital signatures, export crisp transparent PNG images, or stamp your signature directly onto any PDF page locally inside your browser.',
  alternates: { canonical: `${SITE_URL}/studio/signature` },
  openGraph: {
    title: `Free Signature Pad & PDF Signer | ${SITE_NAME}`,
    description: 'Sign PDF documents and export transparent signatures without uploads.',
    url: `${SITE_URL}/studio/signature`,
    siteName: SITE_NAME,
    type: 'website',
  },
};

export default function SignatureStudioPage() {
  return <SignatureStudio />;
}
