'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ToolDef } from '@/data/toolsRegistry';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import { Copy, Check, Download, RefreshCw, Dice5, Clock, ShieldCheck } from 'lucide-react';

const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const URL_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-';

function makeUlid(): string {
  let time = Date.now();
  let tStr = '';
  for (let i = 0; i < 10; i++) {
    tStr = CROCKFORD[time % 32] + tStr;
    time = Math.floor(time / 32);
  }
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let rStr = '';
  for (let i = 0; i < 16; i++) rStr += CROCKFORD[bytes[i] % 32];
  return tStr + rStr;
}

function makeNanoId(len = 21): string {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => URL_ALPHABET[b % URL_ALPHABET.length]).join('');
}

function makeMacAddress(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  bytes[0] = (bytes[0] & 0xfe) | 0x02; // unicast locally administered
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0').toUpperCase()).join(':');
}

function makeTotpFallback(): string {
  const step = Math.floor(Date.now() / 30000);
  const val = ((step * 2654435761) >>> 0) % 1000000;
  return String(val).padStart(6, '0');
}

function getQrPresetPayload(qrPreset: string | undefined, slug: string): string {
  const key = (qrPreset || slug).toLowerCase();
  if (key.includes('wi-fi') || key.includes('wifi')) return 'WIFI:T:WPA;S:SnapToolsGuest;P:MySecurePass123;;';
  if (key.includes('whatsapp')) return 'https://wa.me/15551234567?text=Hello';
  if (key.includes('upi')) return 'upi://pay?pa=merchant@upi&pn=MerchantName&am=100&cu=INR';
  if (key.includes('vcard')) return 'BEGIN:VCARD\nVERSION:3.0\nN:Doe;Jane;;;\nFN:Jane Doe\nTEL:+15551234567\nEMAIL:jane@example.com\nEND:VCARD';
  if (key.includes('email') || key.includes('mailto')) return 'mailto:hello@example.com?subject=Quick%20Question&body=Hi';
  if (key.includes('sms')) return 'smsto:+15551234567:Hello there!';
  if (key.includes('geo') || key.includes('location')) return 'geo:37.7749,-122.4194';
  if (key.includes('event') || key.includes('ical')) return 'BEGIN:VEVENT\nSUMMARY:Team Sync\nDTSTART:20261201T090000Z\nDTEND:20261201T100000Z\nEND:VEVENT';
  if (key.includes('zoom')) return 'https://zoom.us/j/1234567890';
  if (key.includes('youtube')) return 'https://www.youtube.com/@snaptools';
  if (key.includes('instagram')) return 'https://www.instagram.com/snaptools';
  if (key.includes('linkedin')) return 'https://www.linkedin.com/company/snaptools';
  if (key.includes('google-review')) return 'https://g.page/r/example/review';
  return 'https://snaptools-app.vercel.app';
}

