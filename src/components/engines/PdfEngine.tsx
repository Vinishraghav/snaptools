'use client';

import React, { useEffect, useState } from 'react';
import { ToolDef } from '@/data/toolsRegistry';
import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';
import {
  Upload,
  Download,
  FileText,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Layers,
  Image as ImageIcon,
} from 'lucide-react';

type PdfMode =
  | 'images-to-pdf'
  | 'structured-generator'
  | 'text-generator'
  | 'template-generator'
  | 'pdf-file';

const PAPER_SIZES: Record<string, { label: string; dims: [number, number] }> = {
  a0: { label: 'A0 Portrait', dims: [2383.94, 3370.39] },
  a1: { label: 'A1 Portrait', dims: [1683.78, 2383.94] },
  a2: { label: 'A2 Portrait', dims: [1190.55, 1683.78] },
  a3: { label: 'A3 Portrait', dims: [841.89, 1190.55] },
  a4: { label: 'A4 Portrait (Standard)', dims: [595.28, 841.89] },
  a5: { label: 'A5 Portrait', dims: [419.53, 595.28] },
  a6: { label: 'A6 Portrait', dims: [297.64, 419.53] },
  b4: { label: 'B4 JIS', dims: [708.66, 1000.63] },
  b5: { label: 'B5 JIS', dims: [498.9, 708.66] },
  letter: { label: 'US Letter', dims: [612, 792] },
  legal: { label: 'US Legal', dims: [612, 1008] },
  tabloid: { label: 'Tabloid (11x17)', dims: [792, 1224] },
  executive: { label: 'Executive', dims: [522, 756] },
};

function detectPdfMode(slug: string, spec?: Record<string, unknown>): PdfMode {
  if (
    slug.includes('images-to-pdf') ||
    slug.includes('image-to-pdf') ||
    slug.includes('jpg-to-pdf') ||
    slug.includes('png-to-pdf')
  ) {
    return 'images-to-pdf';
  }
  if (
    slug.includes('invoice') ||
    slug.includes('receipt') ||
    slug.includes('certificate') ||
    slug.includes('purchase-order') ||
    slug.includes('ticket') ||
    slug.includes('quotation') ||
    slug.includes('delivery-challan')
  ) {
    return 'structured-generator';
  }
  if (
    slug.includes('text-to-pdf') ||
    slug.includes('html-to-pdf') ||
    slug.includes('markdown-to-pdf') ||
    slug.includes('text-to-handwriting') ||
    slug.includes('resume') ||
    slug.includes('cover-letter') ||
    slug.includes('travel-itinerary')
  ) {
    return 'text-generator';
  }
  if (
    typeof spec?.gridSize === 'number' ||
    slug.includes('cornell-note') ||
    slug.includes('graph-paper') ||
    slug.includes('lined-paper') ||
    slug.includes('dot-grid') ||
    slug.includes('music-sheet') ||
    slug.includes('calligraphy')
  ) {
    return 'template-generator';
  }
  return 'pdf-file';
}

function getDefaultTextForSlug(slug: string, title: string): string {
  if (slug.includes('html')) {
    return '<h1>Project Report</h1>\n<p>Generated 100% locally in your browser with SnapTools.</p>\n<ul>\n  <li>Zero server uploads</li>\n  <li>Instant conversion</li>\n</ul>';
  }
  if (slug.includes('markdown')) {
    return '# Document Title\n\nThis PDF was compiled from Markdown directly inside browser memory.\n\n## Highlights\n- Complete client-side privacy\n- Clean typography & pagination';
  }
  if (slug.includes('resume')) {
    return 'ALEXANDER CHEN\nSenior Software Engineer | San Francisco, CA\n\nSUMMARY\nExperienced full-stack engineer focused on high-performance web applications.\n\nEXPERIENCE\n- Lead Frontend Architect (2022 - Present)\n- Software Engineer (2019 - 2022)';
  }
  if (slug.includes('cover-letter')) {
    return 'Dear Hiring Manager,\n\nI am writing to express my strong interest in joining your engineering team. With deep expertise in modern web architecture and performance optimization, I am excited to contribute from day one.\n\nSincerely,\nYour Name';
  }
  return `Sample content for ${title}.\n\nReplace or edit this text to generate a multi-line paginated PDF document completely inside your browser with zero server uploads.`;
}

