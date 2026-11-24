import type { Metadata } from 'next';
import HomeClient from '@/components/home/HomeClient';
import { SITE_URL, SITE_NAME } from '@/lib/siteConfig';

export const metadata: Metadata = {
  alternates: {
    canonical: SITE_URL,
  },
};

export default function HomePage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description:
      '1,005 handcrafted, 100% client-side micro-tools for PDF, image optimization, developer code, data, finance, health, and unit conversions.',
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeClient />
    </>
  );
}
