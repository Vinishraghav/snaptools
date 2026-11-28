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
  FileText,
  PenTool,
  FileCheck2,
  BookOpen,
  Star,
  GripVertical,
  Image as ImageIcon,
  Camera,
  MapPin,
  IndianRupee,
  Code2,
  Sparkles,
  Plus,
} from 'lucide-react';
import { TOTAL_TOOLS_LABEL, SYNCED_CATEGORIES } from '@/data/catalogMeta';
import { CORE_TOOLS_LIST, loadFullToolsIndex, SearchToolItem } from '@/data/clientCatalog';
import AdSlot from '@/components/ads/AdSlot';
import { ARCADE_GAMES } from '@/components/arcade/arcadeUtils';
import { getToolBenefitDescription } from '@/lib/toolDescriptions';
import {
  usePinnedSlugs,
  useRecentSlugs,
  togglePinnedSlug,
  reorderPinnedSlugs,
  savePinnedSlugs,
} from '@/lib/workspacePrefs';

interface MasterUnifiedCard {
  id: string;
  slug: string;
  title: string;
  badge: string;
  description: string;
  accent: string;
  presets: Array<{ label: string; href: string }>;
}

const MASTER_UNIFIED_CARDS: MasterUnifiedCard[] = [
  {
    id: 'master-image-compress',
    slug: 'image-compressor-lossy-lossless',
    title: 'Smart Image Compressor',
    badge: 'Image + Batch ZIP',
    description: 'Shrink JPG, PNG & WebP batches to exact KB targets offline via Web Workers.',
    accent: 'blue',
    presets: [
      { label: '20KB', href: '/tools/compress-image-to-20kb' },
      { label: '50KB', href: '/tools/compress-image-to-50kb' },
      { label: '100KB', href: '/tools/compress-image-to-100kb' },
      { label: 'Custom', href: '/tools/image-compressor-lossy-lossless' },
    ],
  },
  {
    id: 'master-exam-photo',
    slug: 'indian-passport-size-photo-maker-a4-sheet',
    title: 'Exam & Passport Photo Studio',
    badge: 'UPSC • TNPSC • SSC',
    description: 'Size photos & signatures for Indian exam portals and arrange A4 cut sheets.',
    accent: 'purple',
    presets: [
      { label: 'UPSC', href: '/tools/indian-passport-size-photo-maker-a4-sheet?preset=upsc-photo' },
      { label: 'TNPSC', href: '/tools/indian-passport-size-photo-maker-a4-sheet?preset=tnpsc-photo' },
      { label: 'SSC', href: '/tools/indian-passport-size-photo-maker-a4-sheet?preset=ssc-photo' },
      { label: 'PAN Card', href: '/tools/indian-passport-size-photo-maker-a4-sheet?preset=pan-nsdl-photo' },
    ],
  },
  {
    id: 'master-pdf',
    slug: 'pdf-compressor-target-kb',
    title: 'PDF Client-Side Workbench',
    badge: 'Zero Upload PDF',
    description: 'Compress to KB limits, merge, split, password-lock, or convert PDF to JPG.',
    accent: 'rose',
    presets: [
      { label: 'Target KB', href: '/tools/pdf-compressor-target-kb' },
      { label: 'Merge', href: '/tools/pdf-merge' },
      { label: 'Split', href: '/tools/pdf-split-by-range' },
      { label: 'Lock PDF', href: '/tools/pdf-password-protector' },
    ],
  },
  {
    id: 'master-land',
    slug: 'indian-land-area-converter-cent-ground-guntha-bigha-kanal-marla',
    title: 'Universal Land & Area Matrix',
    badge: 'State-Wise Bigha',
    description: 'Convert Sq Ft, Cents, Grounds, Acres, Guntha, Kanal & Bigha simultaneously.',
    accent: 'emerald',
    presets: [
      { label: 'Cent / Ground', href: '/tools/indian-land-area-converter-cent-ground-guntha-bigha-kanal-marla' },
      { label: 'UP / Raj Bigha', href: '/tools/indian-land-area-converter-cent-ground-guntha-bigha-kanal-marla?bigha=up-east' },
      { label: 'Acre / Guntha', href: '/tools/acre-to-sq-feet-converter' },
    ],
  },
  {
    id: 'master-finance',
    slug: 'indian-income-tax-calculator-new-vs-old-regime',
    title: 'India Finance & FY 2026–27 Tax',
    badge: 'FY 2026–27 Ready',
    description: 'Compare Income Tax regimes, EMI, SIP, PPF, EPF & NPS with SVG charts & PDF.',
    accent: 'amber',
    presets: [
      { label: 'Income Tax', href: '/tools/indian-income-tax-calculator-new-vs-old-regime' },
      { label: 'Home EMI', href: '/tools/home-loan-emi-calculator' },
      { label: 'SIP Wealth', href: '/tools/mutual-fund-sip-calculator' },
      { label: 'PPF / NPS', href: '/tools/ppf-public-provident-fund-calculator' },
    ],
  },
  {
    id: 'master-dev',
    slug: 'csv-to-json-converter',
    title: 'Dev & Data Pipeline Suite',
    badge: 'Workflow Chaining',
    description: 'Convert CSV to JSON, validate payloads, minify, and infer TypeScript types.',
    accent: 'indigo',
    presets: [
      { label: 'CSV → JSON', href: '/tools/csv-to-json-converter' },
      { label: 'Format JSON', href: '/tools/json-formatter-validator' },
      { label: 'To TypeScript', href: '/tools/json-to-typescript-interface' },
      { label: 'Minify JSON', href: '/tools/json-minifier' },
    ],
  },
];

