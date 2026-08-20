'use client';

import React from 'react';
import { useConnectionState } from '@livekit/components-react';
import { ConnectionState } from 'livekit-client';
import { useCallTimer } from '@/hooks/useCallTimer';
import { Clock, Volume2, LogOut } from 'lucide-react';

interface RoomHeaderProps {
  onLeave: () => void;
}

export function RoomHeader({ onLeave }: RoomHeaderProps) {
  const state = useConnectionState();
  const isConnected = state === ConnectionState.Connected;
  const { formattedTime } = useCallTimer(isConnected);

  const renderStateBadge = () => {
    switch (state) {
      case ConnectionState.Connected:
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#23a55a]/10 border border-[#23a55a]/30 text-[#23a55a] text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-[#23a55a] animate-pulse" />
            Voz Conectada
          </div>
        );
      case ConnectionState.Reconnecting:
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f0b232]/10 border border-[#f0b232]/30 text-[#f0b232] text-xs font-bold animate-pulse">
            <span className="w-2 h-2 rounded-full bg-[#f0b232]" />
            Reconectando...
          </div>
        );
      case ConnectionState.Connecting:
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#5865F2]/10 border border-[#5865F2]/30 text-[#5865F2] text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-[#5865F2] animate-ping" />
            Conectando RTC...
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#23a55a]/10 border border-[#23a55a]/30 text-[#23a55a] text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-[#23a55a] animate-pulse" />
            Voz Conectada
          </div>
        );
    }
  };

  return (
    <header className="h-14 px-4 md:px-6 bg-[#2b2d31] border-b border-[#1e1f22] flex items-center justify-between z-20 select-none">
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
      <div className="flex items-center gap-3 md:gap-4">
        {renderStateBadge()}

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
