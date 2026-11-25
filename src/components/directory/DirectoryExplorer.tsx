'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Search, Layers, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { TOTAL_TOOLS_LABEL, SYNCED_CATEGORIES } from '@/data/catalogMeta';
import { CORE_TOOLS_LIST, loadFullToolsIndex, SearchToolItem } from '@/data/clientCatalog';
import AdSlot from '@/components/ads/AdSlot';

const LETTERS = [
  'All',
  '#',
  ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
];

type SortMode = 'id-asc' | 'az' | 'za';

const PAGE_SIZE = 96;

export default function DirectoryExplorer() {
  const [catalog, setCatalog] = useState<SearchToolItem[]>(CORE_TOOLS_LIST);
  const [loadingFull, setLoadingFull] = useState(true);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [sortMode, setSortMode] = useState<SortMode>('id-asc');
  const [letter, setLetter] = useState('All');
  const [page, setPage] = useState(1);

  useEffect(() => {
    let active = true;
    loadFullToolsIndex()
      .then((all) => {
        if (!active) return;
        setCatalog(all);
        setLoadingFull(false);
      })
      .catch(() => {
        if (active) setLoadingFull(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matched = catalog.filter((tool) => {
      if (category !== 'all' && tool.category !== category) return false;
      if (letter !== 'All') {
        const ch = tool.title.trim().charAt(0).toUpperCase();
        if (letter === '#') {
          if (/[A-Z]/.test(ch)) return false;
        } else if (ch !== letter) {
          return false;
        }
      }
      if (q) {
        return (
          tool.title.toLowerCase().includes(q) ||
          tool.slug.toLowerCase().includes(q) ||
          tool.categoryName.toLowerCase().includes(q)
        );
      }
      return true;
    });
    if (sortMode === 'az') {
      return [...matched].sort((a, b) => a.title.localeCompare(b.title));
    }
    if (sortMode === 'za') {
      return [...matched].sort((a, b) => b.title.localeCompare(a.title));
    }
    return matched;
  }, [catalog, category, sortMode, letter, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visibleSlice = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const applyFilterReset = (setter: () => void) => {
    setter();
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 mb-2">
            <Layers className="w-3.5 h-3.5" /> Complete Index &bull; {TOTAL_TOOLS_LABEL} Tools
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white">
            A&ndash;Z All-Tools Directory
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Browse every utility by letter, engine type, or category.{' '}
            {loadingFull ? 'Loading complete index...' : `${catalog.length.toLocaleString()} tools indexed locally.`}
          </p>
        </div>

        <div className="text-xs font-mono font-bold text-neutral-600 dark:text-neutral-300">
          {filtered.length.toLocaleString()} matching tools
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 sm:p-5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(e) => applyFilterReset(() => setQuery(e.target.value))}
              placeholder="Filter tools by keyword (e.g. gst, resize, regex, salary, pdf)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-xs sm:text-sm"
            />
          </div>
          <div className="md:col-span-3">
            <select
              value={category}
              onChange={(e) => applyFilterReset(() => setCategory(e.target.value))}
              className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-xs font-semibold"
              aria-label="Filter by category"
            >
              <option value="all">All 20 Categories</option>
              {SYNCED_CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name} ({c.count})
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-3">
            <select
              value={sortMode}
              onChange={(e) => applyFilterReset(() => setSortMode(e.target.value as SortMode))}
              className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-xs font-semibold"
              aria-label="Sort directory"
            >
              <option value="id-asc">Order: Featured (#1+)</option>
              <option value="az">Sort: A &rarr; Z</option>
              <option value="za">Sort: Z &rarr; A</option>
            </select>
          </div>
        </div>

        {/* A-Z Letter Pills */}
        <div className="flex flex-wrap gap-1.5">
          {LETTERS.map((ltr) => (
            <button
              key={ltr}
              onClick={() => applyFilterReset(() => setLetter(ltr))}
              className={`min-w-8 px-2 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition ${
                letter === ltr
                  ? 'bg-blue-600 text-white'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              {ltr}
            </button>
          ))}
        </div>
      </div>

      {/* Results Grid */}
      {visibleSlice.length === 0 ? (
        <div className="py-16 text-center text-sm text-neutral-500">
          No tools matched these filters. Try resetting your letter or keyword!
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {visibleSlice.map((tool) => (
            <Link
              key={tool.slug}
              href={`/tools/${tool.slug}`}
              className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-blue-500 hover:shadow-md transition group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-[10px] text-neutral-400 mb-1">
                  <span className="font-semibold text-blue-600 dark:text-blue-400 truncate max-w-[180px]">
                    {tool.categoryName}
                  </span>
                  <span className="font-mono">#{tool.id}</span>
                </div>
                <div className="text-xs font-bold text-neutral-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 line-clamp-1">
                  {tool.title}
                </div>
              </div>
              <div className="mt-2.5 pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                <span>Open</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage <= 1}
            className="px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" /> Prev
          </button>
          <span className="text-xs font-mono font-bold">
            Page {safePage} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage >= totalPages}
            className="px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-40"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      <AdSlot slotId="directory-bottom-banner" format="horizontal" />
    </div>
  );
}
