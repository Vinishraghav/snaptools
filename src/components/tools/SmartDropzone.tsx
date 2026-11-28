'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import {
  UploadCloud,
  FileText,
  Download,
  Trash2,
  X,
  Archive,
  ClipboardPaste,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from 'lucide-react';

export interface BatchQueueRow {
  id: string;
  name: string;
  originalSize: number;
  outputSize?: number;
  status: 'pending' | 'processing' | 'done' | 'error';
  previewUrl?: string;
  downloadUrl?: string;
  downloadName?: string;
  error?: string;
  extraBadge?: string;
}

export function formatBytesCompact(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb >= 100 ? Math.round(kb) : kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

function matchesAccept(file: File, accept?: string): boolean {
  if (!accept || accept.trim() === '' || accept === '*') return true;
  const rules = accept.split(',').map((r) => r.trim().toLowerCase());
  const fileName = file.name.toLowerCase();
  const mime = (file.type || '').toLowerCase();
  return rules.some((rule) => {
    if (rule.startsWith('.')) return fileName.endsWith(rule);
    if (rule.endsWith('/*')) return mime.startsWith(rule.slice(0, -1));
    return mime === rule;
  });
}

type WebkitEntryLike = {
  isFile: boolean;
  isDirectory: boolean;
  file?: (cb: (f: File) => void, err?: (e: unknown) => void) => void;
  createReader?: () => {
    readEntries: (cb: (entries: WebkitEntryLike[]) => void, err?: (e: unknown) => void) => void;
  };
};

async function collectFilesFromEntry(entry: WebkitEntryLike): Promise<File[]> {
  if (entry.isFile && entry.file) {
    return new Promise((resolve) => {
      entry.file!(
        (f) => resolve([f]),
        () => resolve([])
      );
    });
  }
  if (entry.isDirectory && entry.createReader) {
    const reader = entry.createReader();
    const allEntries: WebkitEntryLike[] = [];
    const readBatch = (): Promise<void> =>
      new Promise((resolve) => {
        reader.readEntries(
          async (batch) => {
            if (batch.length === 0) {
              resolve();
            } else {
              allEntries.push(...batch);
              await readBatch();
              resolve();
            }
          },
          () => resolve()
        );
      });
    await readBatch();
    const nested = await Promise.all(allEntries.map(collectFilesFromEntry));
    return nested.flat();
  }
  return [];
}

export default function SmartDropzone({
  accept,
  multiple = true,
  files,
  onFilesAdded,
  onRemoveFile,
  onClearAll,
  title = 'Drop files or entire folders here',
  subtitle = 'Processed 100% locally inside browser memory',
  accent = 'blue',
  queueRows,
  onDownloadAllZip,
  zipBusy = false,
  onPasteText,
}: {
  accept?: string;
  multiple?: boolean;
  files: File[];
  onFilesAdded: (incoming: File[], replace?: boolean) => void;
  onRemoveFile?: (index: number) => void;
  onClearAll?: () => void;
  title?: string;
  subtitle?: string;
  accent?: 'blue' | 'purple' | 'rose' | 'indigo';
  queueRows?: BatchQueueRow[];
  onDownloadAllZip?: () => void;
  zipBusy?: boolean;
  onPasteText?: (text: string) => void;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || target?.isContentEditable) return;

      const items = e.clipboardData?.items;
      if (!items) return;
      const pastedFiles: File[] = [];
      for (const item of Array.from(items)) {
        if (item.kind === 'file') {
          const f = item.getAsFile();
          if (f && matchesAccept(f, accept)) pastedFiles.push(f);
        }
      }
      if (pastedFiles.length > 0) {
        e.preventDefault();
        onFilesAdded(multiple ? pastedFiles : [pastedFiles[0]], !multiple);
        return;
      }
      if (onPasteText) {
        const text = e.clipboardData?.getData('text/plain');
        if (text) onPasteText(text);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [accept, multiple, onFilesAdded, onPasteText]);

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);

    const droppedItems = Array.from(e.dataTransfer.items || []);
    const entries = droppedItems
      .map((item) => {
        const withGetEntry = item as unknown as { webkitGetAsEntry?: () => WebkitEntryLike | null };
        return withGetEntry.webkitGetAsEntry ? withGetEntry.webkitGetAsEntry() : null;
      })
      .filter((entry): entry is WebkitEntryLike => Boolean(entry));

    let extracted: File[] = [];
    if (entries.length > 0) {
      const nested = await Promise.all(entries.map(collectFilesFromEntry));
      extracted = nested.flat();
    } else {
      extracted = Array.from(e.dataTransfer.files || []);
    }

    const valid = extracted.filter((f) => matchesAccept(f, accept));
    if (valid.length > 0) {
      onFilesAdded(multiple ? valid : [valid[0]], !multiple);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []).filter((f) => matchesAccept(f, accept));
    if (selected.length > 0) {
      onFilesAdded(multiple ? selected : [selected[0]], !multiple);
    }
    e.target.value = '';
  };

  const accentBorder =
    dragging
      ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/30 scale-[1.005]'
      : accent === 'rose'
        ? 'border-neutral-300 dark:border-neutral-700 hover:border-rose-500'
        : accent === 'purple'
          ? 'border-neutral-300 dark:border-neutral-700 hover:border-purple-500'
          : 'border-neutral-300 dark:border-neutral-700 hover:border-blue-500';

  const doneCount = queueRows ? queueRows.filter((r) => r.status === 'done' && r.downloadUrl).length : 0;

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        className={`relative rounded-2xl border-2 border-dashed p-6 sm:p-8 text-center cursor-pointer transition bg-neutral-50/70 dark:bg-neutral-950/50 ${accentBorder}`}
      >
        <input
          id={inputId}
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInput}
          className="hidden"
        />

        <UploadCloud className="w-8 h-8 mx-auto text-blue-600 dark:text-blue-400 mb-2.5" />
        <div className="text-sm font-bold text-neutral-900 dark:text-white">{title}</div>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{subtitle}</p>
        <div className="mt-3 inline-flex flex-wrap items-center justify-center gap-2 text-[11px] font-semibold text-neutral-500">
          <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
            Browse Files
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
            Folder Drop Supported
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
            <ClipboardPaste className="w-3 h-3" /> Ctrl+V Paste
          </span>
        </div>
      </div>

      {/* Clean Batch Queue Table */}
      {(queueRows ? queueRows.length > 0 : files.length > 0) && (
        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-2 bg-neutral-50/80 dark:bg-neutral-900/60">
            <div className="text-xs font-bold text-neutral-700 dark:text-neutral-200">
              Batch Queue ({queueRows ? queueRows.length : files.length}{' '}
              {(queueRows ? queueRows.length : files.length) === 1 ? 'file' : 'files'})
            </div>

            <div className="flex items-center gap-2">
              {onDownloadAllZip && doneCount > 1 && (
                <button
                  type="button"
                  disabled={zipBusy}
                  onClick={onDownloadAllZip}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer disabled:opacity-50"
                >
                  {zipBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />}
                  <span>Download All as ZIP ({doneCount} files)</span>
                </button>
              )}
              {onClearAll && (
                <button
                  type="button"
                  onClick={onClearAll}
                  className="min-h-[44px] px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-semibold text-neutral-500 hover:text-rose-500 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear
                </button>
              )}
            </div>
          </div>

          <div className="divide-y divide-neutral-100 dark:divide-neutral-800 max-h-80 overflow-y-auto">
            {queueRows
              ? queueRows.map((row, idx) => {
                  const hasOut = typeof row.outputSize === 'number' && row.outputSize > 0;
                  const diffPct =
                    hasOut && row.originalSize > 0
                      ? Math.round(((row.originalSize - row.outputSize!) / row.originalSize) * 100)
                      : null;

                  return (
                    <div
                      key={row.id}
                      className="px-4 py-3 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {row.previewUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={row.previewUrl}
                            alt={row.name}
                            className="w-10 h-10 rounded-lg object-cover border border-neutral-200 dark:border-neutral-800 shrink-0 bg-neutral-100"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5 text-blue-500" />
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-neutral-900 dark:text-white truncate">
                            {row.name}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-neutral-500 mt-0.5">
                            <span>Orig: {formatBytesCompact(row.originalSize)}</span>
                            {hasOut && (
                              <>
                                <span>&rarr;</span>
                                <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                                  {formatBytesCompact(row.outputSize!)}
                                </span>
                              </>
                            )}
                            {diffPct !== null && (
                              <span
                                className={`font-bold px-1.5 py-0.5 rounded ${
                                  diffPct >= 0
                                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                                    : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                                }`}
                              >
                                {diffPct >= 0 ? `-${diffPct}% saved` : `+${Math.abs(diffPct)}%`}
                              </span>
                            )}
                            {row.extraBadge && (
                              <span className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 font-mono text-[10px]">
                                {row.extraBadge}
                              </span>
                            )}
                          </div>
                          {row.error && (
                            <div className="text-[11px] text-rose-500 flex items-center gap-1 mt-0.5">
                              <AlertCircle className="w-3.5 h-3.5" /> {row.error}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {row.status === 'processing' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 px-2">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Working
                          </span>
                        )}
                        {row.status === 'done' && row.downloadUrl && (
                          <a
                            href={row.downloadUrl}
                            download={row.downloadName || row.name}
                            className="min-h-[44px] px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-bold flex items-center gap-1.5 hover:bg-blue-100 transition"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Download</span>
                          </a>
                        )}
                        {row.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-neutral-400 px-2">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Queued
                          </span>
                        )}
                        {onRemoveFile && (
                          <button
                            type="button"
                            onClick={() => onRemoveFile(idx)}
                            aria-label={`Remove ${row.name}`}
                            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-neutral-400 hover:text-rose-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              : files.map((file, idx) => (
                  <div
                    key={`${file.name}-${idx}`}
                    className="px-4 py-3 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <FileText className="w-5 h-5 text-blue-500 shrink-0" />
                      <div className="min-w-0">
                        <div className="font-bold text-neutral-900 dark:text-white truncate">
                          {file.name}
                        </div>
                        <div className="text-[11px] text-neutral-500">
                          {formatBytesCompact(file.size)}
                        </div>
                      </div>
                    </div>
                    {onRemoveFile && (
                      <button
                        type="button"
                        onClick={() => onRemoveFile(idx)}
                        aria-label={`Remove ${file.name}`}
                        className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-neutral-400 hover:text-rose-500 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
          </div>
        </div>
      )}
    </div>
  );
}
