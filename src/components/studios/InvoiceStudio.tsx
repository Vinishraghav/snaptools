'use client';

import React, { useState } from 'react';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import {
  FileText,
  Plus,
  Trash2,
  Download,
  Upload,
  CheckCircle2,
  X,
} from 'lucide-react';
import {
  toWinAnsiSafe,
  hexToPdfRgb,
  wrapPdfText,
  triggerBlobDownload,
} from '@/lib/pdfStudios';
import AdSlot from '@/components/ads/AdSlot';

interface InvoiceLineItem {
  id: number;
  description: string;
  qty: number;
  rate: number;
}

type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP';
type TaxMode = 'cgst_sgst' | 'single' | 'none';

const CURRENCY_META: Record<CurrencyCode, { symbol: string; pdfPrefix: string; locale: string }> = {
  INR: { symbol: '₹', pdfPrefix: 'Rs. ', locale: 'en-IN' },
  USD: { symbol: '$', pdfPrefix: '$', locale: 'en-US' },
  EUR: { symbol: '€', pdfPrefix: 'EUR ', locale: 'en-IE' },
  GBP: { symbol: '£', pdfPrefix: 'GBP ', locale: 'en-GB' },
};

export default function InvoiceStudio() {
  const todayIso = '2026-11-25';
  const [invoiceNumber, setInvoiceNumber] = useState('INV-2026-001');
  const [issueDate, setIssueDate] = useState(todayIso);
  const [dueDate, setDueDate] = useState('2026-12-10');
  const [currency, setCurrency] = useState<CurrencyCode>('INR');
  const [accentHex, setAccentHex] = useState('#2563eb');
  const [taxMode, setTaxMode] = useState<TaxMode>('cgst_sgst');
  const [taxPercent, setTaxPercent] = useState<number>(18);
  const [discountPercent, setDiscountPercent] = useState<number>(0);

  const [fromName, setFromName] = useState('Apex Digital Studio');
  const [fromTaxId, setFromTaxId] = useState('GSTIN: 33AABCU9603R1ZM');
  const [fromAddress, setFromAddress] = useState('14 Anna Salai, Chennai, TN 600002');

  const [toName, setToName] = useState('Kaveri Retail Pvt Ltd');
  const [toTaxId, setToTaxId] = useState('GSTIN: 29AAACR5055K1Z8');
  const [toAddress, setToAddress] = useState('42 MG Road, Bengaluru, KA 560001');

  const [notes, setNotes] = useState(
    'Payment due within 15 days via NEFT / UPI. Thank you for your business!'
  );

  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [logoBytes, setLogoBytes] = useState<{ bytes: Uint8Array; type: 'png' | 'jpg' } | null>(
    null
  );

  const [items, setItems] = useState<InvoiceLineItem[]>([
    { id: 1, description: 'Full-Stack Web Application Design & UI Polish', qty: 1, rate: 25000 },
    { id: 2, description: 'Client-Side PDF & Performance Optimization', qty: 2, rate: 7500 },
  ]);
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  const currMeta = CURRENCY_META[currency];
  const formatDisplay = (n: number) =>
    `${currMeta.symbol}${n.toLocaleString(currMeta.locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  const formatPdfMoney = (n: number) =>
    `${currMeta.pdfPrefix}${n.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const subtotal = items.reduce((sum, item) => sum + Math.max(0, item.qty) * Math.max(0, item.rate), 0);
  const discountAmt = subtotal * (Math.max(0, Math.min(100, discountPercent)) / 100);
  const taxable = Math.max(0, subtotal - discountAmt);
  const effectiveTaxRate = taxMode === 'none' ? 0 : Math.max(0, taxPercent);
  const taxAmt = taxable * (effectiveTaxRate / 100);
  const grandTotal = taxable + taxAmt;

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { id: Date.now(), description: 'Consulting / Service Item', qty: 1, rate: 2500 },
    ]);
  };

  const updateItem = (id: number, patch: Partial<InvoiceLineItem>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  };

  const removeItem = (id: number) => {
    setItems((prev) => (prev.length > 1 ? prev.filter((it) => it.id !== id) : prev));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const lower = file.name.toLowerCase();
    const isPng = file.type === 'image/png' || lower.endsWith('.png');
    const buf = new Uint8Array(await file.arrayBuffer());
    setLogoBytes({ bytes: buf, type: isPng ? 'png' : 'jpg' });
    setLogoPreviewUrl(URL.createObjectURL(file));
  };

  const downloadInvoicePdf = async () => {
    const pdfDoc = await PDFDocument.create();
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const accent = hexToPdfRgb(accentHex);

    const page = pdfDoc.addPage([595.28, 841.89]); // A4
    const { width, height } = page.getSize();
    const margin = 44;
    let y = height - 46;

    // Top accent bar
    page.drawRectangle({ x: 0, y: height - 10, width, height: 10, color: accent });

    // Optional Logo
    if (logoBytes) {
      try {
        const img =
          logoBytes.type === 'png'
            ? await pdfDoc.embedPng(logoBytes.bytes)
            : await pdfDoc.embedJpg(logoBytes.bytes);
        const maxLogoW = 90;
        const maxLogoH = 44;
        const ratio = Math.min(maxLogoW / img.width, maxLogoH / img.height, 1);
        const w = img.width * ratio;
        const h = img.height * ratio;
        page.drawImage(img, { x: margin, y: y - h + 10, width: w, height: h });
      } catch {
        // skip invalid image bytes cleanly
      }
    }

    // Invoice Heading right side
    const titleStr = 'INVOICE';
    const titleW = fontBold.widthOfTextAtSize(titleStr, 24);
    page.drawText(titleStr, {
      x: width - margin - titleW,
      y: y - 10,
      size: 24,
      font: fontBold,
      color: accent,
    });

    const invMetaLines = [
      `Invoice #: ${toWinAnsiSafe(invoiceNumber)}`,
      `Date: ${toWinAnsiSafe(issueDate)}`,
      `Due: ${toWinAnsiSafe(dueDate)}`,
    ];
    invMetaLines.forEach((line, idx) => {
      const lw = fontRegular.widthOfTextAtSize(line, 9.5);
      page.drawText(line, {
        x: width - margin - lw,
        y: y - 28 - idx * 13,
        size: 9.5,
        font: fontRegular,
        color: rgb(0.32, 0.32, 0.36),
      });
    });

    y -= 82;

    // From / Bill To columns
    page.drawText('FROM', { x: margin, y, size: 8.5, font: fontBold, color: accent });
    page.drawText('BILL TO', { x: width / 2 + 12, y, size: 8.5, font: fontBold, color: accent });
    y -= 15;

    page.drawText(toWinAnsiSafe(fromName), {
      x: margin,
      y,
      size: 12,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.12),
    });
    page.drawText(toWinAnsiSafe(toName), {
      x: width / 2 + 12,
      y,
      size: 12,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.12),
    });
    y -= 15;

    const fromLines = [
      ...wrapPdfText(fromTaxId, fontRegular, 9.5, 220),
      ...wrapPdfText(fromAddress, fontRegular, 9.5, 220),
    ];
    const toLines = [
      ...wrapPdfText(toTaxId, fontRegular, 9.5, 220),
      ...wrapPdfText(toAddress, fontRegular, 9.5, 220),
    ];
    const maxPartyLines = Math.max(fromLines.length, toLines.length);
    for (let i = 0; i < maxPartyLines; i++) {
      if (fromLines[i]) {
        page.drawText(fromLines[i], {
          x: margin,
          y: y - i * 13,
          size: 9.5,
          font: fontRegular,
          color: rgb(0.3, 0.3, 0.34),
        });
      }
      if (toLines[i]) {
        page.drawText(toLines[i], {
          x: width / 2 + 12,
          y: y - i * 13,
          size: 9.5,
          font: fontRegular,
          color: rgb(0.3, 0.3, 0.34),
        });
      }
    }

    y -= maxPartyLines * 13 + 22;

    // Line items table header
    const tableW = width - margin * 2;
    page.drawRectangle({ x: margin, y: y - 6, width: tableW, height: 24, color: accent });
    page.drawText('DESCRIPTION', {
      x: margin + 10,
      y: y + 2,
      size: 8.5,
      font: fontBold,
      color: rgb(1, 1, 1),
    });
    page.drawText('QTY', {
      x: margin + 280,
      y: y + 2,
      size: 8.5,
      font: fontBold,
      color: rgb(1, 1, 1),
    });
    page.drawText('RATE', {
      x: margin + 345,
      y: y + 2,
      size: 8.5,
      font: fontBold,
      color: rgb(1, 1, 1),
    });
    page.drawText('AMOUNT', {
      x: margin + 435,
      y: y + 2,
      size: 8.5,
      font: fontBold,
      color: rgb(1, 1, 1),
    });

    y -= 24;

    items.forEach((item, idx) => {
      const descLines = wrapPdfText(item.description || 'Item', fontRegular, 9.5, 255);
      const rowH = Math.max(24, descLines.length * 13 + 10);
      if (idx % 2 === 1) {
        page.drawRectangle({
          x: margin,
          y: y - rowH + 14,
          width: tableW,
          height: rowH,
          color: rgb(0.97, 0.97, 0.99),
        });
      }
      descLines.forEach((dl, lineIdx) => {
        page.drawText(dl, {
          x: margin + 10,
          y: y - lineIdx * 13,
          size: 9.5,
          font: fontRegular,
          color: rgb(0.12, 0.12, 0.15),
        });
      });

      const lineTotal = Math.max(0, item.qty) * Math.max(0, item.rate);
      page.drawText(String(item.qty), {
        x: margin + 280,
        y,
        size: 9.5,
        font: fontRegular,
        color: rgb(0.2, 0.2, 0.24),
      });
      page.drawText(formatPdfMoney(item.rate), {
        x: margin + 345,
        y,
        size: 9.5,
        font: fontRegular,
        color: rgb(0.2, 0.2, 0.24),
      });
      page.drawText(formatPdfMoney(lineTotal), {
        x: margin + 435,
        y,
        size: 9.5,
        font: fontBold,
        color: rgb(0.1, 0.1, 0.12),
      });

      y -= rowH;
    });

    y -= 16;

    // Totals block
    const totalsX = width - margin - 210;
    const drawSummaryRow = (label: string, value: string, bold = false) => {
      const f = bold ? fontBold : fontRegular;
      const sz = bold ? 11.5 : 9.5;
      page.drawText(label, { x: totalsX, y, size: sz, font: f, color: rgb(0.2, 0.2, 0.24) });
      const vw = f.widthOfTextAtSize(value, sz);
      page.drawText(value, {
        x: width - margin - vw,
        y,
        size: sz,
        font: f,
        color: bold ? accent : rgb(0.1, 0.1, 0.12),
      });
      y -= bold ? 20 : 16;
    };

    drawSummaryRow('Subtotal', formatPdfMoney(subtotal));
    if (discountPercent > 0) {
      drawSummaryRow(`Discount (${discountPercent}%)`, `-${formatPdfMoney(discountAmt)}`);
    }
    if (taxMode === 'cgst_sgst') {
      const halfRate = (effectiveTaxRate / 2).toFixed(1).replace(/\.0$/, '');
      drawSummaryRow(`CGST (${halfRate}%)`, formatPdfMoney(taxAmt / 2));
      drawSummaryRow(`SGST (${halfRate}%)`, formatPdfMoney(taxAmt / 2));
    } else if (taxMode === 'single') {
      drawSummaryRow(`Tax / IGST (${effectiveTaxRate}%)`, formatPdfMoney(taxAmt));
    }
    y -= 4;
    page.drawLine({
      start: { x: totalsX, y: y + 12 },
      end: { x: width - margin, y: y + 12 },
      thickness: 1,
      color: accent,
    });
    drawSummaryRow('TOTAL DUE', formatPdfMoney(grandTotal), true);

    // Notes block
    if (notes.trim()) {
      y -= 18;
      page.drawText('NOTES & PAYMENT TERMS', {
        x: margin,
        y,
        size: 8.5,
        font: fontBold,
        color: accent,
      });
      y -= 14;
      const noteLines = wrapPdfText(notes, fontRegular, 9.5, tableW);
      noteLines.forEach((nl, idx) => {
        page.drawText(nl, {
          x: margin,
          y: y - idx * 13,
          size: 9.5,
          font: fontRegular,
          color: rgb(0.32, 0.32, 0.36),
        });
      });
    }

    // Footer stamp
    page.drawText('Generated 100% locally in browser by SnapTools Invoice Studio', {
      x: margin,
      y: 26,
      size: 8,
      font: fontRegular,
      color: rgb(0.55, 0.55, 0.6),
    });

    const bytes = await pdfDoc.save();
    const safeFile = (invoiceNumber.replace(/[^a-zA-Z0-9_-]/g, '') || 'invoice') + '.pdf';
    triggerBlobDownload(bytes, safeFile);
    setExportStatus(`Downloaded ${safeFile}`);
    setTimeout(() => setExportStatus(null), 3500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      {/* Studio Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 mb-2">
            <FileText className="w-3.5 h-3.5" /> 100% Client-Side PDF Invoice Studio
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white">
            GST &amp; Business Invoice PDF Maker
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Create crisp A4 invoices with CGST/SGST splits, discounts, and logo stamping directly inside your browser.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {exportStatus && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" /> {exportStatus}
            </span>
          )}
          <button
            onClick={downloadInvoicePdf}
            className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-lg flex items-center gap-2 cursor-pointer transition"
          >
            <Download className="w-4 h-4" /> Download Invoice PDF
          </button>
        </div>
      </div>

      {/* Main Split Editor + Paper Preview */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Left: Form Controls */}
        <div className="xl:col-span-6 space-y-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 sm:p-6">
          {/* Meta Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-neutral-500 uppercase mb-1">
                Invoice #
              </label>
              <input
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-xs font-semibold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-neutral-500 uppercase mb-1">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-xs font-semibold"
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-neutral-500 uppercase mb-1">
                Issue Date
              </label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-neutral-500 uppercase mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-xs"
              />
            </div>
          </div>

          {/* Branding: Logo & Accent */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-3">
              <label className="px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:border-blue-500 transition">
                <Upload className="w-3.5 h-3.5 text-blue-600" />
                {logoPreviewUrl ? 'Change Logo' : 'Upload Logo (PNG/JPG)'}
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </label>
              {logoPreviewUrl && (
                <button
                  onClick={() => {
                    setLogoPreviewUrl(null);
                    setLogoBytes(null);
                  }}
                  className="text-xs text-rose-500 flex items-center gap-0.5 font-semibold cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" /> Remove
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="text-neutral-500">Theme Color:</span>
              {['#2563eb', '#059669', '#d97706', '#7c3aed', '#111827'].map((col) => (
                <button
                  key={col}
                  type="button"
                  onClick={() => setAccentHex(col)}
                  style={{ backgroundColor: col }}
                  aria-label={`Select color ${col}`}
                  className={`w-5 h-5 rounded-full cursor-pointer transition ${
                    accentHex === col ? 'ring-2 ring-offset-2 ring-neutral-900 dark:ring-white' : ''
                  }`}
                />
              ))}
            </div>
          </div>

          {/* From & Bill To */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-xs font-bold text-neutral-700 dark:text-neutral-300">From (Your Business)</div>
              <input
                value={fromName}
                onChange={(e) => setFromName(e.target.value)}
                placeholder="Business Name"
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-xs font-semibold"
              />
              <input
                value={fromTaxId}
                onChange={(e) => setFromTaxId(e.target.value)}
                placeholder="GSTIN / Tax ID"
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-xs"
              />
              <textarea
                rows={2}
                value={fromAddress}
                onChange={(e) => setFromAddress(e.target.value)}
                placeholder="Address"
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-xs"
              />
            </div>

            <div className="space-y-2">
              <div className="text-xs font-bold text-neutral-700 dark:text-neutral-300">Bill To (Client)</div>
              <input
                value={toName}
                onChange={(e) => setToName(e.target.value)}
                placeholder="Client Name"
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-xs font-semibold"
              />
              <input
                value={toTaxId}
                onChange={(e) => setToTaxId(e.target.value)}
                placeholder="Client GSTIN / ID"
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-xs"
              />
              <textarea
                rows={2}
                value={toAddress}
                onChange={(e) => setToAddress(e.target.value)}
                placeholder="Client Address"
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-xs"
              />
            </div>
          </div>

          {/* Line Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-neutral-700 dark:text-neutral-300">Line Items</div>
              <button
                onClick={addItem}
                className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 text-xs font-bold flex items-center gap-1 cursor-pointer hover:bg-blue-100 transition"
              >
                <Plus className="w-3.5 h-3.5" /> Add Item
              </button>
            </div>

            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                  <input
                    value={item.description}
                    onChange={(e) => updateItem(item.id, { description: e.target.value })}
                    placeholder="Service / Product description"
                    className="col-span-6 px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-xs"
                  />
                  <input
                    type="number"
                    min={0}
                    value={item.qty}
                    onChange={(e) => updateItem(item.id, { qty: Number(e.target.value) })}
                    className="col-span-2 px-2.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-xs font-mono"
                    aria-label="Quantity"
                  />
                  <input
                    type="number"
                    min={0}
                    value={item.rate}
                    onChange={(e) => updateItem(item.id, { rate: Number(e.target.value) })}
                    className="col-span-3 px-2.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-xs font-mono"
                    aria-label="Rate"
                  />
                  <button
                    onClick={() => removeItem(item.id)}
                    aria-label="Remove item"
                    className="col-span-1 p-2 text-neutral-400 hover:text-rose-500 cursor-pointer flex justify-center"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Tax & Discount */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-neutral-500 uppercase mb-1">
                Tax Scheme
              </label>
              <select
                value={taxMode}
                onChange={(e) => setTaxMode(e.target.value as TaxMode)}
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-xs font-semibold"
              >
                <option value="cgst_sgst">CGST + SGST Split</option>
                <option value="single">IGST / Single Tax %</option>
                <option value="none">No Tax</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-neutral-500 uppercase mb-1">
                Tax Rate (%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                disabled={taxMode === 'none'}
                value={taxPercent}
                onChange={(e) => setTaxPercent(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-xs font-mono disabled:opacity-40"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-neutral-500 uppercase mb-1">
                Discount (%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={discountPercent}
                onChange={(e) => setDiscountPercent(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-xs font-mono"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-500 uppercase mb-1">
              Payment Notes / Terms / UPI
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-xs"
            />
          </div>
        </div>

        {/* Right: Crisp Live A4 Paper Preview */}
        <div className="xl:col-span-6">
          <div className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white text-neutral-900 shadow-2xl overflow-hidden">
            <div style={{ backgroundColor: accentHex }} className="h-2.5 w-full" />
            <div className="p-6 sm:p-8 space-y-6 text-xs">
              <div className="flex items-start justify-between gap-4">
                <div>
                  {logoPreviewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={logoPreviewUrl}
                      alt="Business Logo"
                      className="max-h-14 max-w-[140px] object-contain"
                    />
                  ) : (
                    <div className="text-lg font-black text-neutral-900">{fromName}</div>
                  )}
                </div>
                <div className="text-right">
                  <div style={{ color: accentHex }} className="text-2xl font-black tracking-tight">
                    INVOICE
                  </div>
                  <div className="text-neutral-600 mt-1 space-y-0.5 font-mono text-[11px]">
                    <div>#{invoiceNumber}</div>
                    <div>Date: {issueDate}</div>
                    <div>Due: {dueDate}</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-2">
                <div>
                  <div style={{ color: accentHex }} className="text-[10px] font-bold uppercase mb-1">
                    From
                  </div>
                  <div className="font-bold text-sm text-neutral-900">{fromName}</div>
                  <div className="text-neutral-600 text-[11px] whitespace-pre-line">
                    {fromTaxId}
                    {'\n'}
                    {fromAddress}
                  </div>
                </div>
                <div>
                  <div style={{ color: accentHex }} className="text-[10px] font-bold uppercase mb-1">
                    Bill To
                  </div>
                  <div className="font-bold text-sm text-neutral-900">{toName}</div>
                  <div className="text-neutral-600 text-[11px] whitespace-pre-line">
                    {toTaxId}
                    {'\n'}
                    {toAddress}
                  </div>
                </div>
              </div>

              {/* Preview Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr style={{ backgroundColor: accentHex }} className="text-white text-[10px] uppercase">
                      <th className="py-2 px-3 text-left rounded-l-lg">Description</th>
                      <th className="py-2 px-2 text-right">Qty</th>
                      <th className="py-2 px-2 text-right">Rate</th>
                      <th className="py-2 px-3 text-right rounded-r-lg">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {items.map((it) => (
                      <tr key={it.id}>
                        <td className="py-2.5 px-3 font-medium text-neutral-800">
                          {it.description || 'Item'}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono">{it.qty}</td>
                        <td className="py-2.5 px-2 text-right font-mono">{formatDisplay(it.rate)}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold">
                          {formatDisplay(Math.max(0, it.qty) * Math.max(0, it.rate))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Preview */}
              <div className="flex justify-end">
                <div className="w-60 space-y-1.5 text-xs">
                  <div className="flex justify-between text-neutral-600">
                    <span>Subtotal</span>
                    <span className="font-mono">{formatDisplay(subtotal)}</span>
                  </div>
                  {discountPercent > 0 && (
                    <div className="flex justify-between text-neutral-600">
                      <span>Discount ({discountPercent}%)</span>
                      <span className="font-mono">-{formatDisplay(discountAmt)}</span>
                    </div>
                  )}
                  {taxMode === 'cgst_sgst' && (
                    <>
                      <div className="flex justify-between text-neutral-600">
                        <span>CGST ({(effectiveTaxRate / 2).toFixed(1).replace(/\.0$/, '')}%)</span>
                        <span className="font-mono">{formatDisplay(taxAmt / 2)}</span>
                      </div>
                      <div className="flex justify-between text-neutral-600">
                        <span>SGST ({(effectiveTaxRate / 2).toFixed(1).replace(/\.0$/, '')}%)</span>
                        <span className="font-mono">{formatDisplay(taxAmt / 2)}</span>
                      </div>
                    </>
                  )}
                  {taxMode === 'single' && (
                    <div className="flex justify-between text-neutral-600">
                      <span>Tax ({effectiveTaxRate}%)</span>
                      <span className="font-mono">{formatDisplay(taxAmt)}</span>
                    </div>
                  )}
                  <div
                    style={{ borderColor: accentHex }}
                    className="flex justify-between pt-2 border-t-2 font-black text-sm"
                  >
                    <span>Total Due</span>
                    <span style={{ color: accentHex }} className="font-mono">
                      {formatDisplay(grandTotal)}
                    </span>
                  </div>
                </div>
              </div>

              {notes.trim() && (
                <div className="pt-4 border-t border-neutral-100">
                  <div style={{ color: accentHex }} className="text-[10px] font-bold uppercase mb-1">
                    Notes &amp; Payment Terms
                  </div>
                  <p className="text-neutral-600 text-[11px]">{notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <AdSlot slotId="studio-invoice-banner" format="horizontal" />
    </div>
  );
}
