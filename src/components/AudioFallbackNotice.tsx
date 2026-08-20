'use client';

import React from 'react';
import { useAudioPlayback } from '@livekit/components-react';
import { Volume2, VolumeX } from 'lucide-react';

export function AudioFallbackNotice() {
  const { canPlayAudio, startAudio } = useAudioPlayback();

  if (canPlayAudio) {
    return null;
  }

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-amber-500/90 text-slate-950 font-medium px-4 py-2.5 rounded-xl shadow-xl backdrop-blur-md border border-amber-400 flex items-center gap-3 animate-bounce">
      <VolumeX className="w-5 h-5 shrink-0" />
      <span className="text-xs sm:text-sm">
        O navegador bloqueou a reprodução automática do áudio da chamada.
      </span>
      <button
        onClick={startAudio}
        className="px-3 py-1 rounded-lg bg-slate-950 text-amber-400 text-xs font-semibold hover:bg-slate-900 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
      >
        <Volume2 className="w-3.5 h-3.5" />
        <span>Liberar áudio</span>
      </button>
    </div>
  );
}
