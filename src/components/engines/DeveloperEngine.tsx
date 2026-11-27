'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { ToolDef } from '@/data/toolsRegistry';
import { TOTAL_TOOLS_COUNT } from '@/data/catalogMeta';
import { SITE_URL } from '@/lib/siteConfig';
import * as yaml from 'js-yaml';
import {
  Copy,
  Check,
  Code2,
  Terminal,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Minimize2,
} from 'lucide-react';

const SAMPLES: Record<string, string> = {
  json: `{\n  "name": "SnapTools",\n  "count": ${TOTAL_TOOLS_COUNT},\n  "clientSide": true,\n  "categories": ["pdf", "image", "dev"]\n}`,
  sql: 'select id, name, department, salary from employees where status = "active" and salary > 50000 order by salary desc limit 25;',
  html: '<div class="card"><h2>SnapTools</h2><p>Fast <strong>client-side</strong> web utilities.</p></div>',
  xml: '<catalog><tool id="1"><name>JSON Formatter</name><category>Developer</category></tool></catalog>',
  css: '.card{display:flex;align-items:center;padding:16px;border-radius:12px;background:#fff}',
  js: 'function greet(name) { const msg = "Hello, " + name; return msg; }',
  yaml: 'name: SnapTools\nversion: 2.0\nfeatures:\n  - Client-side\n  - Privacy-first',
  markdown: '# SnapTools Guide\n\n**100% Client-Side** utilities with zero uploads.\n\n- Fast execution\n- Offline capable',
  curl: 'curl -X GET "https://api.example.com/v1/tools" -H "Accept: application/json"',
};

function getInitialSample(slug: string): string {
  if (slug.includes('sql')) return SAMPLES.sql;
  if (slug.includes('xml')) return SAMPLES.xml;
  if (slug.includes('html') && !slug.includes('entity')) return SAMPLES.html;
  if (slug.includes('css')) return SAMPLES.css;
  if (slug.includes('javascript') || slug.includes('js-')) return SAMPLES.js;
  if (slug.includes('yaml') && !slug.includes('json-to-yaml')) return SAMPLES.yaml;
  if (slug.includes('markdown')) return SAMPLES.markdown;
  if (slug.includes('curl')) return SAMPLES.curl;
  if (slug.includes('regex')) return `Test input: ABCDE1234F | dev@snaptool.me | ${SITE_URL} | +91-9876543210 | 2026-11-25 | #f3f4f6 | 192.168.1.1`;
  return SAMPLES.json;
}

function formatMarkup(raw: string): string {
  const formatted = raw
    .replace(/>\s*</g, '><')
    .replace(/(<[^/][^>]*>)/g, '\n$1')
    .replace(/(<\/[^>]+>)/g, '$1\n')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  let indent = 0;
  return formatted
    .map((line) => {
      if (line.startsWith('</')) indent = Math.max(0, indent - 1);
      const out = `${'  '.repeat(indent)}${line}`;
      if (line.startsWith('<') && !line.startsWith('</') && !line.endsWith('/>') && !line.includes('</')) {
        indent++;
      }
      return out;
    })
    .join('\n');
}

function formatSql(sql: string, minify: boolean): string {
  if (minify) return sql.replace(/\s+/g, ' ').trim();
  const keywords = ['SELECT', 'FROM', 'WHERE', 'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'JOIN', 'ON', 'AND', 'OR', 'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT', 'VALUES', 'SET'];
  let res = sql.replace(/\s+/g, ' ').trim();
  for (const kw of keywords) {
    res = res.replace(new RegExp(`\\b${kw}\\b`, 'gi'), `\n${kw}`);
  }
  return res.trim();
}

function formatCss(css: string, minify: boolean): string {
  if (minify) {
    return css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s*([{}:;,])\s*/g, '$1').replace(/;}/g, '}').trim();
  }
  return css
    .replace(/\s*\{\s*/g, ' {\n  ')
    .replace(/;\s*/g, ';\n  ')
    .replace(/\s*\}\s*/g, '\n}\n\n')
    .replace(/  \n}/g, '}')
    .trim();
}

