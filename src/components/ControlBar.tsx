'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useLocalParticipant, useRoomContext, useChat } from '@livekit/components-react';
import { useKrispNoiseFilter } from '@livekit/components-react/krisp';
import { Track } from 'livekit-client';
import { useScreenShareSupport } from '@/hooks/useScreenShareSupport';
import { useMicrophones } from '@/hooks/useMicrophones';
import { useSpeakers } from '@/hooks/useSpeakers';
import {
  Mic,
  MicOff,
  Monitor,
  MonitorOff,
  PhoneOff,
  Loader2,
  Volume2,
  Volume1,
  ChevronUp,
  Check,
  Settings,
  MessageSquare,
  Sparkles,
  Headphones,
  SlidersHorizontal,
  Zap,
} from 'lucide-react';

export type ScreenQualityPreset = '1080p60' | '720p60' | '1080p30' | '720p30';

export const SCREEN_PRESETS: Record<
  ScreenQualityPreset,
  {
    name: string;
    description: string;
    width: number;
    height: number;
    frameRate: number;
    maxBitrate: number;
  }
> = {
  '1080p60': {
    name: '1080p @ 60 FPS',
    description: 'Alta Fidelidade • Padrão Discord Nitro (6 Mbps)',
    width: 1920,
    height: 1080,
    frameRate: 60,
    maxBitrate: 6_000_000,
  },
  '720p60': {
    name: '720p @ 60 FPS',
    description: 'Fluido p/ Jogos Competitivos • Baixo Uso de GPU (3.5 Mbps)',
    width: 1280,
    height: 720,
    frameRate: 60,
    maxBitrate: 3_500_000,
  },
  '1080p30': {
    name: '1080p @ 30 FPS',
    description: 'Full HD Nítido • Texto & Código (4 Mbps)',
    width: 1920,
    height: 1080,
    frameRate: 30,
    maxBitrate: 4_000_000,
  },
  '720p30': {
    name: '720p @ 30 FPS',
    description: 'Econômico • Leve para Máquinas Básicas (2.5 Mbps)',
    width: 1280,
    height: 720,
    frameRate: 30,
    maxBitrate: 2_500_000,
  },
};

const QUALITY_STORAGE_KEY = 'screenshare_quality_preset';
const KRISP_STORAGE_KEY = 'krisp_noise_filter_enabled';

interface ControlBarProps {
  onLeave: () => void;
  isChatOpen: boolean;
  onToggleChat: () => void;
  isDeafened?: boolean;
  onToggleDeafen?: () => void;
}

