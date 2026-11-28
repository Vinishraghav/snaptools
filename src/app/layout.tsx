import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CookieConsent from '@/components/layout/CookieConsent';
import PwaRegistrar from '@/components/layout/PwaRegistrar';
import { WorkflowProvider } from '@/lib/workflowStore';
import { SITE_URL, SITE_NAME, ADSENSE_CLIENT_ID } from '@/lib/siteConfig';
import { TOTAL_TOOLS_LABEL } from '@/data/catalogMeta';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  manifest: '/manifest.json',
  title: {
    default: `SnapTools - ${TOTAL_TOOLS_LABEL} Free Handcrafted Client-Side Micro-Tools`,
    template: '%s | SnapTools',
  },
  description:
    `The internet’s friendly pocketknife. ${TOTAL_TOOLS_LABEL} handcrafted, 100% client-side micro-tools for PDF, image optimization, developer code, data, finance, health, and unit conversions. Zero file uploads, zero accounts.`,
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
  authors: [{ name: 'SnapTools Team', url: SITE_URL }],
  openGraph: {
    title: `SnapTools - ${TOTAL_TOOLS_LABEL} Free Handcrafted Micro-Tools`,
    description: 'The internet’s friendly pocketknife. Fast, private, and 100% free forever.',
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `SnapTools - ${TOTAL_TOOLS_LABEL} Free Handcrafted Micro-Tools`,
    description: '100% client-side privacy. Zero file uploads. Fast & reliable web utilities.',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.png', type: 'image/png' },
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      { url: '/apple-icon.svg', type: 'image/svg+xml' },
    ],
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
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('snaptools_theme');var d=t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d){document.documentElement.classList.add('dark');}}catch(e){}})();`,
          }}
        />
        {/* Google Search Console Ownership Verification */}
        <meta
          name="google-site-verification"
          content="google562716ed7142a0a3"
        />
        {ADSENSE_CLIENT_ID && (
          <>
            <meta name="google-adsense-account" content={ADSENSE_CLIENT_ID} />
            <script
              async
              src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
              crossOrigin="anonymous"
            />
          </>
        )}
      </head>
      <body className="min-h-full flex flex-col bg-neutral-50/60 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 selection:bg-blue-600 selection:text-white">
        <WorkflowProvider>
          <PwaRegistrar />
          <Header />
          <main className="flex-1 w-full">{children}</main>
          <Footer />
          <CookieConsent />
        </WorkflowProvider>
      </body>
    </html>
  );
}
