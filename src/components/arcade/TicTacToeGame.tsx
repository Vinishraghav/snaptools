'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { RotateCcw, Trophy, Cpu, Users } from 'lucide-react';
import { playArcadeSfx } from './arcadeUtils';

type Cell = 'X' | 'O' | null;
type GameMode = 'unbeatable' | 'casual' | 'pvp';

const WIN_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function checkWinner(board: Cell[]): { winner: 'X' | 'O' | 'draw' | null; line: number[] | null } {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line };
    }
  }
  if (board.every((cell) => cell !== null)) {
    return { winner: 'draw', line: null };
  }
  return { winner: null, line: null };
}

function minimax(board: Cell[], depth: number, isMaximizing: boolean): number {
  const { winner } = checkWinner(board);
  if (winner === 'O') return 10 - depth;
  if (winner === 'X') return depth - 10;
  if (winner === 'draw') return 0;

  if (isMaximizing) {
    let best = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = 'O';
        best = Math.max(best, minimax(board, depth + 1, false));
        board[i] = null;
      }
    }
    return best;
  } else {
    let best = Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = 'X';
        best = Math.min(best, minimax(board, depth + 1, true));
        board[i] = null;
      }
    }
    return best;
  }
}

function pickAiMove(board: Cell[], mode: GameMode): number {
  const empty = board
    .map((v, i) => (v === null ? i : -1))
    .filter((i) => i !== -1);
  if (empty.length === 0) return -1;

  if (mode === 'casual' && Math.random() < 0.45) {
    return empty[Math.floor(Math.random() * empty.length)];
  }

  let bestScore = -Infinity;
  let bestMove = empty[0];
  for (const idx of empty) {
    board[idx] = 'O';
    const score = minimax(board, 0, false);
    board[idx] = null;
    if (score > bestScore) {
      bestScore = score;
      bestMove = idx;
    }
  }
  return bestMove;
}