function parsePageIndices(rangeStr: string, totalPages: number): number[] {
  const indices: number[] = [];
  const parts = rangeStr.split(',');
  for (const raw of parts) {
    const part = raw.trim();
    if (!part) continue;
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-');
      const start = Math.max(1, parseInt(startStr, 10) || 1);
      const end = Math.min(totalPages, parseInt(endStr, 10) || totalPages);
      for (let p = start; p <= end; p++) {
        indices.push(p - 1);
      }
    } else {
      const p = parseInt(part, 10);
      if (p >= 1 && p <= totalPages) {
        indices.push(p - 1);
      }
    }
  }
  return Array.from(new Set(indices));
}

function wrapLines(text: string, maxChars: number): string[] {
  const out: string[] = [];
  for (const rawLine of text.split(/\r?\n/)) {
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

async function fileToPngBytesViaCanvas(file: File): Promise<Uint8Array> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error(`Unsupported image format: ${file.name}`));
    el.src = dataUrl;
  });

  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  ctx.drawImage(img, 0, 0);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/png')
  );
  if (!blob) throw new Error(`Failed converting ${file.name} to PNG`);
  return new Uint8Array(await blob.arrayBuffer());
}

export default function PdfEngine({ tool }: { tool: ToolDef }) {
  const spec = (tool.spec ?? {}) as Record<string, unknown>;
  const specTargetKb = typeof spec.targetKb === 'number' ? spec.targetKb : 200;
  const specGridSize = typeof spec.gridSize === 'number' ? spec.gridSize : 18;
  const specPaper = (
    typeof spec.paperSize === 'string'
      ? spec.paperSize
      : typeof spec.resizePaper === 'string'
        ? spec.resizePaper
        : 'a4'
  ).toLowerCase();

  const mode = detectPdfMode(tool.slug, spec);
  const isMerge = tool.slug.includes('merge') || tool.slug.includes('join');
  const isCompressor = typeof spec.targetKb === 'number' || tool.slug.includes('compress');
  const isSplitOrDelete =
    tool.slug.includes('split') ||
    tool.slug.includes('delete') ||
    tool.slug.includes('extract') ||
    tool.slug.includes('odd-even');

  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState<string>('output.pdf');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Feature-specific controls
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [rotationAngle, setRotationAngle] = useState(90);
  const [targetKb, setTargetKb] = useState<number>(specTargetKb);
  const [pageRange, setPageRange] = useState<string>('1-2');
  const [oddEvenMode, setOddEvenMode] = useState<'odd' | 'even'>('odd');
  const [imagePageSize, setImagePageSize] = useState<string>(PAPER_SIZES[specPaper] ? specPaper : 'a4');
  const [imageMargin, setImageMargin] = useState<number>(20);
  const [metaTitle, setMetaTitle] = useState('SnapTools Document');
  const [metaAuthor, setMetaAuthor] = useState('SnapTools User');

  // Generator controls
  const [invoiceName, setInvoiceName] = useState('Acme Corp');
  const [invoiceAmount, setInvoiceAmount] = useState('1500');
  const [invoiceClient, setInvoiceClient] = useState('John Doe');
  const [docTitle, setDocTitle] = useState(tool.title);
  const [docBody, setDocBody] = useState(() =>
    getDefaultTextForSlug(tool.slug, tool.title)
  );
  const [templateGridSize, setTemplateGridSize] = useState<number>(specGridSize);

  useEffect(() => {
    setFiles([]);
    setDownloadUrl(null);
    setStatusMessage('');
    setErrorMessage('');
    setDocTitle(tool.title);
    setDocBody(getDefaultTextForSlug(tool.slug, tool.title));
    setTargetKb(typeof spec.targetKb === 'number' ? spec.targetKb : 200);
    setTemplateGridSize(typeof spec.gridSize === 'number' ? spec.gridSize : 18);
    const nextPaper = (
      typeof spec.paperSize === 'string'
        ? spec.paperSize
        : typeof spec.resizePaper === 'string'
          ? spec.resizePaper
          : 'a4'
    ).toLowerCase();
    setImagePageSize(PAPER_SIZES[nextPaper] ? nextPaper : 'a4');
  }, [tool.slug, tool.title, spec.targetKb, spec.gridSize, spec.paperSize, spec.resizePaper]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(Array.from(e.target.files));
      setDownloadUrl(null);
      setStatusMessage('');
      setErrorMessage('');
    }
  };

  const handleProcessPdf = async () => {
    try {
      setProcessing(true);
      setErrorMessage('');
      setStatusMessage('Processing locally in browser...');

      // 1. Images to PDF Converter
      if (mode === 'images-to-pdf') {
        if (files.length === 0) {
          setErrorMessage('Please select one or more images (PNG, JPG, WebP) first.');
          return;
        }
        const doc = await PDFDocument.create();
        for (const file of files) {
          const isJpg =
            file.type === 'image/jpeg' || /\.(jpe?g)$/i.test(file.name);
          const isPng = file.type === 'image/png' || /\.png$/i.test(file.name);
          let embeddedImg;
          if (isJpg) {
            const bytes = await file.arrayBuffer();
            embeddedImg = await doc.embedJpg(bytes);
          } else if (isPng) {
            const bytes = await file.arrayBuffer();
            embeddedImg = await doc.embedPng(bytes);
          } else {
            const pngBytes = await fileToPngBytesViaCanvas(file);
            embeddedImg = await doc.embedPng(pngBytes);
          }

          const { width: imgW, height: imgH } = embeddedImg.scale(1);
          const preset = PAPER_SIZES[imagePageSize];
          const pageW = preset ? preset.dims[0] : imgW + imageMargin * 2;
          const pageH = preset ? preset.dims[1] : imgH + imageMargin * 2;

          const page = doc.addPage([pageW, pageH]);
          const availW = Math.max(10, pageW - imageMargin * 2);
          const availH = Math.max(10, pageH - imageMargin * 2);
          const scale =
            imagePageSize === 'fit'
              ? 1
              : Math.min(availW / imgW, availH / imgH, 1);
          const drawW = imgW * scale;
          const drawH = imgH * scale;
          page.drawImage(embeddedImg, {
            x: (pageW - drawW) / 2,
            y: (pageH - drawH) / 2,
            width: drawW,
            height: drawH,
          });
        }

        const pdfBytes = await doc.save();
        const blob = new Blob([new Uint8Array(pdfBytes)], {
          type: 'application/pdf',
        });
        setDownloadUrl(URL.createObjectURL(blob));
        setDownloadName('images-combined.pdf');
        setStatusMessage(
          `Successfully converted ${files.length} image${files.length > 1 ? 's' : ''} into PDF (${(pdfBytes.length / 1024).toFixed(1)} KB)!`
        );
        return;
      }

      // 2. Structured Invoice / Receipt / Certificate Generator
      if (mode === 'structured-generator') {
        const doc = await PDFDocument.create();
        const page = doc.addPage([595.28, 841.89]);
        const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
        const fontReg = await doc.embedFont(StandardFonts.Helvetica);
        const { height } = page.getSize();

        page.drawText(tool.title.toUpperCase(), {
          x: 50,
          y: height - 80,
          size: 20,
          font: fontBold,
          color: rgb(0.1, 0.3, 0.8),
        });
        page.drawText(`Issued by: ${invoiceName}`, {
          x: 50,
          y: height - 130,
          size: 13,
          font: fontReg,
          color: rgb(0.15, 0.15, 0.15),
        });
        page.drawText(`Recipient / Client: ${invoiceClient}`, {
          x: 50,
          y: height - 160,
          size: 13,
          font: fontReg,
          color: rgb(0.15, 0.15, 0.15),
        });
        page.drawText(`Amount / Value: $${invoiceAmount}`, {
          x: 50,
          y: height - 195,
          size: 15,
          font: fontBold,
          color: rgb(0.08, 0.5, 0.25),
        });
        page.drawText(`Date: ${new Date().toLocaleDateString()}`, {
          x: 50,
          y: height - 225,
          size: 11,
          font: fontReg,
          color: rgb(0.4, 0.4, 0.4),
        });
        page.drawText('Generated securely 100% client-side with SnapTools.', {
          x: 50,
          y: 45,
          size: 10,
          font: fontReg,
          color: rgb(0.55, 0.55, 0.55),
        });

        const pdfBytes = await doc.save();
        const blob = new Blob([new Uint8Array(pdfBytes)], {
          type: 'application/pdf',
        });
        setDownloadUrl(URL.createObjectURL(blob));
        setDownloadName(`${tool.slug}.pdf`);
        setStatusMessage('Document PDF generated successfully!');
        return;
      }

      // 3. Text / HTML / Markdown / Resume / Letter PDF Generator
      if (mode === 'text-generator') {
        const doc = await PDFDocument.create();
        const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
        const fontReg = await doc.embedFont(StandardFonts.Helvetica);

        const cleanBody = tool.slug.includes('html')
          ? docBody.replace(/<[^>]+>/g, ' ').replace(/[ \t]+/g, ' ')
          : docBody.replace(/^#+\s*/gm, '');

        const [tW, tH] = PAPER_SIZES[imagePageSize]?.dims ?? [595.28, 841.89];
        const lines = wrapLines(cleanBody, Math.max(36, Math.floor((tW - 100) / 6.2)));
        let page = doc.addPage([tW, tH]);
        let y = tH - 56;

        page.drawText(docTitle || tool.title, {
          x: 50,
          y,
          size: 18,
          font: fontBold,
          color: rgb(0.1, 0.25, 0.7),
        });
        y -= 32;

        for (const line of lines) {
          if (y < 55) {
            page = doc.addPage([tW, tH]);
            y = tH - 56;
          }
          if (line.trim()) {
            page.drawText(line, {
              x: 50,
              y,
              size: 11,
              font: fontReg,
              color: rgb(0.12, 0.12, 0.12),
            });
          }
          y -= 17;
        }

        const pdfBytes = await doc.save();
        const blob = new Blob([new Uint8Array(pdfBytes)], {
          type: 'application/pdf',
        });
        setDownloadUrl(URL.createObjectURL(blob));
        setDownloadName(`${tool.slug}.pdf`);
        setStatusMessage(
          `Generated ${doc.getPageCount()}-page PDF (${(pdfBytes.length / 1024).toFixed(1)} KB)!`
        );
        return;
      }

      // 4. Printable Note / Graph / Music / Calligraphy Template Generator
      if (mode === 'template-generator') {
        const doc = await PDFDocument.create();
        const page = doc.addPage([595.28, 841.89]);
        const { width, height } = page.getSize();
        const step = Math.max(10, Math.min(40, templateGridSize));

        if (tool.slug.includes('graph')) {
          for (let x = 36; x <= width - 36; x += step) {
            page.drawLine({
              start: { x, y: 36 },
              end: { x, y: height - 36 },
              thickness: 0.5,
              color: rgb(0.82, 0.85, 0.9),
            });
          }
          for (let y = 36; y <= height - 36; y += step) {
            page.drawLine({
              start: { x: 36, y },
              end: { x: width - 36, y },
              thickness: 0.5,
              color: rgb(0.82, 0.85, 0.9),
            });
          }
        } else {
          for (let y = 48; y <= height - 48; y += step) {
            page.drawLine({
              start: { x: 40, y },
              end: { x: width - 40, y },
              thickness: 0.6,
              color: rgb(0.75, 0.78, 0.85),
            });
          }
          if (tool.slug.includes('cornell')) {
            page.drawLine({
              start: { x: 185, y: 140 },
              end: { x: 185, y: height - 48 },
              thickness: 1.2,
              color: rgb(0.3, 0.45, 0.75),
            });
            page.drawLine({
              start: { x: 40, y: 140 },
              end: { x: width - 40, y: 140 },
              thickness: 1.2,
              color: rgb(0.3, 0.45, 0.75),
            });
          }
        }

        const pdfBytes = await doc.save();
        const blob = new Blob([new Uint8Array(pdfBytes)], {
          type: 'application/pdf',
        });
        setDownloadUrl(URL.createObjectURL(blob));
        setDownloadName(`${tool.slug}.pdf`);
        setStatusMessage(`Printable A4 template PDF created!`);
        return;
      }

      // 5. PDF File Operations
      if (files.length === 0) {
        setErrorMessage('Please select a PDF file first.');
        return;
      }

      if (isMerge) {
        const mergedDoc = await PDFDocument.create();
        for (const file of files) {
          const bytes = await file.arrayBuffer();
          const doc = await PDFDocument.load(bytes);
          const copiedPages = await mergedDoc.copyPages(doc, doc.getPageIndices());
          copiedPages.forEach((p) => mergedDoc.addPage(p));
        }
        const pdfBytes = await mergedDoc.save();
        const blob = new Blob([new Uint8Array(pdfBytes)], {
          type: 'application/pdf',
        });
        setDownloadUrl(URL.createObjectURL(blob));
        setDownloadName('merged-document.pdf');
        setStatusMessage(`Successfully merged ${files.length} PDF files!`);
      } else if (tool.slug.includes('watermark')) {
        const bytes = await files[0].arrayBuffer();
        const doc = await PDFDocument.load(bytes);
        doc.getPages().forEach((page) => {
          const { width, height } = page.getSize();
          page.drawText(watermarkText, {
            x: width / 4,
            y: height / 2,
            size: 42,
            rotate: degrees(45),
            color: rgb(0.8, 0.2, 0.2),
            opacity: 0.35,
          });
        });
        const pdfBytes = await doc.save();
        const blob = new Blob([new Uint8Array(pdfBytes)], {
          type: 'application/pdf',
        });
        setDownloadUrl(URL.createObjectURL(blob));
        setDownloadName('watermarked.pdf');
        setStatusMessage('Watermark applied to all pages!');
      } else if (tool.slug.includes('rotat')) {
        const bytes = await files[0].arrayBuffer();
        const doc = await PDFDocument.load(bytes);
        const pages = doc.getPages();
        pages.forEach((page) => {
          const currentRotation = page.getRotation().angle;
          page.setRotation(degrees(currentRotation + rotationAngle));
        });
        const pdfBytes = await doc.save();
        const blob = new Blob([new Uint8Array(pdfBytes)], {
          type: 'application/pdf',
        });
        setDownloadUrl(URL.createObjectURL(blob));
        setDownloadName('rotated.pdf');
        setStatusMessage(`Rotated ${pages.length} pages by ${rotationAngle}°!`);
      } else if (tool.slug.includes('numbering') || tool.slug.includes('bates')) {
        const bytes = await files[0].arrayBuffer();
        const doc = await PDFDocument.load(bytes);
        const pages = doc.getPages();
        pages.forEach((page, idx) => {
          const { width } = page.getSize();
          page.drawText(`Page ${idx + 1} of ${pages.length}`, {
            x: width / 2 - 40,
            y: 30,
            size: 11,
            color: rgb(0.3, 0.3, 0.3),
          });
        });
        const pdfBytes = await doc.save();
        const blob = new Blob([new Uint8Array(pdfBytes)], {
          type: 'application/pdf',
        });
        setDownloadUrl(URL.createObjectURL(blob));
        setDownloadName('numbered.pdf');
        setStatusMessage('Page numbers added to all pages!');
      } else if (isSplitOrDelete) {
        const bytes = await files[0].arrayBuffer();
        const doc = await PDFDocument.load(bytes);
        const total = doc.getPageCount();
        let keepIndices: number[] = [];

        if (tool.slug.includes('odd-even')) {
          keepIndices = doc
            .getPageIndices()
            .filter((idx) => (oddEvenMode === 'odd' ? idx % 2 === 0 : idx % 2 === 1));
        } else if (tool.slug.includes('delete')) {
          const deleteSet = new Set(parsePageIndices(pageRange, total));
          keepIndices = doc.getPageIndices().filter((idx) => !deleteSet.has(idx));
        } else {
          keepIndices = parsePageIndices(pageRange, total);
        }

        if (keepIndices.length === 0) {
          setErrorMessage(`No valid pages matched for ${total}-page PDF.`);
          return;
        }

        const outDoc = await PDFDocument.create();
        const copied = await outDoc.copyPages(doc, keepIndices);
        copied.forEach((p) => outDoc.addPage(p));
        const pdfBytes = await outDoc.save({ useObjectStreams: true });
        const blob = new Blob([new Uint8Array(pdfBytes)], {
          type: 'application/pdf',
        });
        setDownloadUrl(URL.createObjectURL(blob));
        setDownloadName(`split-${files[0].name}`);
        setStatusMessage(
          `Extracted ${keepIndices.length} page${keepIndices.length > 1 ? 's' : ''} out of ${total}!`
        );
      } else {
        const bytes = await files[0].arrayBuffer();
        const doc = await PDFDocument.load(bytes);
        const total = doc.getPageCount();

        if (tool.slug.includes('reverse')) {
          const revDoc = await PDFDocument.create();
          for (let i = total - 1; i >= 0; i--) {
            const [p] = await revDoc.copyPages(doc, [i]);
            revDoc.addPage(p);
          }
          const pdfBytes = await revDoc.save();
          const blob = new Blob([new Uint8Array(pdfBytes)], {
            type: 'application/pdf',
          });
          setDownloadUrl(URL.createObjectURL(blob));
          setDownloadName('reversed.pdf');
          setStatusMessage(`Reversed order of all ${total} pages!`);
        } else if (Boolean(spec.resizePaper) || tool.slug.includes('resize-to-')) {
          const resizeKey =
            (typeof spec.resizePaper === 'string' ? spec.resizePaper : '').toLowerCase() ||
            (tool.slug.includes('letter') ? 'letter' : 'a4');
          const paperEntry = PAPER_SIZES[resizeKey] ?? PAPER_SIZES.a4;
          const [targetW, targetH] = paperEntry.dims;
          const resizedDoc = await PDFDocument.create();
          const embeddedPages = await resizedDoc.embedPages(doc.getPages());
          for (const ep of embeddedPages) {
            const scale = Math.min(targetW / ep.width, targetH / ep.height);
            const p = resizedDoc.addPage([targetW, targetH]);
            p.drawPage(ep, {
              x: (targetW - ep.width * scale) / 2,
              y: (targetH - ep.height * scale) / 2,
              width: ep.width * scale,
              height: ep.height * scale,
            });
          }
          const pdfBytes = await resizedDoc.save();
          const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
          setDownloadUrl(URL.createObjectURL(blob));
          setDownloadName(`resized-${resizeKey}.pdf`);
          setStatusMessage(`Resized all ${total} pages to ${paperEntry.label}!`);
        } else if (tool.slug.includes('metadata-editor')) {
          doc.setTitle(metaTitle);
          doc.setAuthor(metaAuthor);
          doc.setCreator('SnapTools PDF Editor');
          const pdfBytes = await doc.save();
          const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
          setDownloadUrl(URL.createObjectURL(blob));
          setDownloadName(`updated-meta-${files[0].name}`);
          setStatusMessage(`Updated PDF metadata Title="${metaTitle}" & Author="${metaAuthor}"!`);
        } else if (tool.slug.includes('header-footer')) {
          doc.getPages().forEach((page) => {
            const { width, height } = page.getSize();
            page.drawText(metaTitle || 'SnapTools Header', { x: 40, y: height - 28, size: 10, color: rgb(0.35, 0.35, 0.35) });
            page.drawText(metaAuthor || 'SnapTools Footer', { x: 40, y: 20, size: 10, color: rgb(0.35, 0.35, 0.35) });
          });
          const pdfBytes = await doc.save();
          const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
          setDownloadUrl(URL.createObjectURL(blob));
          setDownloadName(`header-footer-${files[0].name}`);
          setStatusMessage(`Added custom header & footer to all ${total} pages!`);
        } else {
          if (isCompressor || tool.slug.includes('scrub')) {
            doc.setTitle('');
            doc.setAuthor('');
            doc.setSubject('');
            doc.setKeywords([]);
            doc.setProducer('');
            doc.setCreator('');
          }
          const pdfBytes = await doc.save({ useObjectStreams: true });
          const origKb = (files[0].size / 1024).toFixed(1);
          const newKb = (pdfBytes.length / 1024).toFixed(1);
          const blob = new Blob([new Uint8Array(pdfBytes)], {
            type: 'application/pdf',
          });
          setDownloadUrl(URL.createObjectURL(blob));
          setDownloadName(`optimized-${files[0].name}`);
          setStatusMessage(
            isCompressor
              ? `Optimized PDF (${total} pages): ${origKb} KB → ${newKb} KB (Target: ${targetKb} KB, lossless structural optimization applied).`
              : `Successfully processed ${files[0].name} (${total} pages, ${newKb} KB)!`
          );
        }
      }
    } catch (err: unknown) {
      setErrorMessage(`Error processing PDF: ${(err as Error).message}`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl space-y-6">
      {mode === 'structured-generator' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5">
              Issuer / Company Name
            </label>
            <input
              type="text"
              value={invoiceName}
              onChange={(e) => setInvoiceName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5">
              Client / Recipient Name
            </label>
            <input
              type="text"
              value={invoiceClient}
              onChange={(e) => setInvoiceClient(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5">
              Amount / Value ($)
            </label>
            <input
              type="number"
              value={invoiceAmount}
              onChange={(e) => setInvoiceAmount(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      ) : mode === 'text-generator' ? (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5">
              Document Title
            </label>
            <input
              type="text"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5">
              {tool.slug.includes('html')
                ? 'HTML Markup Input'
                : tool.slug.includes('markdown')
                  ? 'Markdown Content'
                  : 'Document Text Content'}
            </label>
            <textarea
              rows={9}
              value={docBody}
              onChange={(e) => setDocBody(e.target.value)}
              className="w-full p-3.5 rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      ) : mode === 'template-generator' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5">
              Line / Grid Spacing (pt)
            </label>
            <input
              type="number"
              min={10}
              max={40}
              value={templateGridSize}
              onChange={(e) => setTemplateGridSize(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      ) : mode === 'images-to-pdf' ? (
        <div className="space-y-4">
          <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-2xl hover:border-blue-500 hover:bg-blue-50/20 dark:hover:bg-blue-950/20 cursor-pointer transition text-center group">
            <ImageIcon className="w-10 h-10 text-neutral-400 group-hover:text-blue-500 mb-2 transition" />
            <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
              Click or drag &amp; drop Image files here (JPG, PNG, WebP)
            </span>
            <span className="text-xs text-neutral-500 mt-1">
              Select one or multiple images to combine into a single PDF document
            </span>
            <input
              type="file"
              accept="image/*"
              multiple={true}
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                PDF Page Size
              </label>
              <select
                value={imagePageSize}
                onChange={(e) => setImagePageSize(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm focus:outline-hidden"
              >
                {Object.entries(PAPER_SIZES).map(([key, info]) => (
                  <option key={key} value={key}>
                    {info.label}
                  </option>
                ))}
                <option value="fit">Fit to Image Dimensions</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                Page Margin (px): {imageMargin}
              </label>
              <input
                type="range"
                min={0}
                max={60}
                value={imageMargin}
                onChange={(e) => setImageMargin(Number(e.target.value))}
                className="w-full mt-2"
              />
            </div>
          </div>

          {(tool.slug.includes('metadata-editor') || tool.slug.includes('header-footer')) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                  {tool.slug.includes('header-footer') ? 'Header Text' : 'Document Title'}
                </label>
                <input
                  type="text"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                  {tool.slug.includes('header-footer') ? 'Footer Text' : 'Author Name'}
                </label>
                <input
                  type="text"
                  value={metaAuthor}
                  onChange={(e) => setMetaAuthor(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm focus:outline-hidden"
                />
              </div>
            </div>
          )}

          {files.length > 0 && (
            <div className="flex flex-wrap gap-2 text-xs">
              {files.map((f, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5 font-mono"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
                  {f.name} ({(f.size / 1024).toFixed(1)} KB)
                </span>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-2xl hover:border-blue-500 hover:bg-blue-50/20 dark:hover:bg-blue-950/20 cursor-pointer transition text-center group">
            <Upload className="w-10 h-10 text-neutral-400 group-hover:text-blue-500 mb-2 transition" />
            <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
              {isMerge
                ? 'Click or drag & drop PDF files to merge'
                : 'Click or drag & drop your PDF file here'}
            </span>
            <span className="text-xs text-neutral-500 mt-1">
              {isMerge
                ? 'Supports selecting multiple PDF documents at once'
                : 'Processes 100% locally in your browser (.pdf)'}
            </span>
            <input
              type="file"
              accept=".pdf,application/pdf"
              multiple={isMerge}
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          {isCompressor && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                  Target File Size (KB)
                </label>
                <input
                  type="number"
                  min={20}
                  max={10000}
                  value={targetKb}
                  onChange={(e) => setTargetKb(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-end">
                <p className="text-xs text-neutral-500 pb-2">
                  Applies lossless PDF object stream compaction and removes unused metadata.
                </p>
              </div>
            </div>
          )}

          {isSplitOrDelete && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {tool.slug.includes('odd-even') ? (
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                    Pages to Extract
                  </label>
                  <select
                    value={oddEvenMode}
                    onChange={(e) => setOddEvenMode(e.target.value as 'odd' | 'even')}
                    className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm focus:outline-hidden"
                  >
                    <option value="odd">Odd Pages (1, 3, 5...)</option>
                    <option value="even">Even Pages (2, 4, 6...)</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                    {tool.slug.includes('delete')
                      ? 'Pages to Delete (e.g. 2, 4-5)'
                      : 'Page Range to Keep (e.g. 1-3, 5)'}
                  </label>
                  <input
                    type="text"
                    value={pageRange}
                    onChange={(e) => setPageRange(e.target.value)}
                    placeholder="1-2, 4"
                    className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm font-mono focus:outline-hidden"
                  />
                </div>
              )}
            </div>
          )}

          {tool.slug.includes('watermark') && (
            <div>
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                Watermark Text
              </label>
              <input
                type="text"
                value={watermarkText}
                onChange={(e) => setWatermarkText(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm focus:outline-hidden"
              />
            </div>
          )}

          {tool.slug.includes('rotat') && (
            <div>
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                Rotation Angle
              </label>
              <select
                value={rotationAngle}
                onChange={(e) => setRotationAngle(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm focus:outline-hidden"
              >
                <option value={90}>90° Clockwise</option>
                <option value={180}>180° Upside Down</option>
                <option value={270}>270° Counter-Clockwise</option>
              </select>
            </div>
          )}

          {(tool.slug.includes('metadata-editor') || tool.slug.includes('header-footer')) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                  {tool.slug.includes('header-footer') ? 'Header Text' : 'Document Title'}
                </label>
                <input
                  type="text"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                  {tool.slug.includes('header-footer') ? 'Footer Text' : 'Author Name'}
                </label>
                <input
                  type="text"
                  value={metaAuthor}
                  onChange={(e) => setMetaAuthor(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm focus:outline-hidden"
                />
              </div>
            </div>
          )}

          {files.length > 0 && (
            <div className="flex flex-wrap gap-2 text-xs">
              {files.map((f, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5 font-mono"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-500" />
                  {f.name} ({(f.size / 1024).toFixed(1)} KB)
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action Button */}
      <div className="flex flex-wrap items-center gap-4">
        <button
          onClick={handleProcessPdf}
          disabled={
            processing ||
            ((mode === 'pdf-file' || mode === 'images-to-pdf') && files.length === 0)
          }
          className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm shadow-md shadow-blue-500/20 flex items-center gap-2 transition"
        >
          {processing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" /> Processing...
            </>
          ) : (
            <>
              <Layers className="w-4 h-4" /> Run {tool.title}
            </>
          )}
        </button>

        {downloadUrl && (
          <a
            href={downloadUrl}
            download={downloadName}
            className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md shadow-emerald-500/20 flex items-center gap-2 transition"
          >
            <Download className="w-4 h-4" /> Download Result ({downloadName})
          </a>
        )}
      </div>

      {/* Status Messages */}
      {statusMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {statusMessage}
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {errorMessage}
        </div>
      )}
    </div>
  );
}
