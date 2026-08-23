'use client';

import React, { useState, useEffect } from 'react';
import { LiveKitRoom, useTracks, AudioTrack, useLocalParticipant } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { RoomHeader } from '@/components/RoomHeader';
import { ScreenShareArea } from '@/components/ScreenShareArea';
import { ParticipantList } from '@/components/ParticipantList';
import { ChatPanel } from '@/components/ChatPanel';
import { ControlBar } from '@/components/ControlBar';
import { AudioFallbackNotice } from '@/components/AudioFallbackNotice';
import { useMicrophones } from '@/hooks/useMicrophones';
import { useDuckSound } from '@/hooks/useDuckSound';

interface RoomContainerProps {
  token: string;
  wsUrl: string;
  onLeave: (reason?: string) => void;
}

// Renderizador de áudio exclusivo para microfones de voz remotos
// (Evita duplicar o áudio das transmissões de tela que já são reproduzidas no ScreenShareArea com controle de volume)
function VoiceAudioRenderer({ isDeafened }: { isDeafened: boolean }) {
  const micTracks = useTracks([Track.Source.Microphone], {
    updateOnlyOn: [],
    onlySubscribed: true,
  }).filter((ref) => !ref.participant.isLocal && ref.publication.kind === Track.Kind.Audio);

  return (
    <div style={{ display: 'none' }}>
      {micTracks.map((trackRef) => (
        <AudioTrack
          key={`${trackRef.participant.identity}-${trackRef.source}-${trackRef.publication?.trackSid || ''}`}
          trackRef={trackRef}
          volume={isDeafened ? 0 : 1}
          muted={isDeafened}
        />
      ))}
    </div>
  );
}

// Subcomponente interno para ter acesso ao contexto da sala LiveKit e ativar o efeito sonoro de pato
function RoomInnerContent({ onLeave }: { onLeave: (reason?: string) => void }) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const { localParticipant } = useLocalParticipant();
  
  // Ativa automaticamente o som de pato ("Quack!") quando alguém entra ou sai
  useDuckSound();

  // Ativa o microfone de forma suave após a conexão estabelecida sem derrubar a sala se falhar
  useEffect(() => {
    if (localParticipant && !localParticipant.isMicrophoneEnabled) {
      localParticipant.setMicrophoneEnabled(true, {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      }).catch((err) => {
        console.warn('Aviso: microfone não iniciado automaticamente (pode ser ativado pelo botão):', err);
      });
    }
  }, [localParticipant]);

  return (
    <>
      {/* Renderer exclusivo de microfones (respeita o modo ensurdecer) */}
      <VoiceAudioRenderer isDeafened={isDeafened} />

      {/* Alerta de Autoplay do Navegador */}
      <AudioFallbackNotice />

      {/* Cabeçalho do Canal */}
      <RoomHeader onLeave={() => onLeave()} />

      {/* Conteúdo Principal (Área de Telas + Lista de Membros + Painel de Bate-papo) */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative min-h-0">
        <ScreenShareArea isDeafened={isDeafened} />
        <ParticipantList />
        <ChatPanel isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      </div>

      {/* Barra de Controles Fixa no Rodapé com controle do Chat e Ensurdecer */}
      <ControlBar
        onLeave={() => onLeave()}
        isChatOpen={isChatOpen}
        onToggleChat={() => setIsChatOpen((prev) => !prev)}
        isDeafened={isDeafened}
        onToggleDeafen={() => setIsDeafened((prev) => !prev)}
      />
    </>
  );
}

const LIVEKIT_ROOM_OPTIONS = {
  adaptiveStream: true, // Reduz uso de RAM/GPU em faixas não visíveis
  dynacast: true,       // Otimiza decodificação WebRTC dinamicamente
  publishDefaults: {
    simulcast: false,   // Transmissão de 1080p Full HD pura sem downscaling
    forceStereo: true,  // Suporte a áudio estéreo para som de jogos e música
    dtx: false,         // Desativa descontinuidade de transmissão para áudio contínuo de jogos
    audioPreset: {
      maxBitrate: 192_000, // 192 kbps de áudio de alta fidelidade
    },
    screenShareEncoding: {
      maxBitrate: 10_000_000, // 10 Mbps de bitrate para qualidade Full HD 1080p 60 FPS nativa de jogos
      maxFramerate: 60,
    },
  },
  audioCaptureDefaults: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
};

export function RoomContainer({ token, wsUrl, onLeave }: RoomContainerProps) {
  // Garante que o serverUrl tenha o formato WebSocket correto mesmo em caso de variavel sem protocolo
  const cleanWsUrl = wsUrl?.trim().replace(/^["']|["']$/g, '') || '';
  const formattedServerUrl = cleanWsUrl
    ? (cleanWsUrl.includes('://')
        ? cleanWsUrl.replace(/^https:\/\//i, 'wss://').replace(/^http:\/\//i, 'ws://')
        : `wss://${cleanWsUrl}`
      ).replace(/\/+$/, '')
    : cleanWsUrl;

  return (
    <div className="fixed inset-0 w-screen h-screen bg-[#1e1f22] overflow-hidden select-none flex flex-col z-50">
      <LiveKitRoom
        serverUrl={formattedServerUrl}
        token={token}
        connect={true}
        audio={false} // Desativa tentativa síncrona no connect para evitar queda se o microfone demorar a responder
        video={false} // Desativa webcam para economizar RAM e CPU
        options={LIVEKIT_ROOM_OPTIONS}
        onDisconnected={(reason) => {
          console.warn('LiveKit desconectado:', reason);
          // Ignora desconexões iniciadas pelo cliente durante montagem/limpeza de ciclo de vida
          const reasonStr = String(reason || '');
          if (
            reasonStr.toLowerCase().includes('client') ||
            reasonStr.toLowerCase().includes('duplicate_identity')
          ) {
            return;
          }
          onLeave(reason ? `Desconectado da sala: ${reason}` : undefined);
        }}
        onError={(err) => {
          console.error('Erro na sala LiveKit:', err);
          onLeave(err?.message || 'Erro ao conectar à sala de voz.');
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
        <RoomInnerContent onLeave={onLeave} />
      </LiveKitRoom>
    </div>
  );
}
