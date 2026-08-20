'use client';

import React from 'react';
import { useParticipants, useLocalParticipant } from '@livekit/components-react';
import { Users, Mic, MicOff, Monitor, Volume2, User } from 'lucide-react';

export function ParticipantList() {
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();

  return (
    <aside className="w-full md:w-80 bg-slate-900/80 backdrop-blur-md border-t md:border-t-0 md:border-l border-slate-800 flex flex-col h-64 md:h-full z-10 shrink-0">
      {/* Cabeçalho do Painel */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-indigo-400" />
          <h2 className="text-sm font-semibold text-slate-200">Participantes</h2>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-xs font-mono">
          {participants.length}
        </span>
      </div>

      {/* Lista de Participantes */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {participants.map((p) => {
          const isLocal = p.identity === localParticipant.identity;
          const isMicEnabled = p.isMicrophoneEnabled;
          const isSpeaking = p.isSpeaking;
          const isScreenSharing = p.isScreenShareEnabled;

          return (
            <div
              key={p.identity}
              className={`p-3 rounded-xl border transition-all flex items-center justify-between ${
                isSpeaking
                  ? 'bg-indigo-950/40 border-indigo-500/50 shadow-sm shadow-indigo-500/10'
                  : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              {/* Avatar + Nome */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-all ${
                    isSpeaking
                      ? 'bg-indigo-600 text-white ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-950'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {p.name ? p.name.substring(0, 2).toUpperCase() : <User className="w-4 h-4" />}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-slate-200 truncate">
                      {p.name || 'Participante'}
                    </span>
                    {isLocal && (
                      <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-semibold uppercase">
                        Você
                      </span>
                    )}
                  </div>

                  {/* Badges de Estado */}
                  <div className="flex items-center gap-2 mt-0.5">
                    {isSpeaking && (
                      <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                        <Volume2 className="w-3 h-3 animate-pulse" />
                        Falando
                      </span>
                    )}
                    {isScreenSharing && (
                      <span className="text-[11px] text-indigo-400 font-medium flex items-center gap-1">
                        <Monitor className="w-3 h-3" />
                        Compartilhando tela
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Status do Microfone */}
              <div className="ml-2 shrink-0">
                {isMicEnabled ? (
                  <div
                    className={`p-1.5 rounded-lg ${
                      isSpeaking ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                    }`}
                    title="Microfone ativado"
                  >
                    <Mic className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400" title="Microfone desligado">
                    <MicOff className="w-4 h-4" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
