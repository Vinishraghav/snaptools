'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Bookmark,
  Clock,
  ChevronDown,
  X,
  ExternalLink,
  Layers,
  Sparkles,
  Heart,
} from 'lucide-react';
import Logo from '@/components/brand/Logo';
import { TOOLS_REGISTRY, ToolDef, TOTAL_TOOLS_LABEL } from '@/data/toolsRegistry';
import { CATEGORIES } from '@/data/categories';

export default function Header() {
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ToolDef[]>([]);
  const [recentTools, setRecentTools] = useState<ToolDef[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [catMenuOpen, setCatMenuOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load recent & favorites from localStorage
    try {
      const recents: string[] = JSON.parse(localStorage.getItem('omnitools_recents') || '[]');
      const favs: string[] = JSON.parse(localStorage.getItem('omnitools_favorites') || '[]');
      setFavorites(favs);
      const recentDefs = recents
        .map((slug) => TOOLS_REGISTRY.find((t) => t.slug === slug))
        .filter((t): t is ToolDef => Boolean(t))
        .slice(0, 5);
      setRecentTools(recentDefs);
    } catch {
      // fallback
    }

    // Keyboard shortcut: Ctrl+K or Cmd+K
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setSearchOpen(false);
        setCatMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [searchOpen]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const q = searchQuery.toLowerCase().trim();
    const hits = TOOLS_REGISTRY.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.categoryName.toLowerCase().includes(q) ||
        t.keywords.some((k) => k.toLowerCase().includes(q)) ||
        t.description.toLowerCase().includes(q)
    ).slice(0, 8);
    setSearchResults(hits);
  }, [searchQuery]);

  const selectTool = (slug: string) => {
    setSearchOpen(false);
    setSearchQuery('');
    router.push(`/tools/${slug}`);
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-neutral-200/80 dark:border-neutral-800/80 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Handcrafted Brand Logo */}
          <Logo />

          {/* Quick Search trigger (desktop) */}
          <button
            onClick={() => setSearchOpen(true)}
            className="hidden md:flex items-center gap-3 w-72 lg:w-96 px-3.5 py-2 rounded-xl text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-100/80 dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition"
          >
            <Search className="w-4 h-4 text-neutral-400" />
            <span className="flex-1 text-left">Search {TOTAL_TOOLS_LABEL} client-side tools...</span>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded shadow-xs">
              Ctrl K
            </kbd>
          </button>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-2">
            {/* Categories dropdown */}
            <div className="relative">
              <button
                onClick={() => setCatMenuOpen(!catMenuOpen)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition"
              >
                <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="hidden sm:inline">Categories</span>
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
                  {CATEGORIES.map((cat) => (
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
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="hidden sm:inline">Popular</span>
            </Link>
          </nav>
        </div>
      </header>

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
                          {tool.description}
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
                        const tool = TOOLS_REGISTRY.find((t) => t.slug === slug);
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
