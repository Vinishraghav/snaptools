'use client';

import React, { useState, useEffect, useRef, useMemo, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Bookmark,
  Clock,
  ChevronDown,
  X,
  Layers,
  Sparkles,
  Gamepad2,
  Dices,
  Sun,
  Moon,
  Briefcase,
  FileText,
  PenTool,
  FileCheck2,
  BookOpen,
  Trash2,
} from 'lucide-react';
import Logo from '@/components/brand/Logo';
import { SYNCED_CATEGORIES, TOTAL_TOOLS_LABEL } from '@/data/catalogMeta';
import { CORE_TOOLS_LIST, loadFullToolsIndex, SearchToolItem } from '@/data/clientCatalog';

const THEME_EVENT = 'snaptools-theme-update';
const STORAGE_EVENT = 'snaptools-storage-update';

function subscribeTheme(cb: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(THEME_EVENT, cb);
  return () => window.removeEventListener(THEME_EVENT, cb);
}

function getThemeSnapshot(): boolean {
  if (typeof document === 'undefined') return false;
  return document.documentElement.classList.contains('dark');
}

function subscribeStorage(cb: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(STORAGE_EVENT, cb);
  window.addEventListener('storage', cb);
  return () => {
    window.removeEventListener(STORAGE_EVENT, cb);
    window.removeEventListener('storage', cb);
  };
}

let cachedFavRaw: string | null = null;
let cachedFavList: string[] = [];
const EMPTY_SLUGS: string[] = [];

function getFavoritesSnapshot(): string[] {
  if (typeof window === 'undefined') return EMPTY_SLUGS;
  try {
    const raw = localStorage.getItem('omnitools_favorites') || '[]';
    if (raw !== cachedFavRaw) {
      cachedFavRaw = raw;
      const parsed = JSON.parse(raw);
      cachedFavList = Array.isArray(parsed) ? parsed : [];
    }
    return cachedFavList;
  } catch {
    return EMPTY_SLUGS;
  }
}

let cachedRecentsRaw: string | null = null;
let cachedRecentsList: string[] = [];

function getRecentsSnapshot(): string[] {
  if (typeof window === 'undefined') return EMPTY_SLUGS;
  try {
    const raw = localStorage.getItem('omnitools_recents') || '[]';
    if (raw !== cachedRecentsRaw) {
      cachedRecentsRaw = raw;
      const parsed = JSON.parse(raw);
      cachedRecentsList = Array.isArray(parsed) ? parsed : [];
    }
    return cachedRecentsList;
  } catch {
    return EMPTY_SLUGS;
  }
}

function getServerEmptySlugs(): string[] {
  return EMPTY_SLUGS;
}

