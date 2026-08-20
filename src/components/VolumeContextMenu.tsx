'use client';

import React, { useEffect, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface VolumeContextMenuProps {
  x: number;
  y: number;
  participantName: string;
  volume: number; // 0 a 200
  isMuted: boolean;
  onVolumeChange: (newVolume: number) => void;
  onToggleMute: () => void;
  onClose: () => void;
}

export function VolumeContextMenu({
  x,
  y,
  participantName,
  volume,
  isMuted,
  onVolumeChange,
  onToggleMute,
  onClose,
}: VolumeContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Garante que o menu não saia da tela
  const adjustedX = Math.min(x, typeof window !== 'undefined' ? window.innerWidth - 220 : x);
  const adjustedY = Math.min(y, typeof window !== 'undefined' ? window.innerHeight - 180 : y);

  return (
    <div
      ref={menuRef}
      style={{ top: `${adjustedY}px`, left: `${adjustedX}px` }}
      className="fixed z-50 w-56 bg-[#111214] border border-[#2b2d31] rounded-xl shadow-2xl p-3 text-[#dbdee1] select-none animate-in fade-in zoom-in-95 duration-100"
    >
      {/* Cabeçalho */}
      <div className="pb-2 border-b border-[#1e1f22] mb-3">
        <p className="text-[11px] font-bold text-[#949ba4] uppercase tracking-wider">
          Ajuste de Áudio
        </p>
        <p className="text-xs font-bold text-white truncate">{participantName}</p>
      </div>

      {/* Controle de Volume */}
      <div className="space-y-2 mb-3">
        <div className="flex justify-between items-center text-xs">
          <span className="text-[#949ba4] font-medium flex items-center gap-1">
            <Volume2 className="w-3.5 h-3.5 text-[#5865F2]" /> Volume do Usuário
          </span>
          <span className="font-bold text-[#23a55a]">{isMuted ? 'Muted' : `${Math.round(volume)}%`}</span>
        </div>

        <input
          type="range"
          min="0"
          max="200"
          step="5"
          value={isMuted ? 0 : volume}
          onChange={(e) => onVolumeChange(Number(e.target.value))}
          className="w-full h-2 bg-[#2b2d31] rounded-lg appearance-none cursor-pointer accent-[#5865F2]"
        />
        <div className="flex justify-between text-[10px] text-[#949ba4]">
          <span>0%</span>
          <span>100%</span>
          <span>200%</span>
        </div>
      </div>

      {/* Botão de Mudar Mudo Local */}
      <button
        onClick={onToggleMute}
        className={`w-full py-1.5 px-3 rounded-md text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
          isMuted
            ? 'bg-[#23a55a] text-white hover:bg-[#1d8a4b]'
            : 'bg-[#f23f43]/10 text-[#f23f43] hover:bg-[#f23f43]/20 border border-[#f23f43]/30'
        }`}
      >
        {isMuted ? (
          <>
            <Volume2 className="w-3.5 h-3.5" />
            <span>Desmutar para Você</span>
          </>
        ) : (
          <>
            <VolumeX className="w-3.5 h-3.5" />
            <span>Mutar para Você</span>
          </>
        )}
      </button>
    </div>
  );
}
