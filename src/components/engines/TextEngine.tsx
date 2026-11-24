'use client';

import React, { useState, useEffect } from 'react';
import { ToolDef } from '@/data/toolsRegistry';
import { Copy, Check, Volume2, Mic } from 'lucide-react';

const UPSIDE_DOWN_MAP: Record<string, string> = {
  a: 'ɐ', b: 'q', c: 'ɔ', d: 'p', e: 'ǝ', f: 'ɟ', g: 'ƃ', h: 'ɥ',
  i: 'ᴉ', j: 'ɾ', k: 'ʞ', l: 'l', m: 'ɯ', n: 'u', o: 'o', p: 'd',
  q: 'b', r: 'ɹ', s: 's', t: 'ʇ', u: 'n', v: 'ʌ', w: 'ʍ', x: 'x',
  y: 'ʎ', z: 'z', '1': 'Ɩ', '2': 'ᄅ', '3': 'Ɛ', '4': 'ㄣ', '5': 'ϛ',
  '6': '9', '7': 'ㄥ', '8': '8', '9': '6', '0': '0', '.': '˙', ',': '\'',
  '?': '¿', '!': '¡',
};

const LOREM_PARAGRAPHS = [
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
  'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
  'Curabitur pretium tincidunt lacus. Nulla gravida orci a odio. Nullam varius, turpis et commodo pharetra, est eros bibendum elit, nec luctus magna felis sollicitudin mauris.',
  'Integer in mauris eu nibh euismod gravida. Duis ac tellus et risus vulputate vehicula. Donec lobortis risus a elit. Etiam tempor. Ut ullamcorper, ligula eu tempor congue.',
  'Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Proin pharetra nonummy pede. Mauris et orci.',
];

function toFancyUnicode(text: string): string {
  return Array.from(text)
    .map((ch) => {
      const code = ch.charCodeAt(0);
      if (code >= 65 && code <= 90) return String.fromCodePoint(0x1d400 + (code - 65));
      if (code >= 97 && code <= 122) return String.fromCodePoint(0x1d41a + (code - 97));
      return ch;
    })
    .join('');
}

function toZalgo(text: string): string {
  const marks = ['\u0300', '\u0301', '\u0302', '\u0303', '\u0308', '\u0315', '\u0323', '\u0336'];
  return Array.from(text)
    .map((ch) => (ch === ' ' || ch === '\n' ? ch : ch + marks[ch.charCodeAt(0) % marks.length] + marks[(ch.charCodeAt(0) + 3) % marks.length]))
    .join('');
}

