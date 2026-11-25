'use client';

export type ArcadeGameId =
  | 'snake'
  | '2048'
  | 'typing'
  | 'reaction'
  | 'memory'
  | 'tictactoe';

export interface ArcadeGameMeta {
  id: ArcadeGameId;
  title: string;
  tagline: string;
  badge: string;
  accent: string;
}

export const ARCADE_GAMES: ArcadeGameMeta[] = [
  {
    id: 'snake',
    title: 'Neon Snake',
    tagline: 'Eat glowing orbs, chain combos, wrap walls or go hardcore.',
    badge: 'Classic',
    accent: 'from-emerald-500 to-teal-600',
  },
  {
    id: '2048',
    title: '2048 Neon',
    tagline: 'Slide & merge matching tiles with 1-step Undo support.',
    badge: 'Puzzle',
    accent: 'from-amber-500 to-orange-600',
  },
  {
    id: 'typing',
    title: 'Typing Blitz',
    tagline: '30s & 60s WPM typing sprints with real-time accuracy.',
    badge: 'Speed',
    accent: 'from-blue-500 to-indigo-600',
  },
  {
    id: 'reaction',
    title: 'Lightning Reflex',
    tagline: '5-round sub-millisecond reaction test with Pro rank tiers.',
    badge: 'Reflex',
    accent: 'from-rose-500 to-pink-600',
  },
  {
    id: 'memory',
    title: 'Emoji Memory',
    tagline: '4x4 & 6x4 card matching board with timer and move counter.',
    badge: 'Memory',
    accent: 'from-purple-500 to-fuchsia-600',
  },
  {
    id: 'tictactoe',
    title: 'Tic-Tac-Toe AI',
    tagline: 'Challenge an Unbeatable Minimax AI or play 2-Player mode.',
    badge: 'Strategy',
    accent: 'from-cyan-500 to-blue-600',
  },
];

export interface ArcadeScores {
  snakeBest: number;
  best2048: number;
  bestWpm: number;
  bestReactionMs: number | null;
  memoryBestMoves: number | null;
  tttWins: number;
  tttStreak: number;
}

const STORAGE_KEY = 'snaptools_arcade_scores';

export const DEFAULT_ARCADE_SCORES: ArcadeScores = {
  snakeBest: 0,
  best2048: 0,
  bestWpm: 0,
  bestReactionMs: null,
  memoryBestMoves: null,
  tttWins: 0,
  tttStreak: 0,
};

export function loadArcadeScores(): ArcadeScores {
  if (typeof window === 'undefined') return DEFAULT_ARCADE_SCORES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_ARCADE_SCORES;
    const parsed = JSON.parse(raw) as Partial<ArcadeScores>;
    return {
      snakeBest: typeof parsed.snakeBest === 'number' ? parsed.snakeBest : 0,
      best2048: typeof parsed.best2048 === 'number' ? parsed.best2048 : 0,
      bestWpm: typeof parsed.bestWpm === 'number' ? parsed.bestWpm : 0,
      bestReactionMs: typeof parsed.bestReactionMs === 'number' ? parsed.bestReactionMs : null,
      memoryBestMoves: typeof parsed.memoryBestMoves === 'number' ? parsed.memoryBestMoves : null,
      tttWins: typeof parsed.tttWins === 'number' ? parsed.tttWins : 0,
      tttStreak: typeof parsed.tttStreak === 'number' ? parsed.tttStreak : 0,
    };
  } catch {
    return DEFAULT_ARCADE_SCORES;
  }
}

let cachedScores: ArcadeScores | null = null;
const scoreListeners = new Set<() => void>();

export function saveArcadeScores(next: ArcadeScores): void {
  cachedScores = next;
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore quota errors
  }
  scoreListeners.forEach((fn) => fn());
}

export function getScoresSnapshot(): ArcadeScores {
  if (typeof window === 'undefined') return DEFAULT_ARCADE_SCORES;
  if (!cachedScores) {
    cachedScores = loadArcadeScores();
  }
  return cachedScores;
}

export function getServerScoresSnapshot(): ArcadeScores {
  return DEFAULT_ARCADE_SCORES;
}

export function subscribeArcadeScores(listener: () => void): () => void {
  scoreListeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      cachedScores = loadArcadeScores();
      listener();
    }
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', onStorage);
  }
  return () => {
    scoreListeners.delete(listener);
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', onStorage);
    }
  };
}

export type ArcadeSfxType = 'click' | 'eat' | 'merge' | 'win' | 'lose' | 'go' | 'flip';

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedAudioCtx) {
    sharedAudioCtx = new AudioCtx();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

function playSingleOsc(
  ctx: AudioContext,
  freq: number,
  durationSec: number,
  type: OscillatorType,
  gainPeak: number,
  delaySec = 0
): void {
  const start = ctx.currentTime + delaySec;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(gainPeak, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + durationSec);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + durationSec + 0.02);
}

export function playArcadeSfx(kind: ArcadeSfxType, muted: boolean): void {
  if (muted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    switch (kind) {
      case 'click':
        playSingleOsc(ctx, 520, 0.05, 'triangle', 0.05);
        break;
      case 'flip':
        playSingleOsc(ctx, 420, 0.06, 'sine', 0.05);
        break;
      case 'eat':
        playSingleOsc(ctx, 587, 0.07, 'square', 0.04);
        playSingleOsc(ctx, 880, 0.09, 'square', 0.04, 0.05);
        break;
      case 'merge':
        playSingleOsc(ctx, 440, 0.07, 'triangle', 0.06);
        playSingleOsc(ctx, 660, 0.09, 'triangle', 0.05, 0.04);
        break;
      case 'go':
        playSingleOsc(ctx, 988, 0.14, 'sine', 0.07);
        break;
      case 'win':
        playSingleOsc(ctx, 523.25, 0.1, 'triangle', 0.07, 0);
        playSingleOsc(ctx, 659.25, 0.1, 'triangle', 0.07, 0.09);
        playSingleOsc(ctx, 783.99, 0.18, 'triangle', 0.08, 0.18);
        break;
      case 'lose':
        playSingleOsc(ctx, 300, 0.12, 'sawtooth', 0.05, 0);
        playSingleOsc(ctx, 210, 0.2, 'sawtooth', 0.05, 0.11);
        break;
    }
  } catch {
    // ignore Web Audio block errors
  }
}
