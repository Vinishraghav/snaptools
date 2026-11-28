'use client';

export interface ImageJobSpec {
  id: string;
  file: File;
  outMime: string;
  width?: number;
  height?: number;
  quality: number;
  targetKb: number;
  grayscale?: boolean;
  sepia?: boolean;
  invert?: boolean;
  brightness?: number;
  contrast?: number;
  rotationDeg?: number;
  watermarkText?: string;
  pixelateSize?: number;
  whiteBg?: boolean;
}

export interface ImageJobResult {
  id: string;
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  outputSize: number;
}

const WORKER_SCRIPT = `
self.onmessage = async (e) => {
  const job = e.data;
  try {
    if (typeof OffscreenCanvas === 'undefined' || typeof createImageBitmap === 'undefined') {
      throw new Error('NO_OFFSCREEN');
    }
    const inBlob = new Blob([job.buffer], { type: job.inMime || 'image/png' });
    const bitmap = await createImageBitmap(inBlob);

    const rot = ((job.rotationDeg || 0) % 360 + 360) % 360;
    const isSideways = rot === 90 || rot === 270;

    let targetW = job.width > 0 ? job.width : (isSideways ? bitmap.height : bitmap.width);
    let targetH = job.height > 0 ? job.height : (isSideways ? bitmap.width : bitmap.height);

    const canvas = new OffscreenCanvas(targetW, targetH);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('NO_CTX');

    if (job.whiteBg || job.outMime === 'image/jpeg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, targetW, targetH);
    }

    const filters = [];
    if (job.brightness && job.brightness !== 100) filters.push('brightness(' + job.brightness + '%)');
    if (job.contrast && job.contrast !== 100) filters.push('contrast(' + job.contrast + '%)');
    if (job.grayscale) filters.push('grayscale(100%)');
    if (job.sepia) filters.push('sepia(100%)');
    if (job.invert) filters.push('invert(100%)');
    if (filters.length > 0 && 'filter' in ctx) {
      ctx.filter = filters.join(' ');
    }

    ctx.save();
    ctx.translate(targetW / 2, targetH / 2);
    if (rot) ctx.rotate((rot * Math.PI) / 180);
    const drawW = isSideways ? targetH : targetW;
    const drawH = isSideways ? targetW : targetH;
    ctx.drawImage(bitmap, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();
    bitmap.close();

    if (job.watermarkText) {
      ctx.filter = 'none';
      const fontSize = Math.max(18, Math.round(targetW / 18));
      ctx.font = 'bold ' + fontSize + 'px sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.52)';
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.lineWidth = 2;
      ctx.textAlign = 'center';
      ctx.strokeText(job.watermarkText, targetW / 2, targetH - fontSize);
      ctx.fillText(job.watermarkText, targetW / 2, targetH - fontSize);
    }

    const mime = job.outMime === 'image/png' || job.outMime === 'image/webp' ? job.outMime : 'image/jpeg';
    let q = (job.quality || 88) / 100;
    let outBlob = await canvas.convertToBlob({ type: mime, quality: q });

    if (job.targetKb > 0) {
      const targetBytes = job.targetKb * 1024;
      let encodeMime = mime === 'image/png' ? 'image/jpeg' : mime;
      let curW = targetW;
      let curH = targetH;
      let curCanvas = canvas;

      if (outBlob.size > targetBytes && encodeMime !== mime) {
        outBlob = await curCanvas.convertToBlob({ type: encodeMime, quality: q });
      }
      if (outBlob.size > targetBytes) {
        let low = 0.05;
        let high = 0.94;
        for (let iter = 0; iter < 8; iter++) {
          const mid = (low + high) / 2;
          const attempt = await curCanvas.convertToBlob({ type: encodeMime, quality: mid });
          if (attempt.size <= targetBytes) {
            outBlob = attempt;
            low = mid;
          } else {
            high = mid;
          }
        }
        // Downscale gently if quality floor still exceeds targetBytes (e.g. 20KB)
        let scaleAttempts = 0;
        while (outBlob.size > targetBytes && curW > 60 && scaleAttempts < 6) {
          scaleAttempts++;
          curW = Math.max(60, Math.round(curW * 0.8));
          curH = Math.max(60, Math.round(curH * 0.8));
          const resized = new OffscreenCanvas(curW, curH);
          const rctx = resized.getContext('2d');
          rctx.fillStyle = '#ffffff';
          rctx.fillRect(0, 0, curW, curH);
          rctx.drawImage(curCanvas, 0, 0, curW, curH);
          curCanvas = resized;
          outBlob = await curCanvas.convertToBlob({ type: encodeMime, quality: 0.72 });
        }
      }
    }

    const outBuf = await outBlob.arrayBuffer();
    self.postMessage({ id: job.id, ok: true, outBuf, type: outBlob.type, width: targetW, height: targetH }, [outBuf]);
  } catch (err) {
    self.postMessage({ id: job.id, ok: false, error: String(err && err.message ? err.message : err) });
  }
};
`;

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Failed reading Blob'));
    reader.readAsDataURL(blob);
  });
}

