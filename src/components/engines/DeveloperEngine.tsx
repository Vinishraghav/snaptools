'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ToolDef } from '@/data/toolsRegistry';
import * as yaml from 'js-yaml';
import { Copy, Check, Code2, Terminal, AlertCircle, CheckCircle2, Sparkles, Minimize2 } from 'lucide-react';

const SAMPLE_JSON =
  '{\n  "name": "SnapTools",\n  "count": 1005,\n  "clientSide": true,\n  "categories": ["pdf", "image", "dev"]\n}';

export default function DeveloperEngine({ tool }: { tool: ToolDef }) {
  const [inputCode, setInputCode] = useState(SAMPLE_JSON);
  const [outputCode, setOutputCode] = useState('');
  const [error, setError] = useState('');
  const [validBanner, setValidBanner] = useState('');
  const [copied, setCopied] = useState(false);
  const [jsonAction, setJsonAction] = useState<'format' | 'minify'>(
    tool.slug.includes('minify') ? 'minify' : 'format'
  );
  const [activeKey, setActiveKey] = useState<{
    key: string;
    code: string;
    keyCode: number;
  } | null>(null);

  useEffect(() => {
    setJsonAction(tool.slug.includes('minify') ? 'minify' : 'format');
  }, [tool.slug]);

  // Keycode listener if keycode tool
  useEffect(() => {
    if (tool.slug.includes('keycode')) {
      const handleKeyDown = (e: KeyboardEvent) => {
        setActiveKey({
          key: e.key,
          code: e.code,
          keyCode: e.keyCode,
        });
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [tool.slug]);

  const runTransform = useCallback(
    (modeOverride?: 'format' | 'minify' | 'validate') => {
      setError('');
      setValidBanner('');
      const slug = tool.slug;
      const effectiveMode =
        modeOverride === 'format' || modeOverride === 'minify'
          ? modeOverride
          : jsonAction;

      try {
        if (!inputCode.trim() && !slug.includes('gitignore') && !slug.includes('user-agent')) {
          setOutputCode('');
          return;
        }

        // 1. JSON tools
        if (slug.includes('json')) {
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
              const parsed = JSON.parse(inputCode);
              setOutputCode(yaml.dump(parsed));
            } else {
              const parsed = yaml.load(inputCode);
              setOutputCode(JSON.stringify(parsed, null, 2));
            }
          } else if (effectiveMode === 'minify') {
            const parsed = JSON.parse(inputCode);
            setOutputCode(JSON.stringify(parsed));
            if (modeOverride === 'validate') setValidBanner('Valid JSON (Minified)');
          } else {
            const parsed = JSON.parse(inputCode);
            setOutputCode(JSON.stringify(parsed, null, 2));
            if (modeOverride === 'validate') setValidBanner('Valid JSON syntax confirmed!');
          }
        }
        // 2. YAML Formatter
        else if (slug.includes('yaml')) {
          const loaded = yaml.load(inputCode);
          setOutputCode(yaml.dump(loaded));
        }
        // 3. JWT Decoder
        else if (slug.includes('jwt')) {
          const parts = inputCode.trim().split('.');
          if (parts.length >= 2) {
            const header = JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')));
            const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
            setOutputCode(
              `HEADER:\n${JSON.stringify(header, null, 2)}\n\nPAYLOAD:\n${JSON.stringify(payload, null, 2)}`
            );
          } else {
            setOutputCode('Paste a valid JWT token (header.payload.signature)');
          }
        }
        // 4. Base64
        else if (slug.includes('base64')) {
          if (slug.includes('decode')) {
            setOutputCode(decodeURIComponent(escape(atob(inputCode.trim()))));
          } else {
            setOutputCode(btoa(unescape(encodeURIComponent(inputCode))));
          }
        }
        // 5. URL Encode / Decode
        else if (slug.includes('url-encoder') || slug.includes('url-decode')) {
          if (slug.includes('decode')) {
            setOutputCode(decodeURIComponent(inputCode));
          } else {
            setOutputCode(encodeURIComponent(inputCode));
          }
        }
        // 6. HTML Entities
        else if (slug.includes('html-entity')) {
          if (slug.includes('decode')) {
            const txt = document.createElement('textarea');
            txt.innerHTML = inputCode;
            setOutputCode(txt.value);
          } else {
            setOutputCode(
              inputCode.replace(/[\u00A0-\u9999<>&]/g, (i) => `&#${i.charCodeAt(0)};`)
            );
          }
        }
        // 7. cURL to Fetch
        else if (slug.includes('curl') && slug.includes('fetch')) {
          const urlMatch = inputCode.match(/curl\s+(?:-X\s+[A-Z]+\s+)?['"]?([^'"]+)['"]?/);
          const url = urlMatch ? urlMatch[1] : 'https://api.example.com/data';
          setOutputCode(
            `fetch("${url}", {\n  method: "GET",\n  headers: {\n    "Content-Type": "application/json"\n  }\n})\n  .then(res => res.json())\n  .then(data => console.log(data));`
          );
        }
        // 8. .gitignore Generator
        else if (slug.includes('gitignore')) {
          setOutputCode(
            `# Node.js\nnode_modules/\n.next/\nbuild/\ndist/\n\n# Environment\n.env\n.env.local\n*.env*\n\n# OS & Logs\n.DS_Store\nThumbs.db\nnpm-debug.log*\nyarn-error.log*`
          );
        }
        // 9. User Agent
        else if (slug.includes('user-agent')) {
          if (typeof window !== 'undefined') {
            setOutputCode(
              `Current Browser User-Agent:\n${navigator.userAgent}\n\nPlatform: ${navigator.platform}\nLanguage: ${navigator.language}\nCookies Enabled: ${navigator.cookieEnabled}`
            );
          }
        }
        // Default formatting
        else {
          setOutputCode(inputCode.trim());
        }
      } catch (e: unknown) {
        setOutputCode('');
        setValidBanner('');
        setError((e as Error).message);
      }
    },
    [inputCode, tool.slug, jsonAction]
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

  const isPureJson =
    tool.slug.includes('json') &&
    !tool.slug.includes('typescript') &&
    !tool.slug.includes('yaml');

  return (
    <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl space-y-6">
      {/* Keycode special visualizer */}
      {tool.slug.includes('keycode') && (
        <div className="p-8 rounded-2xl bg-neutral-900 text-white flex flex-col items-center justify-center text-center space-y-3">
          <div className="text-xs uppercase text-neutral-400 font-mono tracking-wider">
            Press any key on your keyboard
          </div>
          <div className="text-6xl font-black text-blue-400 font-mono">
            {activeKey ? activeKey.keyCode : '00'}
          </div>
          <div className="flex gap-4 text-xs font-mono text-neutral-300">
            <span>Key: &ldquo;{activeKey?.key || 'None'}&rdquo;</span>
            <span>Code: {activeKey?.code || 'None'}</span>
          </div>
        </div>
      )}

      {/* Action Buttons Bar for JSON Tools */}
      {isPureJson && (
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setJsonAction('format');
              runTransform('format');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
              jsonAction === 'format'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> Format
          </button>
          <button
            type="button"
            onClick={() => {
              setJsonAction('minify');
              runTransform('minify');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
              jsonAction === 'minify'
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
            onClick={() => setInputCode(SAMPLE_JSON)}
            className="px-3 py-2 rounded-xl text-xs font-medium text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition ml-auto"
          >
            Load Sample
          </button>
        </div>
      )}

      {/* Code Editor Panels */}
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
            placeholder="Paste code or JSON payload here..."
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
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
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

      {/* Valid alert */}
      {validBanner && !error && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {validBanner}
        </div>
      )}

      {/* Error alert */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          Syntax Error: {error}
        </div>
      )}
    </div>
  );
}
