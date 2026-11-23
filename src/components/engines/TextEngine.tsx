'use client';

import React, { useState, useEffect } from 'react';
import { ToolDef } from '@/data/toolsRegistry';
import { Copy, Check, Volume2, Mic, RefreshCw, Type, FileText } from 'lucide-react';

export default function TextEngine({ tool }: { tool: ToolDef }) {
  const [inputText, setInputText] = useState(
    'The quick brown fox jumps over the lazy dog. Fast, secure, and 100% client-side text processing.'
  );
  const [outputText, setOutputText] = useState('');
  const [copied, setCopied] = useState(false);
  const [findStr, setFindStr] = useState('');
  const [replaceStr, setReplaceStr] = useState('');
  const [loremCount, setLoremCount] = useState(3);
  const [prefixStr, setPrefixStr] = useState('> ');
  const [shiftCount, setShiftCount] = useState(3);

  // Dynamic metrics
  const charCount = inputText.length;
  const wordCount = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;
  const lineCount = inputText ? inputText.split(/\r\n|\r|\n/).length : 0;
  const readingTime = Math.ceil(wordCount / 200);

  useEffect(() => {
    const slug = tool.slug;
    let res = '';

    // Case Converters
    if (slug.includes('uppercase')) {
      res = inputText.toUpperCase();
    } else if (slug.includes('lowercase')) {
      res = inputText.toLowerCase();
    } else if (slug.includes('title-case')) {
      res = inputText.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
    } else if (slug.includes('sentence-case')) {
      res = inputText.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase());
    } else if (slug.includes('camelcase')) {
      res = inputText
        .replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase())
        .replace(/^[A-Z]/, (c) => c.toLowerCase());
    } else if (slug.includes('snake-case')) {
      res = inputText.trim().toLowerCase().replace(/[\s\W]+/g, '_').replace(/^_+|_+$/g, '');
    } else if (slug.includes('kebab-case')) {
      res = inputText.trim().toLowerCase().replace(/[\s\W]+/g, '-').replace(/^-+|-+$/g, '');
    } else if (slug.includes('pascalcase')) {
      res = inputText
        .replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase())
        .replace(/^[a-z]/, (c) => c.toUpperCase());
    } else if (slug.includes('spongebob')) {
      res = inputText
        .split('')
        .map((c, i) => (i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()))
        .join('');
    }
    // Line manipulations
    else if (slug.includes('duplicate-line')) {
      const lines = inputText.split(/\r?\n/);
      res = Array.from(new Set(lines)).join('\n');
    } else if (slug.includes('alphabetical-line') || (slug.includes('sort') && slug.includes('a-z'))) {
      const lines = inputText.split(/\r?\n/);
      res = lines.sort((a, b) => a.localeCompare(b)).join('\n');
    } else if (slug.includes('reverse-line') || (slug.includes('sort') && slug.includes('z-a'))) {
      const lines = inputText.split(/\r?\n/);
      res = lines.sort((a, b) => b.localeCompare(a)).join('\n');
    } else if (slug.includes('random-line-shuffler')) {
      const lines = inputText.split(/\r?\n/);
      res = lines.sort(() => Math.random() - 0.5).join('\n');
    } else if (slug.includes('whitespace') || slug.includes('blank-line')) {
      res = inputText
        .split(/\r?\n/)
        .map((l) => l.trim().replace(/\s+/g, ' '))
        .filter(Boolean)
        .join('\n');
    } else if (slug.includes('prefix')) {
      res = inputText
        .split(/\r?\n/)
        .map((l) => `${prefixStr}${l}`)
        .join('\n');
    } else if (slug.includes('line-number-adder')) {
      res = inputText
        .split(/\r?\n/)
        .map((l, i) => `${i + 1}. ${l}`)
        .join('\n');
    } else if (slug.includes('reverse-text')) {
      res = inputText.split('').reverse().join('');
    } else if (slug.includes('reverse-word')) {
      res = inputText.split(/\s+/).reverse().join(' ');
    }
    // Ciphers and Encodings
    else if (slug.includes('binary')) {
      if (slug.includes('binary-to-text')) {
        res = inputText
          .split(' ')
          .map((bin) => String.fromCharCode(parseInt(bin, 2)))
          .join('');
      } else {
        res = inputText
          .split('')
          .map((c) => c.charCodeAt(0).toString(2).padStart(8, '0'))
          .join(' ');
      }
    } else if (slug.includes('hexadecimal')) {
      res = inputText
        .split('')
        .map((c) => c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(' ');
    } else if (slug.includes('morse')) {
      const morseCode: Record<string, string> = {
        a: '.-', b: '-...', c: '-.-.', d: '-..', e: '.', f: '..-.',
        g: '--.', h: '....', i: '..', j: '.---', k: '-.-', l: '.-..',
        m: '--', n: '-.', o: '---', p: '.--.', q: '--.-', r: '.-.',
        s: '...', t: '-', u: '..-', v: '...-', w: '.--', x: '-..-',
        y: '-.--', z: '--..', '1': '.----', '2': '..---', '3': '...--',
        '4': '....-', '5': '.....', '6': '-....', '7': '--...', '8': '---..',
        '9': '----.', '0': '-----', ' ': '/'
      };
      res = inputText
        .toLowerCase()
        .split('')
        .map((c) => morseCode[c] || c)
        .join(' ');
    } else if (slug.includes('rot13')) {
      res = inputText.replace(/[a-zA-Z]/g, (c) => {
        const base = c <= 'Z' ? 65 : 97;
        return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
      });
    } else if (slug.includes('caesar')) {
      res = inputText.replace(/[a-zA-Z]/g, (c) => {
        const base = c <= 'Z' ? 65 : 97;
        return String.fromCharCode(((c.charCodeAt(0) - base + shiftCount) % 26) + base);
      });
    }
    // Extractors
    else if (slug.includes('email-address-extractor')) {
      const emails = inputText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
      res = Array.from(new Set(emails)).join('\n') || 'No email addresses found.';
    } else if (slug.includes('url') && slug.includes('extractor')) {
      const urls = inputText.match(/https?:\/\/[^\s]+/g) || [];
      res = Array.from(new Set(urls)).join('\n') || 'No URLs found.';
    } else if (slug.includes('phone') && slug.includes('extractor')) {
      const phones = inputText.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g) || [];
      res = Array.from(new Set(phones)).join('\n') || 'No phone numbers found.';
    }
    // Find & replace
    else if (slug.includes('find-replace') && findStr) {
      res = inputText.split(findStr).join(replaceStr);
    }
    // Word counter or default
    else {
      res = `Character Count: ${charCount}\nWord Count: ${wordCount}\nLines: ${lineCount}\nEstimated Reading Time: ${readingTime} min\n\nPreview:\n${inputText}`;
    }

    setOutputText(res);
  }, [inputText, tool.slug, findStr, replaceStr, prefixStr, shiftCount, charCount, wordCount, lineCount, readingTime]);

  const handleCopy = () => {
    navigator.clipboard.writeText(outputText || inputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTTS = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(inputText);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl space-y-6">
      {/* Counters bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-center">
        <div>
          <div className="text-lg font-bold text-neutral-900 dark:text-white font-mono">{charCount}</div>
          <div className="text-[11px] text-neutral-500 uppercase">Characters</div>
        </div>
        <div>
          <div className="text-lg font-bold text-neutral-900 dark:text-white font-mono">{wordCount}</div>
          <div className="text-[11px] text-neutral-500 uppercase">Words</div>
        </div>
        <div>
          <div className="text-lg font-bold text-neutral-900 dark:text-white font-mono">{lineCount}</div>
          <div className="text-[11px] text-neutral-500 uppercase">Lines</div>
        </div>
        <div>
          <div className="text-lg font-bold text-blue-600 dark:text-blue-400 font-mono">{readingTime} min</div>
          <div className="text-[11px] text-neutral-500 uppercase">Read Time</div>
        </div>
      </div>

      {/* Extra options if find & replace / caesar */}
      {tool.slug.includes('find-replace') && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">Find</label>
            <input
              type="text"
              value={findStr}
              onChange={(e) => setFindStr(e.target.value)}
              placeholder="Search string..."
              className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">Replace With</label>
            <input
              type="text"
              value={replaceStr}
              onChange={(e) => setReplaceStr(e.target.value)}
              placeholder="Replacement text..."
              className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs"
            />
          </div>
        </div>
      )}

      {/* Input / Output Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Input Text</label>
            <div className="flex items-center gap-2">
              <button
                onClick={handleTTS}
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
              >
                <Volume2 className="w-3.5 h-3.5" /> Listen
              </button>
              <button
                onClick={() => setInputText('')}
                className="text-xs text-neutral-400 hover:text-neutral-600"
              >
                Clear
              </button>
            </div>
          </div>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={8}
            className="w-full p-3.5 rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            placeholder="Type or paste your text here..."
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Transformed Output</label>
            <button
              onClick={handleCopy}
              className="px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-medium flex items-center gap-1.5 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <textarea
            value={outputText}
            readOnly
            rows={8}
            className="w-full p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100/60 dark:bg-neutral-900/60 text-sm font-mono focus:outline-hidden"
          />
        </div>
      </div>
    </div>
  );
}