const STARTER_PIN_SLUGS = [
  'image-compressor-lossy-lossless',
  'pdf-compressor-target-kb',
  'pdf-merge',
  'indian-land-area-converter-cent-ground-guntha-bigha-kanal-marla',
  'indian-income-tax-calculator-new-vs-old-regime',
  'json-formatter-validator',
];

export default function HomeClient() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [catalog, setCatalog] = useState<SearchToolItem[]>(CORE_TOOLS_LIST);
  const [dragSlug, setDragSlug] = useState<string | null>(null);
  const [extraPagination, setExtraPagination] = useState<{ key: string; count: number }>({
    key: 'all::',
    count: 0,
  });

  const pinnedSlugs = usePinnedSlugs();
  const recentSlugs = useRecentSlugs();

  useEffect(() => {
    let active = true;
    loadFullToolsIndex().then((all) => {
      if (active && all.length > 0) setCatalog(all);
    });
    return () => {
      active = false;
    };
  }, []);

  const bySlug = useMemo(() => new Map(catalog.map((t) => [t.slug, t])), [catalog]);

  const pinnedTools = useMemo(
    () =>
      pinnedSlugs
        .map((s) => bySlug.get(s))
        .filter((t): t is SearchToolItem => Boolean(t)),
    [pinnedSlugs, bySlug]
  );

  const recentTools = useMemo(
    () =>
      recentSlugs
        .map((s) => bySlug.get(s))
        .filter((t): t is SearchToolItem => Boolean(t))
        .slice(0, 5),
    [recentSlugs, bySlug]
  );

  const filterKey = `${selectedCategory}::${searchQuery}`;
  const visibleCount = 100 + (extraPagination.key === filterKey ? extraPagination.count : 0);

  const isFilteringCatalog = searchQuery.trim().length > 0 || selectedCategory !== 'all';

  const filteredTools = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q && selectedCategory === 'all') return [];
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

  const openCommandPalette = () => {
    window.dispatchEvent(new Event('snaptools-open-palette'));
  };

  const renderMasterIcon = (id: string) => {
    if (id.includes('image')) return <ImageIcon className="w-5 h-5" />;
    if (id.includes('exam')) return <Camera className="w-5 h-5" />;
    if (id.includes('pdf')) return <FileText className="w-5 h-5" />;
    if (id.includes('land')) return <MapPin className="w-5 h-5" />;
    if (id.includes('finance')) return <IndianRupee className="w-5 h-5" />;
    return <Code2 className="w-5 h-5" />;
  };

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-10 pb-14 md:pt-16 md:pb-20 border-b border-neutral-200/80 dark:border-neutral-800/80 bg-gradient-to-b from-amber-50/30 via-white to-transparent dark:from-neutral-900 dark:via-neutral-950 dark:to-neutral-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{TOTAL_TOOLS_LABEL} Private Utilities &bull; Zero Server Uploads &bull; Offline PWA Ready</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-neutral-950 dark:text-white leading-[1.12]">
            Daily-Driver Tools in{' '}
            <span className="bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 bg-clip-text text-transparent">
              Browser Memory.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Compress batches, pipe outputs directly between tools without re-uploading, calculate FY 2026–27 taxes, and convert regional Indian land units offline.
          </p>

          {/* Search Bar + Instant Command Palette Trigger */}
          <div className="max-w-2xl mx-auto relative pt-2">
            <div className="relative flex items-center shadow-xl shadow-blue-500/5 rounded-2xl border-2 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 focus-within:border-blue-500 transition-all">
              <Search className="w-5 h-5 text-neutral-400 ml-4 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Filter ${TOTAL_TOOLS_LABEL} tools (try '20kb', 'cent', 'income tax', 'pdf')...`}
                className="w-full py-3.5 sm:py-4 pl-3 pr-2 text-sm sm:text-base bg-transparent text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-hidden"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="mr-2 min-h-[44px] px-3 text-xs font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
                >
                  Clear
                </button>
              ) : (
                <button
                  type="button"
                  onClick={openCommandPalette}
                  className="mr-2.5 hidden sm:inline-flex items-center gap-1.5 min-h-[36px] px-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-[11px] font-mono font-semibold text-neutral-600 dark:text-neutral-300 hover:border-blue-500 transition cursor-pointer shrink-0"
                >
                  <Sparkles className="w-3 h-3 text-amber-500" /> Ctrl K
                </button>
              )}
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-4 mt-4 text-xs text-neutral-500">
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-500" /> 0 KB Server Uploads
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" /> In-Memory Workflow Piping
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-500" /> 20 Categories
              </span>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
              <Link
                href="/arcade"
                className="min-h-[44px] px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition"
              >
                <Gamepad2 className="w-4 h-4" /> Play SnapTools Arcade
              </Link>
              <button
                type="button"
                onClick={() => {
                  const pool = catalog.length > 0 ? catalog : CORE_TOOLS_LIST;
                  const pick = pool[Math.floor(Math.random() * pool.length)];
                  if (pick) router.push(`/tools/${pick.slug}`);
                }}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-purple-500 text-neutral-800 dark:text-neutral-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <Dices className="w-4 h-4 text-purple-500" /> Surprise Me
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Personalized Pinned Workspace & Recently Used Strip (Right Below Hero Search) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
        <div className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/70 p-4 sm:p-6 shadow-xs space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-black text-neutral-900 dark:text-white flex items-center gap-2">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" /> My Pinned Tools ({pinnedTools.length}/12)
              </h2>
              <p className="text-xs text-neutral-500">
                Pin daily drivers with ★ on any tool card and drag to reorder your dock.
              </p>
            </div>
            {pinnedTools.length === 0 && (
              <button
                type="button"
                onClick={() => savePinnedSlugs(STARTER_PIN_SLUGS)}
                className="min-h-[44px] px-3.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-bold inline-flex items-center gap-1.5 hover:bg-amber-100 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Pin Top 6 Daily Tools
              </button>
            )}
          </div>

          {pinnedTools.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {pinnedTools.map((tool) => (
                <div
                  key={tool.slug}
                  draggable
                  onDragStart={() => setDragSlug(tool.slug)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (dragSlug && dragSlug !== tool.slug) {
                      reorderPinnedSlugs(dragSlug, tool.slug);
                    }
                    setDragSlug(null);
                  }}
                  className="p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-950/70 hover:border-amber-400 transition flex items-start justify-between gap-2 group"
                >
                  <div className="flex items-start gap-2 min-w-0 flex-1">
                    <span
                      title="Drag to reorder"
                      className="mt-1 text-neutral-300 dark:text-neutral-700 group-hover:text-neutral-500 cursor-grab shrink-0"
                    >
                      <GripVertical className="w-4 h-4" />
                    </span>
                    <Link href={`/tools/${tool.slug}`} className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-neutral-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                        {tool.title}
                      </div>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-1 mt-0.5">
                        {getToolBenefitDescription(tool.title, tool.slug, tool.category)}
                      </p>
                    </Link>
                  </div>
                  <button
                    type="button"
                    onClick={() => togglePinnedSlug(tool.slug)}
                    title="Unpin tool"
                    aria-label={`Unpin ${tool.title}`}
                    className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/50 transition cursor-pointer shrink-0"
                  >
                    <Star className="w-4 h-4 fill-amber-500" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 p-4 text-xs text-neutral-500">
              Your pinned workspace is empty. Click any <strong>★ Pin</strong> button below or load the starter dock above.
            </div>
          )}

          {/* Recently Used Horizontal Strip (Last 5) */}
          {recentTools.length > 0 && (
            <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2.5">
                <Clock className="w-3.5 h-3.5 text-blue-500" /> Recently Used (Resume Instantly)
              </div>
              <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                {recentTools.map((rt) => (
                  <Link
                    key={rt.slug}
                    href={`/tools/${rt.slug}`}
                    className="shrink-0 min-h-[44px] px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 hover:border-blue-500 transition flex items-center gap-2 text-xs font-semibold text-neutral-800 dark:text-neutral-200"
                  >
                    <span className="truncate max-w-[200px]">{rt.title}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Filtered Search or Category View (Shows all matching URLs on demand without cluttering default feed) */}
      {isFilteringCatalog && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <Search className="w-5 h-5 text-blue-600" />
                {searchQuery ? `Results for "${searchQuery}"` : SYNCED_CATEGORIES.find((c) => c.slug === selectedCategory)?.name}
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Showing {Math.min(visibleCount, filteredTools.length).toLocaleString()} of {filteredTools.length.toLocaleString()} matching tools
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="min-h-[44px] px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-900 cursor-pointer"
            >
              Reset Filter
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {filteredTools.slice(0, visibleCount).map((tool) => {
              const isPinned = pinnedSlugs.includes(tool.slug);
              return (
                <div
                  key={tool.slug}
                  className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-blue-500 hover:shadow-md transition-all group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-neutral-400 mb-1.5">
                      <span className="font-semibold text-neutral-500 truncate max-w-[160px]">
                        {tool.categoryName}
                      </span>
                      <button
                        type="button"
                        onClick={() => togglePinnedSlug(tool.slug)}
                        aria-label={isPinned ? `Unpin ${tool.title}` : `Pin ${tool.title}`}
                        className={`p-1.5 rounded-lg transition cursor-pointer ${
                          isPinned ? 'text-amber-500' : 'text-neutral-300 hover:text-amber-500'
                        }`}
                      >
                        <Star className={`w-4 h-4 ${isPinned ? 'fill-amber-500' : ''}`} />
                      </button>
                    </div>
                    <Link href={`/tools/${tool.slug}`}>
                      <h3 className="text-xs font-bold text-neutral-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition line-clamp-1">
                        {tool.title}
                      </h3>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2">
                        {getToolBenefitDescription(tool.title, tool.slug, tool.category)}
                      </p>
                    </Link>
                  </div>
                  <Link
                    href={`/tools/${tool.slug}`}
                    className="mt-3 pt-2 border-t border-neutral-100 dark:border-neutral-800/60 flex items-center justify-between text-[11px] font-semibold text-blue-600 dark:text-blue-400"
                  >
                    <span>Launch Tool</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
                  </Link>
                </div>
              );
            })}
          </div>

          {filteredTools.length > visibleCount && (
            <div className="text-center py-4">
              <button
                type="button"
                onClick={() =>
                  setExtraPagination((prev) => ({
                    key: filterKey,
                    count: (prev.key === filterKey ? prev.count : 0) + 100,
                  }))
                }
                className="min-h-[44px] px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition cursor-pointer"
              >
                Show More (+100 tools)
              </button>
            </div>
          )}
        </section>
      )}

      {/* Curated Master Unified Tools (De-Cluttered Homepage Core) */}
      {!isFilteringCatalog && (
        <section id="popular" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-5">
            <div>
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" /> Master Unified Workspaces
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Clean grouped powerhouses with built-in exam/KB/state presets—zero duplicate card clutter.
              </p>
            </div>
            <Link
              href="/directory"
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              A&ndash;Z Directory ({TOTAL_TOOLS_LABEL}) <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {MASTER_UNIFIED_CARDS.map((card) => {
              const isPinned = pinnedSlugs.includes(card.slug);
              return (
                <div
                  key={card.id}
                  className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-blue-500 hover:shadow-lg transition-all flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                          {renderMasterIcon(card.id)}
                        </span>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                          {card.badge}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => togglePinnedSlug(card.slug)}
                        aria-label={isPinned ? `Unpin ${card.title}` : `Pin ${card.title}`}
                        className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition cursor-pointer ${
                          isPinned
                            ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/50'
                            : 'text-neutral-400 hover:text-amber-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                        }`}
                      >
                        <Star className={`w-4 h-4 ${isPinned ? 'fill-amber-500' : ''}`} />
                      </button>
                    </div>

                    <Link href={`/tools/${card.slug}`} className="group block">
                      <h3 className="text-base font-bold text-neutral-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                        {card.title}
                      </h3>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                        {card.description}
                      </p>
                    </Link>

                    {/* Built-in Preset Pills */}
                    <div className="flex flex-wrap gap-1.5 mt-3.5">
                      {card.presets.map((p) => (
                        <Link
                          key={p.href + p.label}
                          href={p.href}
                          className="px-2.5 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-blue-600 hover:text-white text-neutral-700 dark:text-neutral-300 text-[11px] font-semibold transition"
                        >
                          {p.label}
                        </Link>
                      ))}
                    </div>
                  </div>

                  <Link
                    href={`/tools/${card.slug}`}
                    className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs font-bold text-blue-600 dark:text-blue-400"
                  >
                    <span>Open Unified Workspace</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Top Leaderboard AdSlot */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AdSlot slotId="home-leaderboard" format="horizontal" />
      </div>

      {/* Interactive Document & Utility Studios */}
      {!isFilteringCatalog && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-5">
            <div>
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                Pro Document Studios
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Multi-step document builders &amp; A&ndash;Z catalog explorer running 100% locally.
              </p>
            </div>
            <Link
              href="/directory"
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              Browse Full A&ndash;Z Directory <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/studio/invoice"
              className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-blue-500 hover:shadow-lg transition group flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white group-hover:text-blue-600 transition">
                  GST Invoice PDF Studio
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  Generate A4 business invoices with CGST/SGST splits &amp; instant PDF export.
                </p>
              </div>
              <div className="mt-4 text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                Open Studio <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </div>
            </Link>

            <Link
              href="/studio/signature"
              className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-purple-500 hover:shadow-lg transition group flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3">
                  <PenTool className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white group-hover:text-purple-600 transition">
                  Signature &amp; PDF Signer
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  Draw signatures, export portal sizes, or stamp directly onto piped PDFs.
                </p>
              </div>
              <div className="mt-4 text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                Open Studio <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </div>
            </Link>

            <Link
              href="/studio/resume"
              className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-emerald-500 hover:shadow-lg transition group flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white group-hover:text-emerald-600 transition">
                  ATS Resume PDF Builder
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  Build clean single-column resumes with live A4 preview &amp; 1-click PDF download.
                </p>
              </div>
              <div className="mt-4 text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                Open Studio <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </div>
            </Link>

            <Link
              href="/directory"
              className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-indigo-500 hover:shadow-lg transition group flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white group-hover:text-indigo-600 transition">
                  A&ndash;Z Complete Directory
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  Browse all {TOTAL_TOOLS_LABEL} utilities by alphabet, category, or SEO route.
                </p>
              </div>
              <div className="mt-4 text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                Explore Index <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* SnapTools Arcade Showcase */}
      {!isFilteringCatalog && (
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

      {/* Category Pills Bar (quick inline filter) + 20 Category Hubs */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600 shrink-0" /> Browse by 20 Category Hubs
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Pick a category chip to filter inline, or open any dedicated category hub.
              </p>
            </div>
            <button
              type="button"
              onClick={openCommandPalette}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              Jump via Ctrl+K <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 w-full">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              Master Feed View
            </button>
            {SYNCED_CATEGORIES.map((c) => (
              <button
                type="button"
                key={c.slug}
                onClick={() => setSelectedCategory(c.slug)}
                className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition cursor-pointer ${
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
