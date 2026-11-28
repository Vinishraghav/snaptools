'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  PenTool,
  Type,
  Undo2,
  Trash2,
  Download,
  FileUp,
  CheckCircle2,
  Workflow,
} from 'lucide-react';
import { triggerBlobDownload } from '@/lib/pdfStudios';
import AdSlot from '@/components/ads/AdSlot';
import { useWorkflowStore } from '@/lib/workflowStore';
import { EXAM_IMAGE_PRESETS } from '@/lib/examPresets';

const SIGNATURE_PORTAL_PRESETS = EXAM_IMAGE_PRESETS.filter(
  (p) => p.id.includes('sign')
);

interface Stroke {
  color: string;
  width: number;
  points: Array<{ x: number; y: number }>;
}

type SignatureMode = 'draw' | 'type';
type PlacementPreset = 'bottom-right' | 'bottom-left' | 'bottom-center' | 'top-right';

const TYPED_FONTS = [
  { id: 'script', label: 'Classic Script', fontCss: 'italic 44px "Brush Script MT", "Segoe Script", cursive' },
  { id: 'serif', label: 'Executive Serif', fontCss: 'italic 38px Georgia, "Times New Roman", serif' },
  { id: 'clean', label: 'Modern Signature', fontCss: 'italic 600 36px "Trebuchet MS", sans-serif' },
  { id: 'mono', label: 'Minimal Initial', fontCss: 'bold 34px "Courier New", monospace' },
];

const CANVAS_W = 640;
const CANVAS_H = 220;

