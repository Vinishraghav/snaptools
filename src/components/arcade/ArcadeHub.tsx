'use client';

import React, { useState, useCallback, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Gamepad2,
  Volume2,
  VolumeX,
  Dices,
  ArrowRight,
  Trash2,
} from 'lucide-react';
import AdSlot from '@/components/ads/AdSlot';
import {
  ARCADE_GAMES,
  ArcadeGameId,
  ArcadeScores,
  DEFAULT_ARCADE_SCORES,
  getScoresSnapshot,
  getServerScoresSnapshot,
  subscribeArcadeScores,
  saveArcadeScores,
  playArcadeSfx,
} from './arcadeUtils';
import SnakeGame from './SnakeGame';
import Game2048 from './Game2048';
import TypingGame from './TypingGame';
import ReactionGame from './ReactionGame';
import MemoryGame from './MemoryGame';
import TicTacToeGame from './TicTacToeGame';

function isValidGameId(val: string | null): val is ArcadeGameId {
  return Boolean(val && ARCADE_GAMES.some((g) => g.id === val));
}

function getGameBestLabel(id: ArcadeGameId, scores: ArcadeScores): string {
  switch (id) {
    case 'snake':
      return scores.snakeBest > 0 ? `Best: ${scores.snakeBest}` : 'No score yet';
    case '2048':
      return scores.best2048 > 0 ? `Best: ${scores.best2048}` : 'No score yet';
    case 'typing':
      return scores.bestWpm > 0 ? `Best: ${scores.bestWpm} WPM` : 'Not timed yet';
    case 'reaction':
      return scores.bestReactionMs !== null ? `Best: ${scores.bestReactionMs}ms` : 'No record';
    case 'memory':
      return scores.memoryBestMoves !== null ? `Best: ${scores.memoryBestMoves} moves` : 'No record';
    case 'tictactoe':
      return `${scores.tttWins} Wins (${scores.tttStreak} streak)`;
  }
}

