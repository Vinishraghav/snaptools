'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  X,
  Clock,
  Star,
  Zap,
  Sun,
  Moon,
  Trash2,
  Download,
  FileText,
  ArrowUp,
  ArrowDown,
  CornerDownLeft,
} from 'lucide-react';
import { TOTAL_TOOLS_LABEL } from '@/data/catalogMeta';
import { SearchToolItem } from '@/data/clientCatalog';
import { getToolBenefitDescription } from '@/lib/toolDescriptions';
import {
  usePinnedSlugs,
  useRecentSlugs,
  clearLocalWorkspaceCache,
} from '@/lib/workspacePrefs';
import { triggerPwaInstall } from '@/lib/pwaInstall';

type FilterTab = {
  id: string;
  label: string;
  categories?: string[];
};

const FILTER_TABS: FilterTab[] = [
  { id: 'all', label: 'All' },
  { id: 'pdf', label: 'PDF', categories: ['pdf-tools'] },
  { id: 'image', label: 'Image', categories: ['image-editing-optimization'] },
  {
    id: 'finance',
    label: 'Finance & Tax',
    categories: ['indian-finance-tax-calculators', 'business-ecommerce-accounting'],
  },
  {
    id: 'land',
    label: 'Land & Units',
    categories: ['construction-home-land-measurement', 'unit-measurement-converters'],
  },
  {
    id: 'dev',
    label: 'Dev & Data',
    categories: ['developer-code-formatters', 'data-csv-spreadsheet', 'cryptography-security-networking'],
  },
];

const SYNONYMS: Record<string, string[]> = {
  cent: ['indian-land-area', 'land', 'area', 'cent'],
  ground: ['indian-land-area', 'ground', 'sq-feet'],
  patta: ['indian-land-area', 'land', 'bigha', 'guntha'],
  bigha: ['indian-land-area', 'bigha'],
  guntha: ['indian-land-area', 'guntha'],
  kanal: ['indian-land-area', 'kanal', 'marla'],
  marla: ['indian-land-area', 'marla', 'kanal'],
  '20kb': ['compress-image-to-20kb', '20kb', 'passport', 'signature'],
  '50kb': ['compress-image-to-50kb', '50kb', 'passport'],
  '100kb': ['compress-image-to-100kb', '100kb', 'pdf'],
  gst: ['gst', 'invoice', 'tax'],
  upsc: ['passport', 'compress', 'resizer', 'pdf-compressor'],
  tnpsc: ['passport', 'compress', 'resizer', 'pdf-compressor'],
  ssc: ['passport', 'compress', 'resizer'],
  ibps: ['passport', 'compress', 'resizer'],
  sbi: ['passport', 'compress', 'emi', 'ppf'],
  pan: ['passport', 'resizer', '20kb'],
  itr: ['income-tax', 'salary', 'tax'],
  regime: ['income-tax', 'indian-income-tax'],
  webp: ['webp', 'jpg-png-to-webp'],
  exif: ['exif', 'gps'],
  ts: ['typescript', 'json-to-typescript'],
};

