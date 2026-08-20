'use client';

import React, { useState, useEffect } from 'react';
import { useTracks, VideoTrack } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { Monitor, Share2, User } from 'lucide-react';

export function ScreenShareArea() {
  // Busca todas as faixas ativas de compartilhamento de tela
  const screenShareTracks = useTracks([Track.Source.ScreenShare]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  // Reseta ou ajusta o índice selecionado se a lista mudar
  useEffect(() => {
    if (selectedIndex >= screenShareTracks.length) {
      setSelectedIndex(Math.max(0, screenShareTracks.length - 1));
    }
  }, [screenShareTracks.length, selectedIndex]);

  // Se ninguém estiver compartilhando a tela
  if (screenShareTracks.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-slate-950 relative overflow-hidden">
        <div className="w-20 h-20 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 shadow-xl shadow-indigo-950/30">
          <Monitor className="w-10 h-10" />
        </div>
        <h3 className="text-lg font-semibold text-slate-200 mb-1">
          Nenhum compartilhamento de tela ativo
        </h3>
        <p className="text-sm text-slate-400 max-w-sm">
          Clique no botão <span className="text-indigo-400 font-medium">Compartilhar tela</span> na barra inferior para transmitir sua tela, código ou apresentação para a sala.
        </p>
      </div>
    );
  }

  const activeTrack = screenShareTracks[selectedIndex];
  const participantName = activeTrack?.participant?.name || 'Participante';

  return (
    <div className="flex-1 bg-black flex flex-col relative overflow-hidden">
      {/* Seletor de Telas se houver mais de uma transmissão */}
      {screenShareTracks.length > 1 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-slate-900/90 backdrop-blur-md border border-slate-800 p-1.5 rounded-xl flex items-center gap-1.5 shadow-2xl">
          <span className="text-xs text-slate-400 px-2 font-medium flex items-center gap-1">
            <Share2 className="w-3.5 h-3.5 text-indigo-400" />
            Transmissões ({screenShareTracks.length}):
          </span>
          {screenShareTracks.map((t, idx) => {
            const isSelected = idx === selectedIndex;
            const name = t.participant?.name || `Tela ${idx + 1}`;
            return (
              <button
                key={t.participant.identity + t.publication?.trackSid}
                onClick={() => setSelectedIndex(idx)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {name}
              </button>
            );
          })}
        </div>
      )}

      {/* Banner Superior com o Nome de Quem Compartilha */}
      {screenShareTracks.length === 1 && (
        <div className="absolute top-4 left-4 z-20 bg-slate-900/80 backdrop-blur-md border border-slate-800/80 px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs text-slate-200 shadow-lg">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          <User className="w-3.5 h-3.5 text-indigo-400" />
          <span>Tela de <strong className="font-semibold text-white">{participantName}</strong></span>
        </div>
      )}

      {/* Área Principal de Exibição do Vídeo */}
      <div className="w-full h-full flex items-center justify-center relative">
        {activeTrack && (
          <VideoTrack
            trackRef={activeTrack}
            className="w-full h-full object-contain max-h-full max-w-full"
          />
        )}
      </div>
    </div>
  );
}