async function processOnMainThread(job: ImageJobSpec): Promise<ImageJobResult> {
  const srcUrl = await blobToDataUrl(job.file);
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error(`Unable to decode ${job.file.name}`));
    el.src = srcUrl;
  });

  const rot = ((job.rotationDeg || 0) % 360 + 360) % 360;
  const isSideways = rot === 90 || rot === 270;
  const w = job.width && job.width > 0 ? job.width : isSideways ? img.naturalHeight : img.naturalWidth;
  const h = job.height && job.height > 0 ? job.height : isSideways ? img.naturalWidth : img.naturalHeight;

  let canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');

  if (job.whiteBg || job.outMime === 'image/jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
  }

  const filters: string[] = [];
  if (job.brightness && job.brightness !== 100) filters.push(`brightness(${job.brightness}%)`);
  if (job.contrast && job.contrast !== 100) filters.push(`contrast(${job.contrast}%)`);
  if (job.grayscale) filters.push('grayscale(100%)');
  if (job.sepia) filters.push('sepia(100%)');
  if (job.invert) filters.push('invert(100%)');
  if (filters.length > 0) ctx.filter = filters.join(' ');

  ctx.save();
  ctx.translate(w / 2, h / 2);
  if (rot) ctx.rotate((rot * Math.PI) / 180);
  const drawW = isSideways ? h : w;
  const drawH = isSideways ? w : h;
  ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
  ctx.restore();

  if (job.pixelateSize && job.pixelateSize > 1) {
    ctx.filter = 'none';
    const px = Math.max(2, job.pixelateSize);
    const tiny = document.createElement('canvas');
    tiny.width = Math.max(1, Math.floor(w / px));
    tiny.height = Math.max(1, Math.floor(h / px));
    tiny.getContext('2d')?.drawImage(canvas, 0, 0, tiny.width, tiny.height);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(tiny, 0, 0, w, h);
  }

  if (job.watermarkText) {
    ctx.filter = 'none';
    const fontSize = Math.max(18, Math.round(w / 18));
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 2;
    ctx.textAlign = 'center';
    ctx.strokeText(job.watermarkText, w / 2, h - fontSize);
    ctx.fillText(job.watermarkText, w / 2, h - fontSize);
  }

  const encode = async (c: HTMLCanvasElement, mime: string, q: number): Promise<Blob> =>
    new Promise((resolve) => c.toBlob((b) => resolve(b || new Blob()), mime, q));

  const mime = job.outMime === 'image/png' || job.outMime === 'image/webp' ? job.outMime : 'image/jpeg';
  let outBlob = await encode(canvas, mime, (job.quality || 88) / 100);

  if (job.targetKb > 0) {
    const targetBytes = job.targetKb * 1024;
    const compressMime = mime === 'image/png' ? 'image/jpeg' : mime;
    if (outBlob.size > targetBytes) {
      let low = 0.05;
      let high = 0.94;
      for (let iter = 0; iter < 8; iter++) {
        const mid = (low + high) / 2;
        const candidate = await encode(canvas, compressMime, mid);
        if (candidate.size <= targetBytes) {
          outBlob = candidate;
          low = mid;
        } else {
          high = mid;
        }
      }
      let curW = canvas.width;
      let curH = canvas.height;
      let attempts = 0;
      while (outBlob.size > targetBytes && curW > 60 && attempts < 6) {
        attempts++;
        curW = Math.max(60, Math.round(curW * 0.8));
        curH = Math.max(60, Math.round(curH * 0.8));
        const nextC = document.createElement('canvas');
        nextC.width = curW;
        nextC.height = curH;
        const nctx = nextC.getContext('2d');
        if (nctx) {
          nctx.fillStyle = '#ffffff';
          nctx.fillRect(0, 0, curW, curH);
          nctx.drawImage(canvas, 0, 0, curW, curH);
          canvas = nextC;
          outBlob = await encode(canvas, compressMime, 0.72);
        }
      }
    }
  }

  const dataUrl = await blobToDataUrl(outBlob);
  return {
    id: job.id,
    blob: outBlob,
    dataUrl,
    width: w,
    height: h,
    outputSize: outBlob.size,
  };
}

