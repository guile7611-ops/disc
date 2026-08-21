'use client';

import React, { useState } from 'react';
import { useLocalParticipant, useRoomContext } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { useScreenShareSupport } from '@/hooks/useScreenShareSupport';
import { Mic, MicOff, Monitor, MonitorOff, PhoneOff, Loader2, Volume2 } from 'lucide-react';

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
        audio: true, // Captura áudio do sistema
        resolution: {
          width: 1920,
          height: 1080,
          frameRate: 60,
        },
        contentHint: 'motion', // Prioriza 60 FPS e fluidez para jogos e vídeos
      });

      // Se estiver iniciando o compartilhamento, força os parâmetros WebRTC para 10 Mbps e 60 FPS sem queda
      if (nextState) {
        setTimeout(() => {
          try {
            const screenTrackPub = localParticipant.getTrackPublication(Track.Source.ScreenShare);
            if (screenTrackPub && screenTrackPub.track) {
              const sender = screenTrackPub.track.sender;
              if (sender && typeof sender.getParameters === 'function') {
                const params = sender.getParameters();
                if (params && params.encodings && params.encodings.length > 0) {
                  params.encodings[0].maxBitrate = 10_000_000; // 10 Mbps ultra-hd
                  params.encodings[0].maxFramerate = 60;
                  params.degradationPreference = 'maintain-framerate';
                  sender.setParameters(params).catch(() => {});
                }
              }
            }
          } catch (e) {
            console.error('Aviso ao ajustar WebRTC sender:', e);
          }
        }, 600);
      }
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
    <footer className="h-20 bg-[#232428] border-t border-[#1e1f22] px-4 md:px-6 flex items-center justify-between z-20 shrink-0 select-none relative">
      {/* Indicador de Status da Voz - Estilo Discord */}
      <div className="hidden sm:flex items-center gap-3 min-w-48">
        <div className="w-9 h-9 rounded-full bg-[#2b2d31] flex items-center justify-center text-[#23a55a]">
          <Volume2 className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <p className="text-xs font-bold text-[#23a55a] flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#23a55a] animate-ping" />
            Voz Conectada
          </p>
          <p className="text-[11px] text-[#949ba4] truncate max-w-36">
            Sala principal / Full HD 60fps
          </p>
        </div>
      </div>

      {/* Botões Centrais de Controle */}
      <div className="flex items-center gap-3 mx-auto sm:mx-0">
        {/* Botão Microfone */}
        <div className="relative group">
          <button
            onClick={toggleMicrophone}
            disabled={isMicLoading}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isMicrophoneEnabled
                ? 'bg-[#313338] hover:bg-[#3b3e45] text-[#dbdee1] border border-[#3f4248]'
                : 'bg-[#f23f43] hover:bg-[#d83a3e] text-white shadow-lg shadow-rose-950/40'
            }`}
            aria-label={isMicrophoneEnabled ? 'Desativar microfone' : 'Ativar microfone'}
          >
            {isMicLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-[#949ba4]" />
            ) : isMicrophoneEnabled ? (
              <Mic className="w-5 h-5" />
            ) : (
              <MicOff className="w-5 h-5" />
            )}
          </button>
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-[#111214] text-[#dbdee1] text-xs px-3 py-1.5 rounded-md border border-[#2b2d31] whitespace-nowrap shadow-xl">
            {isMicrophoneEnabled ? 'Desativar microfone' : 'Ativar microfone'}
          </div>
        </div>

        {/* Botão Compartilhar Tela (Full HD 1080p 60 FPS) */}
        <div className="relative group">
          <button
            onClick={toggleScreenShare}
            disabled={isScreenLoading || !isScreenShareSupported}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              !isScreenShareSupported
                ? 'bg-[#1e1f22] text-[#4e5058] border border-[#2b2d31] cursor-not-allowed'
                : isScreenShareEnabled
                ? 'bg-[#23a55a] hover:bg-[#1d8a4b] text-white shadow-lg shadow-emerald-950/40 border border-[#23a55a]'
                : 'bg-[#313338] hover:bg-[#3b3e45] text-[#dbdee1] border border-[#3f4248]'
            }`}
            aria-label={isScreenShareEnabled ? 'Interromper compartilhamento' : 'Compartilhar tela (Full HD 1080p 60 FPS)'}
          >
            {isScreenLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-[#949ba4]" />
            ) : isScreenShareEnabled ? (
              <MonitorOff className="w-5 h-5" />
            ) : (
              <Monitor className="w-5 h-5" />
            )}
          </button>
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-[#111214] text-[#dbdee1] text-xs px-3 py-1.5 rounded-md border border-[#2b2d31] whitespace-nowrap shadow-xl">
            {!isScreenShareSupported
              ? 'Compartilhamento de tela indisponível no dispositivo'
              : isScreenShareEnabled
              ? 'Interromper compartilhamento'
              : 'Compartilhar tela (Full HD 1920x1080 @ 60 FPS)'}
          </div>
        </div>

        {/* Botão Desconectar */}
        <div className="relative group">
          <button
            onClick={handleDisconnect}
            className="w-12 h-12 rounded-full bg-[#f23f43] hover:bg-[#d83a3e] text-white flex items-center justify-center transition-all shadow-lg shadow-rose-950/50 cursor-pointer"
            aria-label="Desconectar da chamada"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-[#111214] text-[#dbdee1] text-xs px-3 py-1.5 rounded-md border border-[#2b2d31] whitespace-nowrap shadow-xl">
            Desconectar da chamada
          </div>
        </div>
      </div>

      {/* Espaçador para alinhamento */}
      <div className="hidden sm:block min-w-48 text-right text-xs text-[#949ba4]">
        Full HD (1080p @ 60 FPS)
      </div>
    </footer>
  );
}
