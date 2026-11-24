'use client';

import React, { useState, useEffect } from 'react';
import { ToolDef } from '@/data/toolsRegistry';
import Papa from 'papaparse';
import * as yaml from 'js-yaml';
import { Copy, Check, Download, Table, FileSpreadsheet } from 'lucide-react';

function xmlNodeToObj(node: Element): unknown {
  const children = Array.from(node.children);
  if (children.length === 0) return node.textContent || '';
  const obj: Record<string, unknown> = {};
  for (const ch of children) {
    const val = xmlNodeToObj(ch);
    if (obj[ch.tagName] !== undefined) {
      obj[ch.tagName] = Array.isArray(obj[ch.tagName])
        ? [...(obj[ch.tagName] as unknown[]), val]
        : [obj[ch.tagName], val];
    } else {
      obj[ch.tagName] = val;
    }
  }
  return obj;
}

function objToXml(val: unknown, tagName = 'root'): string {
  if (Array.isArray(val)) {
    return val.map((item) => objToXml(item, 'item')).join('\n');
  }
  if (val !== null && typeof val === 'object') {
    const inner = Object.entries(val as Record<string, unknown>)
      .map(([k, v]) => objToXml(v, k.replace(/[^a-zA-Z0-9_-]/g, '_')))
      .join('\n');
    return `<${tagName}>\n${inner}\n</${tagName}>`;
  }
  return `<${tagName}>${String(val ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')}</${tagName}>`;
}