export default function TicTacToeGame({
  totalWins,
  streak,
  muted,
  onRecordResult,
}: {
  totalWins: number;
  streak: number;
  muted: boolean;
  onRecordResult: (outcome: 'win' | 'loss' | 'draw') => void;
}) {
  const [mode, setMode] = useState<GameMode>('unbeatable');
  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null));
  const [turn, setTurn] = useState<'X' | 'O'>('X');
  const [roundScore, setRoundScore] = useState({ x: 0, draws: 0, o: 0 });

  const { winner, line } = checkWinner(board);

  const resetBoard = useCallback(() => {
    setBoard(Array(9).fill(null));
    setTurn('X');
  }, []);

  const handleBoardOutcome = useCallback(
    (nextBoard: Cell[]) => {
      const outcome = checkWinner(nextBoard).winner;
      if (!outcome) return false;
      if (outcome === 'X') {
        playArcadeSfx('win', muted);
        setRoundScore((s) => ({ ...s, x: s.x + 1 }));
        onRecordResult('win');
      } else if (outcome === 'O') {
        playArcadeSfx('lose', muted);
        setRoundScore((s) => ({ ...s, o: s.o + 1 }));
        onRecordResult('loss');
      } else {
        playArcadeSfx('click', muted);
        setRoundScore((s) => ({ ...s, draws: s.draws + 1 }));
        onRecordResult('draw');
      }
      return true;
    },
    [muted, onRecordResult]
  );

  // AI turn trigger
  useEffect(() => {
    if (mode === 'pvp' || turn !== 'O' || winner) return;
    const t = setTimeout(() => {
      const next = [...board];
      const moveIdx = pickAiMove(next, mode);
      if (moveIdx !== -1) {
        next[moveIdx] = 'O';
        setBoard(next);
        setTurn('X');
        if (!handleBoardOutcome(next)) {
          playArcadeSfx('flip', muted);
        }
      }
    }, 260);
    return () => clearTimeout(t);
  }, [board, turn, mode, winner, muted, handleBoardOutcome]);

  const handleCellClick = (idx: number) => {
    if (board[idx] !== null || winner) return;
    if (mode !== 'pvp' && turn !== 'X') return;
    const next = [...board];
    next[idx] = turn;
    setBoard(next);
    setTurn(turn === 'X' ? 'O' : 'X');
    if (!handleBoardOutcome(next)) {
      playArcadeSfx('click', muted);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-8">
      {/* Board */}
      <div className="w-full max-w-[330px] space-y-4">
        <div className="grid grid-cols-3 gap-3 p-3.5 rounded-3xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-lg">
          {board.map((cell, idx) => {
            const isWinCell = line?.includes(idx);
            return (
              <button
                key={idx}
                onClick={() => handleCellClick(idx)}
                className={`aspect-square rounded-2xl text-4xl font-black flex items-center justify-center transition-all cursor-pointer select-none ${
                  isWinCell
                    ? 'bg-emerald-500 text-white shadow-lg scale-[1.03]'
                    : 'bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 hover:border-blue-500'
                } ${cell === 'X' && !isWinCell ? 'text-blue-600 dark:text-blue-400' : ''} ${
                  cell === 'O' && !isWinCell ? 'text-rose-500 dark:text-rose-400' : ''
                }`}
              >
                {cell}
              </button>
            );
          })}
        </div>

        <div className="text-center text-sm font-bold">
          {winner === 'X' ? (
            <span className="text-emerald-600 dark:text-emerald-400">
              {mode === 'pvp' ? 'Player X Wins!' : 'You Won!'}
            </span>
          ) : winner === 'O' ? (
            <span className="text-rose-500">
              {mode === 'pvp' ? 'Player O Wins!' : 'AI Won This Round!'}
            </span>
          ) : winner === 'draw' ? (
            <span className="text-amber-500">Clean Draw!</span>
          ) : (
            <span className="text-neutral-600 dark:text-neutral-400">
              {turn === 'X'
                ? mode === 'pvp'
                  ? 'Turn: Player X'
                  : 'Your Turn (X)'
                : mode === 'pvp'
                ? 'Turn: Player O'
                : 'AI Thinking...'}
            </span>
          )}
        </div>
      </div>

      {/* Mode & Scoreboard */}
      <div className="w-full max-w-xs space-y-5">
        <div className="space-y-2">
          <div className="text-xs font-semibold text-neutral-500">Opponent Mode</div>
          <div className="grid grid-cols-1 gap-2">
            {(
              [
                { id: 'unbeatable', label: 'Minimax AI (Unbeatable)', icon: Cpu },
                { id: 'casual', label: 'Casual AI (Beatable)', icon: Cpu },
                { id: 'pvp', label: '2-Player Pass & Play', icon: Users },
              ] as const
            ).map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.id}
                  onClick={() => {
                    setMode(opt.id);
                    resetBoard();
                  }}
                  className={`px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                    mode === opt.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40">
            <div className="text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400">X Wins</div>
            <div className="text-xl font-black font-mono">{roundScore.x}</div>
          </div>
          <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800">
            <div className="text-[10px] font-bold uppercase text-neutral-500">Draws</div>
            <div className="text-xl font-black font-mono">{roundScore.draws}</div>
          </div>
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40">
            <div className="text-[10px] font-bold uppercase text-rose-600 dark:text-rose-400">O Wins</div>
            <div className="text-xl font-black font-mono">{roundScore.o}</div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 font-semibold text-neutral-600 dark:text-neutral-400">
            <Trophy className="w-4 h-4 text-amber-500" /> All-Time Wins / Streak
          </span>
          <span className="font-mono font-black">
            {totalWins} / {streak}🔥
          </span>
        </div>

        <button
          onClick={resetBoard}
          className="w-full py-2.5 px-4 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer hover:opacity-90 transition"
        >
          <RotateCcw className="w-4 h-4" /> Next Round
        </button>
      </div>
    </div>
  );
}
