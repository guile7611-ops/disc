'use client';

import React from 'react';
import { useRoomContext } from '@livekit/components-react';
import { ConnectionState } from 'livekit-client';
import { useCallTimer } from '@/hooks/useCallTimer';
import { Clock, Signal, Radio, LogOut } from 'lucide-react';

interface RoomHeaderProps {
  onLeave: () => void;
}

export function RoomHeader({ onLeave }: RoomHeaderProps) {
  const room = useRoomContext();
  const state = room?.state ?? ConnectionState.Disconnected;
  const isConnected = state === ConnectionState.Connected;
  const { formattedTime } = useCallTimer(isConnected);

  const renderStateBadge = () => {
    switch (state) {
      case ConnectionState.Connected:
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Conectado
          </div>
        );
      case ConnectionState.Reconnecting:
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium animate-pulse">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Reconectando...
          </div>
        );
      case ConnectionState.Connecting:
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
            Conectando...
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            Desconectado
          </div>
        );
    }
  };

  return (
    <header className="h-16 px-4 md:px-6 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between z-20">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
          <Radio className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <h1 className="text-base font-bold text-slate-100 flex items-center gap-2">
            Sala principal
          </h1>
          <p className="text-xs text-slate-400">Canal permanente de voz e tela</p>
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-4">
        {/* Badge de Conexão */}
        {renderStateBadge()}

        {/* Cronômetro */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-xs font-mono">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{formattedTime}</span>
        </div>

        {/* Botão Sair Rápido */}
        <button
          onClick={onLeave}
          title="Sair da sala"
          className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 transition-colors text-xs font-medium flex items-center gap-1.5 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden md:inline">Sair</span>
        </button>
      </div>
    </header>
  );
}
