'use client';

import { useSyncExternalStore } from 'react';

export const FAVORITES_KEY = 'omnitools_favorites';
export const RECENTS_KEY = 'omnitools_recents';
export const STORAGE_UPDATE_EVENT = 'snaptools-storage-update';
export const MAX_PINNED_TOOLS = 12;

const EMPTY_LIST: string[] = [];

let cachedFavRaw: string | null = null;
let cachedFavList: string[] = [];

let cachedRecentRaw: string | null = null;
let cachedRecentList: string[] = [];

export function subscribeWorkspaceStorage(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(STORAGE_UPDATE_EVENT, cb);
  window.addEventListener('storage', cb);
  return () => {
    window.removeEventListener(STORAGE_UPDATE_EVENT, cb);
    window.removeEventListener('storage', cb);
  };
}

export function getPinnedSnapshot(): string[] {
  if (typeof window === 'undefined') return EMPTY_LIST;
  try {
    const raw = localStorage.getItem(FAVORITES_KEY) || '[]';
    if (raw !== cachedFavRaw) {
      cachedFavRaw = raw;
      const parsed = JSON.parse(raw);
      cachedFavList = Array.isArray(parsed)
        ? parsed.filter((s): s is string => typeof s === 'string').slice(0, MAX_PINNED_TOOLS)
        : [];
    }
    return cachedFavList;
  } catch {
    return EMPTY_LIST;
  }
}

export function getRecentsSnapshot(): string[] {
  if (typeof window === 'undefined') return EMPTY_LIST;
  try {
    const raw = localStorage.getItem(RECENTS_KEY) || '[]';
    if (raw !== cachedRecentRaw) {
      cachedRecentRaw = raw;
      const parsed = JSON.parse(raw);
      cachedRecentList = Array.isArray(parsed)
        ? parsed.filter((s): s is string => typeof s === 'string')
        : [];
    }
    return cachedRecentList;
  } catch {
    return EMPTY_LIST;
  }
}

function getServerEmpty(): string[] {
  return EMPTY_LIST;
}

export function usePinnedSlugs(): string[] {
  return useSyncExternalStore(subscribeWorkspaceStorage, getPinnedSnapshot, getServerEmpty);
}

export function useRecentSlugs(): string[] {
  return useSyncExternalStore(subscribeWorkspaceStorage, getRecentsSnapshot, getServerEmpty);
}

export function savePinnedSlugs(next: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    const clean = Array.from(new Set(next)).slice(0, MAX_PINNED_TOOLS);
    const raw = JSON.stringify(clean);
    cachedFavRaw = raw;
    cachedFavList = clean;
    localStorage.setItem(FAVORITES_KEY, raw);
    window.dispatchEvent(new Event(STORAGE_UPDATE_EVENT));
  } catch {
    // ignore quota errors
  }
}

export function togglePinnedSlug(slug: string): boolean {
  const current = getPinnedSnapshot();
  if (current.includes(slug)) {
    savePinnedSlugs(current.filter((s) => s !== slug));
    return false;
  }
  const updated = [slug, ...current].slice(0, MAX_PINNED_TOOLS);
  savePinnedSlugs(updated);
  return true;
}

export function reorderPinnedSlugs(sourceSlug: string, targetSlug: string): void {
  if (sourceSlug === targetSlug) return;
  const current = [...getPinnedSnapshot()];
  const fromIdx = current.indexOf(sourceSlug);
  const toIdx = current.indexOf(targetSlug);
  if (fromIdx === -1 || toIdx === -1) return;
  const [moved] = current.splice(fromIdx, 1);
  current.splice(toIdx, 0, moved);
  savePinnedSlugs(current);
}

export function recordRecentSlug(slug: string): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getRecentsSnapshot();
    const updated = [slug, ...current.filter((s) => s !== slug)].slice(0, 15);
    const raw = JSON.stringify(updated);
    cachedRecentRaw = raw;
    cachedRecentList = updated;
    localStorage.setItem(RECENTS_KEY, raw);
    window.dispatchEvent(new Event(STORAGE_UPDATE_EVENT));
  } catch {
    // ignore
  }
}

export function clearLocalWorkspaceCache(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(FAVORITES_KEY);
    localStorage.removeItem(RECENTS_KEY);
    cachedFavRaw = '[]';
    cachedFavList = [];
    cachedRecentRaw = '[]';
    cachedRecentList = [];
    window.dispatchEvent(new Event(STORAGE_UPDATE_EVENT));
  } catch {
    // ignore
  }
}
