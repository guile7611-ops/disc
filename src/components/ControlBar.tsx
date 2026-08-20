'use client';

import React, { useState } from 'react';
import { useLocalParticipant, useRoomContext } from '@livekit/components-react';
import { useScreenShareSupport } from '@/hooks/useScreenShareSupport';
import { Mic, MicOff, Monitor, MonitorOff, PhoneOff, Loader2 } from 'lucide-react';

interface ControlBarProps {
  onLeave: () => void;
}

export function ControlBar({ onLeave }: ControlBarProps) {
  const room = useRoomContext();
  const { localParticipant, isMicrophoneEnabled, isScreenShareEnabled } = useLocalParticipant();
  const isScreenShareSupported = useScreenShareSupport();

  const [isMicLoading, setIsMicLoading] = useState(false);
  const [isScreenLoading, setIsScreenLoading] = useState(false);

  const toggleMicrophone = async () => {
    if (!localParticipant || isMicLoading) return;
    setIsMicLoading(true);
    try {
      const nextState = !isMicrophoneEnabled;
      await localParticipant.setMicrophoneEnabled(nextState, {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      });
    } catch (err) {
      console.error('Erro ao alternar microfone:', err);
    } finally {
      setIsMicLoading(false);
    }
  };

  const toggleScreenShare = async () => {
    if (!localParticipant || isScreenLoading || !isScreenShareSupported) return;
    setIsScreenLoading(true);
    try {
      const nextState = !isScreenShareEnabled;
      await localParticipant.setScreenShareEnabled(nextState, {
        audio: true, // Solicita áudio do sistema quando suportado pelo navegador
        resolution: {
          width: 1920,
          height: 1080,
          frameRate: 30,
        },
        contentHint: 'detail', // Otimizado para nitidez de texto e código
      });
    } catch (err) {
      console.error('Erro ao alternar compartilhamento de tela:', err);
    } finally {
      setIsScreenLoading(false);
    }
  };

  const handleDisconnect = () => {
    room?.disconnect();
    onLeave();
  };

  return (
    <footer className="h-20 bg-slate-900/90 backdrop-blur-md border-t border-slate-800 px-4 flex items-center justify-center gap-4 z-20 shrink-0">
      {/* Botão Microfone */}
      <div className="relative group">
        <button
          onClick={toggleMicrophone}
          disabled={isMicLoading}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
            isMicrophoneEnabled
              ? 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700'
              : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/40'
          }`}
          aria-label={isMicrophoneEnabled ? 'Desativar microfone' : 'Ativar microfone'}
        >
          {isMicLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
          ) : isMicrophoneEnabled ? (
            <Mic className="w-5 h-5" />
          ) : (
            <MicOff className="w-5 h-5" />
          )}
        </button>
        {/* Tooltip em Português */}
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-950 text-slate-200 text-xs px-2.5 py-1 rounded-md border border-slate-800 whitespace-nowrap shadow-lg">
          {isMicrophoneEnabled ? 'Desativar microfone' : 'Ativar microfone'}
        </div>
      </div>

      {/* Botão Compartilhar Tela */}
      <div className="relative group">
        <button
          onClick={toggleScreenShare}
          disabled={isScreenLoading || !isScreenShareSupported}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
            !isScreenShareSupported
              ? 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
              : isScreenShareEnabled
              ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 border border-indigo-500'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700'
          }`}
          aria-label={isScreenShareEnabled ? 'Interromper compartilhamento' : 'Compartilhar tela'}
        >
          {isScreenLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
          ) : isScreenShareEnabled ? (
            <MonitorOff className="w-5 h-5" />
          ) : (
            <Monitor className="w-5 h-5" />
          )}
        </button>
        {/* Tooltip em Português */}
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-950 text-slate-200 text-xs px-2.5 py-1 rounded-md border border-slate-800 whitespace-nowrap shadow-lg">
          {!isScreenShareSupported
            ? 'O compartilhamento de tela não é suportado neste navegador/dispositivo móvel'
            : isScreenShareEnabled
            ? 'Interromper compartilhamento'
            : 'Compartilhar tela (1080p@30fps)'}
        </div>
      </div>

      {/* Botão Sair da Chamada */}
      <div className="relative group">
        <button
          onClick={handleDisconnect}
          className="w-12 h-12 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center transition-all shadow-lg shadow-rose-600/30 border border-rose-500 cursor-pointer"
          aria-label="Sair da chamada"
        >
          <PhoneOff className="w-5 h-5" />
        </button>
        {/* Tooltip em Português */}
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-950 text-slate-200 text-xs px-2.5 py-1 rounded-md border border-slate-800 whitespace-nowrap shadow-lg">
          Sair da chamada
        </div>
      </div>
    </footer>
  );
}
