'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ToolDef } from '@/data/toolsRegistry';
import {
  Download,
  RotateCw,
  Image as ImageIcon,
  Palette,
  RefreshCw,
  Sliders,
  ShieldCheck,
  Sparkles,
  Grid,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import SmartDropzone, { BatchQueueRow, formatBytesCompact } from '@/components/tools/SmartDropzone';
import WorkflowChainBar from '@/components/tools/WorkflowChainBar';
import { useWorkflowStore } from '@/lib/workflowStore';
import { EXAM_IMAGE_PRESETS } from '@/lib/examPresets';
import {
  runImageBatchPool,
  createZipBlob,
  renderA4PassportSheet,
  ImageJobResult,
} from '@/lib/imageWorkerPool';

interface BatchEntry {
  id: string;
  file: File;
  previewUrl: string;
  origW: number;
  origH: number;
  status: 'pending' | 'processing' | 'done' | 'error';
  result?: ImageJobResult;
  downloadUrl?: string;
  downloadName?: string;
  error?: string;
}

function readPresetParam(): string {
  if (typeof window === 'undefined') return '';
  try {
    return new URLSearchParams(window.location.search).get('preset') || '';
  } catch {
    return '';
  }
}

async function readImageDims(file: File): Promise<{ url: string; width: number; height: number }> {
  const url = URL.createObjectURL(file);
  try {
    const dims = await new Promise<{ width: number; height: number }>((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth || img.width, height: img.naturalHeight || img.height });
      img.onerror = () => resolve({ width: 0, height: 0 });
      img.src = url;
    });
    return { url, ...dims };
  } catch {
    return { url, width: 0, height: 0 };
  }
}

