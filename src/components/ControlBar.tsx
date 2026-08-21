'use client';

import React, { useState } from 'react';
import { useLocalParticipant, useRoomContext } from '@livekit/components-react';
import { useScreenShareSupport } from '@/hooks/useScreenShareSupport';
import { Mic, MicOff, Monitor, MonitorOff, PhoneOff, Loader2, Volume2, Info } from 'lucide-react';

interface ControlBarProps {
  onLeave: () => void;
}

export function ControlBar({ onLeave }: ControlBarProps) {
  const room = useRoomContext();
  const { localParticipant, isMicrophoneEnabled, isScreenShareEnabled } = useLocalParticipant();
  const isScreenShareSupported = useScreenShareSupport();

  const [isMicLoading, setIsMicLoading] = useState(false);
  const [isScreenLoading, setIsScreenLoading] = useState(false);
  const [showTip, setShowTip] = useState(false);

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
      if (nextState) {
        setShowTip(true); // Exibe dica para remover a borda amarela do Windows
      }
      await localParticipant.setScreenShareEnabled(nextState, {
        audio: true, // Captura áudio do sistema
        resolution: {
          width: 1920,
          height: 1080,
          frameRate: 60,
        },
        contentHint: 'motion', // 'motion' otimiza para 60 FPS dinâmico de jogos e vídeos
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
    <footer className="h-20 bg-[#232428] border-t border-[#1e1f22] px-4 md:px-6 flex items-center justify-between z-20 shrink-0 select-none relative">
      {/* Toast Informativo de Dica de Tela Inteira para Remover Borda Amarela */}
      {showTip && isScreenShareEnabled && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-50 bg-[#111214] text-[#dbdee1] border border-[#23a55a] p-3 rounded-xl shadow-2xl max-w-md text-xs flex items-start gap-3 animate-in slide-in-from-bottom-2">
          <Info className="w-5 h-5 text-[#23a55a] shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <p className="font-bold text-white">Dica para Transmissão Full HD 60 FPS sem borda amarela:</p>
            <p className="text-[#949ba4]">
              No popup do seu navegador, escolha <strong className="text-[#23a55a]">&quot;Tela Inteira&quot;</strong> (Monitor) em vez de &quot;Janela de Aplicativo&quot;. O Windows remove a borda amarela e transmite em 1080p 60 FPS nativo.
            </p>
          </div>
          <button
            onClick={() => setShowTip(false)}
            className="text-[#949ba4] hover:text-white font-bold text-sm px-1"
          >
            ✕
          </button>
        </div>
      )}

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