function generateLuhnCard(prefix = '4532'): string {
  const digits = prefix.split('').map(Number);
  while (digits.length < 15) digits.push(Math.floor(Math.random() * 10));
  let sum = 0;
  for (let i = 0; i < 15; i++) {
    let d = digits[14 - i];
    if (i % 2 === 0) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  digits.push((10 - (sum % 10)) % 10);
  return digits.join('').replace(/(\d{4})/g, '$1 ').trim();
}

export default function DataEngine({ tool }: { tool: ToolDef }) {
  const spec = (tool.spec ?? {}) as Record<string, unknown>;
  const specMockCount = typeof spec.mockCount === 'number' ? spec.mockCount : 10;

  const [csvInput, setCsvInput] = useState(
    'id,name,role,salary,department\n1,Alice,Engineer,95000,Engineering\n2,Bob,Designer,82000,Product\n3,Charlie,Product Manager,110000,Product\n4,David,Data Scientist,105000,AI'
  );
  const [outputData, setOutputData] = useState('');
  const [copied, setCopied] = useState(false);
  const [mockCount, setMockCount] = useState(specMockCount);
  const [regenTick, setRegenTick] = useState(0);

  useEffect(() => {
    setMockCount(typeof spec.mockCount === 'number' ? spec.mockCount : 10);
  }, [tool.slug, spec.mockCount]);

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
    return {
      count: sorted.length,
      sum,
      mean,
      median,
      variance,
      stdDev,
      min: sorted[0],
      max: sorted[sorted.length - 1],
    };
  };

  useEffect(() => {
    const slug = tool.slug;

    if (slug.includes('credit-card')) {
      const cards = Array.from({ length: Math.min(50, Math.max(1, mockCount)) }, (_, i) => {
        const type = i % 2 === 0 ? { brand: 'Visa (Test)', pre: '4532' } : { brand: 'Mastercard (Test)', pre: '5425' };
        return `${type.brand}: ${generateLuhnCard(type.pre)} | Exp: 12/29 | CVV: ${100 + ((i * 73) % 899)}`;
      });
      setOutputData(
        `SYNTHETIC LUHN-VALID TEST CARDS (SANDBOX / QA TESTING ONLY):\n\n${cards.join('\n')}`
      );
      return;
    }

    if (slug.includes('mock') || slug.includes('random')) {
      const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Aarav', 'Priya', 'Rohan', 'Ananya'];
      const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Sharma', 'Patel', 'Verma', 'Gupta'];
      const domains = ['gmail.com', 'outlook.com', 'company.io', 'example.org'];
      const cities = ['New York', 'San Francisco', 'Bengaluru', 'London', 'Tokyo', 'Berlin', 'Mumbai'];

      const rows: (string | number)[][] = [['id', 'fullName', 'email', 'city', 'active']];
      for (let i = 1; i <= Math.min(200, Math.max(1, mockCount)); i++) {
        const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
        const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
        const email = `${fn.toLowerCase()}.${ln.toLowerCase()}${Math.floor(Math.random() * 99)}@${domains[Math.floor(Math.random() * domains.length)]}`;
        const city = cities[Math.floor(Math.random() * cities.length)];
        rows.push([i, `${fn} ${ln}`, email, city, Math.random() > 0.3 ? 'true' : 'false']);
      }
      setOutputData(Papa.unparse(rows));
      return;
    }

    if (slug.includes('yaml-to-json')) {
      try {
        const parsed = yaml.load(csvInput);
        setOutputData(JSON.stringify(parsed, null, 2));
      } catch (e) {
        setOutputData(`YAML Parse Error: ${(e as Error).message}`);
      }
      return;
    }

    if (slug.includes('json-to-yaml')) {
      try {
        const parsed = JSON.parse(csvInput.trim());
        setOutputData(yaml.dump(parsed));
      } catch {
        setOutputData('Paste valid JSON on the left to convert to YAML.');
      }
      return;
    }

    if (slug.includes('xml-to-json')) {
      try {
        const doc = new DOMParser().parseFromString(csvInput.trim(), 'application/xml');
        const err = doc.querySelector('parsererror');
        if (err) {
          setOutputData('Paste valid XML on the left (e.g., <users><user><name>Alice</name></user></users>).');
        } else {
          setOutputData(JSON.stringify({ [doc.documentElement.tagName]: xmlNodeToObj(doc.documentElement) }, null, 2));
        }
      } catch {
        setOutputData('Paste valid XML to convert to JSON.');
      }
      return;
    }

    if (slug.includes('json-to-xml')) {
      try {
        const parsed = JSON.parse(csvInput.trim());
        setOutputData(`<?xml version="1.0" encoding="UTF-8"?>\n${objToXml(parsed, 'root')}`);
      } catch {
        setOutputData('Paste valid JSON on the left to convert to XML.');
      }
      return;
    }

    if (slug.includes('env-file-to-json') || slug.includes('ini-to-json') || slug.includes('toml-to-json')) {
      const obj: Record<string, string> = {};
      for (const line of csvInput.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith(';') || trimmed.startsWith('[')) continue;
        const eq = trimmed.indexOf('=');
        if (eq > 0) {
          const k = trimmed.slice(0, eq).trim();
          const v = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
          obj[k] = v;
        }
      }
      setOutputData(JSON.stringify(obj, null, 2));
      return;
    }

    if (slug.includes('json-to-env')) {
      try {
        const parsed = JSON.parse(csvInput.trim()) as Record<string, unknown>;
        setOutputData(Object.entries(parsed).map(([k, v]) => `${k}=${String(v)}`).join('\n'));
      } catch {
        setOutputData('Paste a flat JSON object (e.g., {"PORT": 3000, "NODE_ENV": "production"}).');
      }
      return;
    }

    if (slug.includes('csv-to-json') || (slug.includes('csv') && slug.includes('json'))) {
      const parsed = Papa.parse(csvInput.trim(), { header: true });
      setOutputData(JSON.stringify(parsed.data, null, 2));
      return;
    }

    if (slug.includes('json-to-csv')) {
      try {
        const parsed = JSON.parse(csvInput.trim());
        setOutputData(Papa.unparse(parsed));
      } catch {
        setOutputData('Please paste valid JSON array of objects.');
      }
      return;
    }

    if (slug.includes('html-table')) {
      const rows = Papa.parse(csvInput.trim(), { header: false }).data as string[][];
      if (rows.length > 0) {
        const th = rows[0].map((c) => `      <th>${c}</th>`).join('\n');
        const trs = rows
          .slice(1)
          .map((r) => `    <tr>\n${r.map((c) => `      <td>${c}</td>`).join('\n')}\n    </tr>`)
          .join('\n');
        setOutputData(`<table>\n  <thead>\n    <tr>\n${th}\n    </tr>\n  </thead>\n  <tbody>\n${trs}\n  </tbody>\n</table>`);
      }
      return;
    }

    if (slug.includes('latex-table')) {
      const rows = Papa.parse(csvInput.trim(), { header: false }).data as string[][];
      if (rows.length > 0) {
        const cols = rows[0].map(() => 'l').join(' | ');
        const lines = rows.map((r) => `  ${r.join(' & ')} \\\\ \\hline`).join('\n');
        setOutputData(`\\begin{tabular}{| ${cols} |}\n  \\hline\n${lines}\n\\end{tabular}`);
      }
      return;
    }

    if (slug.includes('markdown-table') || slug.includes('ascii-text-table')) {
      const rows = Papa.parse(csvInput.trim(), { header: false }).data as string[][];
      if (rows.length > 0) {
        let md = '| ' + rows[0].join(' | ') + ' |\n';
        md += '| ' + rows[0].map(() => '---').join(' | ') + ' |\n';
        for (let i = 1; i < rows.length; i++) {
          if (rows[i].length === rows[0].length) md += '| ' + rows[i].join(' | ') + ' |\n';
        }
        setOutputData(md);
      }
      return;
    }

    if (slug.includes('tsv-to-csv')) {
      const parsed = Papa.parse(csvInput.trim(), { delimiter: '\t' });
      setOutputData(Papa.unparse(parsed.data as string[][]));
      return;
    }

    if (slug.includes('csv-to-tsv')) {
      const parsed = Papa.parse(csvInput.trim());
      setOutputData((parsed.data as string[][]).map((r) => r.join('\t')).join('\n'));
      return;
    }

    if (slug.includes('duplicate-row')) {
      const lines = csvInput.trim().split(/\r?\n/);
      setOutputData(Array.from(new Set(lines)).join('\n'));
      return;
    }

    if (slug.includes('transpose')) {
      const rows = Papa.parse(csvInput.trim(), { header: false }).data as string[][];
      if (rows.length > 0) {
        const transposed = rows[0].map((_, col) => rows.map((row) => row[col] ?? ''));
        setOutputData(Papa.unparse(transposed));
      }
      return;
    }

    if (slug.includes('sql') || slug.includes('insert')) {
      const parsed = Papa.parse(csvInput.trim(), { header: true });
      const tableName = 'my_table';
      if (parsed.data.length > 0) {
        const statements = parsed.data.map((row) => {
          const cols = Object.keys(row as object).join(', ');
          const vals = Object.values(row as object).map((v) => `'${String(v).replace(/'/g, "''")}'`).join(', ');
          return `INSERT INTO ${tableName} (${cols}) VALUES (${vals});`;
        });
        setOutputData(statements.join('\n'));
      }
      return;
    }

    if (slug.includes('deviation') || slug.includes('regression') || slug.includes('distribution') || slug.includes('test')) {
      const nums = csvInput.split(/[,\s\n]+/).map(Number).filter((n) => !isNaN(n));
      const stats = calculateStats(nums);
      if (stats) {
        setOutputData(
          `STATISTICAL ANALYSIS SUMMARY:\nCount: ${stats.count}\nSum: ${stats.sum.toFixed(2)}\nMean: ${stats.mean.toFixed(4)}\nMedian: ${stats.median.toFixed(4)}\nStd Dev: ${stats.stdDev.toFixed(4)}\nVariance: ${stats.variance.toFixed(4)}\nMin: ${stats.min}\nMax: ${stats.max}`
        );
      } else {
        setOutputData('Provide numbers separated by commas, spaces, or newlines.');
      }
      return;
    }

    setOutputData(csvInput);
  }, [csvInput, tool.slug, mockCount, regenTick]);

  const handleDownload = () => {
    const isJson = outputData.trim().startsWith('{') || outputData.trim().startsWith('[');
    const blob = new Blob([outputData], { type: isJson ? 'application/json' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tool.slug}-export.${isJson ? 'json' : 'txt'}`;
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
      {(typeof spec.mockCount === 'number' || tool.slug.includes('mock') || tool.slug.includes('random') || tool.slug.includes('credit-card')) && (
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
          <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            Count / Rows:
          </label>
          <input
            type="number"
            min={1}
            max={200}
            value={mockCount}
            onChange={(e) => setMockCount(Number(e.target.value))}
            className="w-24 px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs font-mono"
          />
          <button
            onClick={() => setRegenTick((t) => t + 1)}
            className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition"
          >
            Regenerate
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
              <Table className="w-3.5 h-3.5 text-blue-500" /> Source Data
            </label>
            <button onClick={() => setCsvInput('')} className="text-xs text-neutral-400 hover:text-neutral-600">
              Clear
            </button>
          </div>
          <textarea
            value={csvInput}
            onChange={(e) => setCsvInput(e.target.value)}
            rows={12}
            className="w-full p-4 rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            placeholder="Paste CSV, JSON, XML, YAML, ENV, or INI input..."
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
