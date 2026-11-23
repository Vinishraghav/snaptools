'use client';

import React, { useState, useEffect } from 'react';
import { ToolDef } from '@/data/toolsRegistry';
import Papa from 'papaparse';
import { Copy, Check, Download, Table, FileSpreadsheet, RefreshCw, BarChart3 } from 'lucide-react';

export default function DataEngine({ tool }: { tool: ToolDef }) {
  const [csvInput, setCsvInput] = useState(
    'id,name,role,salary,department\n1,Alice,Engineer,95000,Engineering\n2,Bob,Designer,82000,Product\n3,Charlie,Product Manager,110000,Product\n4,David,Data Scientist,105000,AI'
  );
  const [outputData, setOutputData] = useState('');
  const [copied, setCopied] = useState(false);
  const [mockCount, setMockCount] = useState(10);

  // Statistics calculation helper
  const calculateStats = (numbers: number[]) => {
    if (numbers.length === 0) return null;
    const sorted = [...numbers].sort((a, b) => a - b);
    const sum = sorted.reduce((acc, v) => acc + v, 0);
    const mean = sum / sorted.length;
    const median =
      sorted.length % 2 === 0
        ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
        : sorted[Math.floor(sorted.length / 2)];
    const variance = sorted.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / sorted.length;
    const stdDev = Math.sqrt(variance);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    return { count: sorted.length, sum, mean, median, variance, stdDev, min, max };
  };

  useEffect(() => {
    const slug = tool.slug;

    // 1. Mock Data Generator
    if (slug.includes('mock') || slug.includes('random')) {
      const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'Aarav', 'Priya', 'Rohan', 'Ananya'];
      const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Sharma', 'Patel', 'Verma', 'Gupta'];
      const domains = ['gmail.com', 'outlook.com', 'yahoo.com', 'company.io', 'techcorp.net'];
      const cities = ['New York', 'San Francisco', 'Bengaluru', 'London', 'Tokyo', 'Berlin', 'Mumbai'];

      const rows = [];
      rows.push(['id', 'fullName', 'email', 'city', 'signupDate', 'active']);

      for (let i = 1; i <= mockCount; i++) {
        const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
        const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
        const email = `${fn.toLowerCase()}.${ln.toLowerCase()}${Math.floor(Math.random() * 99)}@${domains[Math.floor(Math.random() * domains.length)]}`;
        const city = cities[Math.floor(Math.random() * cities.length)];
        const date = new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString().split('T')[0];
        const active = Math.random() > 0.3 ? 'true' : 'false';
        rows.push([i, `${fn} ${ln}`, email, city, date, active]);
      }

      const csv = Papa.unparse(rows);
      setOutputData(csv);
      return;
    }

    // 2. CSV to JSON
    if (slug.includes('csv-to-json') || slug.includes('csv') && slug.includes('json')) {
      const parsed = Papa.parse(csvInput.trim(), { header: true });
      setOutputData(JSON.stringify(parsed.data, null, 2));
      return;
    }

    // 3. JSON to CSV
    if (slug.includes('json-to-csv')) {
      try {
        const parsed = JSON.parse(csvInput.trim());
        const csv = Papa.unparse(parsed);
        setOutputData(csv);
      } catch {
        setOutputData('Please paste valid JSON array of objects.');
      }
      return;
    }

    // 4. CSV to Markdown Table
    if (slug.includes('markdown-table')) {
      const parsed = Papa.parse(csvInput.trim(), { header: false });
      const rows = parsed.data as string[][];
      if (rows.length > 0) {
        let md = '| ' + rows[0].join(' | ') + ' |\n';
        md += '| ' + rows[0].map(() => '---').join(' | ') + ' |\n';
        for (let i = 1; i < rows.length; i++) {
          if (rows[i].length === rows[0].length) {
            md += '| ' + rows[i].join(' | ') + ' |\n';
          }
        }
        setOutputData(md);
      }
      return;
    }

    // 5. CSV to SQL INSERT
    if (slug.includes('sql') || slug.includes('insert')) {
      const parsed = Papa.parse(csvInput.trim(), { header: true });
      const tableName = 'my_table';
      if (parsed.data.length > 0) {
        const statements = parsed.data.map((row) => {
          const cols = Object.keys(row as object).join(', ');
          const vals = Object.values(row as object)
            .map((v) => `'${String(v).replace(/'/g, "''")}'`)
            .join(', ');
          return `INSERT INTO ${tableName} (${cols}) VALUES (${vals});`;
        });
        setOutputData(statements.join('\n'));
      }
      return;
    }

    // 6. Statistical calculation
    if (slug.includes('deviation') || slug.includes('regression') || slug.includes('distribution') || slug.includes('test')) {
      const nums = csvInput
        .split(/[,\s\n]+/)
        .map(Number)
        .filter((n) => !isNaN(n));
      const stats = calculateStats(nums);
      if (stats) {
        setOutputData(
          `STATISTICAL ANALYSIS SUMMARY:\n` +
          `Count: ${stats.count}\n` +
          `Sum: ${stats.sum.toFixed(2)}\n` +
          `Mean (Average): ${stats.mean.toFixed(4)}\n` +
          `Median: ${stats.median.toFixed(4)}\n` +
          `Standard Deviation (σ): ${stats.stdDev.toFixed(4)}\n` +
          `Variance (σ²): ${stats.variance.toFixed(4)}\n` +
          `Min: ${stats.min}\n` +
          `Max: ${stats.max}\n` +
          `Range: ${(stats.max - stats.min).toFixed(4)}`
        );
      } else {
        setOutputData('Please provide numbers separated by commas, spaces, or newlines.');
      }
      return;
    }

    // Default: Pretty CSV
    setOutputData(csvInput);
  }, [csvInput, tool.slug, mockCount]);

  const handleDownload = () => {
    const isJson = outputData.trim().startsWith('{') || outputData.trim().startsWith('[');
    const blob = new Blob([outputData], { type: isJson ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tool.slug}-export.${isJson ? 'json' : 'csv'}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(outputData);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl space-y-6">
      {/* Mock data options */}
      {(tool.slug.includes('mock') || tool.slug.includes('random')) && (
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
          <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            Number of Rows:
          </label>
          <input
            type="number"
            min={1}
            max={500}
            value={mockCount}
            onChange={(e) => setMockCount(Number(e.target.value))}
            className="w-24 px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs font-mono"
          />
          <button
            onClick={() => setMockCount((c) => c)}
            className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition"
          >
            Regenerate
          </button>
        </div>
      )}

      {/* Editor Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
              <Table className="w-3.5 h-3.5 text-blue-500" /> Source Data (CSV / JSON / Numbers)
            </label>
            <button
              onClick={() => setCsvInput('')}
              className="text-xs text-neutral-400 hover:text-neutral-600"
            >
              Clear
            </button>
          </div>
          <textarea
            value={csvInput}
            onChange={(e) => setCsvInput(e.target.value)}
            rows={12}
            className="w-full p-4 rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            placeholder="Paste CSV rows, JSON array, or list of numbers..."
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" /> Transformed Output
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-medium flex items-center gap-1.5 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button
                onClick={handleDownload}
                className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 hover:bg-blue-100 text-xs font-medium flex items-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" /> Export
              </button>
            </div>
          </div>
          <textarea
            value={outputData}
            readOnly
            rows={12}
            className="w-full p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100/60 dark:bg-neutral-900/60 text-xs font-mono focus:outline-hidden"
          />
        </div>
      </div>
    </div>
  );
}
