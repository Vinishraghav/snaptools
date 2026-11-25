'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Zap, RotateCcw, Trophy } from 'lucide-react';
import { playArcadeSfx } from './arcadeUtils';

type Phase = 'idle' | 'waiting' | 'ready' | 'early' | 'roundDone' | 'complete';

const TOTAL_ROUNDS = 5;

function getReflexRank(avgMs: number): { label: string; color: string } {
  if (avgMs < 185) return { label: 'Cyber Ninja', color: 'text-amber-500' };
  if (avgMs < 235) return { label: 'Pro Gamer Reflexes', color: 'text-emerald-500' };
  if (avgMs < 290) return { label: 'Quick & Sharp', color: 'text-blue-500' };
  return { label: 'Chill Cruise Mode', color: 'text-purple-500' };
}

export default function ReactionGame({
  bestMs,
  muted,
  onNewBest,
}: {
  bestMs: number | null;
  muted: boolean;
  onNewBest: (ms: number) => void;
}) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [times, setTimes] = useState<number[]>([]);
  const [lastMs, setLastMs] = useState<number | null>(null);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef<number>(0);

  const clearWaitTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearWaitTimer();
  }, [clearWaitTimer]);

  const startRound = useCallback(() => {
    clearWaitTimer();
    setPhase('waiting');
    playArcadeSfx('click', muted);
    const delay = 1400 + Math.floor(Math.random() * 2600);
    timeoutRef.current = setTimeout(() => {
      startTimeRef.current = performance.now();
      setPhase('ready');
      playArcadeSfx('go', muted);
    }, delay);
  }, [clearWaitTimer, muted]);

  const resetAll = () => {
    clearWaitTimer();
    setPhase('idle');
    setTimes([]);
    setLastMs(null);
  };

  const handleArenaPress = () => {
    if (phase === 'idle' || phase === 'early' || phase === 'roundDone') {
      startRound();
      return;
    }

    if (phase === 'complete') {
      clearWaitTimer();
      setTimes([]);
      setLastMs(null);
      startRound();
      return;
    }

    if (phase === 'waiting') {
      clearWaitTimer();
      playArcadeSfx('lose', muted);
      setPhase('early');
      return;
    }

    if (phase === 'ready') {
      const reaction = Math.max(50, Math.round(performance.now() - startTimeRef.current));
      const updated = [...times, reaction];
      setLastMs(reaction);
      setTimes(updated);

      if (updated.length >= TOTAL_ROUNDS) {
        const avg = Math.round(updated.reduce((a, b) => a + b, 0) / updated.length);
        if (bestMs === null || avg < bestMs) {
          onNewBest(avg);
        }
        playArcadeSfx('win', muted);
        setPhase('complete');
      } else {
        playArcadeSfx('eat', muted);
        setPhase('roundDone');
      }
    }
  };

  const avgMs =
    times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : null;
  const rank = avgMs !== null ? getReflexRank(avgMs) : null;

  const arenaBg =
    phase === 'waiting'
      ? 'bg-rose-600 hover:bg-rose-600 text-white border-rose-500'
      : phase === 'ready'
      ? 'bg-emerald-500 hover:bg-emerald-500 text-neutral-950 border-emerald-400'
      : phase === 'early'
      ? 'bg-amber-500 hover:bg-amber-500 text-neutral-950 border-amber-400'
      : 'bg-neutral-900 dark:bg-neutral-950 hover:bg-neutral-800 text-white border-neutral-800';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Round strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          {Array.from({ length: TOTAL_ROUNDS }, (_, i) => (
            <span
              key={i}
              className={`px-2.5 py-1 rounded-lg font-mono font-bold ${
                times[i] !== undefined
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                  : i === times.length
                  ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400'
              }`}
            >
              R{i + 1}: {times[i] !== undefined ? `${times[i]}ms` : '--'}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 font-bold flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5" /> Best 5-Round Avg: {bestMs !== null ? `${bestMs}ms` : '--'}
          </span>
          <button
            onClick={resetAll}
            className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
            aria-label="Reset reaction test"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Click/Tap Pad */}
      <button
        type="button"
        onMouseDown={handleArenaPress}
        className={`w-full min-h-[290px] rounded-3xl border-2 p-8 flex flex-col items-center justify-center text-center transition-colors select-none cursor-pointer shadow-xl ${arenaBg}`}
      >
        <Zap className="w-10 h-10 mb-3 opacity-90" />
        {phase === 'idle' && (
          <>
            <div className="text-2xl sm:text-3xl font-black">Lightning Reflex Test</div>
            <p className="text-sm opacity-80 mt-2 max-w-md">
              Click anywhere here to start Round 1 of {TOTAL_ROUNDS}. Wait for red to turn emerald green, then tap as fast as humanly possible!
            </p>
          </>
        )}
        {phase === 'waiting' && (
          <>
            <div className="text-3xl font-black tracking-wide">Wait for Green...</div>
            <p className="text-sm opacity-85 mt-2">Steady... do not click early!</p>
          </>
        )}
        {phase === 'ready' && (
          <>
            <div className="text-4xl sm:text-5xl font-black uppercase tracking-tight">
              CLICK NOW!
            </div>
            <p className="text-sm font-bold mt-2 opacity-80">Tap immediately!</p>
          </>
        )}
        {phase === 'early' && (
          <>
            <div className="text-3xl font-black">Too Early!</div>
            <p className="text-sm font-semibold mt-2 opacity-90">
              Click anywhere here to retry this round.
            </p>
          </>
        )}
        {phase === 'roundDone' && (
          <>
            <div className="text-5xl font-black font-mono text-emerald-400">{lastMs} ms</div>
            <p className="text-sm opacity-85 mt-2">
              Round {times.length}/{TOTAL_ROUNDS} logged! Click anywhere for the next round.
            </p>
          </>
        )}
        {phase === 'complete' && avgMs !== null && rank && (
          <>
            <div className="text-xs font-bold uppercase tracking-widest opacity-70">
              5-Round Average
            </div>
            <div className="text-5xl font-black font-mono text-emerald-400 mt-1">{avgMs} ms</div>
            <div className={`text-base font-extrabold mt-2 ${rank.color}`}>
              Rank: {rank.label}
            </div>
            <p className="text-xs opacity-75 mt-3">Click anywhere here to play another 5-round set</p>
          </>
        )}
      </button>
    </div>
  );
}
