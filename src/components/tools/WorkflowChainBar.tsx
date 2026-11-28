'use client';

import React from 'react';
import { ArrowRight, Workflow } from 'lucide-react';

export type WorkflowBarMode = 'image' | 'passport' | 'pdf' | 'pdf-split' | 'data';

export interface WorkflowActionItem {
  label: string;
  target: string;
}

const CHAIN_PRESETS: Record<WorkflowBarMode, WorkflowActionItem[]> = {
  image: [
    { label: 'Convert to WebP', target: 'jpg-png-to-webp-converter' },
    { label: 'Resize Pixels', target: 'image-resizer-pixels' },
    { label: 'Add Watermark', target: 'image-text-watermark-tool' },
    { label: 'Create PDF from Image', target: 'images-to-pdf-converter' },
    { label: 'Strip EXIF Data', target: 'exif-gps-camera-remover' },
  ],
  passport: [
    { label: 'Compress to 20KB', target: 'compress-image-to-20kb' },
    { label: 'Compress to 50KB', target: 'compress-image-to-50kb' },
    { label: 'Arrange on A4 Print Sheet', target: 'indian-passport-size-photo-maker-a4-sheet' },
    { label: 'Create PDF from Image', target: 'images-to-pdf-converter' },
  ],
  pdf: [
    { label: 'Compress PDF (Target KB)', target: 'pdf-compressor-target-kb' },
    { label: 'Add Password', target: 'pdf-password-protector' },
    { label: 'Add Page Numbers', target: 'pdf-page-numbering-tool' },
    { label: 'Sign PDF', target: '/studio/signature' },
  ],
  'pdf-split': [
    { label: 'Convert Pages to JPG', target: 'pdf-to-jpg-converter' },
    { label: 'Extract Plain Text', target: 'pdf-to-plain-text-extractor' },
    { label: 'Compress PDF (Target KB)', target: 'pdf-compressor-target-kb' },
    { label: 'Sign PDF', target: '/studio/signature' },
  ],
  data: [
    { label: 'Format & Validate JSON', target: 'json-formatter-validator' },
    { label: 'Generate TypeScript Interfaces', target: 'json-to-typescript-interface' },
    { label: 'Minify Payload', target: 'json-minifier' },
  ],
};

export default function WorkflowChainBar({
  currentSlug,
  mode,
  onPipe,
  disabled = false,
}: {
  currentSlug: string;
  mode: WorkflowBarMode;
  onPipe: (targetSlugOrPath: string) => void;
  disabled?: boolean;
}) {
  const actions = CHAIN_PRESETS[mode].filter((a) => a.target !== currentSlug);
  if (actions.length === 0) return null;

  return (
    <div className="p-4 rounded-2xl border border-blue-200/80 dark:border-blue-900/60 bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-violet-50/60 dark:from-blue-950/30 dark:via-indigo-950/20 dark:to-neutral-950 space-y-2.5">
      <div className="flex items-center gap-2 text-xs font-bold text-blue-800 dark:text-blue-300">
        <Workflow className="w-4 h-4 shrink-0" />
        <span>Continue Workflow &rarr; Pipe Output In-Memory Without Re-Uploading</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <button
            key={action.target}
            type="button"
            disabled={disabled}
            onClick={() => onPipe(action.target)}
            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 text-xs font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5 shadow-xs transition cursor-pointer disabled:opacity-40"
          >
            <span>{action.label}</span>
            <ArrowRight className="w-3.5 h-3.5 shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}