export default function Header() {
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [savedOpen, setSavedOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [catalog, setCatalog] = useState<SearchToolItem[]>(CORE_TOOLS_LIST);
  const [catMenuOpen, setCatMenuOpen] = useState(false);
  const [studioMenuOpen, setStudioMenuOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const isDark = useSyncExternalStore(subscribeTheme, getThemeSnapshot, () => false);
  const favoriteSlugs = useSyncExternalStore(
    subscribeStorage,
    getFavoritesSnapshot,
    getServerEmptySlugs
  );
  const recentSlugs = useSyncExternalStore(
    subscribeStorage,
    getRecentsSnapshot,
    getServerEmptySlugs
  );

  const bySlug = useMemo(() => new Map(catalog.map((t) => [t.slug, t])), [catalog]);

  const recentTools = useMemo(
    () =>
      recentSlugs
        .map((s) => bySlug.get(s))
        .filter((t): t is SearchToolItem => Boolean(t))
        .slice(0, 6),
    [recentSlugs, bySlug]
  );

  const savedTools = useMemo(
    () =>
      favoriteSlugs
        .map((s) => bySlug.get(s))
        .filter((t): t is SearchToolItem => Boolean(t)),
    [favoriteSlugs, bySlug]
  );

  const searchResults = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return [];
    return catalog
      .filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.categoryName.toLowerCase().includes(q) ||
          t.slug.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [searchQuery, catalog]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setSearchOpen(false);
        setSavedOpen(false);
        setCatMenuOpen(false);
        setStudioMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (searchOpen || savedOpen) {
      loadFullToolsIndex().then((all) => {
        setCatalog(all);
      });
    }
    if (searchOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [searchOpen, savedOpen]);

  const selectTool = (slug: string) => {
    setSearchOpen(false);
    setSavedOpen(false);
    setSearchQuery('');
    router.push(`/tools/${slug}`);
  };

  const toggleTheme = () => {
    const nextDark = !document.documentElement.classList.contains('dark');
    document.documentElement.classList.toggle('dark', nextDark);
    try {
      localStorage.setItem('snaptools_theme', nextDark ? 'dark' : 'light');
    } catch {
      // ignore
    }
    window.dispatchEvent(new Event(THEME_EVENT));
  };

  const removeFavorite = (slug: string) => {
    try {
      const next = favoriteSlugs.filter((s) => s !== slug);
      localStorage.setItem('omnitools_favorites', JSON.stringify(next));
      window.dispatchEvent(new Event(STORAGE_EVENT));
    } catch {
      // ignore
    }
  };

  const handleSurpriseMe = async () => {
    let pool = catalog;
    if (pool.length <= CORE_TOOLS_LIST.length) {
      try {
        const full = await loadFullToolsIndex();
        if (full.length > 0) {
          pool = full;
          setCatalog(full);
        }
      } catch {
        // fall back to loaded catalog
      }
    }
    if (pool.length === 0) return;
    const picked = pool[Math.floor(Math.random() * pool.length)];
    router.push(`/tools/${picked.slug}`);
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-neutral-200/80 dark:border-neutral-800/80 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* Handcrafted Brand Logo */}
          <Logo />

          {/* Quick Search trigger (desktop) */}
          <button
            onClick={() => setSearchOpen(true)}
            className="hidden md:flex items-center gap-3 w-64 lg:w-80 px-3.5 py-2 rounded-xl text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-100/80 dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition cursor-pointer"
          >
            <Search className="w-4 h-4 text-neutral-400" />
            <span className="flex-1 text-left truncate">Search {TOTAL_TOOLS_LABEL} tools...</span>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded shadow-xs">
              Ctrl K
            </kbd>
          </button>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-1.5">
            {/* Studios dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setStudioMenuOpen((v) => !v);
                  setCatMenuOpen(false);
                }}
                className="flex items-center gap-1.5 px-2.5 py-2 text-xs font-semibold rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition cursor-pointer"
              >
                <Briefcase className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline">Studios</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-60" />
              </button>

              {studioMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl p-2 z-50 text-xs space-y-1"
                  onClick={() => setStudioMenuOpen(false)}
                >
                  <div className="px-3 py-1.5 font-semibold text-neutral-400 uppercase text-[10px] tracking-wider">
                    Pro Web Studios
                  </div>
                  <Link
                    href="/studio/invoice"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-semibold"
                  >
                    <FileText className="w-4 h-4 text-blue-600" /> GST Invoice PDF Maker
                  </Link>
                  <Link
                    href="/studio/signature"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-semibold"
                  >
                    <PenTool className="w-4 h-4 text-purple-600" /> Signature &amp; PDF Signer
                  </Link>
                  <Link
                    href="/studio/resume"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-semibold"
                  >
                    <FileCheck2 className="w-4 h-4 text-emerald-600" /> ATS Resume PDF Builder
                  </Link>
                  <Link
                    href="/directory"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-semibold border-t border-neutral-100 dark:border-neutral-800 mt-1 pt-2.5"
                  >
                    <BookOpen className="w-4 h-4 text-indigo-500" /> A&ndash;Z Directory ({TOTAL_TOOLS_LABEL})
                  </Link>
                </div>
              )}
            </div>

            {/* Categories dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setCatMenuOpen(!catMenuOpen);
                  setStudioMenuOpen(false);
                }}
                className="flex items-center gap-1.5 px-2.5 py-2 text-xs font-semibold rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition cursor-pointer"
              >
                <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="hidden xl:inline">Categories</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-60" />
              </button>

              {catMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-72 max-h-96 overflow-y-auto rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl p-2 z-50 text-xs"
                  onClick={() => setCatMenuOpen(false)}
                >
                  <div className="px-3 py-2 font-semibold text-neutral-400 uppercase text-[10px] tracking-wider">
                    20 Tool Categories
                  </div>
                  {SYNCED_CATEGORIES.map((cat) => (
                    <Link
                      key={cat.slug}
                      href={`/category/${cat.slug}`}
                      className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition text-neutral-800 dark:text-neutral-200"
                    >
                      <span>{cat.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 font-mono">
                        {cat.count}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile Search Button */}
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Search tools"
              className="md:hidden p-2 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Popular tools link */}
            <Link
              href="/#popular"
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-2 text-xs font-semibold rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Popular</span>
            </Link>

            {/* Arcade Mini-Games link */}
            <Link
              href="/arcade"
              className="flex items-center gap-1.5 px-2.5 py-2 text-xs font-bold rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition"
            >
              <Gamepad2 className="w-4 h-4 text-amber-500" />
              <span className="hidden sm:inline">Arcade</span>
            </Link>

            {/* Saved Bookmarks & Recents button */}
            <button
              onClick={() => setSavedOpen(true)}
              title="View Saved Bookmarks & Recently Used Tools"
              aria-label="Saved tools and recent history"
              className="relative flex items-center gap-1 px-2.5 py-2 text-xs font-semibold rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition cursor-pointer"
            >
              <Bookmark className="w-4 h-4 text-amber-500" />
              <span className="hidden xl:inline">Saved</span>
              {favoriteSlugs.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-black leading-tight">
                  {favoriteSlugs.length}
                </span>
              )}
            </button>

            {/* Surprise Random Tool button */}
            <button
              onClick={handleSurpriseMe}
              title={`Open a random tool from all ${TOTAL_TOOLS_LABEL} utilities`}
              aria-label="Open a random tool"
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-2 text-xs font-semibold rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition cursor-pointer"
            >
              <Dices className="w-4 h-4 text-purple-500" />
            </button>

            {/* Light / Dark Theme Toggle */}
            <button
              onClick={toggleTheme}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="p-2 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition cursor-pointer"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
          </nav>
        </div>
      </header>

      {/* Saved & Recent Tools Modal */}
      {savedOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-start justify-center p-4 sm:p-6 md:p-20"
          onClick={() => setSavedOpen(false)}
        >
          <div
            className="w-full max-w-xl bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2 text-sm font-black text-neutral-900 dark:text-white">
                <Bookmark className="w-4 h-4 text-amber-500" /> Saved Tools &amp; History
              </div>
              <button
                onClick={() => setSavedOpen(false)}
                aria-label="Close saved tools"
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto p-4 space-y-5 text-xs">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2">
                  Bookmarked ({savedTools.length})
                </div>
                {savedTools.length === 0 ? (
                  <p className="text-neutral-500 py-3">
                    No saved tools yet. Click &ldquo;Save&rdquo; on any tool page to bookmark it here!
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {savedTools.map((t) => (
                      <div
                        key={t.slug}
                        className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-blue-500 transition"
                      >
                        <button
                          onClick={() => selectTool(t.slug)}
                          className="flex-1 text-left cursor-pointer"
                        >
                          <div className="font-bold text-neutral-900 dark:text-white">{t.title}</div>
                          <div className="text-[11px] text-neutral-500">{t.categoryName}</div>
                        </button>
                        <button
                          onClick={() => removeFavorite(t.slug)}
                          aria-label={`Remove ${t.title} from saved`}
                          className="p-1.5 text-neutral-400 hover:text-rose-500 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {recentTools.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Recently Used
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {recentTools.map((rt) => (
                      <button
                        key={rt.slug}
                        onClick={() => selectTool(rt.slug)}
                        className="p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-left cursor-pointer"
                      >
                        <div className="font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                          {rt.title}
                        </div>
                        <div className="text-[10px] text-neutral-400 truncate">{rt.categoryName}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Global Instant Search Modal */}
      {searchOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-start justify-center p-4 sm:p-6 md:p-20"
          onClick={() => setSearchOpen(false)}
        >
          <div
            className="w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input bar */}
            <div className="flex items-center px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
              <Search className="w-5 h-5 text-neutral-400 mr-3 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search across all ${TOTAL_TOOLS_LABEL} tools (e.g. PDF merge, EMI, QR Code, PNG)...`}
                className="w-full bg-transparent text-sm focus:outline-hidden text-neutral-900 dark:text-white placeholder-neutral-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search input"
                  className="p-1 text-neutral-400 hover:text-neutral-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setSearchOpen(false)}
                className="ml-2 px-2 py-1 text-xs rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500 font-mono"
              >
                ESC
              </button>
            </div>

            {/* Results or Suggestions */}
            <div className="max-h-96 overflow-y-auto p-3 divide-y divide-neutral-100 dark:divide-neutral-800/60">
              {searchQuery.trim() ? (
                searchResults.length > 0 ? (
                  searchResults.map((tool) => (
                    <div
                      key={tool.slug}
                      onClick={() => selectTool(tool.slug)}
                      className="p-3 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/80 cursor-pointer transition flex items-center justify-between group"
                    >
                      <div className="pr-4">
                        <div className="text-sm font-semibold text-neutral-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                          {tool.title}
                        </div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1 mt-0.5">
                          Free client-side {tool.categoryName} utility &bull; Tool #{tool.id}
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-medium shrink-0">
                        {tool.categoryName}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-sm text-neutral-500">
                    No micro-tools found for &ldquo;{searchQuery}&rdquo;. Try another keyword!
                  </div>
                )
              ) : (
                <div className="p-2 space-y-4">
                  {/* Recent Tools */}
                  {recentTools.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                        <Clock className="w-3.5 h-3.5" /> Recently Used
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {recentTools.map((rt) => (
                          <div
                            key={rt.slug}
                            onClick={() => selectTool(rt.slug)}
                            className="p-2.5 rounded-xl border border-neutral-200/70 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 cursor-pointer flex items-center justify-between text-xs"
                          >
                            <span className="font-medium text-neutral-800 dark:text-neutral-200 truncate">
                              {rt.title}
                            </span>
                            <span className="text-[10px] text-neutral-400 ml-2">{rt.categoryName}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Popular quick searches */}
                  <div>
                    <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                      Popular Micro-Tools
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[
                        'pdf-merge',
                        'image-compressor-lossy-lossless',
                        'home-loan-emi-calculator',
                        'website-url-qr-code-generator',
                        'json-formatter-validator',
                        'csv-to-json-converter',
                        'strong-password-generator',
                        'bmi-body-mass-index-calculator',
                        'exact-age-calculator-years-months-days-seconds'
                      ].map((slug) => {
                        const tool = catalog.find((t) => t.slug === slug);
                        if (!tool) return null;
                        return (
                          <button
                            key={slug}
                            onClick={() => selectTool(slug)}
                            className="px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-blue-50 dark:hover:bg-blue-950/60 hover:text-blue-600 dark:hover:text-blue-400 text-xs font-medium transition"
                          >
                            {tool.title}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
