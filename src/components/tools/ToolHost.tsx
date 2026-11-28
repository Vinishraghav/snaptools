'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { ToolDef } from '@/data/toolsRegistry';
import { Star, Share2, Check, Sparkles, Workflow, X } from 'lucide-react';
import PrivacyVerifierBadge from './PrivacyVerifierBadge';
import { useWorkflowStore } from '@/lib/workflowStore';
import {
  usePinnedSlugs,
  togglePinnedSlug,
  recordRecentSlug,
} from '@/lib/workspacePrefs';

const EngineLoader = () => (
  <div className="p-10 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-center text-xs text-neutral-500 animate-pulse">
    Loading 100% client-side workspace...
  </div>
);

const PdfEngine = dynamic(() => import('@/components/engines/PdfEngine'), { loading: EngineLoader });
const ImageEngine = dynamic(() => import('@/components/engines/ImageEngine'), { loading: EngineLoader });
const TextEngine = dynamic(() => import('@/components/engines/TextEngine'), { loading: EngineLoader });
const DeveloperEngine = dynamic(() => import('@/components/engines/DeveloperEngine'), { loading: EngineLoader });
const DataEngine = dynamic(() => import('@/components/engines/DataEngine'), { loading: EngineLoader });
const CalculatorEngine = dynamic(() => import('@/components/engines/CalculatorEngine'), { loading: EngineLoader });
const ConverterEngine = dynamic(() => import('@/components/engines/ConverterEngine'), { loading: EngineLoader });
const MediaEngine = dynamic(() => import('@/components/engines/MediaEngine'), { loading: EngineLoader });
const GeneratorEngine = dynamic(() => import('@/components/engines/GeneratorEngine'), { loading: EngineLoader });

export default function ToolHost({ tool }: { tool: ToolDef }) {
  const pinnedSlugs = usePinnedSlugs();
  const isPinned = pinnedSlugs.includes(tool.slug);
  const [shared, setShared] = useState(false);
  const { payload, clearWorkflowPayload } = useWorkflowStore();

  useEffect(() => {
    recordRecentSlug(tool.slug);
  }, [tool.slug]);

  const handlePin = () => {
    togglePinnedSlug(tool.slug);
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  };

  const renderEngine = () => {
    const isIndianLandMatrixSlug =
      /(?:^|-)(cent|cents|ground|grounds|bigha|guntha|kanal|marla|katha|ankanam|ankadam)(?:-|$)|land-area/i.test(
        tool.slug
      );
    if (isIndianLandMatrixSlug) {
      return <ConverterEngine key={tool.slug} tool={tool} />;
    }
    switch (tool.engine) {
      case 'pdf':
        return <PdfEngine key={tool.slug} tool={tool} />;
      case 'image':
        return <ImageEngine key={tool.slug} tool={tool} />;
      case 'text':
        return <TextEngine key={tool.slug} tool={tool} />;
      case 'developer':
        return <DeveloperEngine key={tool.slug} tool={tool} />;
      case 'data':
        return <DataEngine key={tool.slug} tool={tool} />;
      case 'calculator':
        return <CalculatorEngine key={tool.slug} tool={tool} />;
      case 'converter':
        return <ConverterEngine key={tool.slug} tool={tool} />;
      case 'media':
        return <MediaEngine key={tool.slug} tool={tool} />;
      case 'generator':
        return <GeneratorEngine key={tool.slug} tool={tool} />;
      default:
        return <TextEngine key={tool.slug} tool={tool} />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Tool Header Utility bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="min-h-[44px] inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/70 dark:border-blue-800/60">
            <Sparkles className="w-3.5 h-3.5" /> Client-Side Engine
          </span>
          <PrivacyVerifierBadge toolTitle={tool.title} />
          <span className="text-xs text-neutral-400 font-mono px-1">ID: #{tool.id}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePin}
            className={`min-h-[44px] px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              isPinned
                ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300'
                : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-amber-400'
            }`}
            title={isPinned ? 'Unpin from homepage workspace' : 'Pin to My Pinned Tools on homepage'}
          >
            <Star className={`w-4 h-4 ${isPinned ? 'fill-amber-500 text-amber-500' : ''}`} />
            <span>{isPinned ? 'Pinned ★' : 'Pin Tool'}</span>
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="min-h-[44px] px-3.5 py-2 rounded-xl border bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            title="Copy tool link"
          >
            {shared ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
            <span>{shared ? 'Copied' : 'Share'}</span>
          </button>
        </div>
      </div>

      {/* Active In-Memory File Bus Notification */}
      {payload && (payload.files.length > 0 || payload.textPayload) && (
        <div className="p-3.5 rounded-2xl border border-indigo-200 dark:border-indigo-800/70 bg-indigo-50/70 dark:bg-indigo-950/40 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-indigo-800 dark:text-indigo-200 font-semibold min-w-0">
            <Workflow className="w-4 h-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
            <span className="truncate">
              Piped in-memory from <strong>{payload.sourceToolSlug}</strong>:{' '}
              {payload.files.length > 0
                ? `${payload.files.length} file${payload.files.length > 1 ? 's' : ''} (${payload.files.map((f) => f.name).join(', ')})`
                : 'JSON / Text payload loaded'}
            </span>
          </div>
          <button
            type="button"
            onClick={clearWorkflowPayload}
            aria-label="Clear piped workflow payload"
            className="p-1.5 rounded-lg text-indigo-500 hover:bg-indigo-100 dark:hover:bg-indigo-900 cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Lazy-Loaded Engine Container */}
      {renderEngine()}
    </div>
  );
}