export function ControlBar({
  onLeave,
  isChatOpen,
  onToggleChat,
  isDeafened = false,
  onToggleDeafen,
}: ControlBarProps) {
  const room = useRoomContext();
  const { localParticipant, isMicrophoneEnabled, isScreenShareEnabled } = useLocalParticipant();
  const isScreenShareSupported = useScreenShareSupport();
  const { devices, selectedDeviceId, setSelectedDeviceId, refreshDevices } = useMicrophones();
  const { speakerDevices, selectedSpeakerId, setSelectedSpeakerId, refreshSpeakers } = useSpeakers();
  const { chatMessages } = useChat();

  // Hook Oficial do Krisp Noise Filter da LiveKit
  const { isNoiseFilterEnabled, isNoiseFilterPending, setNoiseFilterEnabled } = useKrispNoiseFilter();

  const [isMicLoading, setIsMicLoading] = useState(false);
  const [isScreenLoading, setIsScreenLoading] = useState(false);
  const [showMicMenu, setShowMicMenu] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [qualityPreset, setQualityPreset] = useState<ScreenQualityPreset>('1080p60');
  const [unreadCount, setUnreadCount] = useState(0);

  const lastSeenMsgCountRef = useRef(chatMessages.length);
  const menuRef = useRef<HTMLDivElement>(null);
  const qualityMenuRef = useRef<HTMLDivElement>(null);
  const hasAttemptedAutoKrispRef = useRef(false);

  // Carrega preset de qualidade salvo
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(QUALITY_STORAGE_KEY) as ScreenQualityPreset | null;
      if (saved && SCREEN_PRESETS[saved]) {
        setQualityPreset(saved);
      }
    }
  }, []);

  // Inicializa o filtro de ruído Krisp AI por padrão ao montar/conectar
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem(KRISP_STORAGE_KEY);
    // Padrão é TRUE (Online) se o usuário ainda não tiver desativado manualmente
    const shouldEnable = saved === null ? true : saved === 'true';

    if (shouldEnable && !isNoiseFilterEnabled && !isNoiseFilterPending && !hasAttemptedAutoKrispRef.current) {
      hasAttemptedAutoKrispRef.current = true;
      setNoiseFilterEnabled(true).catch((err) => {
        console.warn('Aviso ao inicializar o Krisp por padrão:', err);
      });
    }
  }, [isNoiseFilterEnabled, isNoiseFilterPending, setNoiseFilterEnabled]);

  const handleSelectQuality = (preset: ScreenQualityPreset) => {
    setQualityPreset(preset);
    if (typeof window !== 'undefined') {
      localStorage.setItem(QUALITY_STORAGE_KEY, preset);
    }
    setShowQualityMenu(false);
  };

  // Contador de mensagens não lidas no Chat
  useEffect(() => {
    if (isChatOpen) {
      setUnreadCount(0);
      lastSeenMsgCountRef.current = chatMessages.length;
    } else if (chatMessages.length > lastSeenMsgCountRef.current) {
      setUnreadCount(chatMessages.length - lastSeenMsgCountRef.current);
    }
  }, [chatMessages.length, isChatOpen]);

  const toggleMicrophone = async () => {
    if (!localParticipant || isMicLoading) return;
    setIsMicLoading(true);
    try {
      const nextState = !isMicrophoneEnabled;
      await localParticipant.setMicrophoneEnabled(nextState, {
        deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
        echoCancellation: true,
        noiseSuppression: false, // Krisp AI assume a supressão de ruído
        autoGainControl: false,  // Desativa ducking de ganho do Chromium ao falar
      });
    } catch (err) {
      console.error('Erro ao alternar microfone:', err);
    } finally {
      setIsMicLoading(false);
    }
  };

  const handleToggleDeafen = () => {
    if (!onToggleDeafen) return;
    const nextDeafened = !isDeafened;
    onToggleDeafen();

    // Se estiver ativando o ensurdecer, desativa o microfone também (padrão Discord)
    if (nextDeafened && isMicrophoneEnabled && localParticipant) {
      localParticipant.setMicrophoneEnabled(false).catch(() => {});
    }
  };

  const handleSelectMicrophone = async (deviceId: string) => {
    setSelectedDeviceId(deviceId);

    if (room) {
      try {
        await room.switchActiveDevice('audioinput', deviceId);
      } catch (err) {
        console.error('Erro ao alternar microfone no LiveKit:', err);
      }
    }
  };

  const handleSelectSpeaker = async (deviceId: string) => {
    setSelectedSpeakerId(deviceId);

    if (room) {
      try {
        await room.switchActiveDevice('audiooutput', deviceId);
      } catch (err) {
        console.error('Erro ao alternar saída de áudio no LiveKit:', err);
      }
    }
  };

  const toggleKrispNoiseFilter = async () => {
    if (isNoiseFilterPending) return;
    try {
      const nextState = !isNoiseFilterEnabled;
      await setNoiseFilterEnabled(nextState);
      if (typeof window !== 'undefined') {
        localStorage.setItem(KRISP_STORAGE_KEY, String(nextState));
      }
    } catch (err) {
      console.error('Erro ao alternar supressão de ruído Krisp:', err);
    }
  };

  const toggleScreenShare = async () => {
    if (!localParticipant || isScreenLoading || !isScreenShareSupported) return;
    setIsScreenLoading(true);

    const activeConfig = SCREEN_PRESETS[qualityPreset] || SCREEN_PRESETS['1080p60'];

    try {
      const nextState = !isScreenShareEnabled;
      await localParticipant.setScreenShareEnabled(
        nextState,
        {
          audio: {
            echoCancellation: false, // CRÍTICO: Não aplicar cancelamento de eco no som do sistema/jogos, senão corta/abaixa ao falar!
            noiseSuppression: false,
            autoGainControl: false,
            channelCount: 2,
            sampleRate: 48000,
            restrictOwnAudio: true,
          } as unknown as boolean,
          suppressLocalAudioPlayback: false, // Mantém o som do jogo/vídeo tocando normalmente nos fones do usuário
          selfBrowserSurface: 'exclude', // Exclui a aba/janela do próprio app de chamada
          systemAudio: 'include',
          resolution: {
            width: activeConfig.width,
            height: activeConfig.height,
            frameRate: activeConfig.frameRate,
          },
          contentHint: 'motion',
        },
        {
          audioPreset: {
            maxBitrate: 192_000,
          },
          screenShareEncoding: {
            maxBitrate: activeConfig.maxBitrate,
            maxFramerate: activeConfig.frameRate,
          },
          simulcast: false,
          dtx: false,
          red: true,
          forceStereo: true,
          videoCodec: 'h264',
          degradationPreference: 'balanced',
        }
      );

      if (nextState) {
        // Função auxiliar para fixar parâmetros otimizados no MediaStreamTrack e RTCRtpSender
        const enforceHighQualitySettings = () => {
          try {
            const screenTrackPub = localParticipant.getTrackPublication(Track.Source.ScreenShare);
            if (screenTrackPub && screenTrackPub.track) {
              // 1. Aplica restrições de resolução e framerate no track nativo do navegador
              const mediaTrack = screenTrackPub.track.mediaStreamTrack;
              if (mediaTrack) {
                if (typeof mediaTrack.applyConstraints === 'function') {
                  mediaTrack
                    .applyConstraints({
                      width: { ideal: activeConfig.width, max: activeConfig.width },
                      height: { ideal: activeConfig.height, max: activeConfig.height },
                      frameRate: { ideal: activeConfig.frameRate, max: activeConfig.frameRate },
                    })
                    .catch(() => {});
                }
                mediaTrack.contentHint = 'motion';
              }

              // 2. Configura a taxa de quadros e bitrate máximo no sender WebRTC sem travar o pipeline da GPU
              const sender = screenTrackPub.track.sender;
              if (sender && typeof sender.getParameters === 'function') {
                const params = sender.getParameters();
                if (params && params.encodings && params.encodings.length > 0) {
                  params.encodings.forEach((enc) => {
                    enc.maxBitrate = activeConfig.maxBitrate;
                    enc.maxFramerate = activeConfig.frameRate;
                  });
                  params.degradationPreference = 'balanced';
                  sender.setParameters(params).catch(() => {});
                }
              }
            }
          } catch (e) {
            console.error('Aviso ao ajustar configurações WebRTC de transmissão:', e);
          }
        };

        // Aplica imediatamente e reforça após a estabilização da conexão WebRTC
        setTimeout(enforceHighQualitySettings, 300);
        setTimeout(enforceHighQualitySettings, 1000);
      }
    } catch (err) {
      console.log('Seleção de tela cancelada ou recusada:', err);
    } finally {
      setIsScreenLoading(false);
    }
  };

  const handleDisconnect = () => {
    room?.disconnect();
    onLeave();
  };

  // Fecha os menus se clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMicMenu(false);
      }
      if (qualityMenuRef.current && !qualityMenuRef.current.contains(e.target as Node)) {
        setShowQualityMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activePresetConfig = SCREEN_PRESETS[qualityPreset] || SCREEN_PRESETS['1080p60'];

  return (
    <footer className="h-20 bg-[#232428] border-t border-[#1e1f22] px-4 md:px-6 flex items-center justify-between z-20 shrink-0 select-none relative">
      {/* Indicador de Status da Voz - Estilo Discord */}
      <div className="hidden sm:flex items-center gap-3 min-w-48">
        <div className="w-9 h-9 rounded-full bg-[#2b2d31] flex items-center justify-center text-[#23a55a]">
          <Volume2 className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <p className="text-xs font-bold text-[#23a55a] flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#23a55a] animate-ping" />
            Voz Conectada
          </p>
          <p className="text-[11px] text-[#949ba4] truncate max-w-40 flex items-center gap-1">
            <span>{activePresetConfig.name}</span>
            {isNoiseFilterEnabled && (
              <span className="text-[#23a55a] font-extrabold text-[10px]">/ Krisp AI</span>
            )}
          </p>
        </div>
      </div>

      {/* Botões Centrais de Controle */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 md:gap-3 mx-auto sm:mx-0">
        {/* 1. Grupo do Botão Microfone com Seletor Popover */}
        <div className="relative flex items-center" ref={menuRef}>
          <div className="relative group flex items-center">
            <button
              onClick={toggleMicrophone}
              disabled={isMicLoading}
              className={`h-11 sm:h-12 px-3 sm:px-4 rounded-l-full flex items-center justify-center transition-all cursor-pointer ${
                isMicrophoneEnabled
                  ? 'bg-[#313338] hover:bg-[#3b3e45] text-[#dbdee1] border-y border-l border-[#3f4248]'
                  : 'bg-[#f23f43] hover:bg-[#d83a3e] text-white shadow-lg shadow-rose-950/40'
              }`}
              aria-label={isMicrophoneEnabled ? 'Desativar microfone' : 'Ativar microfone'}
            >
              {isMicLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-[#949ba4]" />
              ) : isMicrophoneEnabled ? (
                <Mic className="w-5 h-5" />
              ) : (
                <MicOff className="w-5 h-5" />
              )}
            </button>

            {/* Seta para abrir menu de microfones, alto-falantes e Krisp AI */}
            <button
              onClick={() => {
                refreshDevices();
                refreshSpeakers();
                setShowMicMenu((prev) => !prev);
                setShowQualityMenu(false);
              }}
              className={`h-11 sm:h-12 px-2 rounded-r-full flex items-center justify-center border-l border-[#383a40] transition-all cursor-pointer ${
                isMicrophoneEnabled
                  ? 'bg-[#313338] hover:bg-[#3b3e45] text-[#dbdee1] border-y border-r border-[#3f4248]'
                  : 'bg-[#f23f43] hover:bg-[#d83a3e] text-white'
              }`}
              title="Configurações de Entrada, Saída e Krisp AI"
            >
              <ChevronUp className={`w-4 h-4 transition-transform duration-200 ${showMicMenu ? 'rotate-180' : ''}`} />
            </button>

            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-[#111214] text-[#dbdee1] text-xs px-3 py-1.5 rounded-md border border-[#2b2d31] whitespace-nowrap shadow-xl z-30">
              {isMicrophoneEnabled ? 'Desativar microfone' : 'Ativar microfone'}
            </div>
          </div>

          {/* Menu Suspenso de Seleção de Entrada, Saída e Krisp AI */}
          {showMicMenu && (
            <div className="absolute bottom-full mb-3 left-0 w-80 bg-[#111214] border border-[#313338] rounded-xl p-3 shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-2 space-y-3">
              {/* Seção 1: Microfone (Entrada) */}
              <div>
                <div className="flex items-center gap-2 px-1 py-1 border-b border-[#2b2d31] mb-1.5">
                  <Settings className="w-3.5 h-3.5 text-[#5865F2]" />
                  <span className="text-[11px] font-bold text-[#b5bac1] uppercase tracking-wider">
                    Microfone (Dispositivo de Entrada)
                  </span>
                </div>
                <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
                  {devices.length === 0 ? (
                    <p className="text-xs text-[#949ba4] p-2">Nenhum microfone encontrado</p>
                  ) : (
                    devices.map((device, idx) => (
                      <button
                        key={device.deviceId || idx}
                        onClick={() => handleSelectMicrophone(device.deviceId)}
                        className={`w-full flex items-center justify-between text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                          selectedDeviceId === device.deviceId
                            ? 'bg-[#5865F2]/20 text-[#5865F2] font-bold'
                            : 'text-[#dbdee1] hover:bg-[#2b2d31]'
                        }`}
                      >
                        <span className="truncate pr-2">{device.label || `Microfone ${idx + 1}`}</span>
                        {selectedDeviceId === device.deviceId && (
                          <Check className="w-4 h-4 text-[#5865F2] shrink-0" />
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Seção 2: Alto-falantes / Fones (Saída) */}
              <div>
                <div className="flex items-center gap-2 px-1 py-1 border-b border-[#2b2d31] mb-1.5">
                  <Volume1 className="w-3.5 h-3.5 text-[#23a55a]" />
                  <span className="text-[11px] font-bold text-[#b5bac1] uppercase tracking-wider">
                    Alto-falantes / Fones (Dispositivo de Saída)
                  </span>
                </div>
                <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
                  {speakerDevices.length === 0 ? (
                    <p className="text-xs text-[#949ba4] p-2">Saída padrão do sistema</p>
                  ) : (
                    speakerDevices.map((device, idx) => (
                      <button
                        key={device.deviceId || idx}
                        onClick={() => handleSelectSpeaker(device.deviceId)}
                        className={`w-full flex items-center justify-between text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                          selectedSpeakerId === device.deviceId
                            ? 'bg-[#23a55a]/20 text-[#23a55a] font-bold'
                            : 'text-[#dbdee1] hover:bg-[#2b2d31]'
                        }`}
                      >
                        <span className="truncate pr-2">{device.label || `Saída ${idx + 1}`}</span>
                        {selectedSpeakerId === device.deviceId && (
                          <Check className="w-4 h-4 text-[#23a55a] shrink-0" />
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Seção 3: Supressão de Ruído Krisp AI */}
              <div>
                <div className="flex items-center justify-between px-1 py-1 border-b border-[#2b2d31] mb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-[#23a55a]" />
                    <span className="text-[11px] font-bold text-[#b5bac1] uppercase tracking-wider">
                      Supressão Krisp AI
                    </span>
                  </div>
                  <span
                    className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                      isNoiseFilterEnabled
                        ? 'bg-[#23a55a] text-white'
                        : 'bg-[#1e1f22] text-[#949ba4]'
                    }`}
                  >
                    {isNoiseFilterEnabled ? 'Ativada' : 'Desativada'}
                  </span>
                </div>

                <button
                  type="button"
                  disabled={isNoiseFilterPending}
                  onClick={toggleKrispNoiseFilter}
                  className={`w-full py-2 px-3 rounded-lg border text-xs font-bold transition-all cursor-pointer flex items-center justify-between shadow-md ${
                    isNoiseFilterEnabled
                      ? 'bg-[#23a55a]/20 border-[#23a55a] text-[#23a55a] hover:bg-[#23a55a]/30'
                      : 'bg-[#2b2d31] border-[#383a40] text-[#dbdee1] hover:bg-[#35373c]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {isNoiseFilterPending ? (
                      <Loader2 className="w-4 h-4 animate-spin text-[#5865F2]" />
                    ) : (
                      <Sparkles className={`w-4 h-4 ${isNoiseFilterEnabled ? 'text-[#23a55a]' : 'text-[#949ba4]'}`} />
                    )}
                    <span>
                      {isNoiseFilterPending
                        ? 'Carregando Krisp...'
                        : isNoiseFilterEnabled
                        ? 'Supressão Krisp AI Ativada'
                        : 'Ativar Supressão Krisp AI'}
                    </span>
                  </div>
                  <div
                    className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                      isNoiseFilterEnabled ? 'bg-[#23a55a]' : 'bg-[#383a40]'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        isNoiseFilterEnabled ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Botão de Atalho Rápido Krisp AI (Online por padrão) */}
        <div className="relative group">
          <button
            type="button"
            onClick={toggleKrispNoiseFilter}
            disabled={isNoiseFilterPending}
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all cursor-pointer relative ${
              isNoiseFilterEnabled
                ? 'bg-[#23a55a]/20 hover:bg-[#23a55a]/30 text-[#23a55a] border border-[#23a55a] shadow-lg shadow-emerald-950/40'
                : 'bg-[#313338] hover:bg-[#3b3e45] text-[#949ba4] border border-[#3f4248]'
            }`}
            title={isNoiseFilterEnabled ? 'Krisp AI: Online (Filtrando ruídos com IA)' : 'Krisp AI: Desativado'}
            aria-label="Alternar Supressão de Ruído Krisp AI"
          >
            {isNoiseFilterPending ? (
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-[#5865F2]" />
            ) : (
              <Sparkles className={`w-4 h-4 sm:w-5 sm:h-5 ${isNoiseFilterEnabled ? 'text-[#23a55a]' : 'text-[#949ba4]'}`} />
            )}
            {isNoiseFilterEnabled && (
              <span className="absolute bottom-1 right-1 w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-[#23a55a] ring-2 ring-[#232428]" />
            )}
          </button>
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-[#111214] text-[#dbdee1] text-xs px-3 py-1.5 rounded-md border border-[#2b2d31] whitespace-nowrap shadow-xl z-30 pointer-events-none">
            {isNoiseFilterEnabled ? 'Krisp AI: Online' : 'Krisp AI: Desativado'}
          </div>
        </div>

        {/* 2. Botão Ensurdecer (Deafen - Silenciar Sala & Microfone) */}
        <div className="relative group">
          <button
            onClick={handleToggleDeafen}
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all cursor-pointer relative ${
              isDeafened
                ? 'bg-[#f23f43] hover:bg-[#d83a3e] text-white shadow-lg shadow-rose-950/40 border border-[#f23f43]'
                : 'bg-[#313338] hover:bg-[#3b3e45] text-[#dbdee1] border border-[#3f4248]'
            }`}
            aria-label={isDeafened ? 'Desativar ensurdecer' : 'Ensurdecer (Silenciar sala e microfone)'}
          >
            <Headphones className="w-4 h-4 sm:w-5 sm:h-5" />
            {isDeafened && (
              <span className="absolute w-6 sm:w-7 h-0.5 bg-white rotate-45 pointer-events-none" />
            )}
          </button>
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-[#111214] text-[#dbdee1] text-xs px-3 py-1.5 rounded-md border border-[#2b2d31] whitespace-nowrap shadow-xl z-30">
            {isDeafened ? 'Desativar Ensurdecer (Ouvir a sala)' : 'Ensurdecer (Silenciar sala e microfone)'}
          </div>
        </div>

        {/* 3. Grupo de Compartilhamento de Tela com Seletor de Resolução / FPS */}
        <div className="relative flex items-center" ref={qualityMenuRef}>
          <div className="relative group flex items-center">
            <button
              onClick={toggleScreenShare}
              disabled={isScreenLoading || !isScreenShareSupported}
              className={`h-11 sm:h-12 px-3 sm:px-4 rounded-l-full flex items-center justify-center transition-all cursor-pointer ${
                !isScreenShareSupported
                  ? 'bg-[#1e1f22] text-[#4e5058] border-y border-l border-[#2b2d31] cursor-not-allowed'
                  : isScreenShareEnabled
                  ? 'bg-[#23a55a] hover:bg-[#1d8a4b] text-white shadow-lg shadow-emerald-950/40 border-y border-l border-[#23a55a]'
                  : 'bg-[#313338] hover:bg-[#3b3e45] text-[#dbdee1] border-y border-l border-[#3f4248]'
              }`}
              aria-label={isScreenShareEnabled ? 'Interromper compartilhamento' : 'Compartilhar tela'}
            >
              {isScreenLoading ? (
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-[#949ba4]" />
              ) : isScreenShareEnabled ? (
                <MonitorOff className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <Monitor className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </button>

            {/* Seta do Seletor de Qualidade da Transmissão */}
            <button
              onClick={() => {
                setShowQualityMenu((prev) => !prev);
                setShowMicMenu(false);
              }}
              disabled={!isScreenShareSupported}
              className={`h-11 sm:h-12 px-1.5 sm:px-2 rounded-r-full flex items-center justify-center border-l border-[#383a40] transition-all cursor-pointer ${
                !isScreenShareSupported
                  ? 'bg-[#1e1f22] text-[#4e5058] border-y border-r border-[#2b2d31] cursor-not-allowed'
                  : isScreenShareEnabled
                  ? 'bg-[#23a55a] hover:bg-[#1d8a4b] text-white border-y border-r border-[#23a55a]'
                  : 'bg-[#313338] hover:bg-[#3b3e45] text-[#dbdee1] border-y border-r border-[#3f4248]'
              }`}
              title="Qualidade e Resolução da Transmissão"
            >
              <ChevronUp className={`w-4 h-4 transition-transform duration-200 ${showQualityMenu ? 'rotate-180' : ''}`} />
            </button>

            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-[#111214] text-[#dbdee1] text-xs px-3 py-1.5 rounded-md border border-[#2b2d31] whitespace-nowrap shadow-xl z-30">
              {!isScreenShareSupported
                ? 'Compartilhamento indisponível'
                : isScreenShareEnabled
                ? 'Interromper compartilhamento'
                : `Transmitir (${activePresetConfig.name})`}
            </div>
          </div>

          {/* Menu Dropdown de Seleção de Qualidade de Tela */}
          {showQualityMenu && (
            <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-72 bg-[#111214] border border-[#313338] rounded-xl p-3 shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-2 space-y-2">
              <div className="flex items-center gap-2 px-1 py-1 border-b border-[#2b2d31] mb-2">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#5865F2]" />
                <span className="text-[11px] font-bold text-[#b5bac1] uppercase tracking-wider">
                  Qualidade da Transmissão
                </span>
              </div>

              {(Object.keys(SCREEN_PRESETS) as ScreenQualityPreset[]).map((key) => {
                const preset = SCREEN_PRESETS[key];
                const isSelected = qualityPreset === key;

                return (
                  <button
                    key={key}
                    onClick={() => handleSelectQuality(key)}
                    className={`w-full text-left p-2.5 rounded-lg text-xs transition-all cursor-pointer flex items-center justify-between border ${
                      isSelected
                        ? 'bg-[#5865F2]/20 border-[#5865F2] text-white font-bold'
                        : 'bg-[#1e1f22] border-[#2b2d31] text-[#dbdee1] hover:bg-[#2b2d31]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        {key === '1080p60' && <Zap className="w-3.5 h-3.5 text-[#23a55a]" />}
                        <p className="font-bold text-white">{preset.name}</p>
                      </div>
                      <p className="text-[10px] text-[#949ba4] mt-0.5">{preset.description}</p>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[#5865F2] shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>


        {/* 5. Botão de Bate-papo (Chat) */}
        <div className="relative group">
          <button
            onClick={onToggleChat}
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all cursor-pointer relative ${
              isChatOpen
                ? 'bg-[#5865F2] hover:bg-[#4752C4] text-white shadow-lg shadow-indigo-950/40 border border-[#5865F2]'
                : 'bg-[#313338] hover:bg-[#3b3e45] text-[#dbdee1] border border-[#3f4248]'
            }`}
            aria-label="Abrir ou fechar bate-papo"
          >
            <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />

            {/* Contador de Mensagens Não Lidas */}
            {unreadCount > 0 && !isChatOpen && (
              <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#f23f43] text-white text-[9px] sm:text-[10px] font-extrabold flex items-center justify-center shadow-md animate-bounce border border-[#232428]">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-[#111214] text-[#dbdee1] text-xs px-3 py-1.5 rounded-md border border-[#2b2d31] whitespace-nowrap shadow-xl z-30">
            {isChatOpen ? 'Fechar Bate-papo' : 'Abrir Bate-papo da Sala'}
          </div>
        </div>

        {/* 6. Botão Desconectar */}
        <div className="relative group">
          <button
            onClick={handleDisconnect}
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#f23f43] hover:bg-[#d83a3e] text-white flex items-center justify-center transition-all shadow-lg shadow-rose-950/50 cursor-pointer"
            aria-label="Desconectar da chamada"
          >
            <PhoneOff className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-[#111214] text-[#dbdee1] text-xs px-3 py-1.5 rounded-md border border-[#2b2d31] whitespace-nowrap shadow-xl z-30">
            Desconectar da chamada
          </div>
        </div>
      </div>

      {/* Espaçador para alinhamento / Indicador de Resolução ativa */}
      <div className="hidden sm:block min-w-48 text-right text-xs text-[#949ba4]">
        <span className="px-2 py-1 rounded bg-[#1e1f22] border border-[#313338] text-[#dbdee1] font-semibold">
          {activePresetConfig.name}
        </span>
      </div>
    </footer>
  );
}
