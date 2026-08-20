'use client';

import React from 'react';
import { LiveKitRoom, RoomAudioRenderer } from '@livekit/components-react';
import { RoomHeader } from '@/components/RoomHeader';
import { ScreenShareArea } from '@/components/ScreenShareArea';
import { ParticipantList } from '@/components/ParticipantList';
import { ControlBar } from '@/components/ControlBar';
import { AudioFallbackNotice } from '@/components/AudioFallbackNotice';

interface RoomContainerProps {
  token: string;
  wsUrl: string;
  onLeave: () => void;
}

export function RoomContainer({ token, wsUrl, onLeave }: RoomContainerProps) {
  return (
    <LiveKitRoom
      serverUrl={wsUrl}
      token={token}
      connect={true}
      audio={true} // Habilita o microfone na entrada conforme autorização
      video={false} // Desativa webcam (somente voz e compartilhamento de tela)
      onDisconnected={onLeave}
      onError={(err) => {
        console.error('Erro na sala LiveKit:', err);
      }}
      className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden select-none"
    >
      {/* Renderer obrigatório para áudio dos participantes remotos */}
      <RoomAudioRenderer />

      {/* Alerta caso o navegador bloqueie autoplay de áudio */}
      <AudioFallbackNotice />

      {/* Cabeçalho da chamada */}
      <RoomHeader onLeave={onLeave} />

      {/* Conteúdo Principal (Área de Tela + Painel Lateral de Participantes) */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        <ScreenShareArea />
        <ParticipantList />
      </div>

      {/* Barra de Controles Fixa */}
      <ControlBar onLeave={onLeave} />
    </LiveKitRoom>
  );
}