function fuzzyScoreTool(query: string, tool: SearchToolItem): number {
  const q = query.toLowerCase().trim();
  if (!q) return 0;

  const titleL = tool.title.toLowerCase();
  const slugL = tool.slug.toLowerCase();
  const catL = tool.categoryName.toLowerCase();

  let score = 0;
  if (titleL === q || slugL === q) score += 260;

  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const wordRe = new RegExp(`(?:^|\\b|-)${escaped}(?:\\b|-|$)`);
  if (wordRe.test(titleL)) score += 170;
  else if (wordRe.test(slugL)) score += 150;
  else if (titleL.startsWith(q)) score += 75;
  else if (titleL.includes(q)) score += 45;
  else if (slugL.includes(q)) score += 35;
  if (catL.includes(q)) score += 20;

  const tokens = q.split(/\s+/).filter(Boolean);
  for (const tok of tokens) {
    const tokEsc = tok.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const tokWordRe = new RegExp(`(?:^|\\b|-)${tokEsc}(?:\\b|-|$)`);
    if (tokWordRe.test(titleL)) score += 70;
    else if (SYNONYMS[tok]?.some((syn) => slugL.startsWith(syn) || slugL.includes(syn))) {
      score += 110;
    } else if (titleL.includes(tok)) score += 25;
    else if (slugL.includes(tok)) score += 18;
    else if (tok.length >= 3) {
      // Ordered fuzzy character subsequence check for typo tolerance
      let ti = 0;
      for (let i = 0; i < titleL.length && ti < tok.length; i++) {
        if (titleL[i] === tok[ti]) ti++;
      }
      if (ti === tok.length) {
        score += 12;
      } else if (tok.length >= 4) {
        // Allow 1 missing char anywhere inside token
        let matchedChars = 0;
        let idx = 0;
        for (const ch of tok) {
          const found = slugL.indexOf(ch, idx);
          if (found !== -1) {
            matchedChars++;
            idx = found + 1;
          }
        }
        if (matchedChars >= tok.length - 1) score += 8;
      }
    }
  }

  // Prefer core utility IDs slightly when tied
  if (score > 0 && tool.id <= 1050) score += 5;
  return score;
}

interface QuickAction {
  id: string;
  label: string;
  hint: string;
  keywords: string;
  kind: 'navigate' | 'theme' | 'cache' | 'install';
  href?: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'qa-gst-studio',
    label: 'Open GST Studio (Invoice PDF)',
    hint: 'Create A4 CGST/SGST invoices offline',
    keywords: 'open gst studio invoice pdf billing',
    kind: 'navigate',
    href: '/studio/invoice',
  },
  {
    id: 'qa-sign-studio',
    label: 'Open Signature & PDF Signer',
    hint: 'Draw/type signatures & stamp any PDF',
    keywords: 'open signature pad sign pdf exam',
    kind: 'navigate',
    href: '/studio/signature',
  },
  {
    id: 'qa-land-matrix',
    label: 'Open Unified Indian Land Matrix',
    hint: 'Cent, Ground, Bigha, Guntha, Acre converter',
    keywords: 'land area converter cent ground bigha patta',
    kind: 'navigate',
    href: '/tools/indian-land-area-converter-cent-ground-guntha-bigha-kanal-marla',
  },
  {
    id: 'qa-theme',
    label: 'Toggle Dark/Light Mode',
    hint: 'Switch theme instantly',
    keywords: 'toggle dark light mode theme appearance',
    kind: 'theme',
  },
  {
    id: 'qa-cache',
    label: 'Clear Local Cache',
    hint: 'Reset saved pins and recent history',
    keywords: 'clear local cache reset history storage',
    kind: 'cache',
  },
  {
    id: 'qa-install',
    label: 'Install Offline App (PWA)',
    hint: 'Run calculators, converters & tools offline',
    keywords: 'install offline app pwa desktop mobile',
    kind: 'install',
  },
];

