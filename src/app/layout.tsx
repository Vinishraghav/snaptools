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
  metadataBase: new URL('https://snaptools.app'),
  title: {
    default: 'SnapTools - 1,005 Free Handcrafted Client-Side Micro-Tools',
    template: '%s | SnapTools',
  },
  description:
    'The internet’s friendly pocketknife. 1,005 handcrafted, 100% client-side micro-tools for PDF, image optimization, developer code, data, finance, health, and unit conversions. Zero file uploads, zero accounts.',
  keywords: [
    'snaptools',
    'free online tools',
    'client side pdf compress',
    'image compressor',
    'emi calculator',
    'qr code generator',
    'json formatter',
    'unit converter',
    'web utilities',
  ],
  authors: [{ name: 'SnapTools Team', url: 'https://snaptools.app' }],
  openGraph: {
    title: 'SnapTools - 1,005 Free Handcrafted Micro-Tools',
    description: 'The internet’s friendly pocketknife. Fast, private, and 100% free forever.',
    url: 'https://snaptools.app',
    siteName: 'SnapTools',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SnapTools - 1,005 Free Handcrafted Micro-Tools',
    description: '100% client-side privacy. Zero file uploads. Fast & reliable web utilities.',
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/icon.svg',
    apple: '/apple-icon.svg',
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
        {/* Google AdSense Site Verification & Script */}
        <meta
          name="google-adsense-account"
          content={process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || 'ca-pub-XXXXXXXXXXXXXXXX'}
        />
        <Script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || 'ca-pub-XXXXXXXXXXXXXXXX'}`}
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
