'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RotateCcw, Trophy, Zap, Keyboard } from 'lucide-react';
import { playArcadeSfx } from './arcadeUtils';

const PROMPTS = [
  'The quick brown fox jumps over the lazy dog while clean JavaScript functions turn coffee into blazing fast web utilities.',
  'Shipping small features daily beats waiting months for perfection because real users teach you what actually matters most.',
  'Modern browsers run cryptography, image compression, and audio synthesis right inside local memory with zero server uploads.',
  'Typing rhythm improves dramatically when your eyes read two words ahead instead of staring down at your keyboard keys.',
  'Dark mode gradients, crisp monospace numbers, and instant feedback turn boring forms into tools people enjoy opening every day.',
];

export default function TypingGame({
  bestWpm,
  muted,
  onNewBest,
}: {
  bestWpm: number;
  muted: boolean;
  onNewBest: (wpm: number) => void;
}) {
  const [duration, setDuration] = useState<30 | 60>(30);
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [promptIdx, setPromptIdx] = useState(0);
  const [typed, setTyped] = useState('');
  const [completedChars, setCompletedChars] = useState(0);
  const [completedCorrect, setCompletedCorrect] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const prompt = PROMPTS[promptIdx];

  const elapsed = duration - timeLeft;
  const currentCorrect = typed.split('').filter((ch, i) => ch === prompt[i]).length;
  const totalTyped = completedChars + typed.length;
  const totalCorrect = completedCorrect + currentCorrect;
  const wpm = elapsed > 0 ? Math.round((totalCorrect / 5) / (elapsed / 60)) : 0;
  const accuracy = totalTyped > 0 ? Math.round((totalCorrect / totalTyped) * 100) : 100;

  const resetTest = useCallback(
    (nextDuration = duration) => {
      setDuration(nextDuration);
      setTimeLeft(nextDuration);
      setRunning(false);
      setFinished(false);
      setTyped('');
      setCompletedChars(0);
      setCompletedCorrect(0);
      setPromptIdx((idx) => (idx + 1) % PROMPTS.length);
      setTimeout(() => inputRef.current?.focus(), 40);
    },
    [duration]
  );

  useEffect(() => {
    if (!running || finished) return;
    const id = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setRunning(false);
          setFinished(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, finished]);

  useEffect(() => {
    if (finished) {
      playArcadeSfx('win', muted);
      const finalWpm = Math.round((totalCorrect / 5) / (duration / 60));
      if (finalWpm > bestWpm) {
        onNewBest(finalWpm);
      }
    }
  }, [finished, totalCorrect, duration, bestWpm, muted, onNewBest]);

  const handleChange = (val: string) => {
    if (finished) return;
    if (!running && val.length > 0) {
      setRunning(true);
    }
    if (val.length >= prompt.length) {
      const roundCorrect = val
        .slice(0, prompt.length)
        .split('')
        .filter((ch, i) => ch === prompt[i]).length;
      setCompletedChars((c) => c + prompt.length);
      setCompletedCorrect((c) => c + roundCorrect);
      setTyped('');
      setPromptIdx((idx) => (idx + 1) % PROMPTS.length);
      playArcadeSfx('eat', muted);
      return;
    }
    setTyped(val);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header Metrics + Duration */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {([30, 60] as const).map((sec) => (
            <button
              key={sec}
              onClick={() => resetTest(sec)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition ${
                duration === sec
                  ? 'bg-blue-600 text-white'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
              }`}
            >
              {sec}s Sprint
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800">
            Time: <span className="font-black text-blue-600 dark:text-blue-400">{timeLeft}s</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800">
            WPM: <span className="font-black text-emerald-600 dark:text-emerald-400">{wpm}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800">
            Acc: <span className="font-black">{accuracy}%</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5" /> Best: {bestWpm}
          </div>
        </div>
      </div>

      {/* Prompt Display Box */}
      <div
        onClick={() => inputRef.current?.focus()}
        className="p-6 rounded-2xl border-2 border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 font-mono text-base sm:text-lg leading-relaxed tracking-wide cursor-text select-none"
      >
        {prompt.split('').map((char, idx) => {
          let cls = 'text-neutral-400 dark:text-neutral-600';
          if (idx < typed.length) {
            cls =
              typed[idx] === char
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400 bg-rose-500/15 rounded-xs underline';
          } else if (idx === typed.length && !finished) {
            cls =
              'text-neutral-900 dark:text-white border-b-2 border-blue-500 bg-blue-500/10 rounded-xs';
          }
          return (
            <span key={idx} className={cls}>
              {char}
            </span>
          );
        })}
      </div>

      {/* Input */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Keyboard className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            ref={inputRef}
            type="text"
            value={typed}
            onChange={(e) => handleChange(e.target.value)}
            disabled={finished}
            placeholder={
              finished
                ? 'Time is up! Click Restart to try another sprint.'
                : 'Start typing the passage above — timer begins on first keystroke...'
            }
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm font-mono focus:outline-hidden focus:border-blue-500 disabled:opacity-60"
          />
        </div>
        <button
          onClick={() => resetTest(duration)}
          className="px-5 py-3 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer hover:opacity-90 transition shrink-0"
        >
          <RotateCcw className="w-4 h-4" /> New Passage
        </button>
      </div>

      {finished && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-amber-500/10 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-black text-neutral-900 dark:text-white">
                Sprint Complete: {Math.round((totalCorrect / 5) / (duration / 60))} WPM ({accuracy}% Accuracy)
              </div>
              <div className="text-xs text-neutral-500">
                {totalCorrect} correct characters in {duration}s. Personal Best: {Math.max(bestWpm, Math.round((totalCorrect / 5) / (duration / 60)))} WPM.
              </div>
            </div>
          </div>
          <button
            onClick={() => resetTest(duration)}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer transition"
          >
            Race Again
          </button>
        </div>
      )}
    </div>
  );
}