export async function runImageBatchPool(
  jobs: ImageJobSpec[],
  onProgress?: (res: ImageJobResult) => void
): Promise<ImageJobResult[]> {
  if (jobs.length === 0) return [];

  const canUseWorkers =
    typeof Worker !== 'undefined' &&
    typeof OffscreenCanvas !== 'undefined' &&
    typeof createImageBitmap !== 'undefined';

  // Pixelate relies cleanly on imageSmoothingEnabled = false on main Canvas
  if (!canUseWorkers || jobs.some((j) => (j.pixelateSize ?? 1) > 1)) {
    const out: ImageJobResult[] = [];
    for (const job of jobs) {
      const res = await processOnMainThread(job);
      onProgress?.(res);
      out.push(res);
    }
    return out;
  }

  const concurrency = Math.min(navigator.hardwareConcurrency || 4, 8, jobs.length);
  const blobUrl = URL.createObjectURL(new Blob([WORKER_SCRIPT], { type: 'application/javascript' }));
  const workers = Array.from({ length: concurrency }, () => new Worker(blobUrl));

  const results = new Array<ImageJobResult>(jobs.length);
  let cursor = 0;

  const runNext = async (worker: Worker): Promise<void> => {
    while (cursor < jobs.length) {
      const index = cursor++;
      const job = jobs[index];
      try {
        const buffer = await job.file.arrayBuffer();
        const workerOut = await new Promise<{
          ok: boolean;
          outBuf?: ArrayBuffer;
          type?: string;
          width?: number;
          height?: number;
        }>((resolve) => {
          worker.onmessage = (ev) => resolve(ev.data);
          worker.onerror = () => resolve({ ok: false });
          worker.postMessage(
            {
              id: job.id,
              buffer,
              inMime: job.file.type,
              outMime: job.outMime,
              width: job.width || 0,
              height: job.height || 0,
              quality: job.quality,
              targetKb: job.targetKb,
              grayscale: job.grayscale,
              sepia: job.sepia,
              invert: job.invert,
              brightness: job.brightness,
              contrast: job.contrast,
              rotationDeg: job.rotationDeg,
              watermarkText: job.watermarkText,
              whiteBg: job.whiteBg,
            },
            [buffer]
          );
        });

        let itemResult: ImageJobResult;
        if (workerOut.ok && workerOut.outBuf) {
          const outBlob = new Blob([workerOut.outBuf], { type: workerOut.type || job.outMime });
          itemResult = {
            id: job.id,
            blob: outBlob,
            dataUrl: await blobToDataUrl(outBlob),
            width: workerOut.width || job.width || 0,
            height: workerOut.height || job.height || 0,
            outputSize: outBlob.size,
          };
        } else {
          itemResult = await processOnMainThread(job);
        }
        results[index] = itemResult;
        onProgress?.(itemResult);
      } catch {
        const fallback = await processOnMainThread(job);
        results[index] = fallback;
        onProgress?.(fallback);
      }
    }
  };

  try {
    await Promise.all(workers.map(runNext));
  } finally {
    workers.forEach((w) => w.terminate());
    URL.revokeObjectURL(blobUrl);
  }

  return results;
}

