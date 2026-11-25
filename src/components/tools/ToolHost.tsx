'use client';

import React, { useEffect, useState } from 'react';
import { ToolDef } from '@/data/toolsRegistry';
import PdfEngine from '@/components/engines/PdfEngine';
import ImageEngine from '@/components/engines/ImageEngine';
import TextEngine from '@/components/engines/TextEngine';
import DeveloperEngine from '@/components/engines/DeveloperEngine';
import DataEngine from '@/components/engines/DataEngine';
import CalculatorEngine from '@/components/engines/CalculatorEngine';
import ConverterEngine from '@/components/engines/ConverterEngine';
import MediaEngine from '@/components/engines/MediaEngine';
import GeneratorEngine from '@/components/engines/GeneratorEngine';
import { Bookmark, Share2, Check, Sparkles } from 'lucide-react';

export default function ToolHost({ tool }: { tool: ToolDef }) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [shared, setShared] = useState(false);

  useEffect(() => {
    // Record in recents
    try {
      const recents: string[] = JSON.parse(localStorage.getItem('omnitools_recents') || '[]');
      const filtered = recents.filter((s) => s !== tool.slug);
      filtered.unshift(tool.slug);
      localStorage.setItem('omnitools_recents', JSON.stringify(filtered.slice(0, 15)));

      // Check favorite
      const favs: string[] = JSON.parse(localStorage.getItem('omnitools_favorites') || '[]');
      setIsFavorite(favs.includes(tool.slug));
      window.dispatchEvent(new Event('snaptools-storage-update'));
    } catch {
      // ignore
    }
  }, [tool.slug]);

  const toggleFavorite = () => {
    try {
      const favs: string[] = JSON.parse(localStorage.getItem('omnitools_favorites') || '[]');
      let updated: string[];
      if (favs.includes(tool.slug)) {
        updated = favs.filter((s) => s !== tool.slug);
        setIsFavorite(false);
      } else {
        updated = [...favs, tool.slug];
        setIsFavorite(true);
      }
      localStorage.setItem('omnitools_favorites', JSON.stringify(updated));
      window.dispatchEvent(new Event('snaptools-storage-update'));
    } catch {
      // ignore
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  };

  const renderEngine = () => {
    switch (tool.engine) {
      case 'pdf':
        return <PdfEngine tool={tool} />;
      case 'image':
        return <ImageEngine tool={tool} />;
      case 'text':
        return <TextEngine tool={tool} />;
      case 'developer':
        return <DeveloperEngine tool={tool} />;
      case 'data':
        return <DataEngine tool={tool} />;
      case 'calculator':
        return <CalculatorEngine tool={tool} />;
      case 'converter':
        return <ConverterEngine tool={tool} />;
      case 'media':
        return <MediaEngine tool={tool} />;
      case 'generator':
        return <GeneratorEngine tool={tool} />;
      default:
        return <TextEngine tool={tool} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Tool Header Utility bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
            <Sparkles className="w-3 h-3" /> Client-Side Engine
          </span>
          <span className="text-xs text-neutral-400">ID: #{tool.id}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleFavorite}
            className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition ${
              isFavorite
                ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300'
                : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50'
            }`}
            title="Bookmark this tool"
          >
            <Bookmark className={`w-3.5 h-3.5 ${isFavorite ? 'fill-amber-500 text-amber-500' : ''}`} />
            <span className="hidden sm:inline">{isFavorite ? 'Saved' : 'Save'}</span>
          </button>
          <button
            onClick={handleShare}
            className="p-2 rounded-xl border bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 text-xs font-medium flex items-center gap-1.5 transition"
            title="Copy tool link"
          >
            {shared ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{shared ? 'Link Copied' : 'Share'}</span>
          </button>
        </div>
      </div>

      {/* Engine Container */}
      {renderEngine()}
    </div>
  );
}
