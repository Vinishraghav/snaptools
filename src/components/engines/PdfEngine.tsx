'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ToolDef } from '@/data/toolsRegistry';
import {
  FileText,
  Download,
  Lock,
  Image as ImageIcon,
  Type,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Copy,
  RefreshCw,
} from 'lucide-react';
import SmartDropzone, { BatchQueueRow, formatBytesCompact } from '@/components/tools/SmartDropzone';
import WorkflowChainBar from '@/components/tools/WorkflowChainBar';
import { useWorkflowStore } from '@/lib/workflowStore';
import { PDF_PORTAL_PRESETS } from '@/lib/examPresets';
import { createZipBlob } from '@/lib/imageWorkerPool';

type PdfMode =
  | 'merge'
  | 'split'
  | 'rotate'
  | 'watermark'
  | 'page-numbers'
  | 'images-to-pdf'
  | 'pdf-to-image'
  | 'pdf-to-text'
  | 'compress'
  | 'encrypt'
  | 'metadata'
  | 'generate';

interface PdfQueueEntry {
  id: string;
  file: File;
  status: 'pending' | 'processing' | 'done' | 'error';
  outputBlob?: Blob;
  downloadUrl?: string;
  downloadName?: string;
  previewUrl?: string;
  extraBadge?: string;
  error?: string;
}

const PAPER_DIMS: Record<string, [number, number]> = {
  a4: [595.28, 841.89],
  letter: [612, 792],
  legal: [612, 1008],
};

function toWinAnsiSafe(input: string): string {
  return input
    .replace(/\u20B9/g, 'Rs.')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2013|\u2014/g, '-')
    .replace(/\u2022/g, '*')
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, '');
}

function wrapLines(text: string, maxChars: number): string[] {
  const out: string[] = [];
  for (const rawLine of toWinAnsiSafe(text).split(/\r?\n/)) {
    if (rawLine.length <= maxChars) {
      out.push(rawLine);
      continue;
    }
    const words = rawLine.split(/\s+/);
    let current = '';
    for (const w of words) {
      if ((current + ' ' + w).trim().length > maxChars) {
        if (current) out.push(current);
        current = w;
      } else {
        current = current ? `${current} ${w}` : w;
      }
    }
    if (current) out.push(current);
  }
  return out.length > 0 ? out : [''];
}

function parsePageSelection(spec: string, totalPages: number): number[] {
  const indices: number[] = [];
  for (const rawPart of spec.split(',')) {
    const part = rawPart.trim();
    if (!part) continue;
    if (part.includes('-')) {
      const [sStr, eStr] = part.split('-');
      const s = Math.max(1, parseInt(sStr, 10) || 1);
      const e = Math.min(totalPages, parseInt(eStr, 10) || totalPages);
      for (let p = Math.min(s, e); p <= Math.max(s, e); p++) indices.push(p - 1);
    } else {
      const p = parseInt(part, 10);
      if (!Number.isNaN(p) && p >= 1 && p <= totalPages) indices.push(p - 1);
    }
  }
  return Array.from(new Set(indices));
}

function detectPdfMode(slug: string, spec: Record<string, unknown>): PdfMode {
  const s = slug.toLowerCase();
  if (s.includes('images-to-pdf') || s.includes('jpg-to-pdf') || s.includes('png-to-pdf') || s.includes('webp-to-pdf')) {
    return 'images-to-pdf';
  }
  if (s.includes('pdf-to-jpg') || s.includes('pdf-to-png') || s.includes('pdf-to-webp') || s.includes('pdf-to-image')) {
    return 'pdf-to-image';
  }
  if (s.includes('plain-text') || s.includes('pdf-to-text') || s.includes('extract-text')) {
    return 'pdf-to-text';
  }
  if (s.includes('password') || s.includes('protect') || s.includes('encrypt') || s.includes('lock-pdf')) {
    return 'encrypt';
  }
  if (s.includes('merge') || s.includes('join') || s.includes('combine')) return 'merge';
  if (s.includes('split') || s.includes('delete-page') || s.includes('remove-page') || s.includes('extract-page') || s.includes('odd-even')) {
    return 'split';
  }
  if (s.includes('rotate')) return 'rotate';
  if (s.includes('watermark')) return 'watermark';
  if (s.includes('page-number') || s.includes('numbering')) return 'page-numbers';
  if (s.includes('metadata') || s.includes('properties')) return 'metadata';
  if (s.includes('compress') || s.includes('reduce') || s.includes('shrink') || typeof spec.targetKb === 'number') {
    return 'compress';
  }
  if (s.includes('create-') || s.includes('generator') || s.includes('maker') || s.includes('text-to-pdf') || s.includes('invoice')) {
    return 'generate';
  }
  return 'compress';
}

