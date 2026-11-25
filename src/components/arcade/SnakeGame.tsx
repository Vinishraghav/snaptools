'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Trophy,
} from 'lucide-react';
import { playArcadeSfx } from './arcadeUtils';

type Point = { x: number; y: number };
type SpeedTier = 'chill' | 'classic' | 'turbo';

const GRID_SIZE = 20;
const CANVAS_PX = 400;
const CELL_PX = CANVAS_PX / GRID_SIZE;

const SPEED_MS: Record<SpeedTier, number> = {
  chill: 145,
  classic: 100,
  turbo: 68,
};

const INITIAL_SNAKE: Point[] = [
  { x: 10, y: 10 },
  { x: 9, y: 10 },
  { x: 8, y: 10 },
];

function spawnFood(snake: Point[]): Point {
  const occupied = new Set(snake.map((p) => `${p.x},${p.y}`));
  const free: Point[] = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (!occupied.has(`${x},${y}`)) {
        free.push({ x, y });
      }
    }
  }
  if (free.length === 0) return { x: 0, y: 0 };
  return free[Math.floor(Math.random() * free.length)];
}

export default function SnakeGame({
  bestScore,
  muted,
  onNewBest,
}: {
  bestScore: number;
  muted: boolean;
  onNewBest: (score: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [score, setScore] = useState(0);
  const [status, setStatus] = useState<'ready' | 'playing' | 'paused' | 'over'>('ready');
  const [speed, setSpeed] = useState<SpeedTier>('classic');
  const [wrapWalls, setWrapWalls] = useState(true);

  const snakeRef = useRef<Point[]>([...INITIAL_SNAKE]);
  const dirRef = useRef<Point>({ x: 1, y: 0 });
  const dirQueueRef = useRef<Point[]>([]);
  const foodRef = useRef<Point>({ x: 15, y: 10 });
  const scoreRef = useRef(0);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const drawBoard = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background grid
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, CANVAS_PX, CANVAS_PX);

    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let i = 1; i < GRID_SIZE; i++) {
      const pos = i * CELL_PX;
      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, CANVAS_PX);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, pos);
      ctx.lineTo(CANVAS_PX, pos);
      ctx.stroke();
    }

    // Glowing food
    const food = foodRef.current;
    const fx = food.x * CELL_PX + CELL_PX / 2;
    const fy = food.y * CELL_PX + CELL_PX / 2;
    ctx.save();
    ctx.fillStyle = '#f59e0b';
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(fx, fy, CELL_PX * 0.36, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Snake segments
    const snake = snakeRef.current;
    snake.forEach((seg, idx) => {
      const isHead = idx === 0;
      const pad = isHead ? 1.5 : 2.5;
      const x = seg.x * CELL_PX + pad;
      const y = seg.y * CELL_PX + pad;
      const size = CELL_PX - pad * 2;
      ctx.fillStyle = isHead ? '#34d399' : idx % 2 === 0 ? '#10b981' : '#059669';
      ctx.beginPath();
      ctx.roundRect(x, y, size, size, isHead ? 6 : 4);
      ctx.fill();

      // Eyes on head
      if (isHead) {
        ctx.fillStyle = '#064e3b';
        const d = dirRef.current;
        const cx = seg.x * CELL_PX + CELL_PX / 2;
        const cy = seg.y * CELL_PX + CELL_PX / 2;
        const offset = 3.5;
        if (d.x !== 0) {
          ctx.beginPath();
          ctx.arc(cx + d.x * 3, cy - offset, 1.8, 0, Math.PI * 2);
          ctx.arc(cx + d.x * 3, cy + offset, 1.8, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(cx - offset, cy + d.y * 3, 1.8, 0, Math.PI * 2);
          ctx.arc(cx + offset, cy + d.y * 3, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    });
  }, []);

  const resetGame = useCallback(
    (autoStart = false) => {
      snakeRef.current = [...INITIAL_SNAKE];
      dirRef.current = { x: 1, y: 0 };
      dirQueueRef.current = [];
      foodRef.current = spawnFood(INITIAL_SNAKE);
      scoreRef.current = 0;
      setScore(0);
      setStatus(autoStart ? 'playing' : 'ready');
      drawBoard();
    },
    [drawBoard]
  );

  useEffect(() => {
    drawBoard();
  }, [drawBoard]);

  const queueDirection = useCallback(
    (next: Point) => {
      const lastPlanned =
        dirQueueRef.current.length > 0
          ? dirQueueRef.current[dirQueueRef.current.length - 1]
          : dirRef.current;
      // Ignore same axis / 180 reversal
      if (lastPlanned.x + next.x === 0 && lastPlanned.y + next.y === 0) return;
      if (lastPlanned.x === next.x && lastPlanned.y === next.y) return;
      if (dirQueueRef.current.length < 2) {
        dirQueueRef.current.push(next);
      }
      if (status === 'ready') {
        setStatus('playing');
      }
    },
    [status]
  );

  // Keyboard listener
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      const key = e.key.toLowerCase();
      if (key === 'arrowup' || key === 'w') {
        e.preventDefault();
        queueDirection({ x: 0, y: -1 });
      } else if (key === 'arrowdown' || key === 's') {
        e.preventDefault();
        queueDirection({ x: 0, y: 1 });
      } else if (key === 'arrowleft' || key === 'a') {
        e.preventDefault();
        queueDirection({ x: -1, y: 0 });
      } else if (key === 'arrowright' || key === 'd') {
        e.preventDefault();
        queueDirection({ x: 1, y: 0 });
      } else if (key === ' ') {
        e.preventDefault();
        if (status === 'over') {
          resetGame(true);
        } else {
          setStatus((prev) => (prev === 'playing' ? 'paused' : 'playing'));
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [queueDirection, resetGame, status]);

  // Game tick loop
  useEffect(() => {
    if (status !== 'playing') return;

    const timer = setInterval(() => {
      if (dirQueueRef.current.length > 0) {
        dirRef.current = dirQueueRef.current.shift()!;
      }

      const snake = snakeRef.current;
      const head = snake[0];
      let nx = head.x + dirRef.current.x;
      let ny = head.y + dirRef.current.y;

      if (wrapWalls) {
        nx = (nx + GRID_SIZE) % GRID_SIZE;
        ny = (ny + GRID_SIZE) % GRID_SIZE;
      } else if (nx < 0 || nx >= GRID_SIZE || ny < 0 || ny >= GRID_SIZE) {
        playArcadeSfx('lose', muted);
        setStatus('over');
        return;
      }

      const willEat = nx === foodRef.current.x && ny === foodRef.current.y;
      const bodyToCheck = willEat ? snake : snake.slice(0, -1);
      const hitSelf = bodyToCheck.some((seg) => seg.x === nx && seg.y === ny);

      if (hitSelf) {
        playArcadeSfx('lose', muted);
        setStatus('over');
        return;
      }

      const nextSnake = [{ x: nx, y: ny }, ...snake];
      if (!willEat) {
        nextSnake.pop();
      } else {
        const nextScore = scoreRef.current + 10;
        scoreRef.current = nextScore;
        setScore(nextScore);
        if (nextScore > bestScore) {
          onNewBest(nextScore);
        }
        playArcadeSfx('eat', muted);
        foodRef.current = spawnFood(nextSnake);
      }

      snakeRef.current = nextSnake;
      drawBoard();
    }, SPEED_MS[speed]);

    return () => clearInterval(timer);
  }, [status, speed, wrapWalls, muted, bestScore, onNewBest, drawBoard]);

  return (
    <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-8">
      {/* Canvas Arena */}
      <div className="relative w-full max-w-[400px]">
        <div
          className="relative rounded-2xl overflow-hidden border-2 border-neutral-800 bg-neutral-950 shadow-2xl touch-none"
          onTouchStart={(e) => {
            const t = e.touches[0];
            touchStartRef.current = { x: t.clientX, y: t.clientY };
          }}
          onTouchEnd={(e) => {
            if (!touchStartRef.current) return;
            const t = e.changedTouches[0];
            const dx = t.clientX - touchStartRef.current.x;
            const dy = t.clientY - touchStartRef.current.y;
            if (Math.abs(dx) < 18 && Math.abs(dy) < 18) return;
            if (Math.abs(dx) > Math.abs(dy)) {
              queueDirection({ x: dx > 0 ? 1 : -1, y: 0 });
            } else {
              queueDirection({ x: 0, y: dy > 0 ? 1 : -1 });
            }
          }}
        >
          <canvas
            ref={canvasRef}
            width={CANVAS_PX}
            height={CANVAS_PX}
            className="w-full h-auto block"
          />

          {status !== 'playing' && (
            <div className="absolute inset-0 bg-neutral-950/75 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center space-y-3">
              {status === 'over' ? (
                <>
                  <div className="text-xs font-bold uppercase tracking-widest text-rose-400">
                    Game Over
                  </div>
                  <div className="text-3xl font-black text-white">Score: {score}</div>
                  {score > 0 && score >= bestScore && (
                    <div className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      New Personal Best!
                    </div>
                  )}
                </>
              ) : status === 'paused' ? (
                <div className="text-2xl font-black text-white">Paused</div>
              ) : (
                <>
                  <div className="text-2xl font-black text-white">Neon Snake</div>
                  <p className="text-xs text-neutral-300 max-w-xs">
                    Use Arrow keys, WASD, or swipe/D-Pad below to collect glowing amber orbs.
                  </p>
                </>
              )}
              <button
                onClick={() => (status === 'over' ? resetGame(true) : setStatus('playing'))}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-lg"
              >
                <Play className="w-4 h-4 fill-current" />
                {status === 'over' ? 'Play Again' : status === 'paused' ? 'Resume' : 'Start Game'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Controls & Stats */}
      <div className="w-full max-w-xs space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950">
            <div className="text-[11px] uppercase tracking-wider text-neutral-500 font-semibold">
              Score
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
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

        {/* Speed Selector */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
            Speed Mode
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(['chill', 'classic', 'turbo'] as SpeedTier[]).map((tier) => (
              <button
                key={tier}
                onClick={() => setSpeed(tier)}
                className={`py-2 px-3 rounded-xl text-xs font-bold capitalize transition cursor-pointer ${
                  speed === tier
                    ? 'bg-emerald-600 text-white'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                }`}
              >
                {tier}
              </button>
            ))}
          </div>
        </div>

        {/* Wall Mode */}
        <div className="flex items-center justify-between p-3 rounded-xl border border-neutral-200 dark:border-neutral-800">
          <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            Wrap Around Walls
          </span>
          <button
            onClick={() => setWrapWalls((v) => !v)}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
              wrapWalls
                ? 'bg-blue-600 text-white'
                : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
            }`}
          >
            {wrapWalls ? 'ON (Edge Portal)' : 'OFF (Solid Walls)'}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() =>
              status === 'over'
                ? resetGame(true)
                : setStatus((prev) => (prev === 'playing' ? 'paused' : 'playing'))
            }
            className="flex-1 py-2.5 px-4 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer hover:opacity-90 transition"
          >
            {status === 'playing' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {status === 'playing' ? 'Pause' : 'Play'}
          </button>
          <button
            onClick={() => resetGame(false)}
            className="py-2.5 px-4 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          >
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
        </div>

        {/* Mobile / Mouse D-Pad */}
        <div className="pt-1 flex flex-col items-center gap-1.5 select-none">
          <button
            aria-label="Move up"
            onClick={() => queueDirection({ x: 0, y: -1 })}
            className="w-12 h-11 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 flex items-center justify-center active:scale-95 transition cursor-pointer"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
          <div className="flex gap-1.5">
            <button
              aria-label="Move left"
              onClick={() => queueDirection({ x: -1, y: 0 })}
              className="w-12 h-11 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 flex items-center justify-center active:scale-95 transition cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button
              aria-label="Move down"
              onClick={() => queueDirection({ x: 0, y: 1 })}
              className="w-12 h-11 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 flex items-center justify-center active:scale-95 transition cursor-pointer"
            >
              <ArrowDown className="w-5 h-5" />
            </button>
            <button
              aria-label="Move right"
              onClick={() => queueDirection({ x: 1, y: 0 })}
              className="w-12 h-11 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 flex items-center justify-center active:scale-95 transition cursor-pointer"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
          <div className="text-[11px] text-neutral-400 pt-1">
            Space = Pause / Play &bull; Arrow Keys or WASD
          </div>
        </div>
      </div>
    </div>
  );
}