function extractPaletteHex(img: HTMLImageElement): string[] {
  const c = document.createElement('canvas');
  c.width = 48;
  c.height = 48;
  const ctx = c.getContext('2d');
  if (!ctx) return [];
  ctx.drawImage(img, 0, 0, 48, 48);
  const { data } = ctx.getImageData(0, 0, 48, 48);
  const buckets = new Map<string, number>();
  for (let i = 0; i < data.length; i += 16) {
    const r = Math.round(data[i] / 24) * 24;
    const g = Math.round(data[i + 1] / 24) * 24;
    const b = Math.round(data[i + 2] / 24) * 24;
    const hex = `#${[r, g, b].map((v) => Math.min(255, v).toString(16).padStart(2, '0')).join('')}`;
    buckets.set(hex, (buckets.get(hex) || 0) + 1);
  }
  return Array.from(buckets.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map((e) => e[0]);
}

function getExtForMime(mime: string): string {
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  return 'jpg';
}

function buildOutputFilename(origName: string, mime: string, suffix: string): string {
  const stem = origName.replace(/\.[^.]+$/, '') || 'image';
  return `${stem}-${suffix}.${getExtForMime(mime)}`;
}

export default function ImageEngine({ tool }: { tool: ToolDef }) {
  const slug = tool.slug.toLowerCase();
  const spec = (tool.spec ?? {}) as Record<string, unknown>;
  const { payload, markConsumed, pipeToTool } = useWorkflowStore();

  // Mode detection
  const isBase64ToImg = slug.includes('base64-to-im');
  const isImgToBase64 = slug.includes('to-base64') && !isBase64ToImg;
  const isPaletteTool = slug.includes('palette') || slug.includes('color-extractor');
  const isExifTool = slug.includes('exif');
  const isPassportA4 = slug.includes('a4-sheet');
  const urlPresetParam = readPresetParam();
  const isPassportOrExam =
    slug.includes('passport') ||
    slug.includes('visa') ||
    slug.includes('exam') ||
    slug.includes('upsc') ||
    slug.includes('tnpsc') ||
    slug.includes('ssc') ||
    Boolean(urlPresetParam);

  const defaultMime =
    slug.includes('webp')
      ? 'image/webp'
      : slug.includes('to-png') && !slug.includes('png-to-')
        ? 'image/png'
        : slug.includes('png-to-jpg') || slug.includes('20kb') || slug.includes('50kb') || slug.includes('100kb') || isPassportOrExam
          ? 'image/jpeg'
          : 'image/jpeg';

  const specTargetKb =
    typeof spec.targetKb === 'number'
      ? spec.targetKb
      : slug.includes('20kb')
        ? 20
        : slug.includes('50kb')
          ? 50
          : slug.includes('100kb')
            ? 100
            : 0;

  const initialPreset = urlPresetParam
    ? (EXAM_IMAGE_PRESETS.find((p) => p.id === urlPresetParam) ?? null)
    : isPassportOrExam
      ? EXAM_IMAGE_PRESETS[0]
      : null;

  const initialPipedImages = useMemo(() => {
    if (!payload || payload.files.length === 0) return [];
    return payload.files.filter(
      (f) => f.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|svg|bmp)$/i.test(f.name)
    );
  }, [payload]);

  const [entries, setEntries] = useState<BatchEntry[]>(() =>
    initialPipedImages.map((file, idx) => ({
      id: `init_${idx}_${file.name}`,
      file,
      previewUrl: '',
      origW: 0,
      origH: 0,
      status: 'pending',
    }))
  );

  const [presetId, setPresetId] = useState<string>(initialPreset?.id || '');
  const [targetKb, setTargetKb] = useState<number>(initialPreset?.targetKb ?? specTargetKb);
  const [outputMime, setOutputMime] = useState<string>(defaultMime);
  const [quality, setQuality] = useState<number>(88);
  const [resizeW, setResizeW] = useState<number>(initialPreset?.width ?? (typeof spec.width === 'number' ? spec.width : 0));
  const [resizeH, setResizeH] = useState<number>(initialPreset?.height ?? (typeof spec.height === 'number' ? spec.height : 0));
  const [rotationDeg, setRotationDeg] = useState<number>(0);
  const [grayscale, setGrayscale] = useState<boolean>(slug.includes('grayscale'));
  const [sepia, setSepia] = useState<boolean>(slug.includes('sepia'));
  const [invert, setInvert] = useState<boolean>(slug.includes('invert'));
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [watermarkText, setWatermarkText] = useState<string>(slug.includes('watermark') ? 'SnapTools.me' : '');
  const [pixelateSize, setPixelateSize] = useState<number>(slug.includes('pixel') || slug.includes('blur') ? 10 : 1);
  const [a4Copies, setA4Copies] = useState<number>(8);
  const [renderA4Sheet, setRenderA4Sheet] = useState<boolean>(isPassportA4);

  const [processing, setProcessing] = useState<boolean>(false);
  const [zipBusy, setZipBusy] = useState<boolean>(false);
  const [paletteColors, setPaletteColors] = useState<string[]>([]);
  const [base64Text, setBase64Text] = useState<string>('');
  const [base64DecodedUrl, setBase64DecodedUrl] = useState<string>('');
  const [statusNotice, setStatusNotice] = useState<string>('');

  const createdUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    const urls = createdUrlsRef.current;
    return () => {
      urls.forEach((u) => {
        if (u.startsWith('blob:')) URL.revokeObjectURL(u);
      });
    };
  }, []);

  // Hydrate preview URLs for piped initial files cleanly via async callback
  useEffect(() => {
    if (initialPipedImages.length === 0) return;
    let active = true;
    Promise.all(initialPipedImages.map(readImageDims)).then((metas) => {
      if (!active) return;
      metas.forEach((m) => {
        if (m.url.startsWith('blob:')) createdUrlsRef.current.push(m.url);
      });
      setEntries((prev) =>
        prev.map((row, idx) =>
          metas[idx]
            ? {
                ...row,
                previewUrl: metas[idx].url,
                origW: metas[idx].width,
                origH: metas[idx].height,
              }
            : row
        )
      );
      if (payload?.id) markConsumed(payload.id);
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activePreset = useMemo(
    () => EXAM_IMAGE_PRESETS.find((p) => p.id === presetId) ?? null,
    [presetId]
  );

  const applyPortalPreset = (nextId: string) => {
    setPresetId(nextId);
    const p = EXAM_IMAGE_PRESETS.find((item) => item.id === nextId);
    if (p) {
      setResizeW(p.width);
      setResizeH(p.height);
      setTargetKb(p.targetKb);
      setOutputMime('image/jpeg');
      setStatusNotice(`Applied ${p.portal} preset (${p.width}x${p.height}px, target ~${p.targetKb}KB).`);
    }
  };

  const handleFilesAdded = async (incoming: File[], replace?: boolean) => {
    const valid = incoming.filter(
      (f) => f.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|svg|bmp)$/i.test(f.name)
    );
    if (valid.length === 0) return;
    const metas = await Promise.all(valid.map(readImageDims));
    metas.forEach((m) => {
      if (m.url.startsWith('blob:')) createdUrlsRef.current.push(m.url);
    });

    const newRows: BatchEntry[] = valid.map((file, i) => ({
      id: `img_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 6)}`,
      file,
      previewUrl: metas[i].url,
      origW: metas[i].width,
      origH: metas[i].height,
      status: 'pending',
    }));

    setEntries((prev) => (replace ? newRows : [...prev, ...newRows]));
    setStatusNotice('');

    if (isPaletteTool && metas[0]) {
      const img = new Image();
      img.onload = () => setPaletteColors(extractPaletteHex(img));
      img.src = metas[0].url;
    }
  };

  const handleRemoveEntry = (idx: number) => {
    setEntries((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleClearAll = () => {
    setEntries([]);
    setPaletteColors([]);
    setBase64Text('');
    setStatusNotice('');
  };

  const processBatch = async () => {
    if (entries.length === 0) return;
    setProcessing(true);
    setStatusNotice('');
    setEntries((prev) => prev.map((e) => ({ ...e, status: 'processing', error: undefined })));

    try {
      if (renderA4Sheet) {
        const res = await renderA4PassportSheet(
          entries[0].file,
          a4Copies,
          resizeW || 413,
          resizeH || 531
        );
        const dlUrl = URL.createObjectURL(res.blob);
        createdUrlsRef.current.push(dlUrl);
        setEntries((prev) =>
          prev.map((row, idx) =>
            idx === 0
              ? {
                  ...row,
                  status: 'done',
                  result: res,
                  downloadUrl: dlUrl,
                  downloadName: `passport-a4-sheet-${a4Copies}-copies.jpg`,
                }
              : { ...row, status: 'pending' }
          )
        );
        setStatusNotice(`Generated printable A4 sheet with ${a4Copies} passport copies!`);
        return;
      }

      if (isImgToBase64) {
        const dataUrl = await new Promise<string>((resolve) => {
          const r = new FileReader();
          r.onload = () => resolve(String(r.result));
          r.readAsDataURL(entries[0].file);
        });
        setBase64Text(dataUrl);
        setEntries((prev) => prev.map((row, idx) => (idx === 0 ? { ...row, status: 'done' } : row)));
        setStatusNotice('Encoded image into Base64 Data URI cleanly in browser RAM.');
        return;
      }

      const suffix =
        outputMime === 'image/webp'
          ? 'webp'
          : targetKb > 0
            ? `${targetKb}kb`
            : resizeW > 0 && resizeH > 0
              ? `${resizeW}x${resizeH}`
              : 'optimized';

      await runImageBatchPool(
        entries.map((entry) => ({
          id: entry.id,
          file: entry.file,
          outMime: outputMime,
          width: resizeW > 0 ? resizeW : undefined,
          height: resizeH > 0 ? resizeH : undefined,
          quality,
          targetKb,
          grayscale,
          sepia,
          invert,
          brightness,
          contrast,
          rotationDeg,
          watermarkText: watermarkText.trim() || undefined,
          pixelateSize,
          whiteBg: Boolean(presetId) || isPassportOrExam,
        })),
        (res) => {
          const dlUrl = URL.createObjectURL(res.blob);
          createdUrlsRef.current.push(dlUrl);
          setEntries((prev) =>
            prev.map((row) =>
              row.id === res.id
                ? {
                    ...row,
                    status: 'done',
                    result: res,
                    downloadUrl: dlUrl,
                    downloadName: buildOutputFilename(row.file.name, res.blob.type || outputMime, suffix),
                  }
                : row
            )
          );
        }
      );

      setStatusNotice(
        `Completed ${entries.length} ${entries.length === 1 ? 'image' : 'images'} offline via Web Worker pool.`
      );
    } catch (err) {
      setStatusNotice(`Processing error: ${(err as Error).message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleDownloadAllZip = async () => {
    const ready = entries.filter((e) => e.status === 'done' && e.result?.blob);
    if (ready.length < 2) return;
    setZipBusy(true);
    try {
      const zipBlob = await createZipBlob(
        ready.map((e) => ({
          name: e.downloadName || e.file.name,
          blob: e.result!.blob,
        }))
      );
      const url = URL.createObjectURL(zipBlob);
      createdUrlsRef.current.push(url);
      const a = document.createElement('a');
      a.href = url;
      a.download = `snaptools-batch-${ready.length}-images.zip`;
      a.click();
    } finally {
      setZipBusy(false);
    }
  };

  const doneFiles: File[] = useMemo(
    () =>
      entries
        .filter((e) => e.status === 'done' && e.result?.blob)
        .map(
          (e) =>
            new File([e.result!.blob], e.downloadName || e.file.name, {
              type: e.result!.blob.type || outputMime,
            })
        ),
    [entries, outputMime]
  );

  const handlePipeNext = (targetSlugOrPath: string) => {
    const outFiles = doneFiles.length > 0 ? doneFiles : entries.map((e) => e.file);
    if (outFiles.length === 0) return;
    pipeToTool(targetSlugOrPath, {
      files: outFiles,
      sourceToolSlug: tool.slug,
    });
  };

  const queueRows: BatchQueueRow[] = entries.map((e) => ({
    id: e.id,
    name: e.file.name,
    originalSize: e.file.size,
    outputSize: e.result?.outputSize,
    status: e.status,
    previewUrl: e.result?.dataUrl || e.previewUrl,
    downloadUrl: e.downloadUrl,
    downloadName: e.downloadName,
    error: e.error,
    extraBadge:
      e.result?.width && e.result?.height
        ? `${e.result.width}x${e.result.height}`
        : e.origW > 0
          ? `${e.origW}x${e.origH}`
          : undefined,
  }));

  if (isBase64ToImg) {
    return (
      <div className="p-5 sm:p-7 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-neutral-900 dark:text-white">
          <ImageIcon className="w-4 h-4 text-blue-600" /> Paste Base64 Image String
        </div>
        <textarea
          value={base64Text}
          onChange={(e) => {
            const val = e.target.value.trim();
            setBase64Text(val);
            if (val.startsWith('data:image')) setBase64DecodedUrl(val);
            else if (val.length > 20) setBase64DecodedUrl(`data:image/png;base64,${val}`);
            else setBase64DecodedUrl('');
          }}
          placeholder="data:image/png;base64,iVBORw0KGgo..."
          className="w-full h-36 p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 font-mono text-xs"
        />
        {base64DecodedUrl && (
          <div className="space-y-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={base64DecodedUrl}
              alt="Decoded preview"
              className="max-h-72 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100"
            />
            <a
              href={base64DecodedUrl}
              download="decoded-image.png"
              className="inline-flex items-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold"
            >
              <Download className="w-4 h-4" /> Download PNG Image
            </a>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Interactive Workspace Card */}
      <div className="p-5 sm:p-7 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-6">
        {/* Govt & Exam Portal Presets */}
        <div className="p-4 rounded-2xl border border-indigo-200/80 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/25 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="text-xs font-extrabold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Indian Govt &amp; Competitive Exam Portal Presets
              </div>
              <p className="text-[11px] text-indigo-700/80 dark:text-indigo-300/80">
                Auto-apply exact pixel dimensions, KB limits, and aspect lock for official portals.
              </p>
            </div>
            <select
              value={presetId}
              onChange={(e) => applyPortalPreset(e.target.value)}
              aria-label="Select exam portal preset"
              className="min-h-[44px] px-3 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-neutral-900 text-xs font-semibold text-neutral-900 dark:text-white cursor-pointer"
            >
              <option value="">Custom Dimensions &amp; KB Limit</option>
              {EXAM_IMAGE_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {activePreset && (
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] bg-white/80 dark:bg-neutral-900/80 px-3 py-2 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
              <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                {activePreset.dpiLabel} &bull; {activePreset.minKb}–{activePreset.maxKb} KB &bull;{' '}
                {activePreset.guide}
              </span>
            </div>
          )}
        </div>

        {isExifTool && (
          <div className="p-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/70 dark:bg-emerald-950/30 flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-200 font-semibold">
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>
              EXIF Scrubber Active: GPS coordinates, camera make/model, and shutter timestamps are 100% stripped when re-encoding locally.
            </span>
          </div>
        )}

        {/* Batch Dropzone */}
        <SmartDropzone
          accept="image/*,.png,.jpg,.jpeg,.webp"
          multiple={true}
          files={entries.map((e) => e.file)}
          queueRows={queueRows}
          onFilesAdded={handleFilesAdded}
          onRemoveFile={handleRemoveEntry}
          onClearAll={handleClearAll}
          onDownloadAllZip={handleDownloadAllZip}
          zipBusy={zipBusy}
          title="Drop images, folders, or press Ctrl+V to paste"
          subtitle="Multi-file batch pipeline powered by parallel Web Workers"
        />

        {/* Quick Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <div>
            <label className="block text-[11px] font-bold text-neutral-500 uppercase mb-1">
              Target Size Limit (KB)
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={0}
                max={10000}
                value={targetKb}
                onChange={(e) => setTargetKb(Number(e.target.value))}
                className="w-full min-h-[44px] px-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 font-mono"
              />
              {[20, 50, 100].map((kb) => (
                <button
                  key={kb}
                  type="button"
                  onClick={() => setTargetKb(kb)}
                  className={`min-h-[44px] px-2.5 rounded-xl font-bold cursor-pointer transition ${
                    targetKb === kb
                      ? 'bg-blue-600 text-white'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
                  }`}
                >
                  {kb}K
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-neutral-500 uppercase mb-1">
              Output Format
            </label>
            <select
              value={outputMime}
              onChange={(e) => setOutputMime(e.target.value)}
              className="w-full min-h-[44px] px-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 font-semibold"
            >
              <option value="image/jpeg">JPG (Smallest Exam / Web)</option>
              <option value="image/webp">WebP (Modern Compressed)</option>
              <option value="image/png">PNG (Lossless Alpha)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-neutral-500 uppercase mb-1">
              Width x Height (px, 0 = Original)
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <input
                type="number"
                min={0}
                max={8000}
                value={resizeW}
                placeholder="Width"
                onChange={(e) => setResizeW(Number(e.target.value))}
                className="w-full min-h-[44px] px-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 font-mono"
              />
              <input
                type="number"
                min={0}
                max={8000}
                value={resizeH}
                placeholder="Height"
                onChange={(e) => setResizeH(Number(e.target.value))}
                className="w-full min-h-[44px] px-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-neutral-500 uppercase mb-1">
              Quality: {quality}%
            </label>
            <input
              type="range"
              min={10}
              max={100}
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
              className="w-full accent-blue-600 h-11 cursor-pointer"
            />
          </div>
        </div>

        {/* Fine Adjustments Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-neutral-500 uppercase mb-1">
              Watermark Text (Optional)
            </label>
            <input
              type="text"
              value={watermarkText}
              onChange={(e) => setWatermarkText(e.target.value)}
              placeholder="Watermark overlay..."
              className="w-full min-h-[44px] px-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-neutral-500 uppercase mb-1">
              Brightness ({brightness}%) / Contrast ({contrast}%)
            </label>
            <div className="flex items-center gap-2 h-11">
              <Sliders className="w-4 h-4 text-neutral-400 shrink-0" />
              <input
                type="range"
                min={50}
                max={160}
                value={brightness}
                onChange={(e) => setBrightness(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
              <input
                type="range"
                min={50}
                max={160}
                value={contrast}
                onChange={(e) => setContrast(Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pt-4 sm:pt-5">
            <button
              type="button"
              onClick={() => setRotationDeg((r) => (r + 90) % 360)}
              className="min-h-[44px] px-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" /> {rotationDeg}&deg;
            </button>
            <button
              type="button"
              onClick={() => setGrayscale((g) => !g)}
              className={`min-h-[44px] px-3 rounded-xl font-semibold cursor-pointer ${
                grayscale ? 'bg-neutral-900 text-white' : 'border border-neutral-200 dark:border-neutral-800'
              }`}
            >
              B&amp;W
            </button>
            <button
              type="button"
              onClick={() => setSepia((s) => !s)}
              className={`min-h-[44px] px-3 rounded-xl font-semibold cursor-pointer ${
                sepia ? 'bg-amber-700 text-white' : 'border border-neutral-200 dark:border-neutral-800'
              }`}
            >
              Sepia
            </button>
            <button
              type="button"
              onClick={() => setInvert((v) => !v)}
              className={`min-h-[44px] px-3 rounded-xl font-semibold cursor-pointer ${
                invert ? 'bg-purple-600 text-white' : 'border border-neutral-200 dark:border-neutral-800'
              }`}
            >
              Invert
            </button>
          </div>

          <div className="space-y-1">
            <label className="flex items-center gap-2 text-[11px] font-bold text-neutral-600 dark:text-neutral-300 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={renderA4Sheet}
                onChange={(e) => setRenderA4Sheet(e.target.checked)}
                className="w-4 h-4 accent-purple-600"
              />
              <Grid className="w-3.5 h-3.5 text-purple-500" /> Printable A4 Cut Sheet Mode
            </label>
            {renderA4Sheet ? (
              <select
                value={a4Copies}
                onChange={(e) => setA4Copies(Number(e.target.value))}
                className="w-full min-h-[40px] px-3 rounded-xl border border-purple-200 dark:border-purple-900 bg-purple-50/40 dark:bg-purple-950/30 font-semibold"
              >
                <option value={8}>8 Passport Copies on A4</option>
                <option value={12}>12 Passport Copies on A4</option>
                <option value={16}>16 Passport Copies on A4</option>
              </select>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-neutral-500 shrink-0">Pixelate: {pixelateSize}x</span>
                <input
                  type="range"
                  min={1}
                  max={28}
                  value={pixelateSize}
                  onChange={(e) => setPixelateSize(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>
            )}
          </div>
        </div>

        {/* Desktop & Tablet Action Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              disabled={entries.length === 0 || processing}
              onClick={processBatch}
              className="min-h-[44px] px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md transition cursor-pointer"
            >
              {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              <span>
                {renderA4Sheet
                  ? `Generate Printable A4 Sheet (${a4Copies} Photos)`
                  : `Process ${entries.length > 1 ? `All ${entries.length} Images` : 'Image'} Locally`}
              </span>
            </button>

            {doneFiles.length === 1 && entries.find((e) => e.downloadUrl) && (
              <a
                href={entries.find((e) => e.downloadUrl)!.downloadUrl}
                download={entries.find((e) => e.downloadUrl)!.downloadName}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md transition"
              >
                <Download className="w-4 h-4" /> Download Output ({formatBytesCompact(doneFiles[0].size)})
              </a>
            )}
          </div>

          {statusNotice && (
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-2 rounded-xl border border-emerald-200 dark:border-emerald-900">
              <CheckCircle2 className="w-4 h-4 shrink-0" /> {statusNotice}
            </div>
          )}
        </div>

        {/* Palette Output */}
        {paletteColors.length > 0 && (
          <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-2">
            <div className="text-xs font-bold flex items-center gap-1.5 text-neutral-800 dark:text-neutral-200">
              <Palette className="w-4 h-4 text-amber-500" /> Extracted Hex Swatches
            </div>
            <div className="flex flex-wrap gap-2">
              {paletteColors.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => navigator.clipboard?.writeText(hex)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs font-mono cursor-pointer hover:border-blue-500"
                >
                  <span className="w-4 h-4 rounded-md border border-black/10" style={{ backgroundColor: hex }} />
                  <span>{hex}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Base64 Output */}
        {base64Text && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span>Base64 Data URI</span>
              <button
                type="button"
                onClick={() => navigator.clipboard?.writeText(base64Text)}
                className="min-h-[36px] px-3 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-blue-600 hover:text-white cursor-pointer"
              >
                Copy URI
              </button>
            </div>
            <textarea
              readOnly
              value={base64Text}
              className="w-full h-28 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 font-mono text-[11px]"
            />
          </div>
        )}

        {/* Side-by-Side First Image Result Preview */}
        {entries[0]?.result?.dataUrl && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
            <div>
              <div className="text-[11px] font-bold text-neutral-500 uppercase mb-2">
                Original ({formatBytesCompact(entries[0].file.size)})
              </div>
              {entries[0].previewUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={entries[0].previewUrl}
                  alt="Original preview"
                  className="max-h-56 mx-auto rounded-xl border border-neutral-200 dark:border-neutral-800 object-contain"
                />
              )}
            </div>
            <div>
              <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase mb-2">
                Processed ({formatBytesCompact(entries[0].result.outputSize)} &bull; {entries[0].result.width}x
                {entries[0].result.height})
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={entries[0].result.dataUrl}
                alt="Processed result"
                className="max-h-56 mx-auto rounded-xl border border-emerald-200 dark:border-emerald-900 object-contain bg-white"
              />
            </div>
          </div>
        )}
      </div>

      {/* Continue Workflow Output Action Bar */}
      {(doneFiles.length > 0 || entries.length > 0) && (
        <WorkflowChainBar
          currentSlug={tool.slug}
          mode={isPassportOrExam ? 'passport' : 'image'}
          onPipe={handlePipeNext}
          disabled={processing}
        />
      )}

      {/* Sticky Mobile Action Bar */}
      <div className="sm:hidden sticky bottom-3 z-30">
        <button
          type="button"
          disabled={entries.length === 0 || processing}
          onClick={processBatch}
          className="w-full min-h-[48px] px-5 py-3 rounded-2xl bg-blue-600 text-white text-sm font-bold shadow-xl flex items-center justify-center gap-2 disabled:opacity-40"
        >
          {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          <span>{renderA4Sheet ? 'Build A4 Print Sheet' : 'Process Images Locally'}</span>
        </button>
      </div>
    </div>
  );
}
