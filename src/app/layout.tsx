import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CookieConsent from '@/components/layout/CookieConsent';
import Script from 'next/script';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://omnitools.app'),
  title: {
    default: 'OmniTools - 1,005 Free Client-Side Micro-Tools & Utilities',
    template: '%s | OmniTools',
  },
  description:
    'Instant, 100% free, and client-side multi-utility platform with 1,005 specialized micro-tools for PDF, images, audio, coding, data, finance, health, and conversions. Zero uploads, zero database.',
  keywords: [
    'free online tools',
    'client side pdf merge',
    'image compressor',
    'emi calculator',
    'qr code generator',
    'json formatter',
    'unit converter',
    'web utilities',
  ],
  authors: [{ name: 'OmniTools Team' }],
  openGraph: {
    title: 'OmniTools - 1,005 Free Client-Side Micro-Tools',
    description: 'Blazing fast, 100% private, client-side online tools running entirely in your browser.',
    url: 'https://omnitools.app',
    siteName: 'OmniTools',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OmniTools - 1,005 Free Client-Side Micro-Tools',
    description: '100% client-side privacy. Zero file uploads. 1,005 tools.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Google AdSense Script */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body className="min-h-full flex flex-col bg-neutral-50/60 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 selection:bg-blue-600 selection:text-white">
        <Header />
        <main className="flex-1 w-full">{children}</main>
        <Footer />
        <CookieConsent />
      </body>
    </html>
  );
}
