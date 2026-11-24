'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ToolDef } from '@/data/toolsRegistry';
import { Upload, Download, RefreshCw, Palette, Type, Sliders, CheckCircle2 } from 'lucide-react';

export default function ImageEngine({ tool }: { tool: ToolDef }) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('image.png');
  const [targetWidth, setTargetWidth] = useState<number>(800);
  const [targetHeight, setTargetHeight] = useState<number>(600);
  const [quality, setQuality] = useState<number>(85);
  const [filterType, setFilterType] = useState<string>('none');
  const [watermark, setWatermark] = useState<string>('SnapTools');
  const [topMemeText, setTopMemeText] = useState<string>('WHEN THE CODE');
  const [bottomMemeText, setBottomMemeText] = useState<string>('WORKS FIRST TRY');
  const [asciiArt, setAsciiArt] = useState<string>('');
  const [pickedColor, setPickedColor] = useState<string>('#000000');
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setImageSrc(result);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Handle specific sizes like Passport / Visa / Resizing
      let w = img.width;
      let h = img.height;

      if (tool.slug.includes('passport')) {
        w = 350;
        h = 450;
      } else if (tool.slug.includes('visa')) {
        w = 600;
        h = 600;
      } else if (tool.slug.includes('avatar') || tool.slug.includes('square')) {
        const minDim = Math.min(w, h);
        w = minDim;
        h = minDim;
      } else if (tool.slug.includes('resiz')) {
        w = targetWidth || img.width;
        h = targetHeight || img.height;
      }

      canvas.width = w;
      canvas.height = h;

      // Draw background if circular avatar
      ctx.clearRect(0, 0, w, h);
      if (tool.slug.includes('avatar') || tool.slug.includes('round')) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, Math.min(w, h) / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
      }

      // Draw image
      ctx.drawImage(img, 0, 0, w, h);

      if (tool.slug.includes('avatar') || tool.slug.includes('round')) {
        ctx.restore();
      }

      // Filters
      if (tool.slug.includes('grayscale') || tool.slug.includes('black-white') || filterType === 'grayscale') {
        const imgData = ctx.getImageData(0, 0, w, h);
        const d = imgData.data;
        for (let i = 0; i < d.length; i += 4) {
          const v = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
          d[i] = v;
          d[i + 1] = v;
          d[i + 2] = v;
        }
        ctx.putImageData(imgData, 0, 0);
      } else if (tool.slug.includes('sepia') || filterType === 'sepia') {
        const imgData = ctx.getImageData(0, 0, w, h);
        const d = imgData.data;
        for (let i = 0; i < d.length; i += 4) {
          const r = d[i], g = d[i + 1], b = d[i + 2];
          d[i] = Math.min(255, 0.393 * r + 0.769 * g + 0.189 * b);
          d[i + 1] = Math.min(255, 0.349 * r + 0.686 * g + 0.168 * b);
          d[i + 2] = Math.min(255, 0.272 * r + 0.534 * g + 0.131 * b);
        }
        ctx.putImageData(imgData, 0, 0);
      }

      // Watermark
      if (tool.slug.includes('watermark')) {
        ctx.font = 'bold 36px sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 2;
        ctx.strokeText(watermark, 30, h - 40);
        ctx.fillText(watermark, 30, h - 40);
      }

      // Meme Generator
      if (tool.slug.includes('meme')) {
        ctx.font = 'bold 44px Impact, sans-serif';
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 4;
        ctx.textAlign = 'center';
        ctx.strokeText(topMemeText, w / 2, 60);
        ctx.fillText(topMemeText, w / 2, 60);
        ctx.strokeText(bottomMemeText, w / 2, h - 30);
        ctx.fillText(bottomMemeText, w / 2, h - 30);
      }

      // ASCII generation if requested
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
              const brightness = (aData[idx] + aData[idx + 1] + aData[idx + 2]) / 3;
              const charIdx = Math.floor((brightness / 255) * (chars.length - 1));
              str += chars[charIdx];
            }
            str += '\n';
          }
          setAsciiArt(str);
        }
      }

      // Output format and quality
      let mime = 'image/png';
      if (tool.slug.includes('jpg') || tool.slug.includes('jpeg')) mime = 'image/jpeg';
      else if (tool.slug.includes('webp')) mime = 'image/webp';

      const dataUrl = canvas.toDataURL(mime, quality / 100);
      setProcessedUrl(dataUrl);
    };
  }, [imageSrc, targetWidth, targetHeight, quality, filterType, watermark, topMemeText, bottomMemeText, tool.slug]);

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

  return (
    <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl space-y-6">
      {/* Upload Zone */}
      <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-2xl hover:border-blue-500 hover:bg-blue-50/20 dark:hover:bg-blue-950/20 cursor-pointer transition text-center group">
        <Upload className="w-10 h-10 text-neutral-400 group-hover:text-blue-500 mb-2 transition" />
        <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
          Upload an image (PNG, JPG, WebP, SVG, BMP)
        </span>
        <span className="text-xs text-neutral-500 mt-1">Processed 100% locally in your browser memory</span>
        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
      </label>

      {/* Dynamic Settings */}
      {imageSrc && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
          {tool.slug.includes('resiz') && (
            <>
              <div>
                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                  Width (px)
                </label>
                <input
                  type="number"
                  value={targetWidth}
                  onChange={(e) => setTargetWidth(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                  Height (px)
                </label>
                <input
                  type="number"
                  value={targetHeight}
                  onChange={(e) => setTargetHeight(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs"
                />
              </div>
            </>
          )}

          {tool.slug.includes('compress') && (
            <div>
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                Quality: {quality}%
              </label>
              <input
                type="range"
                min={10}
                max={100}
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="w-full"
              />
            </div>
          )}

          {tool.slug.includes('watermark') && (
            <div className="col-span-full">
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                Watermark Text
              </label>
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
                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                  Top Text
                </label>
                <input
                  type="text"
                  value={topMemeText}
                  onChange={(e) => setTopMemeText(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                  Bottom Text
                </label>
                <input
                  type="text"
                  value={bottomMemeText}
                  onChange={(e) => setBottomMemeText(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs"
                />
              </div>
            </>
          )}

          {tool.slug.includes('eyedropper') || tool.slug.includes('palette') ? (
            <div className="col-span-full flex items-center gap-3 p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800">
              <div
                className="w-8 h-8 rounded-lg border border-neutral-300 shadow-sm"
                style={{ backgroundColor: pickedColor }}
              />
              <span className="text-xs font-mono font-semibold">{pickedColor}</span>
              <span className="text-xs text-neutral-500">(Click anywhere on the preview to sample colors)</span>
            </div>
          ) : null}
        </div>
      )}

      {/* Live Preview Canvas */}
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

        {/* ASCII Art display */}
        {asciiArt && (
          <pre className="mt-4 p-3 bg-neutral-900 text-emerald-400 font-mono text-[8px] leading-tight overflow-x-auto rounded-lg max-h-60 w-full">
            {asciiArt}
          </pre>
        )}
      </div>

      {/* Actions */}
      {processedUrl && (
        <div className="flex items-center gap-4">
          <a
            href={processedUrl}
            download={`processed-${fileName}`}
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 flex items-center gap-2 transition"
          >
            <Download className="w-4 h-4" /> Download Processed Image
          </a>
        </div>
      )}
    </div>
  );
}