export default function DeveloperEngine({ tool }: { tool: ToolDef }) {
  const spec = (tool.spec ?? {}) as Record<string, unknown>;
  const specRegex = typeof spec.regexPattern === 'string'
    ? spec.regexPattern
    : '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-z]{2,}';
  const specActionMode: 'format' | 'minify' =
    spec.mode === 'minify' || spec.mode === 'format'
      ? spec.mode
      : tool.slug.includes('minif')
        ? 'minify'
        : 'format';

  const [inputCode, setInputCode] = useState(() => getInitialSample(tool.slug));
  const [outputCode, setOutputCode] = useState('');
  const [error, setError] = useState('');
  const [validBanner, setValidBanner] = useState('');
  const [copied, setCopied] = useState(false);
  const [regexPattern, setRegexPattern] = useState(specRegex);
  const [regexFlags, setRegexFlags] = useState('gi');
  const [actionMode, setActionMode] = useState<'format' | 'minify'>(specActionMode);
  const [activeKey, setActiveKey] = useState<{ key: string; code: string; keyCode: number } | null>(null);

  useEffect(() => {
    setInputCode(getInitialSample(tool.slug));
    setRegexPattern(
      typeof spec.regexPattern === 'string'
        ? spec.regexPattern
        : '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-z]{2,}'
    );
    setActionMode(
      spec.mode === 'minify' || spec.mode === 'format'
        ? spec.mode
        : tool.slug.includes('minif')
          ? 'minify'
          : 'format'
    );
  }, [tool.slug, spec.regexPattern, spec.mode]);

  useEffect(() => {
    if (tool.slug.includes('keycode')) {
      const handleKeyDown = (e: KeyboardEvent) => {
        setActiveKey({ key: e.key, code: e.code, keyCode: e.keyCode });
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [tool.slug]);

  const runTransform = useCallback(
    (override?: 'format' | 'minify' | 'validate') => {
      setError('');
      setValidBanner('');
      const slug = tool.slug;
      const mode = override === 'format' || override === 'minify' ? override : actionMode;

      try {
        if (!inputCode.trim() && !slug.includes('gitignore') && !slug.includes('user-agent')) {
          setOutputCode('');
          return;
        }

        if (slug.includes('regex')) {
          const re = new RegExp(regexPattern, regexFlags);
          const matches = Array.from(inputCode.matchAll(re.global ? re : new RegExp(regexPattern, regexFlags + 'g')));
          setOutputCode(
            matches.length > 0
              ? `Found ${matches.length} match(es):\n\n` + matches.map((m, i) => `${i + 1}. "${m[0]}" (index ${m.index})`).join('\n')
              : 'No matches found for this pattern.'
          );
          if (override === 'validate') setValidBanner('Regular expression syntax is valid!');
        } else if (slug.includes('json')) {
          if (slug.includes('typescript')) {
            const parsed = JSON.parse(inputCode);
            let ts = 'export interface GeneratedInterface {\n';
            for (const [k, v] of Object.entries(parsed)) {
              const type = Array.isArray(v) ? `${typeof v[0]}[]` : typeof v;
              ts += `  ${k}: ${type};\n`;
            }
            ts += '}';
            setOutputCode(ts);
          } else if (slug.includes('yaml')) {
            if (slug.includes('json-to-yaml')) {
              setOutputCode(yaml.dump(JSON.parse(inputCode)));
            } else {
              setOutputCode(JSON.stringify(yaml.load(inputCode), null, 2));
            }
          } else {
            const parsed = JSON.parse(inputCode);
            setOutputCode(mode === 'minify' ? JSON.stringify(parsed) : JSON.stringify(parsed, null, 2));
            if (override === 'validate') setValidBanner('Valid JSON syntax confirmed!');
          }
        } else if (slug.includes('sql')) {
          setOutputCode(formatSql(inputCode, mode === 'minify'));
        } else if (slug.includes('xml')) {
          const parsedXml = new DOMParser().parseFromString(inputCode.trim(), 'application/xml');
          const err = parsedXml.querySelector('parsererror');
          if (err) throw new Error(err.textContent || 'Invalid XML markup');
          setOutputCode(
            mode === 'minify'
              ? inputCode.replace(/>\s+</g, '><').replace(/\s+/g, ' ').trim()
              : formatMarkup(inputCode)
          );
          if (override === 'validate') setValidBanner('Valid XML syntax confirmed!');
        } else if (slug.includes('html') && slug.includes('entity')) {
          if (slug.includes('decode')) {
            const txt = document.createElement('textarea');
            txt.innerHTML = inputCode;
            setOutputCode(txt.value);
          } else {
            setOutputCode(inputCode.replace(/[\u00A0-\u9999<>&]/g, (i) => `&#${i.charCodeAt(0)};`));
          }
        } else if (slug.includes('html')) {
          setOutputCode(
            mode === 'minify'
              ? inputCode.replace(/<!--[\s\S]*?-->/g, '').replace(/>\s+</g, '><').replace(/\s+/g, ' ').trim()
              : formatMarkup(inputCode)
          );
        } else if (slug.includes('css')) {
          setOutputCode(formatCss(inputCode, mode === 'minify'));
        } else if (slug.includes('javascript') || slug.includes('js-')) {
          setOutputCode(
            mode === 'minify'
              ? inputCode.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').trim()
              : inputCode.replace(/;\s*/g, ';\n').replace(/\{\s*/g, ' {\n  ').replace(/\s*\}/g, '\n}').trim()
          );
        } else if (slug.includes('yaml')) {
          setOutputCode(yaml.dump(yaml.load(inputCode)));
        } else if (slug.includes('jwt')) {
          const parts = inputCode.trim().split('.');
          if (parts.length >= 2) {
            const header = JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')));
            const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
            setOutputCode(`HEADER:\n${JSON.stringify(header, null, 2)}\n\nPAYLOAD:\n${JSON.stringify(payload, null, 2)}`);
          } else {
            setOutputCode('Paste a valid JWT token (header.payload.signature)');
          }
        } else if (slug.includes('base64')) {
          setOutputCode(
            slug.includes('decode')
              ? decodeURIComponent(escape(atob(inputCode.trim())))
              : btoa(unescape(encodeURIComponent(inputCode)))
          );
        } else if (slug.includes('url-encoder') || slug.includes('url-decode')) {
          setOutputCode(slug.includes('decode') ? decodeURIComponent(inputCode) : encodeURIComponent(inputCode));
        } else if (slug.includes('curl') && slug.includes('fetch')) {
          const urlMatch = inputCode.match(/curl\s+(?:-X\s+[A-Z]+\s+)?['"]?([^'"]+)['"]?/);
          const url = urlMatch ? urlMatch[1] : 'https://api.example.com/data';
          setOutputCode(`fetch("${url}", {\n  method: "GET",\n  headers: { "Content-Type": "application/json" }\n}).then(res => res.json());`);
        } else if (slug.includes('gitignore')) {
          setOutputCode(`# Node.js\nnode_modules/\n.next/\ndist/\n\n# Env\n.env*\n\n# OS\n.DS_Store\nThumbs.db`);
        } else if (slug.includes('user-agent')) {
          if (typeof window !== 'undefined') {
            setOutputCode(`User-Agent:\n${navigator.userAgent}\n\nPlatform: ${navigator.platform}\nLanguage: ${navigator.language}`);
          }
        } else if (slug.includes('markdown')) {
          const html = inputCode
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/gim, '<em>$1</em>')
            .replace(/^- (.*$)/gim, '<li>$1</li>');
          setOutputCode(html);
        } else {
          setOutputCode(mode === 'minify' ? inputCode.replace(/\s+/g, ' ').trim() : inputCode.trim());
        }
      } catch (e: unknown) {
        setOutputCode('');
        setValidBanner('');
        setError((e as Error).message);
      }
    },
    [inputCode, tool.slug, actionMode, regexPattern, regexFlags]
  );

  useEffect(() => {
    runTransform();
  }, [runTransform]);

  const handleCopy = () => {
    if (!outputCode) return;
    navigator.clipboard.writeText(outputCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const supportsFormatMinify =
    (tool.slug.includes('json') && !tool.slug.includes('typescript') && !tool.slug.includes('yaml')) ||
    tool.slug.includes('sql') ||
    tool.slug.includes('xml') ||
    (tool.slug.includes('html') && !tool.slug.includes('entity')) ||
    tool.slug.includes('css') ||
    tool.slug.includes('javascript');

  return (
    <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl space-y-6">
      {tool.slug.includes('keycode') && (
        <div className="p-8 rounded-2xl bg-neutral-900 text-white flex flex-col items-center justify-center text-center space-y-3">
          <div className="text-xs uppercase text-neutral-400 font-mono tracking-wider">Press any key on your keyboard</div>
          <div className="text-6xl font-black text-blue-400 font-mono">{activeKey ? activeKey.keyCode : '00'}</div>
          <div className="flex gap-4 text-xs font-mono text-neutral-300">
            <span>Key: &ldquo;{activeKey?.key || 'None'}&rdquo;</span>
            <span>Code: {activeKey?.code || 'None'}</span>
          </div>
        </div>
      )}

      {tool.slug.includes('regex') && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">Regular Expression Pattern</label>
            <input
              type="text"
              value={regexPattern}
              onChange={(e) => setRegexPattern(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">Flags</label>
            <input
              type="text"
              value={regexFlags}
              onChange={(e) => setRegexFlags(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-mono"
            />
          </div>
        </div>
      )}

      {supportsFormatMinify && (
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setActionMode('format');
              runTransform('format');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
              actionMode === 'format'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> Format
          </button>
          <button
            type="button"
            onClick={() => {
              setActionMode('minify');
              runTransform('minify');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
              actionMode === 'minify'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
            }`}
          >
            <Minimize2 className="w-3.5 h-3.5" /> Minify
          </button>
          <button
            type="button"
            onClick={() => runTransform('validate')}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 flex items-center gap-1.5 transition"
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Validate
          </button>
          <button
            type="button"
            onClick={() => setInputCode(getInitialSample(tool.slug))}
            className="px-3 py-2 rounded-xl text-xs font-medium text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition ml-auto"
          >
            Load Sample
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5 text-blue-500" /> Input Payload / Code
            </label>
            <button
              type="button"
              onClick={() => {
                setInputCode('');
                setOutputCode('');
                setError('');
              }}
              className="text-xs text-neutral-400 hover:text-neutral-600"
            >
              Clear
            </button>
          </div>
          <textarea
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            rows={12}
            className="w-full p-4 rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            placeholder="Paste code or payload here..."
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-emerald-500" /> Output / Formatted Result
            </label>
            <button
              type="button"
              onClick={handleCopy}
              disabled={!outputCode}
              className="px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-40 text-xs font-medium flex items-center gap-1.5 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <textarea
            value={outputCode}
            readOnly
            rows={12}
            placeholder={error ? 'Fix syntax error on the left to generate output...' : 'Formatted output will appear here...'}
            className="w-full p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100/60 dark:bg-neutral-900/60 text-xs font-mono focus:outline-hidden"
          />
        </div>
      </div>

      {validBanner && !error && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {validBanner}
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          Syntax Error: {error}
        </div>
      )}
    </div>
  );
}
