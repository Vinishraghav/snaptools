'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ToolDef } from '@/data/toolsRegistry';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import { Copy, Check, Download, RefreshCw, QrCode, Key, Dice5, Clock, ShieldCheck } from 'lucide-react';

export default function GeneratorEngine({ tool }: { tool: ToolDef }) {
  const [inputText, setInputText] = useState('https://example.com');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [barcodeValue, setBarcodeValue] = useState<string>('123456789012');
  const [passwordLength, setPasswordLength] = useState<number>(16);
  const [includeSymbols, setIncludeSymbols] = useState<boolean>(true);
  const [includeNumbers, setIncludeNumbers] = useState<boolean>(true);
  const [generatedPassword, setGeneratedPassword] = useState<string>('');
  const [hashResult, setHashResult] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Timer states
  const [timerSeconds, setTimerSeconds] = useState<number>(25 * 60);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);

  // Random outcome state
  const [diceRoll, setDiceRoll] = useState<number>(6);
  const [coinSide, setCoinSide] = useState<'Heads' | 'Tails'>('Heads');

  const barcodeSvgRef = useRef<SVGSVGElement>(null);

  // QR Code generator
  useEffect(() => {
    if (tool.slug.includes('qr') || (!tool.slug.includes('barcode') && !tool.slug.includes('password') && !tool.slug.includes('hash') && !tool.slug.includes('uuid'))) {
      QRCode.toDataURL(inputText, { width: 320, margin: 2 }, (err, url) => {
        if (!err && url) setQrDataUrl(url);
      });
    }
  }, [inputText, tool.slug]);

  // Barcode generator
  useEffect(() => {
    if (tool.slug.includes('barcode') && barcodeSvgRef.current) {
      try {
        JsBarcode(barcodeSvgRef.current, barcodeValue || '123456789012', {
          format: 'CODE128',
          width: 2,
          height: 80,
          displayValue: true,
        });
      } catch {
        // ignore invalid barcode digits during typing
      }
    }
  }, [barcodeValue, tool.slug]);

  // Password & UUID generator
  const generatePassword = () => {
    let chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeNumbers) chars += '0123456789';
    if (includeSymbols) chars += '!@#$%^&*()_+~`|}{[]:;?><,./-=';
    let res = '';
    const array = new Uint32Array(passwordLength);
    crypto.getRandomValues(array);
    for (let i = 0; i < passwordLength; i++) {
      res += chars[array[i] % chars.length];
    }
    setGeneratedPassword(res);
  };

  const generateUuid = () => {
    setGeneratedPassword(crypto.randomUUID());
  };

  useEffect(() => {
    if (tool.slug.includes('password') || tool.slug.includes('passphrase') || tool.slug.includes('pin')) {
      generatePassword();
    } else if (tool.slug.includes('uuid')) {
      generateUuid();
    }
  }, [tool.slug]);

  // SHA-256 Hash generator using Web Crypto API
  useEffect(() => {
    if (tool.slug.includes('hash') || tool.slug.includes('sha') || tool.slug.includes('md5')) {
      const encoder = new TextEncoder();
      const data = encoder.encode(inputText);
      crypto.subtle.digest('SHA-256', data).then((buf) => {
        const hex = Array.from(new Uint8Array(buf))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');
        setHashResult(hex);
      });
    }
  }, [inputText, tool.slug]);

  // Pomodoro Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning]);

  const rollDice = () => {
    setDiceRoll(Math.floor(Math.random() * 6) + 1);
  };

  const flipCoin = () => {
    setCoinSide(Math.random() > 0.5 ? 'Heads' : 'Tails');
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl space-y-6">
      {/* 1. Barcode Generator */}
      {tool.slug.includes('barcode') ? (
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
      ) : tool.slug.includes('password') || tool.slug.includes('pin') || tool.slug.includes('uuid') ? (
        /* 2. Password & UUID Generator */
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <span className="font-mono text-lg font-bold text-neutral-900 dark:text-white break-all">
              {generatedPassword}
            </span>
            <button
              onClick={() => handleCopy(generatedPassword)}
              className="ml-3 px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold flex items-center gap-1.5 shrink-0"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                Length: {passwordLength} characters
              </label>
              <input
                type="range"
                min={6}
                max={64}
                value={passwordLength}
                onChange={(e) => setPasswordLength(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div className="flex gap-4 text-xs font-medium text-neutral-700 dark:text-neutral-300">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeNumbers}
                  onChange={(e) => setIncludeNumbers(e.target.checked)}
                />
                Include Numbers (0-9)
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeSymbols}
                  onChange={(e) => setIncludeSymbols(e.target.checked)}
                />
                Include Symbols (!@#$)
              </label>
            </div>

            <button
              onClick={tool.slug.includes('uuid') ? generateUuid : generatePassword}
              className="px-6 py-2.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold text-xs flex items-center gap-2 hover:opacity-90 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Generate New
            </button>
          </div>
        </div>
      ) : tool.slug.includes('timer') || tool.slug.includes('pomodoro') ? (
        /* 3. Pomodoro Timer */
        <div className="p-8 rounded-2xl bg-neutral-900 text-white flex flex-col items-center justify-center space-y-4 text-center">
          <Clock className="w-8 h-8 text-blue-400" />
          <div className="text-6xl font-mono font-bold">
            {Math.floor(timerSeconds / 60)
              .toString()
              .padStart(2, '0')}
            :{(timerSeconds % 60).toString().padStart(2, '0')}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setTimerRunning(!timerRunning)}
              className="px-6 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold"
            >
              {timerRunning ? 'Pause' : 'Start'}
            </button>
            <button
              onClick={() => {
                setTimerRunning(false);
                setTimerSeconds(25 * 60);
              }}
              className="px-6 py-2 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-semibold"
            >
              Reset
            </button>
          </div>
        </div>
      ) : tool.slug.includes('dice') || tool.slug.includes('coin') ? (
        /* 4. Dice & Coin Flip */
        <div className="p-8 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 flex flex-col items-center justify-center space-y-4 text-center">
          {tool.slug.includes('dice') ? (
            <>
              <div className="w-20 h-20 rounded-2xl bg-blue-600 text-white text-4xl font-bold flex items-center justify-center shadow-lg">
                {diceRoll}
              </div>
              <button
                onClick={rollDice}
                className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold flex items-center gap-2"
              >
                <Dice5 className="w-4 h-4" /> Roll Dice
              </button>
            </>
          ) : (
            <>
              <div className="w-20 h-20 rounded-full bg-amber-500 text-white text-lg font-bold flex items-center justify-center shadow-lg border-4 border-amber-400">
                {coinSide}
              </div>
              <button
                onClick={flipCoin}
                className="px-6 py-2.5 rounded-xl bg-amber-600 text-white text-xs font-semibold"
              >
                Flip Coin
              </button>
            </>
          )}
        </div>
      ) : (
        /* 5. QR Code Generator (Default) */
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
              placeholder="https://example.com"
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
