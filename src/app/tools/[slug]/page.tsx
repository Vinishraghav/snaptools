import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { TOOLS_REGISTRY, getToolBySlug, getRelatedTools, ToolDef } from '@/data/toolsRegistry';
import ToolHost from '@/components/tools/ToolHost';
import AdSlot from '@/components/ads/AdSlot';
import FeedbackWidget from '@/components/feedback/FeedbackWidget';
import { SITE_URL, SITE_NAME } from '@/lib/siteConfig';
import {
  ChevronRight,
  ShieldCheck,
  Zap,
  HelpCircle,
  Sparkles,
  ArrowRight,
  Lock,
  CheckCircle,
  Search,
  Check,
} from 'lucide-react';

interface ToolPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return TOOLS_REGISTRY.map((t) => ({
    slug: t.slug,
  }));
}

export async function generateMetadata({ params }: ToolPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool) return {};

  const cleanTitle = tool.title;
  const title = `${cleanTitle} - Free Online Tool | Instant & Private`;
  const description = `Use our free online ${cleanTitle}. 100% client-side processing in your browser with zero file uploads and zero wait times. Try ${cleanTitle} free now!`;

  return {
    title,
    description,
    keywords: [
      ...tool.keywords,
      cleanTitle.toLowerCase(),
      `${cleanTitle.toLowerCase()} online`,
      `${cleanTitle.toLowerCase()} free`,
      'client side tool',
      'no file upload',
      'free web utility',
      tool.categoryName.toLowerCase(),
    ],
    alternates: {
      canonical: `${SITE_URL}/tools/${tool.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/tools/${tool.slug}`,
      siteName: SITE_NAME,
      type: 'website',
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function ToolPage({ params }: ToolPageProps) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);

  if (!tool) {
    notFound();
  }

  const relatedTools = getRelatedTools(tool, 6);

  // Triple-layer Structured JSON-LD Schema (WebApplication + BreadcrumbList + FAQPage)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        name: tool.title,
        url: `${SITE_URL}/tools/${tool.slug}`,
        description: tool.description,
        applicationCategory: 'UtilityApplication',
        operatingSystem: 'All',
        browserRequirements: 'Requires HTML5 and modern JavaScript support',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
        featureList: tool.features.join(', '),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: SITE_URL,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: tool.categoryName,
            item: `${SITE_URL}/category/${tool.category}`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: tool.title,
            item: `${SITE_URL}/tools/${tool.slug}`,
          },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: tool.faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      },
    ],
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Inject Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-neutral-500">
        <Link href="/" className="hover:text-blue-600 transition">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href={`/category/${tool.category}`} className="hover:text-blue-600 transition">
          {tool.categoryName}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-neutral-800 dark:text-neutral-200 truncate max-w-xs">
          {tool.title}
        </span>
      </nav>

      {/* Header Info */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
          <span>{tool.categoryName}</span>
          <span>&bull;</span>
          <span className="text-neutral-400 font-mono">Tool #{tool.id}</span>
          <span>&bull;</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-medium">100% Free &amp; Private</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-neutral-950 dark:text-white tracking-tight">
          {tool.title}
        </h1>

        <p className="text-base text-neutral-600 dark:text-neutral-400 max-w-3xl leading-relaxed">
          {tool.description} Operates 100% locally in your browser with complete client-side security and zero server uploads.
        </p>
      </div>

      {/* Top AdSlot Leaderboard */}
      <AdSlot slotId={`tool-top-${tool.id}`} format="horizontal" />

      {/* Interactive Working Tool UI */}
      <section aria-label="Tool Application">
        <ToolHost tool={tool} />
      </section>

      {/* In-Content AdSlot */}
      <AdSlot slotId={`tool-mid-${tool.id}`} format="horizontal" />

      {/* Comprehensive 400+ Word SEO Guide & How to Use (AdSense High Quality Content) */}
      <article className="p-8 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-8 text-neutral-800 dark:text-neutral-200">
        <div>
          <h2 className="text-xl font-bold text-neutral-950 dark:text-white mb-4">
            How to Use the {tool.title}
          </h2>
          <ol className="space-y-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400 list-decimal pl-5">
            {tool.howToUse.map((step, idx) => (
              <li key={idx}>
                <span className="font-medium text-neutral-800 dark:text-neutral-200">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <div>
          <h2 className="text-xl font-bold text-neutral-950 dark:text-white mb-4">
            Key Features &amp; Performance Highlights
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tool.features.map((feat, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 flex items-start gap-3"
              >
                <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                <span className="text-xs leading-relaxed text-neutral-700 dark:text-neutral-300">
                  {feat}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-neutral-950 dark:text-white mb-3">
            Why Choose Our Client-Side {tool.title}?
          </h2>
          <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400 mb-3">
            Unlike traditional cloud tools that require uploading your private files, documents, or data payloads to third-party web servers, our <strong>{tool.title}</strong> is executed entirely inside your local device memory using Web APIs, HTML5 Canvas, and WebAssembly. This architecture guarantees total confidentiality for sensitive company data, personal photos, and business documents. Furthermore, because zero network round-trips are required for processing, calculations and transformations happen instantaneously with virtually zero latency.
          </p>
          <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
            Whether you are on a mobile device, tablet, laptop, or desktop workstation, SnapTools delivers unthrottled performance with no rate limits, no daily file caps, and no registration hurdles.
          </p>
        </div>

        {/* Common Use Cases & Search Queries for Google SEO */}
        <div className="p-6 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-3">
          <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <Search className="w-4 h-4 text-blue-600" /> Popular Use Cases for this Tool
          </h3>
          <div className="flex flex-wrap gap-2 text-xs">
            {tool.keywords.map((kw, i) => (
              <span
                key={i}
                className="px-3 py-1 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400"
              >
                #{kw}
              </span>
            ))}
            <span className="px-3 py-1 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400">
              #free-{tool.slug}
            </span>
            <span className="px-3 py-1 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400">
              #online-utility
            </span>
          </div>
        </div>

        {/* Structured FAQ Section */}
        <div>
          <h2 className="text-xl font-bold text-neutral-950 dark:text-white mb-4 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-blue-600" /> Frequently Asked Questions
          </h2>
          <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {tool.faqs.map((faq, idx) => (
              <div key={idx} className="py-4 space-y-1.5">
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                  {faq.question}
                </h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </article>

      {/* Developer Feedback Section */}
      <FeedbackWidget toolName={tool.title} toolSlug={tool.slug} />

      {/* Related Tools Internal Links */}
      {relatedTools.length > 0 && (
        <section className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
              Related {tool.categoryName} Micro-Tools
            </h2>
            <Link
              href={`/category/${tool.category}`}
              className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1"
            >
              View all category tools <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {relatedTools.map((rt) => (
              <Link
                key={rt.slug}
                href={`/tools/${rt.slug}`}
                className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-blue-500 hover:shadow-md transition group flex flex-col justify-between"
              >
                <div>
                  <span className="text-[10px] text-neutral-400 font-mono">#{rt.id}</span>
                  <h3 className="text-xs font-bold text-neutral-900 dark:text-white group-hover:text-blue-600 transition truncate mt-1">
                    {rt.title}
                  </h3>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-2 mt-1">
                    {rt.description}
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-neutral-100 dark:border-neutral-800 text-[11px] font-semibold text-blue-600 flex items-center justify-between">
                  <span>Use Tool</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
