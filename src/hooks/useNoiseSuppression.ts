'use client';

import { useState, useEffect, useCallback } from 'react';

export type NoiseSuppressionMode = 'high_rnnoise' | 'medium' | 'low' | 'off';

export interface NoiseSuppressionOption {
  id: NoiseSuppressionMode;
  label: string;
  badge: string;
  description: string;
}

export const NOISE_SUPPRESSION_OPTIONS: NoiseSuppressionOption[] = [
  {
    id: 'high_rnnoise',
    label: 'IA RNNoise (Inteligente)',
    badge: 'Máximo',
    description: 'Elimina cliques de teclado, ventiladores e ruídos fortes de fundo.',
  },
  {
    id: 'medium',
    label: 'Nativo Médio (Padrão)',
    badge: 'Equilibrado',
    description: 'Filtro padrão de ruído com voz clara e equilibrada.',
  },
  {
    id: 'low',
    label: 'Nativo Baixo (Suave)',
    badge: 'Leve',
    description: 'Redução leve para preservar o tom natural da voz e instrumentos.',
  },
  {
    id: 'off',
    label: 'Desativado (Áudio Puro)',
    badge: 'Desligado',
    description: 'Sem supressão de ruído. Ideal para microfones de estúdio.',
  },
];

const STORAGE_KEY = 'sala_noise_suppression_mode';

export function useNoiseSuppression() {
  const [mode, setModeState] = useState<NoiseSuppressionMode>('high_rnnoise');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY) as NoiseSuppressionMode | null;
      if (saved && ['high_rnnoise', 'medium', 'low', 'off'].includes(saved)) {
        setModeState(saved);
      }
    }
  }, []);

  const setMode = useCallback((newMode: NoiseSuppressionMode) => {
    setModeState(newMode);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, newMode);
    }
  }, []);

  const getAudioConstraints = useCallback((): MediaTrackConstraints => {
    switch (mode) {
      case 'high_rnnoise':
        return {
          noiseSuppression: true,
          echoCancellation: true,
          autoGainControl: true,
        };
      case 'medium':
        return {
          noiseSuppression: true,
          echoCancellation: true,
          autoGainControl: true,
        };
      case 'low':
        return {
          noiseSuppression: true,
          echoCancellation: true,
          autoGainControl: false,
        };
      case 'off':
        return {
          noiseSuppression: false,
          echoCancellation: false,
          autoGainControl: false,
        };
      default:
        return {
          noiseSuppression: true,
          echoCancellation: true,
          autoGainControl: true,
        };
    }
  }, [mode]);

  return {
    mode,
    setMode,
    getAudioConstraints,
    options: NOISE_SUPPRESSION_OPTIONS,
  };
}
