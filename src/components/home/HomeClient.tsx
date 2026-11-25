'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Layers,
  Shield,
  Zap,
  ArrowRight,
  Clock,
  ChevronRight,
  TrendingUp,
  Gamepad2,
  Dices,
} from 'lucide-react';
import { TOTAL_TOOLS_LABEL, SYNCED_CATEGORIES } from '@/data/catalogMeta';
import { CORE_TOOLS_LIST, loadFullToolsIndex, SearchToolItem } from '@/data/clientCatalog';
import AdSlot from '@/components/ads/AdSlot';
import { ARCADE_GAMES } from '@/components/arcade/arcadeUtils';

export default function HomeClient() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [catalog, setCatalog] = useState<SearchToolItem[]>(CORE_TOOLS_LIST);
  const [recentTools, setRecentTools] = useState<SearchToolItem[]>([]);
  const [visibleCount, setVisibleCount] = useState<number>(100);

  useEffect(() => {
    setVisibleCount(100);
  }, [searchQuery, selectedCategory]);

  useEffect(() => {
    let active = true;
    const resolveRecents = (items: SearchToolItem[]) => {
      try {
        const recents: string[] = JSON.parse(localStorage.getItem('omnitools_recents') || '[]');
        const bySlug = new Map(items.map((t) => [t.slug, t]));
        const loaded = recents
          .map((s) => bySlug.get(s))
          .filter((t): t is SearchToolItem => Boolean(t))
          .slice(0, 6);
        if (active) setRecentTools(loaded);
      } catch {
        // fallback
      }
    };
    resolveRecents(CORE_TOOLS_LIST);
    loadFullToolsIndex().then((all) => {
      if (!active) return;
      setCatalog(all);
      resolveRecents(all);
    });
    return () => {
      active = false;
    };
  }, []);

  // Filter tools
  const filteredTools = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return catalog.filter((tool) => {
      const matchesCat = selectedCategory === 'all' || tool.category === selectedCategory;
      if (!matchesCat) return false;
      if (!q) return true;
      return (
        tool.title.toLowerCase().includes(q) ||
        tool.categoryName.toLowerCase().includes(q) ||
        tool.slug.toLowerCase().includes(q)
      );
    });
  }, [catalog, selectedCategory, searchQuery]);

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
  const popularTools = useMemo(() => {
    const bySlug = new Map(CORE_TOOLS_LIST.map((t) => [t.slug, t]));
    return popularSlugs
      .map((s) => bySlug.get(s))
      .filter((t): t is SearchToolItem => Boolean(t));
  }, []);

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24 border-b border-neutral-200/80 dark:border-neutral-800/80 bg-gradient-to-b from-amber-50/30 via-white to-transparent dark:from-neutral-900 dark:via-neutral-950 dark:to-neutral-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{TOTAL_TOOLS_LABEL} Free Client-Side Micro-Tools &bull; Zero Server Uploads &bull; 100% Private</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-neutral-950 dark:text-white leading-[1.15]">
            The Internet&apos;s Friendly Pocketknife.{' '}
            <span className="block bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 bg-clip-text text-transparent">
              Fast, Private, and Free Forever.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Tired of spammy websites that demand sign-ups or upload your private PDFs and photos to unknown servers? We handcrafted {TOTAL_TOOLS_LABEL} client-side utilities that run right in your browser memory.
          </p>

          {/* Instant Search Bar */}
          <div className="max-w-2xl mx-auto relative pt-4">
            <div className="relative flex items-center shadow-xl shadow-blue-500/5 rounded-2xl border-2 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 focus-within:border-blue-500 transition-all">
              <Search className="w-5 h-5 text-neutral-400 ml-4 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search across all ${TOTAL_TOOLS_LABEL} tools (e.g., 'PDF Merge', 'EMI Calculator', 'QR Code')...`}
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

            {/* Fun Quick Actions */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
              <Link
                href="/arcade"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition"
              >
                <Gamepad2 className="w-4 h-4" /> Play SnapTools Arcade (6 Mini-Games)
              </Link>
              <button
                onClick={() => {
                  const pool = catalog.length > 0 ? catalog : CORE_TOOLS_LIST;
                  const pick = pool[Math.floor(Math.random() * pool.length)];
                  if (pick) router.push(`/tools/${pick.slug}`);
                }}
                className="px-4 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-purple-500 text-neutral-800 dark:text-neutral-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <Dices className="w-4 h-4 text-purple-500" /> Surprise Me (Random Tool)
              </button>
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
                    Free client-side {tool.title}. Runs 100% locally inside your browser with instant results and zero uploads.
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

      {/* SnapTools Arcade Showcase */}
      {!searchQuery && selectedCategory === 'all' && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-amber-200/80 dark:border-amber-900/50 bg-gradient-to-br from-amber-50/70 via-white to-orange-50/50 dark:from-neutral-900 dark:via-neutral-900 dark:to-amber-950/20 p-6 sm:p-7 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-neutral-900 dark:text-white flex items-center gap-2">
                  <Gamepad2 className="w-5 h-5 text-amber-500" /> SnapTools Mini-Arcade &bull; Take a Brain Break
                </h2>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
                  Instant client-side browser mini-games with retro SFX and local high scores.
                </p>
              </div>
              <Link
                href="/arcade"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-300 hover:underline shrink-0"
              >
                Open Full Arcade <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {ARCADE_GAMES.map((game) => (
                <Link
                  key={game.id}
                  href={`/arcade?game=${game.id}`}
                  className="p-4 rounded-2xl border border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-neutral-950/80 hover:border-amber-500 hover:shadow-md transition group flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full text-white bg-gradient-to-r ${game.accent}`}
                      >
                        {game.badge}
                      </span>
                      <span className="text-sm font-bold text-neutral-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition">
                        {game.title}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-1">
                      {game.tagline}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-amber-500 group-hover:translate-x-1 transition shrink-0" />
                </Link>
              ))}
            </div>
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
                <Layers className="w-5 h-5 text-indigo-600 shrink-0" /> Explore All {TOTAL_TOOLS_LABEL} Tools
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Showing {filteredTools.length.toLocaleString()} {filteredTools.length === 1 ? 'tool' : 'tools'}
                {selectedCategory !== 'all' && ` in ${SYNCED_CATEGORIES.find((c) => c.slug === selectedCategory)?.name}`}
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
              All Categories ({TOTAL_TOOLS_LABEL})
            </button>
            {SYNCED_CATEGORIES.map((c) => (
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
          {filteredTools.slice(0, visibleCount).map((tool) => (
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
                  Free client-side {tool.title}. Runs 100% locally in your browser.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-neutral-100 dark:border-neutral-800/60 flex items-center justify-between text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                <span>Launch Tool</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
              </div>
            </Link>
          ))}
        </div>

        {filteredTools.length > visibleCount && (
          <div className="text-center py-6 space-y-3">
            <p className="text-xs text-neutral-500">
              Showing {visibleCount.toLocaleString()} of {filteredTools.length.toLocaleString()} matching tools. Use search, categories, or load more below.
            </p>
            <button
              onClick={() => setVisibleCount((prev) => prev + 100)}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition cursor-pointer"
            >
              Show More (+100 tools)
            </button>
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
          {SYNCED_CATEGORIES.map((cat) => (
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