export default function GeneratorEngine({ tool }: { tool: ToolDef }) {
  const spec = (tool.spec ?? {}) as Record<string, unknown>;
  const specLen = typeof spec.length === 'number' ? spec.length : 16;
  const specKind = typeof spec.kind === 'string' ? spec.kind : '';
  const specMinutes = typeof spec.minutes === 'number' ? spec.minutes : 25;
  const diceSides = typeof spec.sides === 'number' && spec.sides >= 2 ? spec.sides : 6;
  const specQrPreset = typeof spec.qrPreset === 'string' ? spec.qrPreset : undefined;
  const specAlgo = typeof spec.algo === 'string' ? spec.algo.toUpperCase() : undefined;

  const [inputText, setInputText] = useState(() => getQrPresetPayload(specQrPreset, tool.slug));
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [barcodeValue, setBarcodeValue] = useState<string>('123456789012');
  const [passwordLength, setPasswordLength] = useState<number>(specLen);
  const [includeSymbols, setIncludeSymbols] = useState<boolean>(specKind !== 'alphanumeric-password');
  const [includeNumbers, setIncludeNumbers] = useState<boolean>(true);
  const [generatedToken, setGeneratedToken] = useState<string>('');
  const [hashResult, setHashResult] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Timer states
  const [timerSeconds, setTimerSeconds] = useState<number>(specMinutes * 60);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);

  // Random outcome state
  const [diceRoll, setDiceRoll] = useState<number>(diceSides);
  const [coinSide, setCoinSide] = useState<'Heads' | 'Tails'>('Heads');

  useEffect(() => {
    setPasswordLength(typeof spec.length === 'number' ? spec.length : 16);
    setIncludeSymbols(spec.kind !== 'alphanumeric-password');
    setIncludeNumbers(true);
    setTimerRunning(false);
    setTimerSeconds((typeof spec.minutes === 'number' ? spec.minutes : 25) * 60);
    setDiceRoll(typeof spec.sides === 'number' && spec.sides >= 2 ? spec.sides : 6);
    setInputText(getQrPresetPayload(typeof spec.qrPreset === 'string' ? spec.qrPreset : undefined, tool.slug));
  }, [tool.slug, spec.length, spec.kind, spec.minutes, spec.sides, spec.qrPreset]);

  const barcodeSvgRef = useRef<SVGSVGElement>(null);
  const slug = tool.slug;

  const isTokenGenerator =
    Boolean(specKind) ||
    slug.includes('password') ||
    slug.includes('passphrase') ||
    slug.includes('pin') ||
    slug.includes('uuid') ||
    slug.includes('ulid') ||
    slug.includes('nanoid') ||
    slug.includes('api-key') ||
    slug.includes('token') ||
    slug.includes('mac-address') ||
    slug.includes('totp');

  const isSecurityOrNetConfig =
    Boolean(specAlgo) ||
    slug.includes('hash') ||
    slug.includes('sha') ||
    slug.includes('md5') ||
    slug.includes('hmac') ||
    slug.includes('checksum') ||
    slug.includes('bcrypt') ||
    slug.includes('ipv4') ||
    slug.includes('ipv6') ||
    slug.includes('robots') ||
    slug.includes('csp') ||
    slug.includes('cors') ||
    slug.includes('basic-auth') ||
    slug.includes('htpasswd');

  const generateValue = useCallback(() => {
    if (slug.includes('uuid')) {
      setGeneratedToken(crypto.randomUUID());
      return;
    }
    if (slug.includes('ulid')) {
      setGeneratedToken(makeUlid());
      return;
    }
    if (specKind === 'nanoid-id' || slug.includes('nanoid')) {
      setGeneratedToken(makeNanoId(passwordLength));
      return;
    }
    if (specKind === 'api-secret-token' || slug.includes('api-key') || slug.includes('token') || slug.includes('secret')) {
      const byteLen = Math.max(8, Math.ceil(passwordLength / 2));
      const bytes = new Uint8Array(byteLen);
      crypto.getRandomValues(bytes);
      setGeneratedToken(
        'sk_live_' + Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('').slice(0, passwordLength)
      );
      return;
    }
    if (slug.includes('mac-address')) {
      setGeneratedToken(makeMacAddress());
      return;
    }
    if (slug.includes('totp') || slug.includes('2fa')) {
      setGeneratedToken(makeTotpFallback());
      return;
    }
    if (specKind === 'pin-code' || slug.includes('pin')) {
      const len = typeof spec.length === 'number'
        ? Math.min(16, Math.max(4, passwordLength))
        : Math.min(8, Math.max(4, passwordLength > 10 ? 6 : passwordLength));
      const arr = new Uint32Array(len);
      crypto.getRandomValues(arr);
      setGeneratedToken(Array.from(arr, (n) => String(n % 10)).join(''));
      return;
    }
    let chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeNumbers) chars += '0123456789';
    if (includeSymbols) chars += '!@#$%^&*()_+~`|}{[]:;?><,./-=';
    const array = new Uint32Array(passwordLength);
    crypto.getRandomValues(array);
    setGeneratedToken(Array.from(array, (n) => chars[n % chars.length]).join(''));
  }, [slug, passwordLength, includeNumbers, includeSymbols]);

  useEffect(() => {
    if (isTokenGenerator) generateValue();
  }, [isTokenGenerator, generateValue]);

  useEffect(() => {
    if (!isTokenGenerator && !isSecurityOrNetConfig && !slug.includes('barcode') && !slug.includes('timer') && !slug.includes('pomodoro') && !slug.includes('dice') && !slug.includes('coin')) {
      QRCode.toDataURL(inputText || 'https://snaptools-app.vercel.app', { width: 320, margin: 2 }, (err, url) => {
        if (!err && url) setQrDataUrl(url);
      });
    }
  }, [inputText, slug, isTokenGenerator, isSecurityOrNetConfig]);

  useEffect(() => {
    if (slug.includes('barcode') && barcodeSvgRef.current) {
      try {
        JsBarcode(barcodeSvgRef.current, barcodeValue || '123456789012', {
          format: 'CODE128',
          width: 2,
          height: 80,
          displayValue: true,
        });
      } catch {
        // ignore transient typing errors
      }
    }
  }, [barcodeValue, slug]);

  // Set helpful initial default for IP/Auth tools
  useEffect(() => {
    if (slug.includes('ipv4')) setInputText('192.168.1.1');
    else if (slug.includes('ipv6')) setInputText('2001:0db8:0000:0000:0000:ff00:0042:8329');
    else if (slug.includes('basic-auth')) setInputText('admin:secret123');
    else if (Boolean(specAlgo) || slug.includes('hash') || slug.includes('sha') || slug.includes('md5') || slug.includes('hmac')) {
      setInputText('Hello SnapTools');
    }
  }, [slug, specAlgo]);

  // Security / Network computation
  useEffect(() => {
    if (!isSecurityOrNetConfig) return;

    if (slug.includes('ipv4')) {
      const parts = inputText.trim().split('.').map(Number);
      if (parts.length === 4 && parts.every((n) => !isNaN(n) && n >= 0 && n <= 255)) {
        const bin = parts.map((n) => n.toString(2).padStart(8, '0')).join('.');
        const hex = parts.map((n) => n.toString(16).padStart(2, '0').toUpperCase()).join(':');
        const intVal = ((parts[0] << 24) >>> 0) + (parts[1] << 16) + (parts[2] << 8) + parts[3];
        setHashResult(
          `IPv4: ${inputText.trim()}\nBinary: ${bin}\nHex: 0x${parts.map((n) => n.toString(16).padStart(2, '0').toUpperCase()).join('')}\nColon Hex: ${hex}\n32-bit Integer: ${intVal}\nIPv6 Mapped: ::ffff:${inputText.trim()}`
        );
      } else {
        setHashResult('Enter a valid IPv4 address (e.g., 192.168.1.1).');
      }
      return;
    }

    if (slug.includes('basic-auth')) {
      setHashResult(`Authorization: Basic ${btoa(unescape(encodeURIComponent(inputText)))}`);
      return;
    }

    if (slug.includes('robots')) {
      setHashResult(`User-agent: *\nAllow: /\nDisallow: /admin/\n\nSitemap: ${inputText.replace(/\/$/, '')}/sitemap.xml`);
      return;
    }

    if (slug.includes('csp')) {
      setHashResult(
        `Content-Security-Policy: default-src 'self'; script-src 'self' ${inputText}; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;`
      );
      return;
    }

    if (slug.includes('cors')) {
      setHashResult(
        `Access-Control-Allow-Origin: ${inputText || '*'}\nAccess-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS\nAccess-Control-Allow-Headers: Content-Type, Authorization`
      );
      return;
    }

    const algo = specAlgo
      || (slug.includes('sha-512')
        ? 'SHA-512'
        : slug.includes('sha-1')
          ? 'SHA-1'
          : slug.includes('sha-3')
            ? 'SHA-384'
            : 'SHA-256');
    const data = new TextEncoder().encode(inputText);
    crypto.subtle.digest(algo, data).then((buf) => {
      const hex = Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
      setHashResult(`${algo}:\n${hex}`);
    });
  }, [inputText, slug, isSecurityOrNetConfig, specAlgo]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerRunning) {
      interval = setInterval(() => setTimerSeconds((p) => (p > 0 ? p - 1 : 0)), 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl space-y-6">
      {slug.includes('barcode') ? (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5">
              Barcode Value / Digits
            </label>
            <input
              type="text"
              value={barcodeValue}
              onChange={(e) => setBarcodeValue(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm font-mono focus:outline-hidden"
            />
          </div>
          <div className="p-6 rounded-2xl bg-white flex items-center justify-center border border-neutral-200 shadow-xs">
            <svg ref={barcodeSvgRef} />
          </div>
        </div>
      ) : isTokenGenerator ? (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <span className="font-mono text-lg font-bold text-neutral-900 dark:text-white break-all">
              {generatedToken}
            </span>
            <button
              onClick={() => handleCopy(generatedToken)}
              className="ml-3 px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold flex items-center gap-1.5 shrink-0"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          <div className="space-y-3">
            {(Boolean(specKind) || slug.includes('password') || slug.includes('nanoid') || slug.includes('pin')) && !slug.includes('uuid') && !slug.includes('ulid') && !slug.includes('mac-address') && (
              <div>
                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                  Length: {passwordLength} characters
                </label>
                <input
                  type="range"
                  min={4}
                  max={64}
                  value={passwordLength}
                  onChange={(e) => setPasswordLength(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            )}
            {slug.includes('password') && (
              <div className="flex gap-4 text-xs font-medium text-neutral-700 dark:text-neutral-300">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={includeNumbers} onChange={(e) => setIncludeNumbers(e.target.checked)} />
                  Include Numbers (0-9)
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={includeSymbols} onChange={(e) => setIncludeSymbols(e.target.checked)} />
                  Include Symbols (!@#$)
                </label>
              </div>
            )}

            <button
              onClick={generateValue}
              className="px-6 py-2.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold text-xs flex items-center gap-2 hover:opacity-90 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Generate New
            </button>
          </div>
        </div>
      ) : isSecurityOrNetConfig ? (
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5">
              Input Payload / Origin / IP
            </label>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm font-mono focus:outline-hidden"
            />
          </div>
          <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-500 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" /> Output
              </span>
              <button
                onClick={() => handleCopy(hashResult)}
                className="px-2.5 py-1 rounded-lg bg-neutral-200 dark:bg-neutral-800 text-xs font-semibold flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <pre className="text-xs font-mono text-neutral-900 dark:text-neutral-100 whitespace-pre-wrap break-all">
              {hashResult}
            </pre>
          </div>
        </div>
      ) : (typeof spec.minutes === 'number' || slug.includes('timer') || slug.includes('pomodoro')) ? (
        <div className="p-8 rounded-2xl bg-neutral-900 text-white flex flex-col items-center justify-center space-y-4 text-center">
          <Clock className="w-8 h-8 text-blue-400" />
          <div className="text-6xl font-mono font-bold">
            {Math.floor(timerSeconds / 60).toString().padStart(2, '0')}:
            {(timerSeconds % 60).toString().padStart(2, '0')}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setTimerRunning(!timerRunning)} className="px-6 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold">
              {timerRunning ? 'Pause' : 'Start'}
            </button>
            <button
              onClick={() => {
                setTimerRunning(false);
                setTimerSeconds(specMinutes * 60);
              }}
              className="px-6 py-2 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-semibold"
            >
              Reset ({specMinutes}m)
            </button>
          </div>
        </div>
      ) : (typeof spec.sides === 'number' || slug.includes('dice') || slug.includes('coin')) ? (
        <div className="p-8 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 flex flex-col items-center justify-center space-y-4 text-center">
          {(typeof spec.sides === 'number' || slug.includes('dice')) ? (
            <>
              <div className="w-20 h-20 rounded-2xl bg-blue-600 text-white text-4xl font-bold flex items-center justify-center shadow-lg">
                {diceRoll}
              </div>
              <button
                onClick={() => setDiceRoll(Math.floor(Math.random() * diceSides) + 1)}
                className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold flex items-center gap-2"
              >
                <Dice5 className="w-4 h-4" /> Roll d{diceSides}
              </button>
            </>
          ) : (
            <>
              <div className="w-20 h-20 rounded-full bg-amber-500 text-white text-lg font-bold flex items-center justify-center shadow-lg border-4 border-amber-400">
                {coinSide}
              </div>
              <button
                onClick={() => setCoinSide(Math.random() > 0.5 ? 'Heads' : 'Tails')}
                className="px-6 py-2.5 rounded-xl bg-amber-600 text-white text-xs font-semibold"
              >
                Flip Coin
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5">
              Payload / URL / Text to Encode
            </label>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm font-mono focus:outline-hidden"
              placeholder="https://snaptools-app.vercel.app"
            />
          </div>

          {qrDataUrl && (
            <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white border border-neutral-200 shadow-sm max-w-sm mx-auto">
              <img src={qrDataUrl} alt="Generated QR Code" className="w-64 h-64" />
              <a
                href={qrDataUrl}
                download="qrcode.png"
                className="mt-4 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-2 shadow-sm"
              >
                <Download className="w-3.5 h-3.5" /> Download QR Code (PNG)
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