export default function SignatureStudio() {
  const [mode, setMode] = useState<SignatureMode>('draw');
  const [inkColor, setInkColor] = useState('#0f172a');
  const [penWidth, setPenWidth] = useState(3.5);
  const [strokeCount, setStrokeCount] = useState(0);

  const [typedName, setTypedName] = useState('Aarav Krishnan');
  const [typedFontIdx, setTypedFontIdx] = useState(0);
  const [exportPresetId, setExportPresetId] = useState<string>('');

  const { payload, markConsumed } = useWorkflowStore();
  const pipedPdf = useMemo(
    () =>
      payload?.files.find(
        (f) => f.type === 'application/pdf' || /\.pdf$/i.test(f.name)
      ) ?? null,
    [payload]
  );

  const [pdfFile, setPdfFile] = useState<File | null>(() => pipedPdf);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [pdfPages, setPdfPages] = useState(1);
  const [targetPage, setTargetPage] = useState(1);
  const [placement, setPlacement] = useState<PlacementPreset>('bottom-right');
  const [sigWidthPct, setSigWidthPct] = useState(26);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!pipedPdf) return;
    let active = true;
    (async () => {
      try {
        const raw = new Uint8Array(await pipedPdf.arrayBuffer());
        const { PDFDocument } = await import('pdf-lib');
        const doc = await PDFDocument.load(raw, { ignoreEncryption: true });
        if (!active) return;
        setPdfFile(pipedPdf);
        setPdfBytes(raw);
        setPdfPages(doc.getPageCount());
        setTargetPage(doc.getPageCount());
        setStatusMsg(`Loaded piped PDF "${pipedPdf.name}" (${doc.getPageCount()} pages)`);
        if (payload?.id) markConsumed(payload.id);
      } catch {
        // ignore invalid piped file
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokesRef = useRef<Stroke[]>([]);
  const drawingRef = useRef(false);
  const activeStrokeRef = useRef<Stroke | null>(null);

  const renderStrokes = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    for (const s of strokesRef.current) {
      if (s.points.length === 0) continue;
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(s.points[0].x, s.points[0].y);
      if (s.points.length === 1) {
        ctx.lineTo(s.points[0].x + 0.1, s.points[0].y + 0.1);
      } else {
        for (let i = 1; i < s.points.length - 1; i++) {
          const midX = (s.points[i].x + s.points[i + 1].x) / 2;
          const midY = (s.points[i].y + s.points[i + 1].y) / 2;
          ctx.quadraticCurveTo(s.points[i].x, s.points[i].y, midX, midY);
        }
        const last = s.points[s.points.length - 1];
        ctx.lineTo(last.x, last.y);
      }
      ctx.stroke();
    }
  }, []);

  useEffect(() => {
    if (mode === 'draw') {
      renderStrokes();
    }
  }, [mode, renderStrokes]);

  const getPointerPos = (e: React.PointerEvent<HTMLCanvasElement>): { x: number; y: number } => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * CANVAS_W,
      y: ((e.clientY - rect.top) / rect.height) * CANVAS_H,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (mode !== 'draw') return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    const pt = getPointerPos(e);
    const nextStroke: Stroke = { color: inkColor, width: penWidth, points: [pt] };
    activeStrokeRef.current = nextStroke;
    strokesRef.current.push(nextStroke);
    setStrokeCount(strokesRef.current.length);
    renderStrokes();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || !activeStrokeRef.current) return;
    activeStrokeRef.current.points.push(getPointerPos(e));
    renderStrokes();
  };

  const handlePointerUp = () => {
    drawingRef.current = false;
    activeStrokeRef.current = null;
  };

  const undoStroke = () => {
    if (strokesRef.current.length === 0) return;
    strokesRef.current.pop();
    setStrokeCount(strokesRef.current.length);
    renderStrokes();
  };

  const clearCanvas = () => {
    strokesRef.current = [];
    setStrokeCount(0);
    renderStrokes();
  };

  const buildSignaturePngBytes = async (): Promise<Uint8Array | null> => {
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = CANVAS_W;
    exportCanvas.height = CANVAS_H;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return null;

    if (mode === 'draw') {
      if (strokesRef.current.length === 0 || !canvasRef.current) return null;
      ctx.drawImage(canvasRef.current, 0, 0);
    } else {
      const cleanName = typedName.trim();
      if (!cleanName) return null;
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.fillStyle = inkColor;
      ctx.font = TYPED_FONTS[typedFontIdx].fontCss;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(cleanName, CANVAS_W / 2, CANVAS_H / 2);
    }

    const blob = await new Promise<Blob | null>((res) => exportCanvas.toBlob(res, 'image/png'));
    if (!blob) return null;
    return new Uint8Array(await blob.arrayBuffer());
  };

  const downloadSignaturePng = async () => {
    const preset = SIGNATURE_PORTAL_PRESETS.find((p) => p.id === exportPresetId);
    if (preset) {
      const outCanvas = document.createElement('canvas');
      outCanvas.width = preset.width;
      outCanvas.height = preset.height;
      const octx = outCanvas.getContext('2d');
      if (!octx) return;
      octx.fillStyle = '#ffffff';
      octx.fillRect(0, 0, preset.width, preset.height);

      const srcBytes = await buildSignaturePngBytes();
      if (!srcBytes) {
        setStatusMsg('Draw or enter a signature first!');
        return;
      }
      const imgUrl = URL.createObjectURL(new Blob([new Uint8Array(srcBytes)], { type: 'image/png' }));
      const img = await new Promise<HTMLImageElement>((resolve) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.src = imgUrl;
      });
      URL.revokeObjectURL(imgUrl);

      octx.drawImage(img, 0, 0, preset.width, preset.height);
      const encodeJpg = (q: number) =>
        new Promise<Blob | null>((r) => outCanvas.toBlob(r, 'image/jpeg', q));
      let blob = await encodeJpg(0.9);
      let low = 0.08;
      let high = 0.92;
      for (let i = 0; i < 8 && blob && blob.size > preset.targetKb * 1024; i++) {
        const mid = (low + high) / 2;
        const cand = await encodeJpg(mid);
        if (cand && cand.size <= preset.targetKb * 1024) {
          blob = cand;
          low = mid;
        } else {
          high = mid;
        }
      }
      if (!blob) return;
      const outBytes = new Uint8Array(await blob.arrayBuffer());
      triggerBlobDownload(outBytes, `${preset.id}.jpg`, 'image/jpeg');
      setStatusMsg(
        `Downloaded ${preset.portal} signature (${preset.width}x${preset.height}px, ${(outBytes.byteLength / 1024).toFixed(1)} KB)!`
      );
      setTimeout(() => setStatusMsg(null), 4000);
      return;
    }

    const bytes = await buildSignaturePngBytes();
    if (!bytes) {
      setStatusMsg('Draw or enter a signature first!');
      return;
    }
    triggerBlobDownload(bytes, 'signature-transparent.png', 'image/png');
    setStatusMsg('Downloaded transparent PNG signature!');
    setTimeout(() => setStatusMsg(null), 3500);
  };

  const handlePdfSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const raw = new Uint8Array(await file.arrayBuffer());
      const { PDFDocument } = await import('pdf-lib');
      const doc = await PDFDocument.load(raw, { ignoreEncryption: true });
      setPdfFile(file);
      setPdfBytes(raw);
      setPdfPages(doc.getPageCount());
      setTargetPage(doc.getPageCount());
      setStatusMsg(`Loaded "${file.name}" (${doc.getPageCount()} pages)`);
    } catch {
      setStatusMsg('Could not parse this PDF file cleanly.');
    }
  };

  const signAndDownloadPdf = async () => {
    if (!pdfBytes || !pdfFile) return;
    const sigPng = await buildSignaturePngBytes();
    if (!sigPng) {
      setStatusMsg('Draw or type your signature before stamping the PDF!');
      return;
    }

    const { PDFDocument } = await import('pdf-lib');
    const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
    const sigImage = await doc.embedPng(sigPng);
    const pageIndex = Math.max(0, Math.min(doc.getPageCount() - 1, targetPage - 1));
    const page = doc.getPage(pageIndex);
    const { width, height } = page.getSize();

    const targetW = (width * sigWidthPct) / 100;
    const aspect = sigImage.height / sigImage.width;
    const targetH = targetW * aspect;
    const margin = 36;

    let x = width - targetW - margin;
    let y = margin;
    if (placement === 'bottom-left') {
      x = margin;
      y = margin;
    } else if (placement === 'bottom-center') {
      x = (width - targetW) / 2;
      y = margin;
    } else if (placement === 'top-right') {
      x = width - targetW - margin;
      y = height - targetH - margin;
    }

    page.drawImage(sigImage, { x, y, width: targetW, height: targetH });
    const signedBytes = await doc.save();
    const baseName = pdfFile.name.replace(/\.pdf$/i, '') || 'document';
    triggerBlobDownload(signedBytes, `${baseName}-signed.pdf`, 'application/pdf');
    setStatusMsg(`Stamped & downloaded ${baseName}-signed.pdf!`);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 mb-2">
            <PenTool className="w-3.5 h-3.5" /> Zero-Upload E-Signature Studio
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white">
            Digital Signature Pad &amp; PDF Signer
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Draw smooth cursive strokes or generate typed signatures. Download as transparent PNG or stamp directly onto any PDF page.
          </p>
        </div>

        {statusMsg && (
          <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="w-4 h-4 shrink-0" /> {statusMsg}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Signature Pad */}
        <div className="lg:col-span-7 space-y-5 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 sm:p-6">
          {/* Mode Tabs & Ink Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMode('draw')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition ${
                  mode === 'draw'
                    ? 'bg-purple-600 text-white'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                }`}
              >
                <PenTool className="w-3.5 h-3.5" /> Draw Signature
              </button>
              <button
                onClick={() => setMode('type')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition ${
                  mode === 'type'
                    ? 'bg-purple-600 text-white'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                }`}
              >
                <Type className="w-3.5 h-3.5" /> Type Signature
              </button>
            </div>

            <div className="flex items-center gap-2">
              {[
                { label: 'Obsidian Ink', hex: '#0f172a' },
                { label: 'Royal Blue', hex: '#1d4ed8' },
                { label: 'Purple', hex: '#7c3aed' },
                { label: 'Crimson', hex: '#be123c' },
              ].map((ink) => (
                <button
                  key={ink.hex}
                  onClick={() => setInkColor(ink.hex)}
                  aria-label={ink.label}
                  style={{ backgroundColor: ink.hex }}
                  className={`w-6 h-6 rounded-full cursor-pointer transition ${
                    inkColor === ink.hex ? 'ring-2 ring-offset-2 ring-purple-500' : ''
                  }`}
                />
              ))}
            </div>
          </div>

          {mode === 'draw' ? (
            <div className="space-y-3">
              <div className="relative rounded-2xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 bg-white overflow-hidden">
                <canvas
                  ref={canvasRef}
                  width={CANVAS_W}
                  height={CANVAS_H}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerLeave={handlePointerUp}
                  className="w-full h-52 sm:h-56 touch-none cursor-crosshair block"
                />
                {strokeCount === 0 && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-neutral-400 font-medium">
                    Sign here with mouse, stylus, or finger...
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 text-xs">
                  <span className="font-semibold text-neutral-500">Stroke Thickness</span>
                  <input
                    type="range"
                    min={1.5}
                    max={8}
                    step={0.5}
                    value={penWidth}
                    onChange={(e) => setPenWidth(Number(e.target.value))}
                    className="w-24 accent-purple-600"
                  />
                  <span className="font-mono font-bold">{penWidth}px</span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={undoStroke}
                    disabled={strokeCount === 0}
                    className="px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-40"
                  >
                    <Undo2 className="w-3.5 h-3.5" /> Undo
                  </button>
                  <button
                    onClick={clearCanvas}
                    disabled={strokeCount === 0}
                    className="px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-40 hover:text-rose-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Clear
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <input
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                placeholder="Type your full name..."
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-sm font-semibold"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {TYPED_FONTS.map((f, idx) => (
                  <button
                    key={f.id}
                    onClick={() => setTypedFontIdx(idx)}
                    className={`p-4 rounded-2xl border bg-white text-center cursor-pointer transition ${
                      typedFontIdx === idx
                        ? 'border-purple-600 ring-2 ring-purple-500/20'
                        : 'border-neutral-200 hover:border-neutral-400'
                    }`}
                  >
                    <div className="text-[10px] font-bold uppercase text-neutral-400 mb-1">
                      {f.label}
                    </div>
                    <div
                      style={{
                        color: inkColor,
                        fontFamily:
                          f.id === 'script'
                            ? '"Brush Script MT", "Segoe Script", cursive'
                            : f.id === 'serif'
                            ? 'Georgia, serif'
                            : f.id === 'clean'
                            ? '"Trebuchet MS", sans-serif'
                            : 'monospace',
                        fontStyle: f.id === 'mono' ? 'normal' : 'italic',
                      }}
                      className="text-2xl truncate py-1"
                    >
                      {typedName || 'Your Signature'}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2.5 pt-1">
            <select
              value={exportPresetId}
              onChange={(e) => setExportPresetId(e.target.value)}
              aria-label="Signature export preset"
              className="w-full min-h-[44px] px-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-xs font-semibold"
            >
              <option value="">Transparent PNG (Default 640x220px)</option>
              {SIGNATURE_PORTAL_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
            <button
              onClick={downloadSignaturePng}
              className="w-full min-h-[44px] py-3 px-4 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer hover:opacity-90 transition"
            >
              <Download className="w-4 h-4" />{' '}
              {exportPresetId ? 'Download Exam Portal JPG Signature' : 'Download Transparent PNG Signature'}
            </button>
          </div>
        </div>

        {/* Right: Stamp onto PDF */}
        <div className="lg:col-span-5 space-y-5 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 sm:p-6">
          <div>
            <h2 className="text-base font-black text-neutral-900 dark:text-white flex items-center gap-2">
              Stamp Signature Directly Onto PDF
              {pipedPdf && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold">
                  <Workflow className="w-3 h-3" /> Piped PDF Loaded
                </span>
              )}
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Optional: drop any contract or form PDF below and place your signature directly inside browser memory.
            </p>
          </div>

          <label className="block p-6 rounded-2xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-purple-500 text-center cursor-pointer transition bg-neutral-50/70 dark:bg-neutral-950/60">
            <FileUp className="w-7 h-7 mx-auto text-purple-600 mb-2" />
            <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
              {pdfFile ? pdfFile.name : 'Click to choose a local PDF file'}
            </div>
            <div className="text-[11px] text-neutral-500 mt-0.5">
              {pdfFile ? `${pdfPages} pages detected` : 'Processed 100% offline in browser'}
            </div>
            <input type="file" accept=".pdf,application/pdf" onChange={handlePdfSelect} className="hidden" />
          </label>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-neutral-500 uppercase mb-1">
                  Target Page (1–{pdfPages})
                </label>
                <input
                  type="number"
                  min={1}
                  max={pdfPages}
                  value={targetPage}
                  onChange={(e) => setTargetPage(Number(e.target.value))}
                  disabled={!pdfFile}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-neutral-500 uppercase mb-1">
                  Width: {sigWidthPct}%
                </label>
                <input
                  type="range"
                  min={14}
                  max={45}
                  value={sigWidthPct}
                  onChange={(e) => setSigWidthPct(Number(e.target.value))}
                  disabled={!pdfFile}
                  className="w-full accent-purple-600 mt-2"
                />
              </div>
            </div>

            <div>
              <div className="text-[11px] font-bold text-neutral-500 uppercase mb-1.5">
                Signature Placement
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { id: 'bottom-right', label: 'Bottom Right' },
                    { id: 'bottom-left', label: 'Bottom Left' },
                    { id: 'bottom-center', label: 'Bottom Center' },
                    { id: 'top-right', label: 'Top Right' },
                  ] as const
                ).map((pos) => (
                  <button
                    key={pos.id}
                    type="button"
                    onClick={() => setPlacement(pos.id)}
                    className={`py-2 px-3 rounded-xl font-bold cursor-pointer transition ${
                      placement === pos.id
                        ? 'bg-purple-600 text-white'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    {pos.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={signAndDownloadPdf}
            disabled={!pdfFile}
            className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition shadow-md"
          >
            <Download className="w-4 h-4" /> Sign &amp; Download PDF
          </button>
        </div>
      </div>

      <AdSlot slotId="studio-signature-banner" format="horizontal" />
    </div>
  );
}
