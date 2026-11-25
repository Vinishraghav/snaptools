'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ToolDef } from '@/data/toolsRegistry';
import { Upload, Download, Sliders, CheckCircle2 } from 'lucide-react';

async function compressCanvasToTargetKb(
  canvas: HTMLCanvasElement,
  mime: string,
  targetKb: number
): Promise<{ dataUrl: string; sizeKb: number }> {
  const effectiveMime = mime === 'image/png' ? 'image/jpeg' : mime;
  const maxBytes = targetKb * 1024;
  let low = 0.05;
  let high = 0.96;
  let bestUrl = canvas.toDataURL(effectiveMime, 0.7);
  let bestBytes = Math.floor((bestUrl.length * 3) / 4);

  for (let i = 0; i < 8; i++) {
    const mid = (low + high) / 2;
    const candidate = canvas.toDataURL(effectiveMime, mid);
    const bytes = Math.floor(((candidate.split(',')[1]?.length || candidate.length) * 3) / 4);
    if (bytes <= maxBytes) {
      bestUrl = candidate;
      bestBytes = bytes;
      low = mid;
    } else {
      high = mid;
    }
  }

  // If still slightly above very tight targets (e.g. 5KB/10KB), proportionally downscale canvas
  if (bestBytes > maxBytes) {
    const scaleFactor = Math.max(0.2, Math.sqrt(maxBytes / bestBytes) * 0.92);
    const temp = document.createElement('canvas');
    temp.width = Math.max(24, Math.floor(canvas.width * scaleFactor));
    temp.height = Math.max(24, Math.floor(canvas.height * scaleFactor));
    temp.getContext('2d')?.drawImage(canvas, 0, 0, temp.width, temp.height);
    const scaled = temp.toDataURL(effectiveMime, 0.7);
    bestUrl = scaled;
    bestBytes = Math.floor(((scaled.split(',')[1]?.length || scaled.length) * 3) / 4);
  }

  return { dataUrl: bestUrl, sizeKb: Number((bestBytes / 1024).toFixed(1)) };
}

