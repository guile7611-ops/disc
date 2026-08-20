'use client';

import React, { useState } from 'react';
import { useParticipants, useLocalParticipant } from '@livekit/components-react';
import { RemoteParticipant } from 'livekit-client';
import { VolumeContextMenu } from '@/components/VolumeContextMenu';
import { Users, Mic, MicOff, Monitor, Volume2, User, VolumeX } from 'lucide-react';

export function ParticipantList() {
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    participant: RemoteParticipant;
  } | null>(null);

  const [volumes, setVolumes] = useState<Record<string, number>>({});
  const [mutedStates, setMutedStates] = useState<Record<string, boolean>>({});

  const handleContextMenu = (e: React.MouseEvent, p: RemoteParticipant) => {
    e.preventDefault();
    if (p.identity === localParticipant.identity) return; // Não abre menu de volume para si mesmo

    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      participant: p,
    });
  };

  const handleVolumeChange = (p: RemoteParticipant, newVolume: number) => {
    setVolumes((prev) => ({ ...prev, [p.identity]: newVolume }));

    // Aplica o volume na API do LiveKit (1.0 = 100%, 2.0 = 200%)
    try {
      if (typeof p.setVolume === 'function') {
        p.setVolume(newVolume / 100);
      }
    } catch (err) {
      console.error('Erro ao ajustar volume do participante:', err);
    }
  };

  const handleToggleMute = (p: RemoteParticipant) => {
    const isCurrentlyMuted = !!mutedStates[p.identity];
    const nextMuted = !isCurrentlyMuted;

    setMutedStates((prev) => ({ ...prev, [p.identity]: nextMuted }));

    try {
      if (typeof p.setVolume === 'function') {
        p.setVolume(nextMuted ? 0 : (volumes[p.identity] ?? 100) / 100);
      }
    } catch (err) {
      console.error('Erro ao mutar participante:', err);
    }
  };

  return (
    <aside className="w-full md:w-72 bg-[#2b2d31] border-t md:border-t-0 md:border-l border-[#1e1f22] flex flex-col h-64 md:h-full z-10 shrink-0 select-none">
      {/* Cabeçalho do Painel no Estilo Discord */}
      <div className="px-4 py-3 border-b border-[#1e1f22] flex items-center justify-between bg-[#2b2d31]">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-[#949ba4]" />
          <h2 className="text-xs font-bold text-[#949ba4] uppercase tracking-wider">
            Membros Online — {participants.length}
          </h2>
        </div>
        <span className="text-[10px] text-[#949ba4]">Clique c/ botão direito p/ volume</span>
      </div>

      {/* Lista de Participantes */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {participants.map((p) => {
          const isLocal = p.identity === localParticipant.identity;
          const isMicEnabled = p.isMicrophoneEnabled;
          const isSpeaking = p.isSpeaking;
          const isScreenSharing = p.isScreenShareEnabled;
          const userVolume = volumes[p.identity] ?? 100;
          const isLocallyMuted = !!mutedStates[p.identity];

          return (
            <div
              key={p.identity}
              onContextMenu={(e) => !isLocal && handleContextMenu(e, p as RemoteParticipant)}
              title={!isLocal ? 'Clique com o botão direito para ajustar volume ou mutar' : ''}
              className={`p-2 rounded-md transition-all flex items-center justify-between group cursor-pointer ${
                isSpeaking
                  ? 'bg-[#35373c] border-l-4 border-[#23a55a]'
                  : 'hover:bg-[#35373c]/70'
              }`}
            >
              {/* Avatar + Nome + Anel de Voz Piscante */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="relative shrink-0">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-xs transition-all ${
                      isSpeaking
                        ? 'bg-[#23a55a] text-white ring-4 ring-[#23a55a]/50 animate-pulse scale-105 shadow-md shadow-[#23a55a]/40'
                        : 'bg-[#5865F2] text-white'
                    }`}
                  >
                    {p.name ? p.name.substring(0, 2).toUpperCase() : <User className="w-4 h-4" />}
                  </div>

                  {/* Indicador de Status Verde Piscante no canto do avatar */}
                  {isSpeaking && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#23a55a] border-2 border-[#2b2d31] animate-ping" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-sm font-medium truncate ${
                        isSpeaking ? 'text-[#23a55a] font-bold' : 'text-[#dbdee1]'
                      }`}
                    >
                      {p.name || 'Participante'}
                    </span>
                    {isLocal && (
                      <span className="px-1.5 py-0.2 rounded bg-[#5865F2]/20 text-[#5865F2] text-[10px] font-bold uppercase">
                        Você
                      </span>
                    )}
                    {!isLocal && (userVolume !== 100 || isLocallyMuted) && (
                      <span className="px-1 py-0.2 rounded bg-[#313338] text-[#23a55a] text-[10px] font-mono font-bold">
                        {isLocallyMuted ? 'Muted' : `${userVolume}%`}
                      </span>
                    )}
                  </div>

                  {/* Badges de Entrada de Voz e Compartilhamento de Tela */}
                  <div className="flex items-center gap-2 mt-0.5">
                    {isSpeaking && (
                      <span className="text-[11px] text-[#23a55a] font-semibold flex items-center gap-1 animate-pulse">
                        <Volume2 className="w-3 h-3 animate-spin" />
                        Falando...
                      </span>
                    )}
                    {isScreenSharing && (
                      <span className="text-[11px] text-[#5865F2] font-semibold flex items-center gap-1">
                        <Monitor className="w-3 h-3" />
                        Ao Vivo (1080p60)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Status do Microfone */}
              <div className="ml-2 shrink-0">
                {isLocallyMuted ? (
                  <div className="p-1.5 rounded-md bg-[#f23f43]/20 text-[#f23f43]" title="Mutado por você">
                    <VolumeX className="w-4 h-4" />
                  </div>
                ) : isMicEnabled ? (
                  <div
                    className={`p-1.5 rounded-md ${
                      isSpeaking ? 'bg-[#23a55a]/20 text-[#23a55a]' : 'text-[#949ba4]'
                    }`}
                    title="Microfone ativado"
                  >
                    <Mic className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="p-1.5 rounded-md bg-[#f23f43]/10 text-[#f23f43]" title="Microfone desligado">
                    <MicOff className="w-4 h-4" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Menu de Contexto do Botão Direito */}
      {contextMenu && (
        <VolumeContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          participantName={contextMenu.participant.name || 'Participante'}
          volume={volumes[contextMenu.participant.identity] ?? 100}
          isMuted={!!mutedStates[contextMenu.participant.identity]}
          onVolumeChange={(vol) => handleVolumeChange(contextMenu.participant, vol)}
          onToggleMute={() => handleToggleMute(contextMenu.participant)}
          onClose={() => setContextMenu(null)}
        />
      )}
    </aside>
  );
}
