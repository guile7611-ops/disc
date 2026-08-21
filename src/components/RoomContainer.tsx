'use client';

import React from 'react';
import { LiveKitRoom, RoomAudioRenderer } from '@livekit/components-react';
import { RoomHeader } from '@/components/RoomHeader';
import { ScreenShareArea } from '@/components/ScreenShareArea';
import { ParticipantList } from '@/components/ParticipantList';
import { ControlBar } from '@/components/ControlBar';
import { AudioFallbackNotice } from '@/components/AudioFallbackNotice';
import { useMicrophones } from '@/hooks/useMicrophones';

interface RoomContainerProps {
  token: string;
  wsUrl: string;
  onLeave: () => void;
}

export function RoomContainer({ token, wsUrl, onLeave }: RoomContainerProps) {
  const { selectedDeviceId } = useMicrophones();

  return (
    <div className="fixed inset-0 w-screen h-screen bg-[#1e1f22] overflow-hidden select-none flex flex-col z-50">
      <LiveKitRoom
        serverUrl={wsUrl}
        token={token}
        connect={true}
        audio={true} // Habilita áudio na entrada
        video={false} // Desativa webcam para economizar RAM e CPU
        onDisconnected={onLeave}
        options={{
          adaptiveStream: true, // Reduz uso de RAM/GPU em faixas não visíveis
          dynacast: true,       // Otimiza decodificação WebRTC dinamicamente
          publishDefaults: {
            simulcast: false,   // Transmissão de 1080p Full HD pura sem downscaling
            screenShareEncoding: {
              maxBitrate: 10_000_000, // 10 Mbps de bitrate para qualidade Full HD 1080p 60 FPS nativa de jogos
              maxFramerate: 60,
            },
          },
          audioCaptureDefaults: {
            deviceId: selectedDeviceId || undefined,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        }}
        onError={(err) => {
          console.error('Erro na sala LiveKit:', err);
        }}
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#1e1f22',
          overflow: 'hidden',
        }}
      >
        {/* Renderer de áudio remoto */}
        <RoomAudioRenderer />

        {/* Alerta de Autoplay do Navegador */}
        <AudioFallbackNotice />

        {/* Cabeçalho do Canal */}
        <RoomHeader onLeave={onLeave} />

        {/* Conteúdo Principal (Área de Telas + Lista de Membros) */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative min-h-0">
          <ScreenShareArea />
          <ParticipantList />
        </div>

        {/* Barra de Controles Fixa no Rodapé */}
        <ControlBar onLeave={onLeave} />
      </LiveKitRoom>
    </div>
  );
}
