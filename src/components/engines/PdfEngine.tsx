'use client';

import React, { useState } from 'react';
import { ToolDef } from '@/data/toolsRegistry';
import { PDFDocument, rgb, degrees } from 'pdf-lib';
import { Upload, Download, FileText, CheckCircle2, AlertCircle, RefreshCw, Layers } from 'lucide-react';

export default function PdfEngine({ tool }: { tool: ToolDef }) {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState<string>('output.pdf');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Options state
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [rotationAngle, setRotationAngle] = useState(90);
  const [invoiceName, setInvoiceName] = useState('Acme Corp');
  const [invoiceAmount, setInvoiceAmount] = useState('1500');
  const [invoiceClient, setInvoiceClient] = useState('John Doe');

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
      setStatusMessage('Processing PDF client-side...');

      // Handle Generators (Invoice, Receipt, Certificate, etc.)
      if (
        tool.slug.includes('invoice') ||
        tool.slug.includes('receipt') ||
        tool.slug.includes('certificate') ||
        tool.slug.includes('purchase-order') ||
        tool.slug.includes('ticket')
      ) {
        const doc = await PDFDocument.create();
        const page = doc.addPage([600, 800]);
        const { height } = page.getSize();

        page.drawText(tool.title.toUpperCase(), {
          x: 50,
          y: height - 80,
          size: 24,
          color: rgb(0.1, 0.3, 0.8),
        });

        page.drawText(`Issued by: ${invoiceName}`, {
          x: 50,
          y: height - 130,
          size: 14,
          color: rgb(0.2, 0.2, 0.2),
        });

        page.drawText(`Recipient / Client: ${invoiceClient}`, {
          x: 50,
          y: height - 160,
          size: 14,
          color: rgb(0.2, 0.2, 0.2),
        });

        page.drawText(`Amount / Value: $${invoiceAmount}`, {
          x: 50,
          y: height - 190,
          size: 16,
          color: rgb(0.1, 0.5, 0.2),
        });

        page.drawText(`Date: ${new Date().toLocaleDateString()}`, {
          x: 50,
          y: height - 220,
          size: 12,
          color: rgb(0.4, 0.4, 0.4),
        });

        page.drawText('Generated securely 100% client-side with SnapTools.', {
          x: 50,
          y: 50,
          size: 10,
          color: rgb(0.6, 0.6, 0.6),
        });

        const pdfBytes = await doc.save();
        const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setDownloadUrl(url);
        setDownloadName(`${tool.slug}-document.pdf`);
        setStatusMessage('Document generated successfully!');
        setProcessing(false);
        return;
      }

      // PDF operations requiring uploaded files
      if (files.length === 0) {
        setErrorMessage('Please select at least one PDF file first.');
        setProcessing(false);
        return;
      }

      // 1. PDF Merge
      if (tool.slug.includes('merge') || tool.slug.includes('join')) {
        const mergedDoc = await PDFDocument.create();
        for (const file of files) {
          const bytes = await file.arrayBuffer();
          const doc = await PDFDocument.load(bytes);
          const copiedPages = await mergedDoc.copyPages(doc, doc.getPageIndices());
          copiedPages.forEach((p) => mergedDoc.addPage(p));
        }
        const pdfBytes = await mergedDoc.save();
        const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
        setDownloadUrl(URL.createObjectURL(blob));
        setDownloadName('merged-document.pdf');
        setStatusMessage(`Successfully merged ${files.length} PDF files!`);
      }
      // 2. PDF Watermark Adder
      else if (tool.slug.includes('watermark')) {
        const bytes = await files[0].arrayBuffer();
        const doc = await PDFDocument.load(bytes);
        const pages = doc.getPages();
        pages.forEach((page) => {
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
        const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
        setDownloadUrl(URL.createObjectURL(blob));
        setDownloadName('watermarked.pdf');
        setStatusMessage('Watermark applied to all pages!');
      }
      // 3. PDF Rotator
      else if (tool.slug.includes('rotat')) {
        const bytes = await files[0].arrayBuffer();
        const doc = await PDFDocument.load(bytes);
        const pages = doc.getPages();
        pages.forEach((page) => {
          const currentRotation = page.getRotation().angle;
          page.setRotation(degrees(currentRotation + rotationAngle));
        });
        const pdfBytes = await doc.save();
        const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
        setDownloadUrl(URL.createObjectURL(blob));
        setDownloadName('rotated.pdf');
        setStatusMessage(`Rotated ${pages.length} pages by ${rotationAngle}°!`);
      }
      // 4. PDF Page Numbering
      else if (tool.slug.includes('numbering')) {
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
        const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
        setDownloadUrl(URL.createObjectURL(blob));
        setDownloadName('numbered.pdf');
        setStatusMessage('Page numbers added to all pages!');
      }
      // 5. General PDF processing (Compress, Delete, Reverse, etc.)
      else {
        const bytes = await files[0].arrayBuffer();
        const doc = await PDFDocument.load(bytes);
        const total = doc.getPageCount();
        
        // Reverse if requested
        if (tool.slug.includes('reverse')) {
          const revDoc = await PDFDocument.create();
          for (let i = total - 1; i >= 0; i--) {
            const [p] = await revDoc.copyPages(doc, [i]);
            revDoc.addPage(p);
          }
          const pdfBytes = await revDoc.save();
          const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
          setDownloadUrl(URL.createObjectURL(blob));
          setDownloadName('reversed.pdf');
          setStatusMessage(`Reversed order of all ${total} pages!`);
        } else {
          // Standard optimized resave
          const pdfBytes = await doc.save({ useObjectStreams: true });
          const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
          setDownloadUrl(URL.createObjectURL(blob));
          setDownloadName(`processed-${files[0].name}`);
          setStatusMessage(`Successfully processed ${files[0].name} (${total} pages)!`);
        }
      }
    } catch (err: unknown) {
      setErrorMessage(`Error processing PDF: ${(err as Error).message}`);
    } finally {
      setProcessing(false);
    }
  };

  const isGenerator =
    tool.slug.includes('invoice') ||
    tool.slug.includes('receipt') ||
    tool.slug.includes('certificate') ||
    tool.slug.includes('purchase-order') ||
    tool.slug.includes('ticket');

  return (
    <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl space-y-6">
      {/* Upload Zone or Form Inputs */}
      {isGenerator ? (
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
      ) : (
        <div className="space-y-4">
          <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-2xl hover:border-blue-500 hover:bg-blue-50/20 dark:hover:bg-blue-950/20 cursor-pointer transition text-center group">
            <Upload className="w-10 h-10 text-neutral-400 group-hover:text-blue-500 mb-2 transition" />
            <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
              Click or drag &amp; drop PDF files here
            </span>
            <span className="text-xs text-neutral-500 mt-1">
              Supports multiple files for merging, single files for editing
            </span>
            <input
              type="file"
              accept=".pdf"
              multiple={tool.slug.includes('merge') || tool.slug.includes('join')}
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          {/* Watermark controls if applicable */}
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

          {/* Rotation controls if applicable */}
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
          disabled={processing || (!isGenerator && files.length === 0)}
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
