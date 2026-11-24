'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  Layers,
  Shield,
  Zap,
  ArrowRight,
  Clock,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { TOOLS_REGISTRY, ToolDef } from '@/data/toolsRegistry';
import { CATEGORIES } from '@/data/categories';
import AdSlot from '@/components/ads/AdSlot';

export default function HomeClient() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [recentTools, setRecentTools] = useState<ToolDef[]>([]);

  useEffect(() => {
    try {
      const recents: string[] = JSON.parse(localStorage.getItem('omnitools_recents') || '[]');
      const loaded = recents
        .map((s) => TOOLS_REGISTRY.find((t) => t.slug === s))
        .filter((t): t is ToolDef => Boolean(t))
        .slice(0, 6);
      setRecentTools(loaded);
    } catch {
      // fallback
    }
  }, []);

  // Filter tools
  const filteredTools = TOOLS_REGISTRY.filter((tool) => {
    const matchesCat = selectedCategory === 'all' || tool.category === selectedCategory;
    if (!matchesCat) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      tool.title.toLowerCase().includes(q) ||
      tool.categoryName.toLowerCase().includes(q) ||
      tool.keywords.some((k) => k.toLowerCase().includes(q)) ||
      tool.description.toLowerCase().includes(q)
    );
  });

  // Popular curated tools
  const popularSlugs = [
    'pdf-compressor-target-kb',
    'pdf-merge',
    'image-compressor-lossy-lossless',
    'png-to-jpg-converter',
    'home-loan-emi-calculator',
    'mutual-fund-sip-calculator',
    'website-url-qr-code-generator',
    'strong-password-generator',
    'json-formatter-validator',
    'csv-to-json-converter',
    'word-character-counter',
    'bmi-body-mass-index-calculator',
  ];
  const popularTools = popularSlugs
    .map((s) => TOOLS_REGISTRY.find((t) => t.slug === s))
    .filter((t): t is ToolDef => Boolean(t));

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24 border-b border-neutral-200/80 dark:border-neutral-800/80 bg-gradient-to-b from-amber-50/30 via-white to-transparent dark:from-neutral-900 dark:via-neutral-950 dark:to-neutral-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>1,005 Free Client-Side Micro-Tools &bull; Zero Server Uploads &bull; 100% Private</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-neutral-950 dark:text-white leading-[1.15]">
            The Internet&apos;s Friendly Pocketknife.{' '}
            <span className="block bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 bg-clip-text text-transparent">
              Fast, Private, and Free Forever.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Tired of spammy websites that demand sign-ups or upload your private PDFs and photos to unknown servers? We handcrafted 1,005 client-side utilities that run right in your browser memory.
          </p>

          {/* Instant Search Bar */}
          <div className="max-w-2xl mx-auto relative pt-4">
            <div className="relative flex items-center shadow-xl shadow-blue-500/5 rounded-2xl border-2 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 focus-within:border-blue-500 transition-all">
              <Search className="w-5 h-5 text-neutral-400 ml-4 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search across all 1,005 tools (e.g., 'PDF Merge', 'EMI Calculator', 'QR Code')..."
                className="w-full py-4 pl-3 pr-4 text-sm sm:text-base bg-transparent text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-hidden"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="mr-3 px-2 py-1 text-xs font-medium text-neutral-400 hover:text-neutral-600"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Quick stats pills */}
            <div className="flex flex-wrap items-center justify-center gap-4 mt-4 text-xs text-neutral-500">
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-blue-500" /> Zero Server Storage
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" /> Instant WASM Speed
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-500" /> 20 Comprehensive Categories
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Top Leaderboard Placement */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AdSlot slotId="home-leaderboard" format="horizontal" />
      </div>

      {/* Recently Used (if any) */}
      {recentTools.length > 0 && !searchQuery && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-blue-600" />
            <h2 className="text-base font-bold text-neutral-900 dark:text-white uppercase tracking-wider text-xs">
              Recently Used Tools
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {recentTools.map((t) => (
              <Link
                key={t.slug}
                href={`/tools/${t.slug}`}
                className="p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 hover:border-blue-500 hover:shadow-md transition group flex flex-col justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-neutral-900 dark:text-white group-hover:text-blue-600 transition truncate">
                    {t.title}
                  </div>
                  <div className="text-[11px] text-neutral-500 mt-1 line-clamp-1">
                    {t.categoryName}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Popular Tools Showcase */}
      {!searchQuery && selectedCategory === 'all' && (
        <section id="popular" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" /> Most Popular Micro-Tools
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Top client-side utilities utilized by millions of creators, developers, and students.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {popularTools.map((tool) => (
              <Link
                key={tool.slug}
                href={`/tools/${tool.slug}`}
                className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-blue-500 hover:shadow-lg transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-300">
                      {tool.categoryName}
                    </span>
                    <span className="text-[10px] text-neutral-400 font-mono">#{tool.id}</span>
                  </div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                    {tool.title}
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1.5 line-clamp-2">
                    {tool.description}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between text-xs font-semibold text-blue-600 dark:text-blue-400">
                  <span>Open Tool</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* In-Content AdSlot */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AdSlot slotId="home-mid-banner" format="horizontal" />
      </div>

      {/* Category Pills & Main Directory */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600 shrink-0" /> Explore All 1,005 Tools
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Showing {filteredTools.length} {filteredTools.length === 1 ? 'tool' : 'tools'}
                {selectedCategory !== 'all' && ` in ${CATEGORIES.find((c) => c.slug === selectedCategory)?.name}`}
              </p>
            </div>
            <span className="text-[11px] text-neutral-400 font-medium hidden sm:inline shrink-0">
              Scroll horizontally &rarr;
            </span>
          </div>

          {/* Category Filter Pills (clean full-width horizontal scroll) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 w-full">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition ${
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              All Categories (1,005)
            </button>
            {CATEGORIES.map((c) => (
              <button
                key={c.slug}
                onClick={() => setSelectedCategory(c.slug)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition ${
                  selectedCategory === c.slug
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                {c.name} ({c.count})
              </button>
            ))}
          </div>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {filteredTools.slice(0, 100).map((tool) => (
            <Link
              key={tool.slug}
              href={`/tools/${tool.slug}`}
              className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-blue-500 hover:shadow-md transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-[10px] text-neutral-400 mb-1.5">
                  <span className="font-semibold text-neutral-500 truncate max-w-[180px]">
                    {tool.categoryName}
                  </span>
                  <span className="font-mono">#{tool.id}</span>
                </div>
                <h3 className="text-xs font-bold text-neutral-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition line-clamp-1">
                  {tool.title}
                </h3>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2">
                  {tool.description}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-neutral-100 dark:border-neutral-800/60 flex items-center justify-between text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                <span>Launch Tool</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
              </div>
            </Link>
          ))}
        </div>

        {filteredTools.length > 100 && (
          <div className="text-center py-6">
            <p className="text-xs text-neutral-500 mb-3">
              Showing first 100 results of {filteredTools.length}. Use search or select a category to narrow down.
            </p>
          </div>
        )}
      </section>

      {/* 20 Categories Directory Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
            Browse by 20 Categories
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Every category features a dedicated hub with deep SEO content and instant utilities.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/category/${cat.slug}`}
              className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-blue-500 hover:shadow-lg transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-neutral-900 dark:text-white group-hover:text-blue-600 transition">
                  {cat.name}
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-bold">
                  {cat.count}
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">
                {cat.description}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