export default function ImageEngine({ tool }: { tool: ToolDef }) {
  const specW = typeof tool.spec?.width === 'number' ? tool.spec.width : 800;
  const specH = typeof tool.spec?.height === 'number' ? tool.spec.height : 600;
  const specTargetKb = typeof tool.spec?.targetKb === 'number' ? tool.spec.targetKb : 0;
  const specFilter = typeof tool.spec?.filter === 'string' ? tool.spec.filter : '';

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('image.png');
  const [targetWidth, setTargetWidth] = useState<number>(specW);
  const [targetHeight, setTargetHeight] = useState<number>(specH);
  const [targetKb, setTargetKb] = useState<number>(specTargetKb);
  const [quality, setQuality] = useState<number>(85);
  const [rotateDeg, setRotateDeg] = useState<number>(
    specFilter === 'rotate90' ? 90 : specFilter === 'rotate180' ? 180 : specFilter === 'rotate270' ? 270 : 0
  );
  const [flipH, setFlipH] = useState<boolean>(specFilter === 'flipH');
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [saturation, setSaturation] = useState<number>(100);
  const [blurPx, setBlurPx] = useState<number>(
    specFilter === 'blur' || tool.slug.includes('blur') ? 10 : 0
  );
  const [borderPx, setBorderPx] = useState<number>(
    specFilter === 'border' || tool.slug.includes('border') ? 32 : 0
  );
  const [watermark, setWatermark] = useState<string>('SnapTools');
  const [topMemeText, setTopMemeText] = useState<string>('WHEN THE CODE');
  const [bottomMemeText, setBottomMemeText] = useState<string>('WORKS FIRST TRY');
  const [asciiArt, setAsciiArt] = useState<string>('');
  const [pickedColor, setPickedColor] = useState<string>('#000000');
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [outputSizeKb, setOutputSizeKb] = useState<number | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setTargetWidth(typeof tool.spec?.width === 'number' ? tool.spec.width : 800);
    setTargetHeight(typeof tool.spec?.height === 'number' ? tool.spec.height : 600);
    setTargetKb(typeof tool.spec?.targetKb === 'number' ? tool.spec.targetKb : 0);
    const f = typeof tool.spec?.filter === 'string' ? tool.spec.filter : '';
    setRotateDeg(f === 'rotate90' ? 90 : f === 'rotate180' ? 180 : f === 'rotate270' ? 270 : 0);
    setFlipH(f === 'flipH');
    setBlurPx(f === 'blur' || tool.slug.includes('blur') ? 10 : 0);
    setBorderPx(f === 'border' || tool.slug.includes('border') ? 32 : 0);
  }, [tool]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageSrc(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (!imageSrc) return;
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = async () => {
      if (cancelled) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let w = img.width;
      let h = img.height;

      const hasFixedDimPreset =
        typeof tool.spec?.width === 'number' && typeof tool.spec?.height === 'number';

      if (hasFixedDimPreset || tool.slug.includes('resiz')) {
        w = targetWidth || img.width;
        h = targetHeight || img.height;
      } else if (tool.slug.includes('passport')) {
        w = 350;
        h = 450;
      } else if (tool.slug.includes('visa')) {
        w = 600;
        h = 600;
      } else if (
        specFilter === 'square' ||
        specFilter === 'circle' ||
        tool.slug.includes('avatar') ||
        tool.slug.includes('square') ||
        tool.slug.includes('1-1')
      ) {
        const minDim = Math.min(w, h);
        w = minDim;
        h = minDim;
      } else if (tool.slug.includes('16-9')) {
        h = Math.round((w * 9) / 16);
      }

      const rotated90 = rotateDeg === 90 || rotateDeg === 270;
      const outW = (rotated90 ? h : w) + borderPx * 2;
      const outH = (rotated90 ? w : h) + borderPx * 2;
      canvas.width = outW;
      canvas.height = outH;

      ctx.clearRect(0, 0, outW, outH);
      if (borderPx > 0) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, outW, outH);
      }

      ctx.save();
      ctx.translate(outW / 2, outH / 2);
      ctx.rotate((rotateDeg * Math.PI) / 180);
      ctx.scale(flipH ? -1 : 1, 1);

      if (specFilter === 'circle' || tool.slug.includes('avatar') || tool.slug.includes('round')) {
        ctx.beginPath();
        ctx.arc(0, 0, Math.min(w, h) / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
      }

      const filters: string[] = [];
      if (brightness !== 100) filters.push(`brightness(${brightness}%)`);
      if (contrast !== 100) filters.push(`contrast(${contrast}%)`);
      if (saturation !== 100) filters.push(`saturate(${saturation}%)`);
      if (blurPx > 0) filters.push(`blur(${blurPx}px)`);
      if (specFilter === 'grayscale' || tool.slug.includes('grayscale') || tool.slug.includes('black-white')) {
        filters.push('grayscale(100%)');
      }
      if (specFilter === 'sepia' || tool.slug.includes('sepia')) {
        filters.push('sepia(100%)');
      }
      ctx.filter = filters.length > 0 ? filters.join(' ') : 'none';

      ctx.drawImage(img, -w / 2, -h / 2, w, h);
      ctx.restore();
      ctx.filter = 'none';

      if (specFilter === 'pixelate' || tool.slug.includes('pixelate')) {
        const block = 12;
        const smallCanvas = document.createElement('canvas');
        smallCanvas.width = Math.max(4, Math.floor(outW / block));
        smallCanvas.height = Math.max(4, Math.floor(outH / block));
        const sCtx = smallCanvas.getContext('2d');
        if (sCtx) {
          sCtx.drawImage(canvas, 0, 0, smallCanvas.width, smallCanvas.height);
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(smallCanvas, 0, 0, smallCanvas.width, smallCanvas.height, 0, 0, outW, outH);
          ctx.imageSmoothingEnabled = true;
        }
      }

      if (tool.slug.includes('watermark')) {
        ctx.font = 'bold 36px sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 2;
        ctx.strokeText(watermark, 30, outH - 40);
        ctx.fillText(watermark, 30, outH - 40);
      }

      if (tool.slug.includes('meme')) {
        ctx.font = 'bold 44px Impact, sans-serif';
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 4;
        ctx.textAlign = 'center';
        ctx.strokeText(topMemeText, outW / 2, 60);
        ctx.fillText(topMemeText, outW / 2, 60);
        ctx.strokeText(bottomMemeText, outW / 2, outH - 30);
        ctx.fillText(bottomMemeText, outW / 2, outH - 30);
      }

      if (tool.slug.includes('ascii')) {
        const asciiCanvas = document.createElement('canvas');
        const aCtx = asciiCanvas.getContext('2d');
        const aW = 60;
        const aH = 30;
        asciiCanvas.width = aW;
        asciiCanvas.height = aH;
        aCtx?.drawImage(img, 0, 0, aW, aH);
        const aData = aCtx?.getImageData(0, 0, aW, aH).data;
        if (aData) {
          const chars = '@%#*+=-:. ';
          let str = '';
          for (let y = 0; y < aH; y++) {
            for (let x = 0; x < aW; x++) {
              const idx = (y * aW + x) * 4;
              const bright = (aData[idx] + aData[idx + 1] + aData[idx + 2]) / 3;
              str += chars[Math.floor((bright / 255) * (chars.length - 1))];
            }
            str += '\n';
          }
          setAsciiArt(str);
        }
      }

      let mime = typeof tool.spec?.outputFormat === 'string' ? tool.spec.outputFormat : 'image/png';
      if (!tool.spec?.outputFormat) {
        if (tool.slug.includes('jpg') || tool.slug.includes('jpeg')) mime = 'image/jpeg';
        else if (tool.slug.includes('webp')) mime = 'image/webp';
      }

      if (targetKb > 0) {
        const compressed = await compressCanvasToTargetKb(canvas, mime, targetKb);
        if (!cancelled) {
          setProcessedUrl(compressed.dataUrl);
          setOutputSizeKb(compressed.sizeKb);
        }
      } else {
        const url = canvas.toDataURL(mime, quality / 100);
        const bytes = Math.floor(((url.split(',')[1]?.length || url.length) * 3) / 4);
        if (!cancelled) {
          setProcessedUrl(url);
          setOutputSizeKb(Number((bytes / 1024).toFixed(1)));
        }
      }
    };

    return () => {
      cancelled = true;
    };
  }, [
    imageSrc,
    targetWidth,
    targetHeight,
    targetKb,
    quality,
    rotateDeg,
    flipH,
    brightness,
    contrast,
    saturation,
    blurPx,
    borderPx,
    watermark,
    topMemeText,
    bottomMemeText,
    tool,
    specFilter,
  ]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * canvas.width);
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * canvas.height);
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const hex = `#${((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2]).toString(16).slice(1)}`;
    setPickedColor(hex);
  };

  const outExt =
    tool.spec?.outputFormat === 'image/webp' || tool.slug.includes('webp')
      ? 'webp'
      : tool.spec?.outputFormat === 'image/jpeg' || tool.slug.includes('jpg') || tool.slug.includes('jpeg') || targetKb > 0
        ? 'jpg'
        : 'png';

  return (
    <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl space-y-6">
      <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-2xl hover:border-blue-500 hover:bg-blue-50/20 dark:hover:bg-blue-950/20 cursor-pointer transition text-center group">
        <Upload className="w-10 h-10 text-neutral-400 group-hover:text-blue-500 mb-2 transition" />
        <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
          Upload an image (PNG, JPG, WebP, SVG, BMP)
        </span>
        <span className="text-xs text-neutral-500 mt-1">
          {targetKb > 0
            ? `Target exact file size: ${targetKb} KB (100% browser memory)`
            : typeof tool.spec?.width === 'number'
              ? `Preset output dimensions: ${targetWidth}×${targetHeight} px`
              : 'Processed 100% locally in your browser memory'}
        </span>
        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
      </label>

      {(targetKb > 0 || tool.slug.includes('compress') || tool.slug.includes('resiz') || typeof tool.spec?.width === 'number') && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
          {(tool.slug.includes('resiz') || typeof tool.spec?.width === 'number') && (
            <>
              <div>
                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">Width (px)</label>
                <input
                  type="number"
                  value={targetWidth}
                  onChange={(e) => setTargetWidth(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">Height (px)</label>
                <input
                  type="number"
                  value={targetHeight}
                  onChange={(e) => setTargetHeight(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs font-mono"
                />
              </div>
            </>
          )}
          {(targetKb > 0 || tool.slug.includes('compress')) && (
            <div>
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                {targetKb > 0 ? 'Target File Size (KB)' : `Quality: ${quality}%`}
              </label>
              {targetKb > 0 ? (
                <input
                  type="number"
                  min={5}
                  max={5000}
                  value={targetKb}
                  onChange={(e) => setTargetKb(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs font-mono"
                />
              ) : (
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className="w-full"
                />
              )}
            </div>
          )}
        </div>
      )}

      {imageSrc && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">

          {(tool.slug.includes('rotat') || tool.slug.includes('flip')) && (
            <>
              <div>
                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">Rotation</label>
                <select
                  value={rotateDeg}
                  onChange={(e) => setRotateDeg(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs"
                >
                  <option value={0}>0° (Original)</option>
                  <option value={90}>90° Clockwise</option>
                  <option value={180}>180° Upside Down</option>
                  <option value={270}>270° Counter-Clockwise</option>
                </select>
              </div>
              <div className="flex items-end pb-1">
                <button
                  type="button"
                  onClick={() => setFlipH(!flipH)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold border transition ${
                    flipH ? 'bg-blue-600 text-white border-blue-600' : 'bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700'
                  }`}
                >
                  Flip Horizontal: {flipH ? 'ON' : 'OFF'}
                </button>
              </div>
            </>
          )}

          {(tool.slug.includes('brightness') || tool.slug.includes('contrast') || tool.slug.includes('saturation')) && (
            <>
              <div>
                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">Brightness: {brightness}%</label>
                <input type="range" min={20} max={200} value={brightness} onChange={(e) => setBrightness(Number(e.target.value))} className="w-full" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">Contrast: {contrast}%</label>
                <input type="range" min={20} max={200} value={contrast} onChange={(e) => setContrast(Number(e.target.value))} className="w-full" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">Saturation: {saturation}%</label>
                <input type="range" min={0} max={200} value={saturation} onChange={(e) => setSaturation(Number(e.target.value))} className="w-full" />
              </div>
            </>
          )}

          {(specFilter === 'blur' || tool.slug.includes('blur')) && (
            <div>
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">Blur Radius: {blurPx}px</label>
              <input type="range" min={0} max={30} value={blurPx} onChange={(e) => setBlurPx(Number(e.target.value))} className="w-full" />
            </div>
          )}

          {(specFilter === 'border' || tool.slug.includes('border')) && (
            <div>
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">White Border: {borderPx}px</label>
              <input type="range" min={0} max={100} value={borderPx} onChange={(e) => setBorderPx(Number(e.target.value))} className="w-full" />
            </div>
          )}

          {tool.slug.includes('watermark') && (
            <div className="col-span-full">
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">Watermark Text</label>
              <input
                type="text"
                value={watermark}
                onChange={(e) => setWatermark(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs"
              />
            </div>
          )}

          {tool.slug.includes('meme') && (
            <>
              <div>
                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">Top Text</label>
                <input
                  type="text"
                  value={topMemeText}
                  onChange={(e) => setTopMemeText(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">Bottom Text</label>
                <input
                  type="text"
                  value={bottomMemeText}
                  onChange={(e) => setBottomMemeText(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs"
                />
              </div>
            </>
          )}

          {(tool.slug.includes('eyedropper') || tool.slug.includes('palette')) && (
            <div className="col-span-full flex items-center gap-3 p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800">
              <div className="w-8 h-8 rounded-lg border border-neutral-300 shadow-sm" style={{ backgroundColor: pickedColor }} />
              <span className="text-xs font-mono font-semibold">{pickedColor}</span>
              <span className="text-xs text-neutral-500">(Click anywhere on the preview to sample colors)</span>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 min-h-[220px]">
        {imageSrc ? (
          <div className="relative max-w-full overflow-auto">
            <canvas
              ref={canvasRef}
              onClick={handleCanvasClick}
              className="max-h-[420px] max-w-full rounded-lg shadow-md cursor-crosshair border border-neutral-200 dark:border-neutral-800"
            />
          </div>
        ) : (
          <div className="text-xs text-neutral-400 flex items-center gap-2">
            <Sliders className="w-4 h-4" /> Upload an image to view interactive canvas preview
          </div>
        )}

        {asciiArt && (
          <pre className="mt-4 p-3 bg-neutral-900 text-emerald-400 font-mono text-[8px] leading-tight overflow-x-auto rounded-lg max-h-60 w-full">
            {asciiArt}
          </pre>
        )}
      </div>

      {(specFilter === 'base64' || tool.slug.includes('base64')) && processedUrl && (
        <textarea
          readOnly
          rows={4}
          value={processedUrl}
          className="w-full p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-[11px] font-mono"
        />
      )}

      {processedUrl && (
        <div className="flex flex-wrap items-center gap-4">
          <a
            href={processedUrl}
            download={`processed-${fileName.replace(/\.[^.]+$/, '')}.${outExt}`}
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 flex items-center gap-2 transition"
          >
            <Download className="w-4 h-4" /> Download Result ({outputSizeKb ? `${outputSizeKb} KB` : outExt.toUpperCase()})
          </a>
          {outputSizeKb !== null && targetKb > 0 && (
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Output optimized to {outputSizeKb} KB (Target: {targetKb} KB)
            </span>
          )}
        </div>
      )}
    </div>
  );
}