async function fileToPngBytes(file: File): Promise<Uint8Array> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error(`Unable to decode ${file.name}`));
      el.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas unavailable');
    ctx.drawImage(img, 0, 0);
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/png'));
    if (!blob) throw new Error(`Failed encoding ${file.name}`);
    return new Uint8Array(await blob.arrayBuffer());
  } finally {
    URL.revokeObjectURL(url);
  }
}

export default function PdfEngine({ tool }: { tool: ToolDef }) {
  const slug = tool.slug.toLowerCase();
  const spec = (tool.spec ?? {}) as Record<string, unknown>;
  const mode = detectPdfMode(slug, spec);
  const { payload, markConsumed, pipeToTool } = useWorkflowStore();

  const isSplitOrDelete = mode === 'split';
  const isImagesToPdf = mode === 'images-to-pdf';
  const specTargetKb = typeof spec.targetKb === 'number' ? spec.targetKb : 200;

  const initialFiles = useMemo(() => {
    if (!payload || payload.files.length === 0) return [];
    if (isImagesToPdf) {
      return payload.files.filter(
        (f) => f.type.startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(f.name)
      );
    }
    return payload.files.filter(
      (f) => f.type === 'application/pdf' || /\.pdf$/i.test(f.name)
    );
  }, [payload, isImagesToPdf]);

  const [entries, setEntries] = useState<PdfQueueEntry[]>(() =>
    initialFiles.map((file, idx) => ({
      id: `init_${idx}_${file.name}`,
      file,
      status: 'pending',
    }))
  );

  // Generated multi-page or standalone outputs (for Merge, Images-to-PDF, PDF->JPG, Generate)
  const [generatedResults, setGeneratedResults] = useState<PdfQueueEntry[]>([]);
  const [extractedText, setExtractedText] = useState<string>('');
  const [processing, setProcessing] = useState<boolean>(false);
  const [zipBusy, setZipBusy] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Mode controls
  const [targetKb, setTargetKb] = useState<number>(specTargetKb);
  const [pageRange, setPageRange] = useState<string>('1-2');
  const [removeSelected, setRemoveSelected] = useState<boolean>(
    slug.includes('delete') || slug.includes('remove')
  );
  const [rotationAngle, setRotationAngle] = useState<number>(90);
  const [watermarkText, setWatermarkText] = useState<string>('CONFIDENTIAL');
  const [userPassword, setUserPassword] = useState<string>('');
  const [ownerPassword, setOwnerPassword] = useState<string>('');
  const [imagePaper, setImagePaper] = useState<string>('a4');
  const [imageFormatOut, setImageFormatOut] = useState<'image/jpeg' | 'image/png'>(
    slug.includes('png') ? 'image/png' : 'image/jpeg'
  );
  const [renderScale, setRenderScale] = useState<number>(1.75);
  const [metaTitle, setMetaTitle] = useState<string>('SnapTools Document');
  const [metaAuthor, setMetaAuthor] = useState<string>('SnapTools User');
  const [docTitle, setDocTitle] = useState<string>(tool.title);
  const [docBody, setDocBody] = useState<string>(
    'Generated 100% locally inside browser memory with SnapTools.\nZero server uploads.\n\nEnter your custom lines below and export instantly as PDF.'
  );

  const urlsRef = useRef<string[]>([]);

  useEffect(() => {
    const urls = urlsRef.current;
    return () => {
      urls.forEach((u) => {
        if (u.startsWith('blob:')) URL.revokeObjectURL(u);
      });
    };
  }, []);

  useEffect(() => {
    if (initialFiles.length > 0 && payload?.id) {
      Promise.resolve().then(() => markConsumed(payload.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilesAdded = (incoming: File[], replace?: boolean) => {
    const newEntries: PdfQueueEntry[] = incoming.map((file, i) => ({
      id: `pdf_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 6)}`,
      file,
      status: 'pending',
    }));
    setEntries((prev) => (replace ? newEntries : [...prev, ...newEntries]));
    setGeneratedResults([]);
    setExtractedText('');
    setErrorMessage('');
    setStatusMessage('');
  };

  const handleClearAll = () => {
    setEntries([]);
    setGeneratedResults([]);
    setExtractedText('');
    setErrorMessage('');
    setStatusMessage('');
  };

  const makePdfBlob = (bytes: Uint8Array): Blob => {
    const copy = new Uint8Array(bytes.byteLength);
    copy.set(bytes);
    return new Blob([copy.buffer], { type: 'application/pdf' });
  };

  const compressPdfAdaptive = async (rawBytes: Uint8Array, limitKb: number): Promise<Uint8Array> => {
    const { PDFDocument } = await import('pdf-lib');
    const srcDoc = await PDFDocument.load(rawBytes, { ignoreEncryption: true });
    srcDoc.setTitle('');
    srcDoc.setSubject('');
    const compact = await srcDoc.save({ useObjectStreams: true });
    if (limitKb <= 0 || compact.byteLength <= limitKb * 1024) {
      return compact;
    }

    // Fallback: re-render PDF pages at tuned DPI + JPEG quality using pdfjs-dist so scanned docs fit strict govt KB limits
    const pdfjs = await import('pdfjs-dist');
    pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
    const loaded = await pdfjs.getDocument({ data: rawBytes.slice() }).promise;
    const numPages = loaded.numPages;

    const presets = [
      { scale: 1.25, q: 0.72 },
      { scale: 1.0, q: 0.56 },
      { scale: 0.8, q: 0.42 },
      { scale: 0.65, q: 0.32 },
    ];

    let bestBytes = compact;
    for (const preset of presets) {
      const rebuilt = await PDFDocument.create();
      for (let p = 1; p <= numPages; p++) {
        const page = await loaded.getPage(p);
        const vp = page.getViewport({ scale: preset.scale });
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.floor(vp.width));
        canvas.height = Math.max(1, Math.floor(vp.height));
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: ctx, viewport: vp, canvas }).promise;
        const jpgBlob = await new Promise<Blob | null>((r) =>
          canvas.toBlob(r, 'image/jpeg', preset.q)
        );
        if (!jpgBlob) continue;
        const jpgBytes = new Uint8Array(await jpgBlob.arrayBuffer());
        const embedded = await rebuilt.embedJpg(jpgBytes);
        const origVp = page.getViewport({ scale: 1 });
        const outPage = rebuilt.addPage([origVp.width, origVp.height]);
        outPage.drawImage(embedded, {
          x: 0,
          y: 0,
          width: origVp.width,
          height: origVp.height,
        });
      }
      const attempt = await rebuilt.save({ useObjectStreams: true });
      if (attempt.byteLength < bestBytes.byteLength) {
        bestBytes = attempt;
      }
      if (bestBytes.byteLength <= limitKb * 1024) break;
    }
    return bestBytes;
  };

  const processPdf = async () => {
    setErrorMessage('');
    setStatusMessage('');
    setExtractedText('');

    if (mode !== 'generate' && entries.length === 0) {
      setErrorMessage(
        isImagesToPdf ? 'Add one or more images first.' : 'Drop or select at least one PDF file first.'
      );
      return;
    }
    if (mode === 'encrypt' && !userPassword.trim()) {
      setErrorMessage('Enter a password to encrypt the PDF.');
      return;
    }

    setProcessing(true);
    try {
      const pdfLib = await import('pdf-lib');
      const { PDFDocument, StandardFonts, rgb, degrees } = pdfLib;

      if (mode === 'generate') {
        const doc = await PDFDocument.create();
        const font = await doc.embedFont(StandardFonts.Helvetica);
        const bold = await doc.embedFont(StandardFonts.HelveticaBold);
        let page = doc.addPage([595.28, 841.89]);
        const { height } = page.getSize();
        let y = height - 60;
        page.drawText(toWinAnsiSafe(docTitle), { x: 48, y, size: 18, font: bold, color: rgb(0.1, 0.25, 0.65) });
        y -= 30;
        for (const line of wrapLines(docBody, 82)) {
          if (y < 52) {
            page = doc.addPage([595.28, 841.89]);
            y = page.getSize().height - 52;
          }
          if (line) page.drawText(line, { x: 48, y, size: 11, font, color: rgb(0.15, 0.15, 0.15) });
          y -= 16;
        }
        const outBytes = await doc.save();
        const blob = makePdfBlob(outBytes);
        const url = URL.createObjectURL(blob);
        urlsRef.current.push(url);
        setGeneratedResults([
          {
            id: `gen_${Date.now()}`,
            file: new File([blob], `${slug}.pdf`, { type: 'application/pdf' }),
            status: 'done',
            outputBlob: blob,
            downloadUrl: url,
            downloadName: `${slug}.pdf`,
          },
        ]);
        setStatusMessage(`Generated ${slug}.pdf in browser memory.`);
        return;
      }

      if (mode === 'merge') {
        const merged = await PDFDocument.create();
        for (const entry of entries) {
          const bytes = new Uint8Array(await entry.file.arrayBuffer());
          const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
          const copied = await merged.copyPages(src, src.getPageIndices());
          copied.forEach((p) => merged.addPage(p));
        }
        const outBytes = await merged.save();
        const blob = makePdfBlob(outBytes);
        const url = URL.createObjectURL(blob);
        urlsRef.current.push(url);
        const outName = `merged-${entries.length}-files.pdf`;
        setGeneratedResults([
          {
            id: `merge_${Date.now()}`,
            file: new File([blob], outName, { type: 'application/pdf' }),
            status: 'done',
            outputBlob: blob,
            downloadUrl: url,
            downloadName: outName,
            extraBadge: `${merged.getPageCount()} pages`,
          },
        ]);
        setStatusMessage(`Merged ${entries.length} PDFs (${merged.getPageCount()} total pages).`);
        return;
      }

      if (mode === 'images-to-pdf') {
        const doc = await PDFDocument.create();
        const [pw, ph] = PAPER_DIMS[imagePaper] || PAPER_DIMS.a4;
        const margin = 24;
        for (const entry of entries) {
          const raw = new Uint8Array(await entry.file.arrayBuffer());
          const isJpg = /jpe?g$/i.test(entry.file.name) || entry.file.type === 'image/jpeg';
          const embedded = isJpg
            ? await doc.embedJpg(raw).catch(async () => doc.embedPng(await fileToPngBytes(entry.file)))
            : await doc.embedPng(await fileToPngBytes(entry.file));
          const page = doc.addPage([pw, ph]);
          const maxW = pw - margin * 2;
          const maxH = ph - margin * 2;
          const scale = Math.min(maxW / embedded.width, maxH / embedded.height, 1);
          const drawW = embedded.width * scale;
          const drawH = embedded.height * scale;
          page.drawImage(embedded, {
            x: (pw - drawW) / 2,
            y: (ph - drawH) / 2,
            width: drawW,
            height: drawH,
          });
        }
        const outBytes = await doc.save();
        const blob = makePdfBlob(outBytes);
        const url = URL.createObjectURL(blob);
        urlsRef.current.push(url);
        const outName = 'images-to-document.pdf';
        setGeneratedResults([
          {
            id: `img2pdf_${Date.now()}`,
            file: new File([blob], outName, { type: 'application/pdf' }),
            status: 'done',
            outputBlob: blob,
            downloadUrl: url,
            downloadName: outName,
            extraBadge: `${doc.getPageCount()} pages`,
          },
        ]);
        setStatusMessage(`Created PDF from ${entries.length} image(s) privately.`);
        return;
      }

      if (mode === 'pdf-to-image') {
        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
        const raw = new Uint8Array(await entries[0].file.arrayBuffer());
        const pdf = await pdfjs.getDocument({ data: raw }).promise;
        const pageOutputs: PdfQueueEntry[] = [];
        const stem = entries[0].file.name.replace(/\.pdf$/i, '') || 'page';
        const ext = imageFormatOut === 'image/png' ? 'png' : 'jpg';

        for (let p = 1; p <= pdf.numPages; p++) {
          const page = await pdf.getPage(p);
          const vp = page.getViewport({ scale: renderScale });
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.floor(vp.width));
          canvas.height = Math.max(1, Math.floor(vp.height));
          const ctx = canvas.getContext('2d');
          if (!ctx) continue;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          await page.render({ canvasContext: ctx, viewport: vp, canvas }).promise;
          const imgBlob = await new Promise<Blob | null>((r) =>
            canvas.toBlob(r, imageFormatOut, 0.92)
          );
          if (!imgBlob) continue;
          const dlUrl = URL.createObjectURL(imgBlob);
          urlsRef.current.push(dlUrl);
          const outName = `${stem}-page-${p}.${ext}`;
          pageOutputs.push({
            id: `p_${p}_${Date.now()}`,
            file: new File([imgBlob], outName, { type: imageFormatOut }),
            status: 'done',
            outputBlob: imgBlob,
            downloadUrl: dlUrl,
            downloadName: outName,
            previewUrl: dlUrl,
            extraBadge: `${canvas.width}x${canvas.height}`,
          });
        }

        setGeneratedResults(pageOutputs);
        setStatusMessage(`Rendered ${pageOutputs.length} PDF page(s) to ${ext.toUpperCase()} offline.`);
        return;
      }

      if (mode === 'pdf-to-text') {
        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
        const raw = new Uint8Array(await entries[0].file.arrayBuffer());
        const pdf = await pdfjs.getDocument({ data: raw }).promise;
        const chunks: string[] = [];
        for (let p = 1; p <= pdf.numPages; p++) {
          const page = await pdf.getPage(p);
          const tc = await page.getTextContent();
          const lineText = tc.items
            .map((it) => ('str' in it ? it.str : ''))
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();
          chunks.push(`--- Page ${p} ---\n${lineText}`);
        }
        const joined = chunks.join('\n\n');
        setExtractedText(joined);
        setStatusMessage(`Extracted text across ${pdf.numPages} PDF page(s) locally.`);
        return;
      }

      // Per-PDF batch operations (compress, encrypt, split, rotate, watermark, page-numbers, metadata)
      setEntries((prev) => prev.map((e) => ({ ...e, status: 'processing', error: undefined })));
      const updatedEntries: PdfQueueEntry[] = [];

      for (const entry of entries) {
        try {
          const raw = new Uint8Array(await entry.file.arrayBuffer());
          let outBytes: Uint8Array;
          let suffix = 'processed';

          if (mode === 'encrypt') {
            const { encryptPDF } = await import('@pdfsmaller/pdf-encrypt-lite');
            outBytes = await encryptPDF(raw, userPassword.trim(), ownerPassword.trim() || userPassword.trim());
            suffix = 'protected';
          } else if (mode === 'compress') {
            outBytes = await compressPdfAdaptive(raw, targetKb);
            suffix = targetKb > 0 ? `${targetKb}kb-compressed` : 'compressed';
          } else {
            const doc = await PDFDocument.load(raw, { ignoreEncryption: true });
            const pages = doc.getPages();

            if (mode === 'split') {
              const chosen = parsePageSelection(pageRange, pages.length);
              const keepIndices = removeSelected
                ? doc.getPageIndices().filter((idx) => !chosen.includes(idx))
                : chosen;
              if (keepIndices.length === 0) throw new Error('No pages matched selection.');
              const outDoc = await PDFDocument.create();
              const copied = await outDoc.copyPages(doc, keepIndices);
              copied.forEach((p) => outDoc.addPage(p));
              outBytes = await outDoc.save();
              suffix = removeSelected ? 'trimmed' : 'extracted';
            } else if (mode === 'rotate') {
              pages.forEach((p) => {
                const cur = p.getRotation().angle;
                p.setRotation(degrees((cur + rotationAngle) % 360));
              });
              outBytes = await doc.save();
              suffix = `rotated-${rotationAngle}`;
            } else if (mode === 'watermark') {
              const font = await doc.embedFont(StandardFonts.HelveticaBold);
              const label = toWinAnsiSafe(watermarkText || 'CONFIDENTIAL');
              pages.forEach((p) => {
                const { width, height } = p.getSize();
                p.drawText(label, {
                  x: width * 0.22,
                  y: height * 0.45,
                  size: 38,
                  font,
                  color: rgb(0.55, 0.55, 0.55),
                  rotate: degrees(35),
                  opacity: 0.35,
                });
              });
              outBytes = await doc.save();
              suffix = 'watermarked';
            } else if (mode === 'page-numbers') {
              const font = await doc.embedFont(StandardFonts.Helvetica);
              pages.forEach((p, idx) => {
                const { width } = p.getSize();
                p.drawText(`Page ${idx + 1} of ${pages.length}`, {
                  x: width / 2 - 28,
                  y: 22,
                  size: 10,
                  font,
                  color: rgb(0.3, 0.3, 0.3),
                });
              });
              outBytes = await doc.save();
              suffix = 'numbered';
            } else {
              doc.setTitle(toWinAnsiSafe(metaTitle));
              doc.setAuthor(toWinAnsiSafe(metaAuthor));
              outBytes = await doc.save();
              suffix = 'updated-meta';
            }
          }

          const blob = makePdfBlob(outBytes);
          const dlUrl = URL.createObjectURL(blob);
          urlsRef.current.push(dlUrl);
          const base = entry.file.name.replace(/\.pdf$/i, '') || 'document';
          updatedEntries.push({
            ...entry,
            status: 'done',
            outputBlob: blob,
            downloadUrl: dlUrl,
            downloadName: `${base}-${suffix}.pdf`,
          });
        } catch (err) {
          updatedEntries.push({
            ...entry,
            status: 'error',
            error: (err as Error).message,
          });
        }
      }

      setEntries(updatedEntries);
      const okCount = updatedEntries.filter((e) => e.status === 'done').length;
      if (okCount > 0) {
        setStatusMessage(`Processed ${okCount} PDF ${okCount === 1 ? 'file' : 'files'} locally in browser RAM.`);
      }
    } catch (err) {
      setErrorMessage((err as Error).message || 'PDF operation failed.');
    } finally {
      setProcessing(false);
    }
  };

  const activeOutputFiles: File[] = useMemo(() => {
    if (generatedResults.length > 0) {
      return generatedResults
        .filter((r) => r.outputBlob)
        .map((r) => new File([r.outputBlob!], r.downloadName || r.file.name, { type: r.outputBlob!.type }));
    }
    const done = entries
      .filter((e) => e.status === 'done' && e.outputBlob)
      .map((e) => new File([e.outputBlob!], e.downloadName || e.file.name, { type: 'application/pdf' }));
    return done.length > 0 ? done : entries.map((e) => e.file);
  }, [generatedResults, entries]);

  const handleDownloadAllZip = async () => {
    const pool =
      generatedResults.length > 1
        ? generatedResults.filter((r) => r.outputBlob)
        : entries.filter((e) => e.status === 'done' && e.outputBlob);
    if (pool.length < 2) return;
    setZipBusy(true);
    try {
      const zip = await createZipBlob(
        pool.map((item) => ({
          name: item.downloadName || item.file.name,
          blob: item.outputBlob!,
        }))
      );
      const url = URL.createObjectURL(zip);
      urlsRef.current.push(url);
      const a = document.createElement('a');
      a.href = url;
      a.download = `snaptools-pdf-batch-${pool.length}.zip`;
      a.click();
    } finally {
      setZipBusy(false);
    }
  };

  const handlePipePdf = (targetSlugOrPath: string) => {
    if (activeOutputFiles.length === 0) return;
    pipeToTool(targetSlugOrPath, {
      files: activeOutputFiles,
      sourceToolSlug: tool.slug,
    });
  };

  const displayRows: BatchQueueRow[] = (generatedResults.length > 0 ? generatedResults : entries).map((e) => ({
    id: e.id,
    name: e.downloadName || e.file.name,
    originalSize: e.file.size,
    outputSize: e.outputBlob?.size,
    status: e.status,
    previewUrl: e.previewUrl,
    downloadUrl: e.downloadUrl,
    downloadName: e.downloadName,
    extraBadge: e.extraBadge,
    error: e.error,
  }));

  return (
    <div className="space-y-6">
      <div className="p-5 sm:p-7 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-6">
        {/* Dropzone (unless generate mode) */}
        {mode !== 'generate' && (
          <SmartDropzone
            accept={isImagesToPdf ? 'image/*,.png,.jpg,.jpeg,.webp' : '.pdf,application/pdf'}
            multiple={mode !== 'pdf-to-image' && mode !== 'pdf-to-text'}
            files={entries.map((e) => e.file)}
            queueRows={displayRows}
            onFilesAdded={handleFilesAdded}
            onRemoveFile={(idx) => setEntries((prev) => prev.filter((_, i) => i !== idx))}
            onClearAll={handleClearAll}
            onDownloadAllZip={handleDownloadAllZip}
            zipBusy={zipBusy}
            title={
              isImagesToPdf
                ? 'Drop JPG, PNG or WebP images (or folder) to combine into PDF'
                : 'Drop PDF file(s) or folder here — 0 KB server uploads'
            }
            subtitle="All PDF rendering, merging, and RC4 128-bit encryption execute locally in RAM"
            accent="rose"
          />
        )}

        {/* Mode-Specific Controls */}
        {mode === 'compress' && (
          <div className="p-4 rounded-2xl border border-amber-200/80 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 space-y-3 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600" /> Exam &amp; Visa Portal PDF Limit Presets
              </div>
              <select
                onChange={(e) => {
                  const found = PDF_PORTAL_PRESETS.find((p) => p.id === e.target.value);
                  if (found) setTargetKb(found.targetKb);
                }}
                defaultValue=""
                className="min-h-[44px] px-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-white dark:bg-neutral-900 font-semibold"
              >
                <option value="">Choose Portal Limit Preset...</option>
                {PDF_PORTAL_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="font-bold text-neutral-600 dark:text-neutral-300">
                Target Max KB:
              </label>
              <input
                type="number"
                min={30}
                max={20000}
                value={targetKb}
                onChange={(e) => setTargetKb(Number(e.target.value))}
                className="w-28 min-h-[44px] px-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 font-mono"
              />
              {[100, 200, 300, 500].map((kb) => (
                <button
                  key={kb}
                  type="button"
                  onClick={() => setTargetKb(kb)}
                  className={`min-h-[44px] px-3 rounded-xl font-bold cursor-pointer ${
                    targetKb === kb
                      ? 'bg-amber-600 text-white'
                      : 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700'
                  }`}
                >
                  {kb} KB
                </button>
              ))}
            </div>
          </div>
        )}

        {mode === 'encrypt' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/40 dark:bg-rose-950/20 text-xs">
            <div>
              <label className="block text-[11px] font-bold uppercase text-neutral-500 mb-1">
                Document Open Password (Required)
              </label>
              <input
                type="password"
                value={userPassword}
                onChange={(e) => setUserPassword(e.target.value)}
                placeholder="Enter secret PDF password..."
                className="w-full min-h-[44px] px-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-neutral-500 mb-1">
                Owner / Permissions Password (Optional)
              </label>
              <input
                type="password"
                value={ownerPassword}
                onChange={(e) => setOwnerPassword(e.target.value)}
                placeholder="Defaults to open password"
                className="w-full min-h-[44px] px-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
              />
            </div>
          </div>
        )}

        {mode === 'split' && (
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-bold uppercase text-neutral-500 mb-1">
                Pages (e.g., 1-2, 4)
              </label>
              <input
                type="text"
                value={pageRange}
                onChange={(e) => setPageRange(e.target.value)}
                className="w-48 min-h-[44px] px-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 font-mono"
              />
            </div>
            <label className="flex items-center gap-2 font-semibold cursor-pointer pt-5">
              <input
                type="checkbox"
                checked={removeSelected}
                onChange={(e) => setRemoveSelected(e.target.checked)}
                className="w-4 h-4 accent-rose-600"
              />
              Delete selected pages instead of extracting
            </label>
          </div>
        )}

        {mode === 'rotate' && (
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-neutral-500">Rotation Angle:</span>
            {[90, 180, 270].map((deg) => (
              <button
                key={deg}
                type="button"
                onClick={() => setRotationAngle(deg)}
                className={`min-h-[44px] px-4 rounded-xl font-bold cursor-pointer ${
                  rotationAngle === deg
                    ? 'bg-rose-600 text-white'
                    : 'bg-neutral-100 dark:bg-neutral-800'
                }`}
              >
                {deg}&deg;
              </button>
            ))}
          </div>
        )}

        {mode === 'watermark' && (
          <div className="text-xs max-w-sm">
            <label className="block text-[11px] font-bold uppercase text-neutral-500 mb-1">
              Diagonal Stamp Text
            </label>
            <input
              type="text"
              value={watermarkText}
              onChange={(e) => setWatermarkText(e.target.value)}
              className="w-full min-h-[44px] px-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 font-semibold"
            />
          </div>
        )}

        {mode === 'images-to-pdf' && (
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="font-bold text-neutral-500">Paper Size:</span>
            {Object.keys(PAPER_DIMS).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setImagePaper(p)}
                className={`min-h-[44px] px-4 rounded-xl font-bold uppercase cursor-pointer ${
                  imagePaper === p
                    ? 'bg-rose-600 text-white'
                    : 'bg-neutral-100 dark:bg-neutral-800'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        )}

        {mode === 'pdf-to-image' && (
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-neutral-500">Format:</span>
              <select
                value={imageFormatOut}
                onChange={(e) => setImageFormatOut(e.target.value as 'image/jpeg' | 'image/png')}
                className="min-h-[44px] px-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 font-semibold"
              >
                <option value="image/jpeg">JPG</option>
                <option value="image/png">PNG</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-neutral-500">DPI Scale:</span>
              <select
                value={renderScale}
                onChange={(e) => setRenderScale(Number(e.target.value))}
                className="min-h-[44px] px-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 font-semibold"
              >
                <option value={1.25}>Fast (1.25x)</option>
                <option value={1.75}>HD (1.75x)</option>
                <option value={2.5}>Print Crisp (2.5x)</option>
              </select>
            </div>
          </div>
        )}

        {mode === 'metadata' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <input
              type="text"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              placeholder="Document Title"
              className="min-h-[44px] px-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950"
            />
            <input
              type="text"
              value={metaAuthor}
              onChange={(e) => setMetaAuthor(e.target.value)}
              placeholder="Author Name"
              className="min-h-[44px] px-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950"
            />
          </div>
        )}

        {mode === 'generate' && (
          <div className="space-y-3 text-xs">
            <input
              type="text"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              className="w-full min-h-[44px] px-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 font-bold"
            />
            <textarea
              value={docBody}
              onChange={(e) => setDocBody(e.target.value)}
              rows={8}
              className="w-full p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 font-mono"
            />
          </div>
        )}

        {/* Primary Action Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={processing || (mode !== 'generate' && entries.length === 0)}
            onClick={processPdf}
            className="min-h-[44px] px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md transition cursor-pointer"
          >
            {processing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : mode === 'encrypt' ? (
              <Lock className="w-4 h-4" />
            ) : mode === 'pdf-to-image' ? (
              <ImageIcon className="w-4 h-4" />
            ) : mode === 'pdf-to-text' ? (
              <Type className="w-4 h-4" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span>
              {mode === 'merge'
                ? 'Merge All PDFs Locally'
                : mode === 'encrypt'
                  ? 'Password Protect PDF'
                  : mode === 'pdf-to-image'
                    ? 'Render PDF Pages to Images'
                    : mode === 'pdf-to-text'
                      ? 'Extract Plain Text'
                      : mode === 'images-to-pdf'
                        ? 'Create PDF from Images'
                        : 'Run Locally'}
            </span>
          </button>

          {generatedResults.length === 1 && generatedResults[0].downloadUrl && (
            <a
              href={generatedResults[0].downloadUrl}
              download={generatedResults[0].downloadName}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md transition"
            >
              <Download className="w-4 h-4" />
              <span>
                Download ({formatBytesCompact(generatedResults[0].outputBlob?.size || 0)})
              </span>
            </a>
          )}
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> {errorMessage}
          </div>
        )}

        {statusMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" /> {statusMessage}
          </div>
        )}

        {extractedText && (
          <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-rose-600" /> Extracted Plain Text
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigator.clipboard?.writeText(extractedText)}
                  className="min-h-[36px] px-3 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-blue-600 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const blob = new Blob([extractedText], { type: 'text/plain' });
                    const u = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = u;
                    a.download = 'extracted-text.txt';
                    a.click();
                  }}
                  className="min-h-[36px] px-3 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> .TXT
                </button>
              </div>
            </div>
            <textarea
              readOnly
              value={extractedText}
              rows={9}
              className="w-full p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 font-mono text-xs"
            />
          </div>
        )}
      </div>

      {/* Continue Workflow Bar (PDF output chains -> Compress, Lock, Page Numbers, Sign PDF, JPG, Text) */}
      {activeOutputFiles.length > 0 && mode !== 'pdf-to-text' && (
        <WorkflowChainBar
          currentSlug={tool.slug}
          mode={mode === 'pdf-to-image' ? 'image' : isSplitOrDelete ? 'pdf-split' : 'pdf'}
          onPipe={handlePipePdf}
          disabled={processing}
        />
      )}

      {/* Sticky Mobile Action Bar */}
      <div className="sm:hidden sticky bottom-3 z-30">
        <button
          type="button"
          disabled={processing || (mode !== 'generate' && entries.length === 0)}
          onClick={processPdf}
          className="w-full min-h-[48px] px-5 py-3 rounded-2xl bg-rose-600 text-white text-sm font-bold shadow-xl flex items-center justify-center gap-2 disabled:opacity-40"
        >
          {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          <span>Process PDF Locally</span>
        </button>
      </div>
    </div>
  );
}
