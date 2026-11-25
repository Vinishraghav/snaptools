import React from 'react';
import type { Metadata } from 'next';
import InvoiceStudio from '@/components/studios/InvoiceStudio';
import { SITE_URL, SITE_NAME } from '@/lib/siteConfig';

export const metadata: Metadata = {
  title: 'Free GST & Business Invoice PDF Maker Studio',
  description:
    'Create professional A4 PDF invoices with CGST/SGST tax breakdown, custom logo upload, discounts, and multi-currency formatting 100% locally in your browser.',
  alternates: { canonical: `${SITE_URL}/studio/invoice` },
  openGraph: {
    title: `Free Invoice PDF Studio | ${SITE_NAME}`,
    description: 'Generate downloadable A4 GST and business invoices without sign-ups.',
    url: `${SITE_URL}/studio/invoice`,
    siteName: SITE_NAME,
    type: 'website',
  },
};

export default function InvoiceStudioPage() {
  return <InvoiceStudio />;
}
