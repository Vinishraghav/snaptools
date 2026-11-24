import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { CATEGORIES } from '@/data/categories';
import { getToolsByCategory } from '@/data/toolsRegistry';
import AdSlot from '@/components/ads/AdSlot';
import { ChevronRight, ArrowRight, Layers, ShieldCheck, Zap } from 'lucide-react';
import { SITE_URL, SITE_NAME } from '@/lib/siteConfig';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return CATEGORIES.map((c) => ({
    slug: c.slug,
  }));
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = CATEGORIES.find((c) => c.slug === slug);
  if (!category) return {};

  const title = `${category.name} - ${category.count} Free Client-Side Tools`;
  const description = `${category.description} 100% free, private browser-based utilities with zero server uploads.`;

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/category/${category.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/category/${category.slug}`,
      siteName: SITE_NAME,
    },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = CATEGORIES.find((c) => c.slug === slug);

  if (!category) {
    notFound();
  }

  const tools = getToolsByCategory(category.slug);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-neutral-500">
        <Link href="/" className="hover:text-blue-600 transition">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-neutral-800 dark:text-neutral-200">Categories</span>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-blue-600 dark:text-blue-400">{category.name}</span>
      </nav>

      {/* Category Hero */}
      <div className="p-8 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300">
          <Layers className="w-3.5 h-3.5" /> Category Hub
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-neutral-950 dark:text-white tracking-tight">
          {category.name}
        </h1>
        <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 max-w-3xl leading-relaxed">
          {category.description} Discover all {category.count} specialized micro-tools operating 100% in your browser without any account or backend tracking.
        </p>
      </div>

      {/* Top AdSlot */}
      <AdSlot slotId={`cat-top-${category.slug}`} format="horizontal" />

      {/* Tools Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
            All {category.count} Micro-Tools in {category.name}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {tools.map((tool) => (
            <Link
              key={tool.slug}
              href={`/tools/${tool.slug}`}
              className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-blue-500 hover:shadow-lg transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-[10px] text-neutral-400 mb-2">
                  <span className="font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    Client Engine
                  </span>
                  <span className="font-mono">#{tool.id}</span>
                </div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                  {tool.title}
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1.5 line-clamp-2">
                  {tool.description}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs font-semibold text-blue-600 dark:text-blue-400">
                <span>Launch Tool</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Bottom AdSlot */}
      <AdSlot slotId={`cat-bot-${category.slug}`} format="horizontal" />
    </div>
  );
}