export async function createZipBlob(
  entries: Array<{ name: string; blob: Blob }>
): Promise<Blob> {
  const { zipSync } = await import('fflate');
  const fileMap: Record<string, Uint8Array> = {};
  const used = new Set<string>();

  for (const entry of entries) {
    let cleanName = entry.name.replace(/[\\/:*?"<>|]/g, '_');
    if (used.has(cleanName)) {
      const dot = cleanName.lastIndexOf('.');
      const stem = dot > 0 ? cleanName.slice(0, dot) : cleanName;
      const ext = dot > 0 ? cleanName.slice(dot) : '';
      let counter = 2;
      while (used.has(`${stem}-${counter}${ext}`)) counter++;
      cleanName = `${stem}-${counter}${ext}`;
    }
    used.add(cleanName);
    fileMap[cleanName] = new Uint8Array(await entry.blob.arrayBuffer());
  }

  const zipped = zipSync(fileMap, { level: 1 });
  const copy = new Uint8Array(zipped.byteLength);
  copy.set(zipped);
  return new Blob([copy.buffer], { type: 'application/zip' });
}

export async function renderA4PassportSheet(
  sourceFile: File,
  copies = 8,
  tileW = 413,
  tileH = 531
): Promise<ImageJobResult> {
  const url = await blobToDataUrl(sourceFile);
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('Could not decode photo'));
    el.src = url;
  });

  // High-resolution A4 150 DPI sheet (1240 x 1754) for instant crisp print + low RAM
  const sheetW = 1240;
  const sheetH = 1754;
  const canvas = document.createElement('canvas');
  canvas.width = sheetW;
  canvas.height = sheetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, sheetW, sheetH);

  const cols = copies >= 12 ? 4 : 3;
  const rows = Math.ceil(copies / cols);
  const marginX = 54;
  const marginY = 64;
  const gapX = 24;
  const gapY = 28;
  const maxCellW = Math.floor((sheetW - marginX * 2 - gapX * (cols - 1)) / cols);
  const ratio = tileH / Math.max(1, tileW);
  const drawW = Math.min(maxCellW, 340);
  const drawH = Math.min(Math.round(drawW * ratio), Math.floor((sheetH - marginY * 2 - gapY * (rows - 1)) / rows));

  let placed = 0;
  for (let r = 0; r < rows && placed < copies; r++) {
    for (let c = 0; c < cols && placed < copies; c++) {
      const x = marginX + c * (drawW + gapX);
      const y = marginY + r * (drawH + gapY);
      ctx.drawImage(img, x, y, drawW, drawH);
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x, y, drawW, drawH);
      placed++;
    }
  }

  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`SnapTools Printable A4 Cut Sheet (${placed} Passport Copies) — 100% Client-Side`, sheetW / 2, sheetH - 22);

  const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b || new Blob()), 'image/jpeg', 0.92));
  const dataUrl = await blobToDataUrl(blob);
  return {
    id: `a4_${Date.now()}`,
    blob,
    dataUrl,
    width: sheetW,
    height: sheetH,
    outputSize: blob.size,
  };
}
