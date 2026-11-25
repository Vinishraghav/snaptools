'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RotateCcw, Trophy, Sparkles } from 'lucide-react';
import { playArcadeSfx } from './arcadeUtils';

const EMOJI_POOL = [
  '🚀',
  '⚡',
  '🔥',
  '🎧',
  '💎',
  '🎮',
  '🌈',
  '🍕',
  '🦊',
  '🪐',
  '🧠',
  '🏆',
];

interface CardItem {
  uid: number;
  emoji: string;
  matched: boolean;
}

function buildDeck(pairs: number): CardItem[] {
  const chosen = EMOJI_POOL.slice(0, pairs);
  const doubled = [...chosen, ...chosen];
  for (let i = doubled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [doubled[i], doubled[j]] = [doubled[j], doubled[i]];
  }
  return doubled.map((emoji, idx) => ({ uid: idx, emoji, matched: false }));
}

export default function MemoryGame({
  bestMoves4x4,
  muted,
  onNewBest,
}: {
  bestMoves4x4: number | null;
  muted: boolean;
  onNewBest: (moves: number) => void;
}) {
  const [pairsCount, setPairsCount] = useState<8 | 12>(8);
  const [cards, setCards] = useState<CardItem[]>(() => buildDeck(8));
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [started, setStarted] = useState(false);

  const lockRef = useRef(false);
  const mismatchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const matchedCount = cards.filter((c) => c.matched).length / 2;
  const won = matchedCount === pairsCount;

  const resetDeck = useCallback(
    (nextPairs: 8 | 12 = pairsCount) => {
      if (mismatchTimerRef.current) {
        clearTimeout(mismatchTimerRef.current);
        mismatchTimerRef.current = null;
      }
      lockRef.current = false;
      setPairsCount(nextPairs);
      setCards(buildDeck(nextPairs));
      setFlippedIndices([]);
      setMoves(0);
      setSeconds(0);
      setStarted(false);
    },
    [pairsCount]
  );

  useEffect(() => {
    return () => {
      if (mismatchTimerRef.current) clearTimeout(mismatchTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!started || won) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [started, won]);

  const flipCard = (idx: number) => {
    if (lockRef.current || won) return;
    if (flippedIndices.includes(idx) || cards[idx].matched) return;

    if (!started) setStarted(true);
    playArcadeSfx('flip', muted);

    const nextFlipped = [...flippedIndices, idx];
    setFlippedIndices(nextFlipped);

    if (nextFlipped.length === 2) {
      const nextMoves = moves + 1;
      setMoves(nextMoves);
      const [firstIdx, secondIdx] = nextFlipped;
      if (cards[firstIdx].emoji === cards[secondIdx].emoji) {
        const updated = cards.map((card, i) =>
          i === firstIdx || i === secondIdx ? { ...card, matched: true } : card
        );
        setCards(updated);
        setFlippedIndices([]);
        const nowWon = updated.every((c) => c.matched);
        if (nowWon) {
          playArcadeSfx('win', muted);
          if (pairsCount === 8 && (bestMoves4x4 === null || nextMoves < bestMoves4x4)) {
            onNewBest(nextMoves);
          }
        } else {
          playArcadeSfx('eat', muted);
        }
      } else {
        lockRef.current = true;
        mismatchTimerRef.current = setTimeout(() => {
          setFlippedIndices([]);
          lockRef.current = false;
        }, 650);
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {([8, 12] as const).map((p) => (
            <button
              key={p}
              onClick={() => resetDeck(p)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition ${
                pairsCount === p
                  ? 'bg-purple-600 text-white'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
              }`}
            >
              {p === 8 ? '4x4 Standard (8 Pairs)' : '6x4 Challenge (12 Pairs)'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800">
            Moves: <span className="font-black text-purple-600 dark:text-purple-400">{moves}</span>
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800">
            Time: <span className="font-black">{seconds}s</span>
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5" /> Best 4x4: {bestMoves4x4 !== null ? `${bestMoves4x4} moves` : '--'}
          </span>
          <button
            onClick={() => resetDeck(pairsCount)}
            className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
            aria-label="Restart memory game"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Card Grid */}
      <div
        className={`grid gap-3 mx-auto ${
          pairsCount === 8 ? 'grid-cols-4 max-w-md' : 'grid-cols-4 sm:grid-cols-6 max-w-xl'
        }`}
      >
        {cards.map((card, idx) => {
          const revealed = card.matched || flippedIndices.includes(idx);
          return (
            <button
              key={card.uid}
              onClick={() => flipCard(idx)}
              className={`aspect-square rounded-2xl border-2 text-3xl sm:text-4xl font-bold flex items-center justify-center transition-all duration-200 cursor-pointer select-none ${
                card.matched
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-400 dark:border-emerald-700 scale-95'
                  : revealed
                  ? 'bg-white dark:bg-neutral-800 border-purple-500 shadow-lg'
                  : 'bg-gradient-to-br from-neutral-900 to-neutral-800 dark:from-neutral-800 dark:to-neutral-900 border-neutral-700 hover:border-purple-500 hover:scale-[1.03]'
              }`}
            >
              {revealed ? (
                <span>{card.emoji}</span>
              ) : (
                <span className="text-lg font-black text-neutral-500">?</span>
              )}
            </button>
          );
        })}
      </div>

      {won && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-500/15 via-pink-500/10 to-amber-500/15 border border-purple-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-black text-neutral-900 dark:text-white">
                Board Cleared in {moves} Moves ({seconds}s)!
              </div>
              <div className="text-xs text-neutral-500">
                Clean visual memory! Try {pairsCount === 8 ? '6x4 Challenge' : 'beating your move count'}.
              </div>
            </div>
          </div>
          <button
            onClick={() => resetDeck(pairsCount)}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold cursor-pointer transition"
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}
