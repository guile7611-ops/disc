'use client';

import React, { useState, useEffect } from 'react';
import { useConnectionState, useRoomContext } from '@livekit/components-react';
import { ConnectionState } from 'livekit-client';
import { useCallTimer } from '@/hooks/useCallTimer';
import { Clock, Volume2, LogOut, Download } from 'lucide-react';

interface RoomHeaderProps {
  onLeave: () => void;
}

export function RoomHeader({ onLeave }: RoomHeaderProps) {
  const connectionState = useConnectionState();
  const room = useRoomContext();
  const [isWeb, setIsWeb] = useState(false);

  useEffect(() => {
    // Detecta se a aplicação está rodando na Web (não no Electron Desktop)
    if (typeof window !== 'undefined' && !window.electronAPI?.isElectron) {
      setIsWeb(true);
    }
  }, []);

  const isConnected =
    connectionState === ConnectionState.Connected ||
    room?.state === ConnectionState.Connected;

  const isConnecting =
    connectionState === ConnectionState.Connecting ||
    room?.state === ConnectionState.Connecting;

  const isReconnecting =
    connectionState === ConnectionState.Reconnecting ||
    room?.state === ConnectionState.Reconnecting;

  const { formattedTime } = useCallTimer(isConnected);

  const handleDownloadApp = () => {
    // Redireciona para os releases mais recentes do GitHub / download do executável
    window.open('https://github.com/guile7611-ops/disc/releases', '_blank');
  };

  const renderStateBadge = () => {
    if (isConnected) {
      return (
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#23a55a]/10 border border-[#23a55a]/30 text-[#23a55a] text-xs font-bold">
          <span className="w-2 h-2 rounded-full bg-[#23a55a] animate-pulse" />
          Voz Conectada
        </div>
      );
    }

    if (isReconnecting) {
      return (
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f0b232]/10 border border-[#f0b232]/30 text-[#f0b232] text-xs font-bold animate-pulse">
          <span className="w-2 h-2 rounded-full bg-[#f0b232]" />
          Reconectando...
        </div>
      );
    }

    if (isConnecting) {
      return (
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#5865F2]/10 border border-[#5865F2]/30 text-[#5865F2] text-xs font-bold">
          <span className="w-2 h-2 rounded-full bg-[#5865F2] animate-ping" />
          Conectando...
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#23a55a]/10 border border-[#23a55a]/30 text-[#23a55a] text-xs font-bold">
        <span className="w-2 h-2 rounded-full bg-[#23a55a] animate-pulse" />
        Voz Conectada
      </div>
    );
  };

  return (
    <header className="h-14 px-4 md:px-6 bg-[#2b2d31] border-b border-[#1e1f22] flex items-center justify-between z-20 select-none shrink-0">
      {/* Nome do Canal no Estilo Discord */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#1e1f22] flex items-center justify-center text-[#949ba4]">
          <Volume2 className="w-5 h-5 text-[#23a55a]" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-[#f2f3f5] flex items-center gap-2">
            <span>sala-principal</span>
            <span className="px-1.5 py-0.2 rounded bg-[#5865F2]/20 text-[#5865F2] text-[10px] uppercase font-extrabold">
              1080p 60 FPS HD
            </span>
          </h1>
          <p className="text-[11px] text-[#949ba4]">Canal público de voz e telas simultâneas</p>
        </div>
      </div>

      {/* Lado Direito: Status e Ações */}
      <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
        {renderStateBadge()}

        {/* Botão Baixar App Desktop - Exibido APENAS quando acessado no Navegador Web */}
        {isWeb && (
          <button
            onClick={handleDownloadApp}
            title="Baixar Aplicativo Desktop para Windows"
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#5865F2]/20 hover:bg-[#5865F2] border border-[#5865F2]/40 text-[#5865F2] hover:text-white text-xs font-bold transition-all cursor-pointer shadow-sm group"
          >
            <Download className="w-3.5 h-3.5 group-hover:animate-bounce" />
            <span className="hidden sm:inline">Baixar App Desktop</span>
          </button>
        )}

        {/* Cronômetro */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#1e1f22] text-[#dbdee1] text-xs font-mono border border-[#313338]">
          <Clock className="w-3.5 h-3.5 text-[#949ba4]" />
          <span>{formattedTime}</span>
        </div>

        {/* Botão Sair Rápido */}
        <button
          onClick={onLeave}
          title="Desconectar da sala"
          className="p-2 rounded-md bg-[#f23f43]/10 hover:bg-[#f23f43]/20 border border-[#f23f43]/30 text-[#f23f43] transition-colors text-xs font-bold flex items-center gap-1.5 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden md:inline">Sair</span>
        </button>
      </div>
    </header>
  );
}
