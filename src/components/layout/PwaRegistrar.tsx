'use client';

import { useEffect } from 'react';
import { initPwaInstallListener } from '@/lib/pwaInstall';

export default function PwaRegistrar() {
  useEffect(() => {
    initPwaInstallListener();
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
        // ignore registration errors on unsupported contexts
      });
    } else if ('serviceWorker' in navigator && window.location.hostname === 'localhost') {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {});
    }
  }, []);

  return null;
}
