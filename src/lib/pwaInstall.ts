'use client';

import { useSyncExternalStore } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const PWA_EVENT = 'snaptools-pwa-state';

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let installedFlag = false;
let initialized = false;

function notifyPwa() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(PWA_EVENT));
  }
}

export function initPwaInstallListener(): void {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  if (window.matchMedia?.('(display-mode: standalone)').matches) {
    installedFlag = true;
  }

  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    notifyPwa();
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    installedFlag = true;
    notifyPwa();
  });
}

function subscribePwa(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  initPwaInstallListener();
  window.addEventListener(PWA_EVENT, cb);
  return () => window.removeEventListener(PWA_EVENT, cb);
}

function getCanInstall(): boolean {
  return Boolean(deferredPrompt);
}

function getIsInstalled(): boolean {
  return installedFlag;
}

export function usePwaInstallStatus(): { canPrompt: boolean; isInstalled: boolean } {
  const canPrompt = useSyncExternalStore(subscribePwa, getCanInstall, () => false);
  const isInstalled = useSyncExternalStore(subscribePwa, getIsInstalled, () => false);
  return { canPrompt, isInstalled };
}

export async function triggerPwaInstall(): Promise<'prompted' | 'installed' | 'manual'> {
  if (installedFlag) return 'installed';
  if (!deferredPrompt) return 'manual';
  await deferredPrompt.prompt();
  const choice = await deferredPrompt.userChoice;
  deferredPrompt = null;
  if (choice.outcome === 'accepted') {
    installedFlag = true;
    notifyPwa();
    return 'installed';
  }
  notifyPwa();
  return 'prompted';
}