export default function CommandPalette({
  open,
  onClose,
  catalog,
  isDark,
  onToggleTheme,
}: {
  open: boolean;
  onClose: () => void;
  catalog: SearchToolItem[];
  isDark: boolean;
  onToggleTheme: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [tabIdx, setTabIdx] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const pinnedSlugs = usePinnedSlugs();
  const recentSlugs = useRecentSlugs();
  const activeTab = FILTER_TABS[tabIdx];

  useEffect(() => {
    if (open) {
      const id = setTimeout(() => {
        setStatusNotice(null);
        setActiveIndex(0);
        inputRef.current?.focus();
      }, 20);
      return () => clearTimeout(id);
    }
  }, [open]);

  const bySlug = useMemo(() => new Map(catalog.map((t) => [t.slug, t])), [catalog]);

  const matchingActions = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return QUICK_ACTIONS;
    return QUICK_ACTIONS.filter(
      (qa) =>
        qa.label.toLowerCase().includes(q) ||
        qa.keywords.toLowerCase().includes(q) ||
        qa.hint.toLowerCase().includes(q)
    );
  }, [query]);

  const toolHits = useMemo(() => {
    const q = query.trim();
    const pool = activeTab.categories
      ? catalog.filter((t) => activeTab.categories!.includes(t.category))
      : catalog;

    if (!q) {
      const prioritySlugs = [
        ...pinnedSlugs,
        ...recentSlugs,
        'image-compressor-lossy-lossless',
        'pdf-compressor-target-kb',
        'pdf-merge',
        'indian-land-area-converter-cent-ground-guntha-bigha-kanal-marla',
        'indian-income-tax-calculator-new-vs-old-regime',
        'home-loan-emi-calculator',
        'indian-passport-size-photo-maker-a4-sheet',
        'csv-to-json-converter',
      ];
      const unique: SearchToolItem[] = [];
      const seen = new Set<string>();
      for (const s of prioritySlugs) {
        const t = bySlug.get(s);
        if (t && !seen.has(t.slug) && (!activeTab.categories || activeTab.categories.includes(t.category))) {
          seen.add(t.slug);
          unique.push(t);
        }
      }
      for (const t of pool) {
        if (unique.length >= 10) break;
        if (!seen.has(t.slug)) {
          seen.add(t.slug);
          unique.push(t);
        }
      }
      return unique.slice(0, 10);
    }

    const scored: Array<{ tool: SearchToolItem; score: number }> = [];
    for (const tool of pool) {
      const s = fuzzyScoreTool(q, tool);
      if (s > 0) scored.push({ tool, score: s });
    }
    scored.sort((a, b) => b.score - a.score || a.tool.id - b.tool.id);
    return scored.slice(0, 12).map((x) => x.tool);
  }, [query, catalog, activeTab, pinnedSlugs, recentSlugs, bySlug]);

  type PaletteRow =
    | { type: 'action'; action: QuickAction }
    | { type: 'tool'; tool: SearchToolItem };

  const rows: PaletteRow[] = useMemo(() => {
    const combined: PaletteRow[] = [];
    const actionsCap = query.trim() ? matchingActions.slice(0, 4) : matchingActions.slice(0, 3);
    for (const t of toolHits) combined.push({ type: 'tool', tool: t });
    for (const a of actionsCap) combined.push({ type: 'action', action: a });
    return combined;
  }, [toolHits, matchingActions, query]);

  const executeRow = async (row: PaletteRow | undefined) => {
    if (!row) return;
    if (row.type === 'tool') {
      onClose();
      setQuery('');
      router.push(`/tools/${row.tool.slug}`);
      return;
    }
    const qa = row.action;
    if (qa.kind === 'navigate' && qa.href) {
      onClose();
      setQuery('');
      router.push(qa.href);
    } else if (qa.kind === 'theme') {
      onToggleTheme();
      setStatusNotice(`Switched to ${isDark ? 'Light' : 'Dark'} Mode.`);
    } else if (qa.kind === 'cache') {
      clearLocalWorkspaceCache();
      setStatusNotice('Cleared pinned tools & local recent history.');
    } else if (qa.kind === 'install') {
      const res = await triggerPwaInstall();
      setStatusNotice(
        res === 'installed'
          ? 'SnapTools installed for offline use!'
          : res === 'manual'
            ? 'Use your browser menu ("Install App" / "Add to Home Screen") to install offline!'
            : 'Install prompt opened.'
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((idx) => (rows.length > 0 ? (idx + 1) % rows.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((idx) => (rows.length > 0 ? (idx - 1 + rows.length) % rows.length : 0));
    } else if (e.key === 'Tab') {
      e.preventDefault();
      setTabIdx((i) => (i + 1) % FILTER_TABS.length);
      setActiveIndex(0);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const clamped = Math.min(activeIndex, Math.max(0, rows.length - 1));
      executeRow(rows[clamped]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-row-index="${activeIndex}"]`);
    if (el) {
      el.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Global Command Palette"
      className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-start justify-center p-3 sm:p-6 md:pt-16"
      onClick={onClose}
    >
      <div
        onKeyDown={handleKeyDown}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden"
      >
        {/* Search Input */}
        <div className="flex items-center px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 gap-2.5">
          <Search className="w-5 h-5 text-blue-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            placeholder={`Search ${TOTAL_TOOLS_LABEL} tools, "cent", "ground", "20kb", "gst", "upsc"...`}
            className="w-full bg-transparent text-sm focus:outline-hidden text-neutral-900 dark:text-white placeholder-neutral-400"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search query"
              className="p-1.5 text-neutral-400 hover:text-neutral-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-2 py-1 text-[10px] rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500 font-mono cursor-pointer"
          >
            ESC
          </button>
        </div>

        {/* Category Filter Tabs (Tab to cycle) */}
        <div className="px-4 py-2 border-b border-neutral-100 dark:border-neutral-800/80 flex items-center gap-1.5 overflow-x-auto text-[11px]">
          {FILTER_TABS.map((tab, idx) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setTabIdx(idx);
                setActiveIndex(0);
              }}
              className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap cursor-pointer transition ${
                tabIdx === idx
                  ? 'bg-blue-600 text-white'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {statusNotice && (
          <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border-b border-emerald-200 dark:border-emerald-900">
            {statusNotice}
          </div>
        )}

        {/* Unified Results & Quick Actions */}
        <div ref={listRef} className="max-h-96 overflow-y-auto p-2.5 space-y-1">
          {rows.length === 0 ? (
            <div className="py-10 text-center text-xs text-neutral-500">
              No matches found for &ldquo;{query}&rdquo;. Try Tab to switch categories!
            </div>
          ) : (
            rows.map((row, idx) => {
              const isSelected = idx === Math.min(activeIndex, rows.length - 1);
              if (row.type === 'tool') {
                const tool = row.tool;
                const isPin = pinnedSlugs.includes(tool.slug);
                const isRecent = recentSlugs.includes(tool.slug);
                return (
                  <button
                    key={`t-${tool.slug}`}
                    data-row-index={idx}
                    type="button"
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => executeRow(row)}
                    className={`w-full text-left p-3 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/60 border border-blue-300 dark:border-blue-800'
                        : 'hover:bg-neutral-100 dark:hover:bg-neutral-800/70 border border-transparent'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {isPin && <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500 shrink-0" />}
                        {!isPin && isRecent && <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
                        <span className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white truncate">
                          {tool.title}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-1 mt-0.5">
                        {getToolBenefitDescription(tool.title, tool.slug, tool.category)}
                      </p>
                    </div>
                    <span className="text-[10px] px-2 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-medium shrink-0">
                      {tool.categoryName}
                    </span>
                  </button>
                );
              }

              const qa = row.action;
              const Icon =
                qa.kind === 'theme'
                  ? isDark
                    ? Sun
                    : Moon
                  : qa.kind === 'cache'
                    ? Trash2
                    : qa.kind === 'install'
                      ? Download
                      : qa.id.includes('gst')
                        ? FileText
                        : Zap;
              return (
                <button
                  key={qa.id}
                  data-row-index={idx}
                  type="button"
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => executeRow(row)}
                  className={`w-full text-left p-3 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition ${
                    isSelected
                      ? 'bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800'
                      : 'hover:bg-neutral-100 dark:hover:bg-neutral-800/70 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                        {qa.label}
                      </div>
                      <div className="text-[11px] text-neutral-500 truncate">{qa.hint}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-100/80 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 shrink-0">
                    Action
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Keyboard Legend Footer */}
        <div className="px-4 py-2 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-950/70 flex flex-wrap items-center justify-between gap-2 text-[10px] text-neutral-500 font-mono">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <ArrowUp className="w-3 h-3" />
              <ArrowDown className="w-3 h-3" /> Navigate
            </span>
            <span className="inline-flex items-center gap-1">
              <CornerDownLeft className="w-3 h-3" /> Open
            </span>
            <span>Tab Filter Category</span>
          </div>
          <span>Esc Close</span>
        </div>
      </div>
    </div>
  );
}
