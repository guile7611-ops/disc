'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTracks, VideoTrack, AudioTrack, TrackReference } from '@livekit/components-react';
import { Track, RemoteAudioTrack } from 'livekit-client';
import {
  Monitor,
  Grid,
  Maximize,
  Maximize2,
  Radio,
  User,
  Volume2,
  VolumeX,
  EyeOff,
  Play,
  Sliders,
} from 'lucide-react';

interface StreamState {
  isMuted: boolean;
  volume: number; // 0 a 100
  isStopped: boolean;
}

interface ContextMenuPosition {
  x: number;
  y: number;
  participantIdentity: string;
}

export function ScreenShareArea() {
  // Faixas de Vídeo da Tela
  const videoTracks = useTracks([{ source: Track.Source.ScreenShare, withPlaceholder: false }]);
  // Faixas de Áudio da Tela
  const audioTracks = useTracks([{ source: Track.Source.ScreenShareAudio, withPlaceholder: false }]);

  const [focusedParticipantId, setFocusedParticipantId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Estado individual para cada transmissão por Participant Identity (Mutar, Volume, Parado)
  const [streamStates, setStreamStates] = useState<Record<string, StreamState>>({});
  // Posição do Menu de Contexto (Botão Direito)
  const [contextMenu, setContextMenu] = useState<ContextMenuPosition | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
        setContextMenu(null);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error('Erro ao alternar tela cheia:', err);
    }
  };

  const getStreamState = (identity: string): StreamState => {
    return streamStates[identity] || { isMuted: false, volume: 100, isStopped: false };
  };

  const updateStreamState = (
    identity: string,
    updates: Partial<StreamState>,
    vTrackPub?: any,
    aTrackPub?: any
  ) => {
    setStreamStates((prev) => {
      const current = prev[identity] || { isMuted: false, volume: 100, isStopped: false };
      const nextState = { ...current, ...updates };

      // Aplica volume e mudo diretamente na faixa de áudio WebRTC se disponível
      if (aTrackPub?.track) {
        const audioTrackObj = aTrackPub.track as RemoteAudioTrack;
        const targetVol = nextState.isStopped || nextState.isMuted ? 0 : nextState.volume / 100;
        if (typeof audioTrackObj.setVolume === 'function') {
          audioTrackObj.setVolume(targetVol);
        }
      }

      return {
        ...prev,
        [identity]: nextState,
      };
    });
  };

  // Abre o menu de contexto no botão direito
  const handleContextMenu = (e: React.MouseEvent, identity: string) => {
    e.preventDefault();
    e.stopPropagation();

    const x = Math.min(e.clientX, window.innerWidth - 230);
    const y = Math.min(e.clientY, window.innerHeight - 220);

    setContextMenu({ x, y, participantIdentity: identity });
  };

  // Retoma a transmissão ao clicar sobre a tela pausada (Assistir de Novo)
  const handleResumeStream = (identity: string, vTrackPub?: any, aTrackPub?: any) => {
    updateStreamState(identity, { isStopped: false }, vTrackPub, aTrackPub);

    if (vTrackPub) {
      vTrackPub.setSubscribed(true);
    }
    if (aTrackPub) {
      aTrackPub.setSubscribed(true);
    }
  };

  // Parar de assistir a transmissão (Desliga Vídeo E Áudio)
  const handleStopStream = (identity: string, vTrackPub?: any, aTrackPub?: any) => {
    updateStreamState(identity, { isStopped: true }, vTrackPub, aTrackPub);

    if (vTrackPub) {
      vTrackPub.setSubscribed(false);
    }
    if (aTrackPub) {
      aTrackPub.setSubscribed(false);
    }
    setContextMenu(null);
  };

  // Se ninguém estiver compartilhando a tela
  if (videoTracks.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-[#313338] relative overflow-hidden select-none">
        <div className="w-24 h-24 rounded-full bg-[#2b2d31] border border-[#3f4248] flex items-center justify-center text-[#5865F2] mb-4 shadow-2xl shadow-black/50">
          <Monitor className="w-12 h-12" />
        </div>
        <h3 className="text-xl font-bold text-[#f2f3f5] mb-2">
          Nenhum compartilhamento de tela no momento
        </h3>
        <p className="text-sm text-[#949ba4] max-w-md">
          Compartilhe sua tela em até <strong className="text-[#23a55a]">60 FPS</strong>. Múltiplos participantes podem transmitir a tela ao mesmo tempo na sala.
        </p>
      </div>
    );
  }

  // Foco selecionado
  const rawFocusedVideoTrack = focusedParticipantId
    ? videoTracks.find((t) => t.participant.identity === focusedParticipantId)
    : null;
  const focusedVideoTrack =
    rawFocusedVideoTrack && rawFocusedVideoTrack.publication
      ? (rawFocusedVideoTrack as TrackReference)
      : null;

  // Renderização do Modo Foco (Spotlight)
  if (focusedVideoTrack) {
    const participantName = focusedVideoTrack.participant?.name || 'Participante';
    const identity = focusedVideoTrack.participant.identity;
    const currentState = getStreamState(identity);

    const vTrackPub = focusedVideoTrack.publication;
    const rawAudioTrackRef = audioTracks.find((t) => t.participant.identity === identity && t.publication);
    const audioTrackRef: TrackReference | null =
      rawAudioTrackRef && rawAudioTrackRef.publication
        ? (rawAudioTrackRef as TrackReference)
        : null;
    const aTrackPub = audioTrackRef?.publication;

    const currentVolume = currentState.isMuted || currentState.isStopped ? 0 : currentState.volume / 100;

    return (
      <div
        ref={containerRef}
        className="flex-1 bg-black flex flex-col relative overflow-hidden outline-none border-none ring-0 select-none"
      >
        {/* Renderiza explicitamente o áudio da transmissão de tela com controle de volume */}
        {audioTrackRef && (
          <AudioTrack trackRef={audioTrackRef} volume={currentVolume} />
        )}

        {/* Banner Superior no Modo Foco */}
        {!isFullscreen && (
          <>
            <div className="absolute top-4 left-4 z-20 bg-[#1e1f22]/90 backdrop-blur-md border border-[#2b2d31] px-4 py-2 rounded-lg flex items-center gap-3 shadow-xl">
              <span className="px-2 py-0.5 rounded bg-[#f23f43] text-white font-bold text-[10px] uppercase tracking-wider flex items-center gap-1">
                <Radio className="w-3 h-3 animate-pulse" />
                AO VIVO 60 FPS
              </span>
              <div className="flex items-center gap-1.5 text-xs text-[#dbdee1]">
                <User className="w-4 h-4 text-[#5865F2]" />
                <span>Tela de <strong className="font-bold text-white">{participantName}</strong></span>
              </div>

              <button
                onClick={() => setFocusedParticipantId(null)}
                className="ml-3 px-2.5 py-1 rounded bg-[#313338] hover:bg-[#3b3e45] text-xs font-semibold text-[#dbdee1] flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Grid className="w-3.5 h-3.5" />
                <span>Ver todas ({videoTracks.length})</span>
              </button>
            </div>

            <button
              onClick={toggleFullscreen}
              className="absolute top-4 right-4 z-20 p-2.5 rounded-lg bg-[#1e1f22]/90 hover:bg-[#5865F2] text-white border border-[#2b2d31] transition-all cursor-pointer shadow-xl flex items-center gap-1.5 text-xs font-bold"
              title="Entrar em Tela Cheia"
            >
              <Maximize className="w-4 h-4" />
              <span className="hidden sm:inline">Tela Cheia</span>
            </button>
          </>
        )}

        {/* Quadro da Transmissão */}
        <div
          onContextMenu={(e) => handleContextMenu(e, identity)}
          className="w-full h-full flex items-center justify-center p-0 outline-none border-none ring-0 bg-black overflow-hidden relative cursor-pointer"
        >
          {currentState.isStopped ? (
            /* Overlay de Transmissão Pausada (Clique para assistir de novo) */
            <div
              onClick={() => handleResumeStream(identity, vTrackPub, aTrackPub)}
              className="w-full h-full flex flex-col items-center justify-center bg-[#111214]/95 text-center p-6 cursor-pointer group hover:bg-[#111214]/90 transition-all z-10"
            >
              <div className="w-16 h-16 rounded-full bg-[#5865F2] group-hover:scale-110 flex items-center justify-center text-white mb-3 shadow-2xl transition-transform">
                <Play className="w-8 h-8 fill-current ml-1" />
              </div>
              <h4 className="text-lg font-bold text-white mb-1">Transmissão Pausada</h4>
              <p className="text-xs text-[#949ba4] font-medium">
                Clique em qualquer lugar da tela para assistir de novo
              </p>
            </div>
          ) : (
            <VideoTrack
              trackRef={focusedVideoTrack}
              className="w-full h-full object-contain max-h-full max-w-full outline-none border-none ring-0 shadow-none overflow-hidden scale-[1.002]"
            />
          )}
        </div>

        {/* Menu de Contexto Customizado (Botão Direito) */}
        {contextMenu && contextMenu.participantIdentity === identity && (
          <RenderContextMenu
            position={contextMenu}
            state={currentState}
            participantName={participantName}
            onToggleMute={() =>
              updateStreamState(identity, { isMuted: !currentState.isMuted }, vTrackPub, aTrackPub)
            }
            onVolumeChange={(v) =>
              updateStreamState(identity, { volume: v }, vTrackPub, aTrackPub)
            }
            onStopStream={() => handleStopStream(identity, vTrackPub, aTrackPub)}
            onClose={() => setContextMenu(null)}
            ref={menuRef}
          />
        )}
      </div>
    );
  }

  // Grade de Telas Simultâneas (Estilo Discord)
  const gridColsClass =
    videoTracks.length === 1
      ? 'grid-cols-1'
      : videoTracks.length === 2
      ? 'grid-cols-1 md:grid-cols-2'
      : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';

  return (
    <div
      ref={containerRef}
      className="flex-1 bg-[#1e1f22] p-3 flex flex-col relative overflow-hidden outline-none border-none ring-0 select-none"
    >
      {!isFullscreen && (
        <div className="mb-3 px-3 py-2 bg-[#2b2d31] rounded-lg border border-[#313338] flex items-center justify-between z-10">
          <span className="text-xs font-bold text-[#dbdee1] flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#f23f43] animate-pulse" />
            {videoTracks.length} Transmissões ao vivo simultâneas (60 FPS)
          </span>

          <button
            onClick={toggleFullscreen}
            className="px-2.5 py-1 rounded bg-[#313338] hover:bg-[#3b3e45] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-[#3f4248]"
            title="Modo Tela Cheia"
          >
            <Maximize className="w-3.5 h-3.5" />
            <span>Tela Cheia</span>
          </button>
        </div>
      )}

      {/* Grade de Telas Simultâneas */}
      <div className={`flex-1 grid ${gridColsClass} gap-3 h-full overflow-y-auto`}>
        {videoTracks.map((rawVTrackRef) => {
          if (!rawVTrackRef.publication) return null;
          const vTrackRef = rawVTrackRef as TrackReference;

          const participantName = vTrackRef.participant?.name || 'Participante';
          const identity = vTrackRef.participant.identity;
          const currentState = getStreamState(identity);

          const vTrackPub = vTrackRef.publication;
          const rawAudioTrackRef = audioTracks.find((t) => t.participant.identity === identity && t.publication);
          const audioTrackRef: TrackReference | null =
            rawAudioTrackRef && rawAudioTrackRef.publication
              ? (rawAudioTrackRef as TrackReference)
              : null;
          const aTrackPub = audioTrackRef?.publication;

          const currentVolume = currentState.isMuted || currentState.isStopped ? 0 : currentState.volume / 100;

          return (
            <div
              key={identity}
              onContextMenu={(e) => handleContextMenu(e, identity)}
              className="relative group bg-black border border-[#2b2d31] hover:border-[#5865F2] rounded-xl overflow-hidden flex items-center justify-center transition-all shadow-xl min-h-48 outline-none ring-0 cursor-pointer"
            >
              {/* Renderiza explicitamente o áudio da transmissão com controle de volume */}
              {audioTrackRef && (
                <AudioTrack trackRef={audioTrackRef} volume={currentVolume} />
              )}

              {!isFullscreen && !currentState.isStopped && (
                <>
                  <div className="absolute top-3 left-3 z-20 bg-[#1e1f22]/90 backdrop-blur-md border border-[#2b2d31] px-3 py-1.5 rounded-md flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full bg-[#f23f43] animate-pulse" />
                    <span className="font-semibold text-white truncate max-w-40">{participantName}</span>
                    <span className="px-1.5 py-0.2 rounded bg-[#5865F2]/20 text-[#5865F2] text-[10px] font-bold">
                      60 FPS
                    </span>
                  </div>

                  <button
                    onClick={() => setFocusedParticipantId(identity)}
                    className="absolute top-3 right-3 z-20 p-2 rounded-md bg-[#1e1f22]/80 hover:bg-[#5865F2] text-white opacity-0 group-hover:opacity-100 transition-all cursor-pointer shadow-lg"
                    title="Expandir tela em foco"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </>
              )}

              {/* Conteúdo do Vídeo ou Overlay de Transmissão Pausada */}
              {currentState.isStopped ? (
                <div
                  onClick={() => handleResumeStream(identity, vTrackPub, aTrackPub)}
                  className="w-full h-full flex flex-col items-center justify-center bg-[#111214]/95 text-center p-4 cursor-pointer group hover:bg-[#111214]/90 transition-all z-10"
                >
                  <div className="w-12 h-12 rounded-full bg-[#5865F2] group-hover:scale-110 flex items-center justify-center text-white mb-2 shadow-xl transition-transform">
                    <Play className="w-6 h-6 fill-current ml-0.5" />
                  </div>
                  <h5 className="text-sm font-bold text-white">Transmissão Pausada</h5>
                  <p className="text-[11px] text-[#949ba4] mt-0.5">
                    Clique para assistir de novo
                  </p>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-black overflow-hidden relative">
                  <VideoTrack
                    trackRef={vTrackRef}
                    className="w-full h-full object-contain max-h-full outline-none border-none ring-0 shadow-none overflow-hidden scale-[1.002]"
                  />
                </div>
              )}

              {/* Menu de Contexto (Botão Direito) */}
              {contextMenu && contextMenu.participantIdentity === identity && (
                <RenderContextMenu
                  position={contextMenu}
                  state={currentState}
                  participantName={participantName}
                  onToggleMute={() =>
                    updateStreamState(identity, { isMuted: !currentState.isMuted }, vTrackPub, aTrackPub)
                  }
                  onVolumeChange={(v) =>
                    updateStreamState(identity, { volume: v }, vTrackPub, aTrackPub)
                  }
                  onStopStream={() => handleStopStream(identity, vTrackPub, aTrackPub)}
                  onClose={() => setContextMenu(null)}
                  ref={menuRef}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Subcomponente do Menu de Contexto (Botão Direito)
const RenderContextMenu = React.forwardRef<
  HTMLDivElement,
  {
    position: ContextMenuPosition;
    state: StreamState;
    participantName: string;
    onToggleMute: () => void;
    onVolumeChange: (vol: number) => void;
    onStopStream: () => void;
    onClose: () => void;
  }
>(({ position, state, participantName, onToggleMute, onVolumeChange, onStopStream, onClose }, ref) => {
  return (
    <div
      ref={ref}
      style={{ top: `${position.y}px`, left: `${position.x}px` }}
      className="fixed z-50 w-56 bg-[#111214] border border-[#313338] rounded-xl p-2 shadow-2xl text-xs space-y-1 animate-in fade-in zoom-in-95 select-none"
    >
      <div className="px-2 py-1.5 font-bold text-[#949ba4] border-b border-[#2b2d31] truncate">
        Transmissão de {participantName}
      </div>

      {/* Mutar / Desmutar Áudio */}
      <button
        onClick={() => {
          onToggleMute();
          onClose();
        }}
        className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-[#dbdee1] hover:bg-[#2b2d31] hover:text-white transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          {state.isMuted ? (
            <VolumeX className="w-4 h-4 text-[#f23f43]" />
          ) : (
            <Volume2 className="w-4 h-4 text-[#23a55a]" />
          )}
          <span>{state.isMuted ? 'Desmutar Transmissão' : 'Mutar Transmissão'}</span>
        </div>
      </button>

      {/* Slider de Regular Volume */}
      <div className="px-2.5 py-2 space-y-1.5 border-t border-[#2b2d31]">
        <div className="flex items-center justify-between text-[#b5bac1]">
          <span className="flex items-center gap-1.5 font-medium">
            <Sliders className="w-3.5 h-3.5 text-[#5865F2]" />
            Volume
          </span>
          <span className="font-bold text-white">{state.volume}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={state.isMuted ? 0 : state.volume}
          onChange={(e) => onVolumeChange(Number(e.target.value))}
          className="w-full h-1.5 bg-[#2b2d31] rounded-lg appearance-none cursor-pointer accent-[#5865F2]"
        />
      </div>

      {/* Parar de Assistir */}
      <button
        onClick={onStopStream}
        className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[#f23f43] hover:bg-[#f23f43]/10 transition-colors cursor-pointer border-t border-[#2b2d31]"
      >
        <EyeOff className="w-4 h-4" />
        <span className="font-bold">Parar de assistir</span>
      </button>
    </div>
  );
});

RenderContextMenu.displayName = 'RenderContextMenu';
