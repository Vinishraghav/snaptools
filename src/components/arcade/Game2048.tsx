'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  RotateCcw,
  Undo2,
  Trophy,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { playArcadeSfx } from './arcadeUtils';

type Board = number[][];
type Dir = 'up' | 'down' | 'left' | 'right';

function emptyBoard(): Board {
  return Array.from({ length: 4 }, () => [0, 0, 0, 0]);
}

function addRandomTile(board: Board): Board {
  const next = board.map((r) => [...r]);
  const empty: Array<[number, number]> = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (next[r][c] === 0) empty.push([r, c]);
    }
  }
  if (empty.length === 0) return next;
  const [rr, cc] = empty[Math.floor(Math.random() * empty.length)];
  next[rr][cc] = Math.random() < 0.9 ? 2 : 4;
  return next;
}

function createInitialBoard(): Board {
  return addRandomTile(addRandomTile(emptyBoard()));
}

function slideRowLeft(row: number[]): { row: number[]; gained: number } {
  const compact = row.filter((v) => v !== 0);
  const merged: number[] = [];
  let gained = 0;
  for (let i = 0; i < compact.length; i++) {
    if (i + 1 < compact.length && compact[i] === compact[i + 1]) {
      const val = compact[i] * 2;
      merged.push(val);
      gained += val;
      i++;
    } else {
      merged.push(compact[i]);
    }
  }
  while (merged.length < 4) merged.push(0);
  return { row: merged, gained };
}

function rotateClockwise(b: Board): Board {
  const next = emptyBoard();
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      next[c][3 - r] = b[r][c];
    }
  }
  return next;
}

function applyMove(board: Board, dir: Dir): { next: Board; gained: number; moved: boolean } {
  let working = board.map((r) => [...r]);
  const rotationsNeeded: Record<Dir, number> = {
    left: 0,
    down: 1,
    right: 2,
    up: 3,
  };
  const rot = rotationsNeeded[dir];
  for (let i = 0; i < rot; i++) working = rotateClockwise(working);

  let gained = 0;
  working = working.map((row) => {
    const res = slideRowLeft(row);
    gained += res.gained;
    return res.row;
  });

  for (let i = 0; i < (4 - rot) % 4; i++) working = rotateClockwise(working);

  let moved = false;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (working[r][c] !== board[r][c]) moved = true;
    }
  }
  return { next: working, gained, moved };
}

function hasMovesAvailable(board: Board): boolean {
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const val = board[r][c];
      if (val === 0) return true;
      if (r < 3 && board[r + 1][c] === val) return true;
      if (c < 3 && board[r][c + 1] === val) return true;
    }
  }
  return false;
}

function tileStyle(val: number): string {
  switch (val) {
    case 0:
      return 'bg-neutral-200/70 dark:bg-neutral-800/70 text-transparent';
    case 2:
      return 'bg-amber-50 dark:bg-neutral-700 text-neutral-900 dark:text-white';
    case 4:
      return 'bg-amber-100 dark:bg-amber-950 text-amber-950 dark:text-amber-100';
    case 8:
      return 'bg-orange-400 text-white';
    case 16:
      return 'bg-orange-500 text-white';
    case 32:
      return 'bg-rose-500 text-white';
    case 64:
      return 'bg-red-600 text-white';
    case 128:
      return 'bg-yellow-400 text-neutral-950 shadow-md';
    case 256:
      return 'bg-yellow-500 text-neutral-950 shadow-md';
    case 512:
      return 'bg-emerald-500 text-white shadow-md';
    case 1024:
      return 'bg-blue-600 text-white shadow-lg';
    case 2048:
      return 'bg-gradient-to-br from-amber-400 via-orange-500 to-rose-600 text-white shadow-xl';
    default:
      return 'bg-gradient-to-br from-purple-600 to-indigo-700 text-white shadow-xl';
  }
}