export default function TextEngine({ tool }: { tool: ToolDef }) {
  const spec = (tool.spec ?? {}) as Record<string, unknown>;
  const specLorem = typeof spec.loremCount === 'number' ? spec.loremCount : 3;
  const specAffix = typeof spec.affix === 'string' ? spec.affix : '> ';
  const specShift = typeof spec.shift === 'number' ? spec.shift : 3;
  const specSuffixMode = typeof spec.suffixMode === 'boolean' ? spec.suffixMode : tool.slug.includes('suffix');

  const [inputText, setInputText] = useState(
    'The quick brown fox jumps over the lazy dog.\nFast, secure, and 100% client-side text processing.'
  );
  const [diffCompareText, setDiffCompareText] = useState(
    'The quick red fox jumps over the lazy dog.\nFast, private, and 100% client-side text processing.'
  );
  const [outputText, setOutputText] = useState('');
  const [copied, setCopied] = useState(false);
  const [findStr, setFindStr] = useState('');
  const [replaceStr, setReplaceStr] = useState('');
  const [loremCount, setLoremCount] = useState(specLorem);
  const [affixStr, setAffixStr] = useState(specAffix);
  const [shiftCount, setShiftCount] = useState(specShift);
  const [listening, setListening] = useState(false);

  useEffect(() => {
    setLoremCount(typeof spec.loremCount === 'number' ? spec.loremCount : 3);
    setAffixStr(typeof spec.affix === 'string' ? spec.affix : '> ');
    setShiftCount(typeof spec.shift === 'number' ? spec.shift : 3);
  }, [tool.slug, spec.loremCount, spec.affix, spec.shift]);

  const charCount = inputText.length;
  const wordCount = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;
  const lineCount = inputText ? inputText.split(/\r\n|\r|\n/).length : 0;
  const readingTime = Math.ceil(wordCount / 200);

  useEffect(() => {
    const slug = tool.slug;
    let res = '';

    if (slug.includes('uppercase')) {
      res = inputText.toUpperCase();
    } else if (slug.includes('lowercase')) {
      res = inputText.toLowerCase();
    } else if (slug.includes('title-case')) {
      res = inputText.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
    } else if (slug.includes('sentence-case')) {
      res = inputText.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase());
    } else if (slug.includes('camelcase')) {
      res = inputText.replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase()).replace(/^[A-Z]/, (c) => c.toLowerCase());
    } else if (slug.includes('snake-case')) {
      res = inputText.trim().toLowerCase().replace(/[\s\W]+/g, '_').replace(/^_+|_+$/g, '');
    } else if (slug.includes('kebab-case')) {
      res = inputText.trim().toLowerCase().replace(/[\s\W]+/g, '-').replace(/^-+|-+$/g, '');
    } else if (slug.includes('pascalcase')) {
      res = inputText.replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase()).replace(/^[a-z]/, (c) => c.toUpperCase());
    } else if (slug.includes('spongebob')) {
      res = inputText.split('').map((c, i) => (i % 2 === 0 ? c.toLowerCase() : c.toUpperCase())).join('');
    } else if (slug.includes('duplicate-line')) {
      res = Array.from(new Set(inputText.split(/\r?\n/))).join('\n');
    } else if (slug.includes('sort-lines-by-length')) {
      res = inputText.split(/\r?\n/).sort((a, b) => a.length - b.length).join('\n');
    } else if (slug.includes('alphabetical-line') || (slug.includes('sort') && slug.includes('a-z'))) {
      res = inputText.split(/\r?\n/).sort((a, b) => a.localeCompare(b)).join('\n');
    } else if (slug.includes('reverse-line') || (slug.includes('sort') && slug.includes('z-a'))) {
      res = inputText.split(/\r?\n/).sort((a, b) => b.localeCompare(a)).join('\n');
    } else if (slug.includes('random-line-shuffler')) {
      res = inputText.split(/\r?\n/).sort(() => Math.random() - 0.5).join('\n');
    } else if (slug.includes('whitespace') || slug.includes('blank-line')) {
      res = inputText.split(/\r?\n/).map((l) => l.trim().replace(/\s+/g, ' ')).filter(Boolean).join('\n');
    } else if (specSuffixMode || slug.includes('suffix')) {
      res = inputText.split(/\r?\n/).map((l) => `${l}${affixStr}`).join('\n');
    } else if (typeof spec.affix === 'string' || slug.includes('prefix')) {
      res = inputText.split(/\r?\n/).map((l) => `${affixStr}${l}`).join('\n');
    } else if (slug.includes('line-number-stripper')) {
      res = inputText.split(/\r?\n/).map((l) => l.replace(/^\s*\d+[\.\)\-:\s]+/, '')).join('\n');
    } else if (slug.includes('line-number-adder')) {
      res = inputText.split(/\r?\n/).map((l, i) => `${i + 1}. ${l}`).join('\n');
    } else if (slug.includes('reverse-text')) {
      res = Array.from(inputText).reverse().join('');
    } else if (slug.includes('reverse-word')) {
      res = inputText.trim().split(/\s+/).reverse().join(' ');
    } else if (slug.includes('lorem-ipsum')) {
      res = Array.from({ length: Math.max(1, Math.min(20, loremCount)) }, (_, i) => LOREM_PARAGRAPHS[i % LOREM_PARAGRAPHS.length]).join('\n\n');
    } else if (slug.includes('emoji-stripper')) {
      res = inputText.replace(/\p{Extended_Pictographic}|\uFE0F|\u200D/gu, '');
    } else if (slug.includes('fancy-unicode')) {
      res = toFancyUnicode(inputText);
    } else if (slug.includes('zalgo')) {
      res = toZalgo(inputText);
    } else if (slug.includes('upside-down')) {
      res = Array.from(inputText.toLowerCase()).map((c) => UPSIDE_DOWN_MAP[c] || c).reverse().join('');
    } else if (slug.includes('word-frequency')) {
      const counts: Record<string, number> = {};
      (inputText.toLowerCase().match(/\b[a-z0-9']+\b/g) || []).forEach((w) => {
        counts[w] = (counts[w] || 0) + 1;
      });
      res = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .map(([w, c]) => `${w}: ${c}`)
        .join('\n') || 'No words found.';
    } else if (slug.includes('diff')) {
      const a = inputText.split(/\r?\n/);
      const b = diffCompareText.split(/\r?\n/);
      const maxLen = Math.max(a.length, b.length);
      const out: string[] = [];
      for (let i = 0; i < maxLen; i++) {
        if (a[i] === b[i]) out.push(`= ${a[i] ?? ''}`);
        else {
          if (a[i] !== undefined) out.push(`- ${a[i]}`);
          if (b[i] !== undefined) out.push(`+ ${b[i]}`);
        }
      }
      res = out.join('\n');
    } else if (slug.includes('comma-to-newline')) {
      res = inputText.split(',').map((s) => s.trim()).filter(Boolean).join('\n');
    } else if (slug.includes('newline-to-comma')) {
      res = inputText.split(/\r?\n/).map((s) => s.trim()).filter(Boolean).join(', ');
    } else if (slug.includes('binary')) {
      if (slug.includes('binary-to-text')) {
        res = inputText.trim().split(/\s+/).map((bin) => String.fromCharCode(parseInt(bin, 2) || 0)).join('');
      } else {
        res = inputText.split('').map((c) => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' ');
      }
    } else if (slug.includes('hexadecimal')) {
      res = inputText.split('').map((c) => c.charCodeAt(0).toString(16).padStart(2, '0')).join(' ');
    } else if (slug.includes('morse')) {
      const morseCode: Record<string, string> = {
        a: '.-', b: '-...', c: '-.-.', d: '-..', e: '.', f: '..-.', g: '--.', h: '....',
        i: '..', j: '.---', k: '-.-', l: '.-..', m: '--', n: '-.', o: '---', p: '.--.',
        q: '--.-', r: '.-.', s: '...', t: '-', u: '..-', v: '...-', w: '.--', x: '-..-',
        y: '-.--', z: '--..', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
        '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.', '0': '-----', ' ': '/',
      };
      res = inputText.toLowerCase().split('').map((c) => morseCode[c] || c).join(' ');
    } else if (slug.includes('rot13')) {
      res = inputText.replace(/[a-zA-Z]/g, (c) => {
        const base = c <= 'Z' ? 65 : 97;
        return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
      });
    } else if (slug.includes('caesar')) {
      res = inputText.replace(/[a-zA-Z]/g, (c) => {
        const base = c <= 'Z' ? 65 : 97;
        return String.fromCharCode(((c.charCodeAt(0) - base + shiftCount + 26) % 26) + base);
      });
    } else if (slug.includes('email-address-extractor')) {
      const emails = inputText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
      res = Array.from(new Set(emails)).join('\n') || 'No email addresses found.';
    } else if (slug.includes('hashtag-extractor')) {
      const tags = inputText.match(/#[a-zA-Z0-9_]+/g) || [];
      res = Array.from(new Set(tags)).join('\n') || 'No hashtags found.';
    } else if (slug.includes('ip-address-extractor')) {
      const ips = inputText.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g) || [];
      res = Array.from(new Set(ips)).join('\n') || 'No IPv4 addresses found.';
    } else if (slug.includes('url') && slug.includes('extractor')) {
      const urls = inputText.match(/https?:\/\/[^\s]+/g) || [];
      res = Array.from(new Set(urls)).join('\n') || 'No URLs found.';
    } else if (slug.includes('phone') && slug.includes('extractor')) {
      const phones = inputText.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g) || [];
      res = Array.from(new Set(phones)).join('\n') || 'No phone numbers found.';
    } else if (slug.includes('find-replace') && findStr) {
      if (slug.includes('regex')) {
        try {
          res = inputText.replace(new RegExp(findStr, 'g'), replaceStr);
        } catch (err) {
          res = `Invalid RegExp: ${(err as Error).message}`;
        }
      } else {
        res = inputText.split(findStr).join(replaceStr);
      }
    } else {
      res = `Character Count: ${charCount}\nWord Count: ${wordCount}\nLines: ${lineCount}\nEstimated Reading Time: ${readingTime} min\n\nPreview:\n${inputText}`;
    }

    setOutputText(res);
  }, [
    inputText,
    diffCompareText,
    tool.slug,
    findStr,
    replaceStr,
    affixStr,
    specSuffixMode,
    spec.affix,
    shiftCount,
    loremCount,
    charCount,
    wordCount,
    lineCount,
    readingTime,
  ]);

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

  const handleDictation = () => {
    const SR =
      (window as unknown as { SpeechRecognition?: new () => any; webkitSpeechRecognition?: new () => any })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => any }).webkitSpeechRecognition;
    if (!SR) {
      setOutputText('Web Speech Recognition API is not supported in this browser (try Chrome desktop).');
      return;
    }
    const recognition = new SR();
    recognition.lang = 'en-US';
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };
    recognition.start();
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

      {/* Tool-specific controls */}
      {(typeof spec.loremCount === 'number' || tool.slug.includes('lorem-ipsum')) && (
        <div>
          <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
            Paragraph Count: {loremCount}
          </label>
          <input
            type="range"
            min={1}
            max={20}
            value={loremCount}
            onChange={(e) => setLoremCount(Number(e.target.value))}
            className="w-full"
          />
        </div>
      )}

      {(typeof spec.affix === 'string' || tool.slug.includes('prefix') || tool.slug.includes('suffix')) && (
        <div>
          <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
            {specSuffixMode || tool.slug.includes('suffix') ? 'Line Suffix' : 'Line Prefix'}
          </label>
          <input
            type="text"
            value={affixStr}
            onChange={(e) => setAffixStr(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-mono"
          />
        </div>
      )}

      {tool.slug.includes('caesar') && (
        <div>
          <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
            Caesar Shift: {shiftCount}
          </label>
          <input
            type="number"
            min={-25}
            max={25}
            value={shiftCount}
            onChange={(e) => setShiftCount(Number(e.target.value))}
            className="w-32 px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-mono"
          />
        </div>
      )}

      {tool.slug.includes('find-replace') && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
              {tool.slug.includes('regex') ? 'Regex Pattern' : 'Find'}
            </label>
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

      {tool.slug.includes('diff') && (
        <div>
          <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
            Compared Text (B)
          </label>
          <textarea
            value={diffCompareText}
            onChange={(e) => setDiffCompareText(e.target.value)}
            rows={4}
            className="w-full p-3.5 rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-xs font-mono"
          />
        </div>
      )}

      {/* Input / Output Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              {tool.slug.includes('diff') ? 'Original Text (A)' : 'Input Text'}
            </label>
            <div className="flex items-center gap-2">
              {tool.slug.includes('speech-to-text') && (
                <button
                  onClick={handleDictation}
                  className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 font-medium"
                >
                  <Mic className="w-3.5 h-3.5" /> {listening ? 'Listening...' : 'Speak'}
                </button>
              )}
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
