'use client';

import React, { useState, useEffect, useMemo, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Star,
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
  Download,
  CheckCircle2,
} from 'lucide-react';
import Logo from '@/components/brand/Logo';
import CommandPalette from '@/components/layout/CommandPalette';
import { SYNCED_CATEGORIES, TOTAL_TOOLS_LABEL } from '@/data/catalogMeta';
import { CORE_TOOLS_LIST, loadFullToolsIndex, SearchToolItem } from '@/data/clientCatalog';
import { usePinnedSlugs, useRecentSlugs, togglePinnedSlug } from '@/lib/workspacePrefs';
import { usePwaInstallStatus, triggerPwaInstall } from '@/lib/pwaInstall';

const THEME_EVENT = 'snaptools-theme-update';

function subscribeTheme(cb: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(THEME_EVENT, cb);
  return () => window.removeEventListener(THEME_EVENT, cb);
}

function getThemeSnapshot(): boolean {
  if (typeof document === 'undefined') return false;
  return document.documentElement.classList.contains('dark');
}

export default function Header() {
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [savedOpen, setSavedOpen] = useState(false);
  const [installTipOpen, setInstallTipOpen] = useState(false);
  const [catalog, setCatalog] = useState<SearchToolItem[]>(CORE_TOOLS_LIST);
  const [catMenuOpen, setCatMenuOpen] = useState(false);
  const [studioMenuOpen, setStudioMenuOpen] = useState(false);

  const isDark = useSyncExternalStore(subscribeTheme, getThemeSnapshot, () => false);
  const pinnedSlugs = usePinnedSlugs();
  const recentSlugs = useRecentSlugs();
  const { isInstalled } = usePwaInstallStatus();

  const bySlug = useMemo(() => new Map(catalog.map((t) => [t.slug, t])), [catalog]);

  const recentTools = useMemo(
    () =>
      recentSlugs
        .map((s) => bySlug.get(s))
        .filter((t): t is SearchToolItem => Boolean(t))
        .slice(0, 5),
    [recentSlugs, bySlug]
  );

  const pinnedTools = useMemo(
    () =>
      pinnedSlugs
        .map((s) => bySlug.get(s))
        .filter((t): t is SearchToolItem => Boolean(t)),
    [pinnedSlugs, bySlug]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setSearchOpen(false);
        setSavedOpen(false);
        setCatMenuOpen(false);
        setStudioMenuOpen(false);
        setInstallTipOpen(false);
      }
    };
    const handleOpenPalette = () => setSearchOpen(true);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('snaptools-open-palette', handleOpenPalette);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('snaptools-open-palette', handleOpenPalette);
    };
  }, []);

  useEffect(() => {
    let active = true;
    if (searchOpen || savedOpen) {
      loadFullToolsIndex().then((all) => {
        if (active && all.length > 0) setCatalog(all);
      });
    }
    return () => {
      active = false;
    };
  }, [searchOpen, savedOpen]);

  const selectTool = (slug: string) => {
    setSearchOpen(false);
    setSavedOpen(false);
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

  const handleInstallClick = async () => {
    const outcome = await triggerPwaInstall();
    if (outcome === 'manual') {
      setInstallTipOpen((prev) => !prev);
    } else {
      setInstallTipOpen(false);
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
      <header className="sticky top-0 z-40 w-full border-b border-neutral-200/80 dark:border-neutral-800/80 bg-white/85 dark:bg-neutral-950/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-1.5 sm:gap-3">
          <Logo />

          {/* Command Palette Trigger (Desktop) */}
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="hidden md:flex items-center gap-2 w-52 lg:w-64 min-h-[44px] px-3 rounded-xl text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-100/80 dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 hover:border-blue-400 dark:hover:border-blue-700 transition cursor-pointer shrink-0"
          >
            <Search className="w-4 h-4 text-neutral-400 shrink-0" />
            <span className="flex-1 text-left truncate">Search {TOTAL_TOOLS_LABEL} tools...</span>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded shadow-xs shrink-0">
              Ctrl K
            </kbd>
          </button>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1">
            {/* Studios dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setStudioMenuOpen((v) => !v);
                  setCatMenuOpen(false);
                }}
                className="flex items-center gap-1.5 min-h-[44px] px-2.5 text-xs font-semibold rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition cursor-pointer"
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
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-semibold"
                  >
                    <FileText className="w-4 h-4 text-blue-600" /> GST Invoice PDF Maker
                  </Link>
                  <Link
                    href="/studio/signature"
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-semibold"
                  >
                    <PenTool className="w-4 h-4 text-purple-600" /> Signature &amp; PDF Signer
                  </Link>
                  <Link
                    href="/studio/resume"
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-semibold"
                  >
                    <FileCheck2 className="w-4 h-4 text-emerald-600" /> ATS Resume PDF Builder
                  </Link>
                  <Link
                    href="/directory"
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-semibold border-t border-neutral-100 dark:border-neutral-800 mt-1 pt-2.5"
                  >
                    <BookOpen className="w-4 h-4 text-indigo-500" /> A&ndash;Z Directory ({TOTAL_TOOLS_LABEL})
                  </Link>
                </div>
              )}
            </div>

            {/* Categories dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setCatMenuOpen(!catMenuOpen);
                  setStudioMenuOpen(false);
                }}
                className="flex items-center gap-1.5 min-h-[44px] px-2.5 text-xs font-semibold rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition cursor-pointer"
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
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition text-neutral-800 dark:text-neutral-200"
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
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Search tools"
              className="md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Popular tools link */}
            <Link
              href="/#popular"
              className="hidden lg:flex items-center gap-1.5 min-h-[44px] px-2.5 text-xs font-semibold rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Popular</span>
            </Link>

            {/* Arcade Mini-Games link */}
            <Link
              href="/arcade"
              className="flex items-center gap-1.5 min-h-[44px] px-2.5 text-xs font-bold rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition"
            >
              <Gamepad2 className="w-4 h-4 text-amber-500" />
              <span className="hidden sm:inline">Arcade</span>
            </Link>

            {/* Pinned & Recent Dock Drawer */}
            <button
              type="button"
              onClick={() => setSavedOpen(true)}
              title="View Pinned Workspace & Recently Used Tools"
              aria-label="Pinned tools and recent history"
              className="relative flex items-center gap-1 min-h-[44px] px-2.5 text-xs font-semibold rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition cursor-pointer"
            >
              <Star className={`w-4 h-4 ${pinnedSlugs.length > 0 ? 'fill-amber-500 text-amber-500' : 'text-amber-500'}`} />
              <span className="hidden xl:inline">Pinned</span>
              {pinnedSlugs.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-black leading-tight">
                  {pinnedSlugs.length}
                </span>
              )}
            </button>

            {/* PWA Install App (Works Offline) button */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={handleInstallClick}
                title={isInstalled ? 'SnapTools Installed (Offline Ready)' : 'Install App (Works Offline)'}
                aria-label="Install Offline App"
                className={`flex items-center gap-1.5 min-h-[44px] px-2.5 text-xs font-bold rounded-lg border transition cursor-pointer whitespace-nowrap shrink-0 ${
                  isInstalled
                    ? 'border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                    : 'border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50'
                }`}
              >
                {isInstalled ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span className="hidden lg:inline">Offline Ready</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 shrink-0" />
                    <span className="hidden lg:inline">Install App</span>
                    <span className="hidden 2xl:inline text-[10px] opacity-80 font-medium">(Works Offline)</span>
                  </>
                )}
              </button>

              {installTipOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl p-3.5 z-50 text-xs space-y-2">
                  <div className="flex items-center justify-between font-bold text-neutral-900 dark:text-white">
                    <span>Install SnapTools Offline PWA</span>
                    <button
                      type="button"
                      onClick={() => setInstallTipOpen(false)}
                      className="text-neutral-400 hover:text-neutral-700 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    Service Worker offline caching is active! In Chrome/Edge, click the{' '}
                    <strong>Install</strong> icon in the address bar; on iOS Safari tap{' '}
                    <strong>Share &rarr; Add to Home Screen</strong>.
                  </p>
                </div>
              )}
            </div>

            {/* Surprise Random Tool button */}
            <button
              type="button"
              onClick={handleSurpriseMe}
              title={`Open a random tool from all ${TOTAL_TOOLS_LABEL} utilities`}
              aria-label="Open a random tool"
              className="hidden sm:flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition cursor-pointer"
            >
              <Dices className="w-4 h-4 text-purple-500" />
            </button>

            {/* Light / Dark Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition cursor-pointer"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
          </nav>
        </div>
      </header>

      {/* Pinned Workspace & Recent History Modal */}
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
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" /> Pinned Workspace &amp; History
              </div>
              <button
                type="button"
                onClick={() => setSavedOpen(false)}
                aria-label="Close pinned workspace"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto p-4 space-y-5 text-xs">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2">
                  Pinned Tools ({pinnedTools.length}/12)
                </div>
                {pinnedTools.length === 0 ? (
                  <p className="text-neutral-500 py-3">
                    No pinned tools yet. Click the ★ icon on any tool card or tool header to pin up to 12 daily drivers.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {pinnedTools.map((t) => (
                      <div
                        key={t.slug}
                        className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-blue-500 transition"
                      >
                        <button
                          type="button"
                          onClick={() => selectTool(t.slug)}
                          className="flex-1 text-left cursor-pointer"
                        >
                          <div className="font-bold text-neutral-900 dark:text-white">{t.title}</div>
                          <div className="text-[11px] text-neutral-500">{t.categoryName}</div>
                        </button>
                        <button
                          type="button"
                          onClick={() => togglePinnedSlug(t.slug)}
                          aria-label={`Unpin ${t.title}`}
                          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-neutral-400 hover:text-rose-500 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {recentTools.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Recently Used (Last 5)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {recentTools.map((rt) => (
                      <button
                        type="button"
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

      {/* Upgraded Raycast-Style Ctrl+K Command Palette */}
      <CommandPalette
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        catalog={catalog}
        isDark={isDark}
        onToggleTheme={toggleTheme}
      />
    </>
  );
}