export default function Game2048({
  bestScore,
  muted,
  onNewBest,
}: {
  bestScore: number;
  muted: boolean;
  onNewBest: (score: number) => void;
}) {
  const [board, setBoard] = useState<Board>(() => createInitialBoard());
  const [score, setScore] = useState(0);
  const [prevSnapshot, setPrevSnapshot] = useState<{ board: Board; score: number } | null>(null);
  const [won2048, setWon2048] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const gameOver = !hasMovesAvailable(board);

  const move = useCallback(
    (dir: Dir) => {
      if (!hasMovesAvailable(board)) return;
      const { next, gained, moved } = applyMove(board, dir);
      if (!moved) return;

      setPrevSnapshot({ board: board.map((r) => [...r]), score });
      const withTile = addRandomTile(next);
      const nextScore = score + gained;
      setBoard(withTile);
      setScore(nextScore);

      if (nextScore > bestScore) onNewBest(nextScore);

      const hit2048 = withTile.some((row) => row.some((v) => v >= 2048));
      if (hit2048 && !won2048) {
        setWon2048(true);
        playArcadeSfx('win', muted);
      } else {
        playArcadeSfx(gained > 0 ? 'merge' : 'click', muted);
      }

      if (!hasMovesAvailable(withTile)) {
        playArcadeSfx('lose', muted);
      }
    },
    [board, score, bestScore, muted, onNewBest, won2048]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      const k = e.key.toLowerCase();
      if (k === 'arrowup' || k === 'w') {
        e.preventDefault();
        move('up');
      } else if (k === 'arrowdown' || k === 's') {
        e.preventDefault();
        move('down');
      } else if (k === 'arrowleft' || k === 'a') {
        e.preventDefault();
        move('left');
      } else if (k === 'arrowright' || k === 'd') {
        e.preventDefault();
        move('right');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [move]);

  const restart = () => {
    setBoard(createInitialBoard());
    setScore(0);
    setPrevSnapshot(null);
    setWon2048(false);
    playArcadeSfx('click', muted);
  };

  const undo = () => {
    if (!prevSnapshot) return;
    setBoard(prevSnapshot.board);
    setScore(prevSnapshot.score);
    setPrevSnapshot(null);
    playArcadeSfx('click', muted);
  };

  return (
    <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-8">
      {/* 4x4 Grid */}
      <div className="relative w-full max-w-[380px]">
        <div
          className="grid grid-cols-4 gap-2.5 p-3 rounded-2xl bg-neutral-300 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 shadow-inner touch-none select-none"
          onTouchStart={(e) => {
            const t = e.touches[0];
            touchStartRef.current = { x: t.clientX, y: t.clientY };
          }}
          onTouchEnd={(e) => {
            if (!touchStartRef.current) return;
            const t = e.changedTouches[0];
            const dx = t.clientX - touchStartRef.current.x;
            const dy = t.clientY - touchStartRef.current.y;
            if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;
            if (Math.abs(dx) > Math.abs(dy)) {
              move(dx > 0 ? 'right' : 'left');
            } else {
              move(dy > 0 ? 'down' : 'up');
            }
          }}
        >
          {board.flatMap((row, r) =>
            row.map((val, c) => (
              <div
                key={`${r}-${c}`}
                className={`aspect-square rounded-xl flex items-center justify-center font-black transition-all duration-100 ${
                  val >= 1024 ? 'text-xl sm:text-2xl' : val >= 100 ? 'text-2xl sm:text-3xl' : 'text-3xl'
                } ${tileStyle(val)}`}
              >
                {val > 0 ? val : ''}
              </div>
            ))
          )}
        </div>

        {gameOver && (
          <div className="absolute inset-0 rounded-2xl bg-neutral-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center space-y-3">
            <div className="text-xs font-bold uppercase tracking-widest text-rose-400">
              No Moves Left
            </div>
            <div className="text-3xl font-black text-white">Score: {score}</div>
            <button
              onClick={restart}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold text-xs cursor-pointer transition"
            >
              Try Again
            </button>
          </div>
        )}
      </div>

      {/* Controls & Info */}
      <div className="w-full max-w-xs space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950">
            <div className="text-[11px] uppercase tracking-wider text-neutral-500 font-semibold">
              Score
            </div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
              {score}
            </div>
          </div>
          <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950">
            <div className="text-[11px] uppercase tracking-wider text-neutral-500 font-semibold flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-amber-500" /> Best
            </div>
            <div className="text-2xl font-black text-neutral-900 dark:text-white font-mono">
              {bestScore}
            </div>
          </div>
        </div>

        {won2048 && (
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700 text-xs font-semibold text-amber-800 dark:text-amber-300">
            2048 Reached! Keep merging to push for 4096!
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={undo}
            disabled={!prevSnapshot}
            className="flex-1 py-2.5 px-4 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          >
            <Undo2 className="w-4 h-4" /> Undo
          </button>
          <button
            onClick={restart}
            className="flex-1 py-2.5 px-4 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer hover:opacity-90 transition"
          >
            <RotateCcw className="w-4 h-4" /> New Game
          </button>
        </div>

        {/* Direction buttons for mouse / mobile */}
        <div className="pt-1 flex flex-col items-center gap-1.5 select-none">
          <button
            aria-label="Slide up"
            onClick={() => move('up')}
            className="w-12 h-11 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 flex items-center justify-center active:scale-95 transition cursor-pointer"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
          <div className="flex gap-1.5">
            <button
              aria-label="Slide left"
              onClick={() => move('left')}
              className="w-12 h-11 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 flex items-center justify-center active:scale-95 transition cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button
              aria-label="Slide down"
              onClick={() => move('down')}
              className="w-12 h-11 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 flex items-center justify-center active:scale-95 transition cursor-pointer"
            >
              <ArrowDown className="w-5 h-5" />
            </button>
            <button
              aria-label="Slide right"
              onClick={() => move('right')}
              className="w-12 h-11 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 flex items-center justify-center active:scale-95 transition cursor-pointer"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
          <div className="text-[11px] text-neutral-400 pt-1">
            Merge matching numbers with Arrow Keys, WASD, or swipe.
          </div>
        </div>
      </div>
    </div>
  );
}
