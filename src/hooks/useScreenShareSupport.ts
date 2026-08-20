'use client';

import { useState, useEffect } from 'react';

export function useScreenShareSupport() {
  const [isSupported, setIsSupported] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Dispositivos móveis ou navegadores sem getDisplayMedia não suportam compartilhamento de tela
    const supported =
      !!navigator.mediaDevices &&
      typeof navigator.mediaDevices.getDisplayMedia === 'function';

    setIsSupported(supported);
  }, []);

  return isSupported;
}
