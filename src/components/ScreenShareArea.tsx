'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTracks, VideoTrack } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { Monitor, Grid, Maximize, Maximize2, Radio, User } from 'lucide-react';

export function ScreenShareArea() {
  const screenShareTracks = useTracks([Track.Source.ScreenShare]);
  const [focusedTrackSid, setFocusedTrackSid] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
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

  // Se ninguém estiver compartilhando a tela
  if (screenShareTracks.length === 0) {
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

  // Se o usuário selecionou uma tela específica para Foco (Spotlight)
  const focusedTrack = focusedTrackSid
    ? screenShareTracks.find((t) => t.publication?.trackSid === focusedTrackSid)
    : null;

  if (focusedTrack) {
    const participantName = focusedTrack.participant?.name || 'Participante';

    return (
      <div
        ref={containerRef}
        className="flex-1 bg-black flex flex-col relative overflow-hidden outline-none border-none ring-0 select-none"
      >
        {/* Exibe o banner e o botão APENAS quando NÃO estiver em tela cheia */}
        {!isFullscreen && (
          <>
            {/* Banner Superior no Modo Foco */}
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
                onClick={() => setFocusedTrackSid(null)}
                className="ml-3 px-2.5 py-1 rounded bg-[#313338] hover:bg-[#3b3e45] text-xs font-semibold text-[#dbdee1] flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Grid className="w-3.5 h-3.5" />
                <span>Ver todas ({screenShareTracks.length})</span>
              </button>
            </div>

            {/* Botão de Entrar em Tela Cheia */}
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

        {/* Vídeo em Foco 100% limpo com corte de bordas YUV */}
        <div className="w-full h-full flex items-center justify-center p-0 outline-none border-none ring-0 bg-black overflow-hidden relative">
          <VideoTrack
            trackRef={focusedTrack}
            className="w-full h-full object-contain max-h-full max-w-full outline-none border-none ring-0 shadow-none overflow-hidden scale-[1.002]"
          />
        </div>
      </div>
    );
  }

  // Grade de Telas Simultâneas (Estilo Discord)
  const gridColsClass =
    screenShareTracks.length === 1
      ? 'grid-cols-1'
      : screenShareTracks.length === 2
      ? 'grid-cols-1 md:grid-cols-2'
      : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';

  return (
    <div
      ref={containerRef}
      className="flex-1 bg-[#1e1f22] p-3 flex flex-col relative overflow-hidden outline-none border-none ring-0 select-none"
    >
      {/* Barra Superior da Grade (Oculta se estiver em Tela Cheia) */}
      {!isFullscreen && (
        <div className="mb-3 px-3 py-2 bg-[#2b2d31] rounded-lg border border-[#313338] flex items-center justify-between z-10">
          <span className="text-xs font-bold text-[#dbdee1] flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#f23f43] animate-pulse" />
            {screenShareTracks.length} Transmissões ao vivo simultâneas (60 FPS)
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
        {screenShareTracks.map((trackRef) => {
          const participantName = trackRef.participant?.name || 'Participante';
          const trackSid = trackRef.publication?.trackSid || trackRef.participant.identity;

          return (
            <div
              key={trackSid}
              className="relative group bg-black border border-[#2b2d31] hover:border-[#5865F2] rounded-xl overflow-hidden flex items-center justify-center transition-all shadow-xl min-h-48 outline-none ring-0"
            >
              {/* Overlay do Participante (Escondido em Tela Cheia) */}
              {!isFullscreen && (
                <>
                  <div className="absolute top-3 left-3 z-20 bg-[#1e1f22]/90 backdrop-blur-md border border-[#2b2d31] px-3 py-1.5 rounded-md flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full bg-[#f23f43] animate-pulse" />
                    <span className="font-semibold text-white truncate max-w-40">{participantName}</span>
                    <span className="px-1.5 py-0.2 rounded bg-[#5865F2]/20 text-[#5865F2] text-[10px] font-bold">
                      60 FPS
                    </span>
                  </div>

                  <button
                    onClick={() => setFocusedTrackSid(trackRef.publication?.trackSid || null)}
                    className="absolute top-3 right-3 z-20 p-2 rounded-md bg-[#1e1f22]/80 hover:bg-[#5865F2] text-white opacity-0 group-hover:opacity-100 transition-all cursor-pointer shadow-lg"
                    title="Expandir tela em foco"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </>
              )}

              {/* Reprodução do Vídeo da Tela com recorte limpo de bordas */}
              <div className="w-full h-full flex items-center justify-center bg-black overflow-hidden relative">
                <VideoTrack
                  trackRef={trackRef}
                  className="w-full h-full object-contain max-h-full outline-none border-none ring-0 shadow-none overflow-hidden scale-[1.002]"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
