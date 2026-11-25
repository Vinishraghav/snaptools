'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Search } from 'lucide-react';
import { loadFullToolsIndex, SearchToolItem } from '@/data/clientCatalog';

interface Props {
  categorySlug: string;
  categoryName: string;
  initialTools: SearchToolItem[];
  totalCount: number;
}

export default function CategoryToolsGrid({
  categorySlug,
  categoryName,
  initialTools,
  totalCount,
}: Props) {
  const [allCatTools, setAllCatTools] = useState<SearchToolItem[]>(initialTools);
  const [query, setQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(120);

  useEffect(() => {
    let active = true;
    loadFullToolsIndex().then((all) => {
      if (!active) return;
      const filtered = all.filter((t) => t.category === categorySlug);
      if (filtered.length > 0) setAllCatTools(filtered);
    });
    return () => {
      active = false;
    };
  }, [categorySlug]);

  useEffect(() => {
    setVisibleCount(120);
  }, [query]);

  const matching = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allCatTools;
    return allCatTools.filter(
      (t) => t.title.toLowerCase().includes(q) || t.slug.toLowerCase().includes(q)
    );
  }, [allCatTools, query]);

  return (
    <section className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
          All {totalCount.toLocaleString()} Micro-Tools in {categoryName}
        </h2>
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Filter ${categoryName}...`}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs focus:outline-hidden focus:border-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {matching.slice(0, visibleCount).map((tool) => (
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
                Free client-side {tool.title}. Runs 100% locally inside your browser with zero uploads.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs font-semibold text-blue-600 dark:text-blue-400">
              <span>Launch Tool</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </div>
          </Link>
        ))}
      </div>

      {matching.length > visibleCount && (
        <div className="text-center pt-4 space-y-2">
          <p className="text-xs text-neutral-500">
            Showing {visibleCount.toLocaleString()} of {matching.length.toLocaleString()} matching tools
          </p>
          <button
            onClick={() => setVisibleCount((prev) => prev + 120)}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition cursor-pointer"
          >
            Show More (+120 tools)
          </button>
        </div>
      )}
    </section>
  );
}