export default function ArcadeHub() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryGame = searchParams.get('game');

  const activeGame: ArcadeGameId = isValidGameId(queryGame) ? queryGame : 'snake';
  const scores = useSyncExternalStore(
    subscribeArcadeScores,
    getScoresSnapshot,
    getServerScoresSnapshot
  );
  const [muted, setMuted] = useState(false);

  const selectGame = (id: ArcadeGameId) => {
    playArcadeSfx('click', muted);
    router.replace(`/arcade?game=${id}`, { scroll: false });
  };

  const pickRandomGame = () => {
    const others = ARCADE_GAMES.filter((g) => g.id !== activeGame);
    const picked = others[Math.floor(Math.random() * others.length)] ?? ARCADE_GAMES[0];
    selectGame(picked.id);
  };

  const updateSnakeBest = useCallback((val: number) => {
    const prev = getScoresSnapshot();
    if (val <= prev.snakeBest) return;
    saveArcadeScores({ ...prev, snakeBest: val });
  }, []);

  const update2048Best = useCallback((val: number) => {
    const prev = getScoresSnapshot();
    if (val <= prev.best2048) return;
    saveArcadeScores({ ...prev, best2048: val });
  }, []);

  const updateWpmBest = useCallback((wpm: number) => {
    const prev = getScoresSnapshot();
    if (wpm <= prev.bestWpm) return;
    saveArcadeScores({ ...prev, bestWpm: wpm });
  }, []);

  const updateReactionBest = useCallback((ms: number) => {
    const prev = getScoresSnapshot();
    if (prev.bestReactionMs !== null && ms >= prev.bestReactionMs) return;
    saveArcadeScores({ ...prev, bestReactionMs: ms });
  }, []);

  const updateMemoryBest = useCallback((moves: number) => {
    const prev = getScoresSnapshot();
    if (prev.memoryBestMoves !== null && moves >= prev.memoryBestMoves) return;
    saveArcadeScores({ ...prev, memoryBestMoves: moves });
  }, []);

  const recordTttResult = useCallback((outcome: 'win' | 'loss' | 'draw') => {
    const prev = getScoresSnapshot();
    const next: ArcadeScores =
      outcome === 'win'
        ? { ...prev, tttWins: prev.tttWins + 1, tttStreak: prev.tttStreak + 1 }
        : outcome === 'loss'
        ? { ...prev, tttStreak: 0 }
        : prev;
    if (next !== prev) {
      saveArcadeScores(next);
    }
  }, []);

  const resetAllScores = () => {
    saveArcadeScores(DEFAULT_ARCADE_SCORES);
    playArcadeSfx('click', muted);
  };

  const activeMeta = ARCADE_GAMES.find((g) => g.id === activeGame) ?? ARCADE_GAMES[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Header Banner */}
      <div className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-gradient-to-br from-neutral-900 via-neutral-900 to-indigo-950 text-white p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Gamepad2 className="w-3.5 h-3.5" /> SnapTools Mini-Arcade &bull; 100% Browser-Side
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
            Need a Quick Brain Break? Play Right Here.
          </h1>
          <p className="text-xs sm:text-sm text-neutral-300">
            Six zero-lag browser mini-games with retro Web Audio sound effects and local high-score tracking. No downloads, no sign-ups.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={pickRandomGame}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition shadow-md"
          >
            <Dices className="w-4 h-4" /> Random Game
          </button>
          <button
            onClick={() => setMuted((m) => !m)}
            className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition"
            aria-label={muted ? 'Unmute arcade sounds' : 'Mute arcade sounds'}
          >
            {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            {muted ? 'SFX Muted' : 'SFX On'}
          </button>
          <button
            onClick={resetAllScores}
            className="px-3 py-2.5 rounded-xl bg-white/5 hover:bg-rose-500/20 text-neutral-300 hover:text-rose-200 font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition"
            title="Clear local arcade high scores"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear Scores
          </button>
        </div>
      </div>

      {/* Game Selector Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {ARCADE_GAMES.map((game) => {
          const selected = game.id === activeGame;
          return (
            <button
              key={game.id}
              onClick={() => selectGame(game.id)}
              className={`text-left p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                selected
                  ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 shadow-md ring-2 ring-blue-500/20'
                  : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full text-white bg-gradient-to-r ${game.accent}`}
                  >
                    {game.badge}
                  </span>
                </div>
                <div className="text-sm font-black text-neutral-900 dark:text-white">
                  {game.title}
                </div>
              </div>
              <div className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 mt-2">
                {getGameBestLabel(game.id, scores)}
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Game Arena */}
      <section className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 sm:p-8 shadow-xs space-y-6">
        <div className="border-b border-neutral-100 dark:border-neutral-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-black text-neutral-900 dark:text-white">
              {activeMeta.title}
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {activeMeta.tagline}
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
            {getGameBestLabel(activeMeta.id, scores)}
          </span>
        </div>

        {activeGame === 'snake' && (
          <SnakeGame bestScore={scores.snakeBest} muted={muted} onNewBest={updateSnakeBest} />
        )}
        {activeGame === '2048' && (
          <Game2048 bestScore={scores.best2048} muted={muted} onNewBest={update2048Best} />
        )}
        {activeGame === 'typing' && (
          <TypingGame bestWpm={scores.bestWpm} muted={muted} onNewBest={updateWpmBest} />
        )}
        {activeGame === 'reaction' && (
          <ReactionGame
            bestMs={scores.bestReactionMs}
            muted={muted}
            onNewBest={updateReactionBest}
          />
        )}
        {activeGame === 'memory' && (
          <MemoryGame
            bestMoves4x4={scores.memoryBestMoves}
            muted={muted}
            onNewBest={updateMemoryBest}
          />
        )}
        {activeGame === 'tictactoe' && (
          <TicTacToeGame
            totalWins={scores.tttWins}
            streak={scores.tttStreak}
            muted={muted}
            onRecordResult={recordTttResult}
          />
        )}
      </section>

      {/* Clean Banner Slot */}
      <AdSlot slotId="arcade-bottom-banner" format="horizontal" />

      {/* Back to Tools Synergy Strip */}
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="text-sm font-bold text-neutral-900 dark:text-white">
            Back to Productivity?
          </div>
          <div className="text-xs text-neutral-500">
            Jump straight into PDF tools, Image optimizers, Finance calculators, or Hardware testers.
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/tools/pdf-merge"
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-semibold hover:border-blue-500 transition flex items-center gap-1"
          >
            PDF Merge <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/tools/image-compressor-lossy-lossless"
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-semibold hover:border-blue-500 transition flex items-center gap-1"
          >
            Image Compressor <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/"
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition flex items-center gap-1"
          >
            All Tools <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
