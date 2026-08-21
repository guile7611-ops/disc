'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useLocalParticipant, useRoomContext, useChat } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { useScreenShareSupport } from '@/hooks/useScreenShareSupport';
import { useMicrophones } from '@/hooks/useMicrophones';
import { useNoiseSuppression, NoiseSuppressionMode } from '@/hooks/useNoiseSuppression';
import {
  Mic,
  MicOff,
  Monitor,
  MonitorOff,
  PhoneOff,
  Loader2,
  Volume2,
  ChevronUp,
  Check,
  Settings,
  MessageSquare,
  Sliders,
} from 'lucide-react';

interface ControlBarProps {
  onLeave: () => void;
  isChatOpen: boolean;
  onToggleChat: () => void;
}

export function ControlBar({ onLeave, isChatOpen, onToggleChat }: ControlBarProps) {
  const room = useRoomContext();
  const { localParticipant, isMicrophoneEnabled, isScreenShareEnabled } = useLocalParticipant();
  const isScreenShareSupported = useScreenShareSupport();
  const { devices, selectedDeviceId, setSelectedDeviceId, refreshDevices } = useMicrophones();
  const { mode: noiseMode, setMode: setNoiseMode, options: noiseOptions, getAudioConstraints } = useNoiseSuppression();
  const { chatMessages } = useChat();

  const [isMicLoading, setIsMicLoading] = useState(false);
  const [isScreenLoading, setIsScreenLoading] = useState(false);
  const [showMicMenu, setShowMicMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const lastSeenMsgCountRef = useRef(chatMessages.length);
  const menuRef = useRef<HTMLDivElement>(null);

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
      const noiseConstraints = getAudioConstraints();

      await localParticipant.setMicrophoneEnabled(nextState, {
        ...noiseConstraints,
      });
    } catch (err) {
      console.error('Erro ao alternar microfone:', err);
    } finally {
      setIsMicLoading(false);
    }
  };

  const handleSelectMicrophone = async (deviceId: string) => {
    setSelectedDeviceId(deviceId);

    if (room) {
      try {
        await room.switchActiveDevice('audioinput', deviceId);
      } catch (err) {
        console.error('Erro ao alternar dispositivo no LiveKit:', err);
      }
    }
  };

  const handleNoiseModeSelect = async (modeId: NoiseSuppressionMode) => {
    setNoiseMode(modeId);

    // Se o microfone estiver ativo, reaplica os novos filtros de supressão de ruído no participante
    if (localParticipant && isMicrophoneEnabled) {
      try {
        const noiseConstraints = getAudioConstraints();
        await localParticipant.setMicrophoneEnabled(false);
        await localParticipant.setMicrophoneEnabled(true, noiseConstraints);
      } catch (e) {
        console.error('Erro ao reaplicar supressão de ruído:', e);
      }
    }
  };

  const toggleScreenShare = async () => {
    if (!localParticipant || isScreenLoading || !isScreenShareSupported) return;
    setIsScreenLoading(true);

    try {
      const nextState = !isScreenShareEnabled;
      await localParticipant.setScreenShareEnabled(nextState, {
        audio: true,
        resolution: {
          width: 1920,
          height: 1080,
          frameRate: 60,
        },
        contentHint: 'motion',
      });

      if (nextState) {
        setTimeout(() => {
          try {
            const screenTrackPub = localParticipant.getTrackPublication(Track.Source.ScreenShare);
            if (screenTrackPub && screenTrackPub.track) {
              const sender = screenTrackPub.track.sender;
              if (sender && typeof sender.getParameters === 'function') {
                const params = sender.getParameters();
                if (params && params.encodings && params.encodings.length > 0) {
                  params.encodings[0].maxBitrate = 10_000_000;
                  params.encodings[0].maxFramerate = 60;
                  params.degradationPreference = 'maintain-framerate';
                  sender.setParameters(params).catch(() => {});
                }
              }
            }
          } catch (e) {
            console.error('Aviso ao ajustar sender WebRTC:', e);
          }
        }, 500);
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

  // Fecha o menu de microfones se clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMicMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
          <p className="text-[11px] text-[#949ba4] truncate max-w-36">
            Full HD 60fps / Filtro IA
          </p>
        </div>
      </div>

      {/* Botões Centrais de Controle */}
      <div className="flex items-center gap-3 mx-auto sm:mx-0">
        {/* Grupo do Botão Microfone com Seletor Popover */}
        <div className="relative flex items-center" ref={menuRef}>
          <div className="relative group flex items-center">
            <button
              onClick={toggleMicrophone}
              disabled={isMicLoading}
              className={`h-12 px-4 rounded-l-full flex items-center justify-center transition-all cursor-pointer ${
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

            {/* Seta para abrir menu de microfones e supressão de ruído */}
            <button
              onClick={() => {
                refreshDevices();
                setShowMicMenu((prev) => !prev);
              }}
              className={`h-12 px-2 rounded-r-full flex items-center justify-center border-l border-[#383a40] transition-all cursor-pointer ${
                isMicrophoneEnabled
                  ? 'bg-[#313338] hover:bg-[#3b3e45] text-[#dbdee1] border-y border-r border-[#3f4248]'
                  : 'bg-[#f23f43] hover:bg-[#d83a3e] text-white'
              }`}
              title="Selecionar Microfone e Filtros de Ruído"
            >
              <ChevronUp className={`w-4 h-4 transition-transform duration-200 ${showMicMenu ? 'rotate-180' : ''}`} />
            </button>

            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-[#111214] text-[#dbdee1] text-xs px-3 py-1.5 rounded-md border border-[#2b2d31] whitespace-nowrap shadow-xl z-30">
              {isMicrophoneEnabled ? 'Desativar microfone' : 'Ativar microfone'}
            </div>
          </div>

          {/* Menu Suspenso de Seleção de Microfone & Supressão de Ruído */}
          {showMicMenu && (
            <div className="absolute bottom-full mb-3 left-0 w-80 bg-[#111214] border border-[#313338] rounded-xl p-3 shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-2 space-y-3">
              {/* Seção 1: Microfone */}
              <div>
                <div className="flex items-center gap-2 px-1 py-1 border-b border-[#2b2d31] mb-1.5">
                  <Settings className="w-3.5 h-3.5 text-[#5865F2]" />
                  <span className="text-[11px] font-bold text-[#b5bac1] uppercase tracking-wider">
                    Dispositivo de Entrada
                  </span>
                </div>
                <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
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

              {/* Seção 2: Supressão de Ruído (Filtro IA RNNoise / Nativo / Desativado) */}
              <div>
                <div className="flex items-center gap-2 px-1 py-1 border-b border-[#2b2d31] mb-1.5">
                  <Sliders className="w-3.5 h-3.5 text-[#23a55a]" />
                  <span className="text-[11px] font-bold text-[#b5bac1] uppercase tracking-wider">
                    Supressão de Ruído
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-1">
                  {noiseOptions.map((opt) => {
                    const isSelected = noiseMode === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => handleNoiseModeSelect(opt.id)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-[#23a55a]/20 border border-[#23a55a]/40 text-[#23a55a] font-bold'
                            : 'text-[#dbdee1] hover:bg-[#2b2d31]'
                        }`}
                      >
                        <div>
                          <p className="text-xs font-bold leading-none">{opt.label}</p>
                          <p className="text-[10px] text-[#949ba4] mt-0.5">{opt.description}</p>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-[#23a55a] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Botão Compartilhar Tela (Full HD 1080p 60 FPS) */}
        <div className="relative group">
          <button
            onClick={toggleScreenShare}
            disabled={isScreenLoading || !isScreenShareSupported}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              !isScreenShareSupported
                ? 'bg-[#1e1f22] text-[#4e5058] border border-[#2b2d31] cursor-not-allowed'
                : isScreenShareEnabled
                ? 'bg-[#23a55a] hover:bg-[#1d8a4b] text-white shadow-lg shadow-emerald-950/40 border border-[#23a55a]'
                : 'bg-[#313338] hover:bg-[#3b3e45] text-[#dbdee1] border border-[#3f4248]'
            }`}
            aria-label={isScreenShareEnabled ? 'Interromper compartilhamento' : 'Compartilhar tela (Full HD 1080p 60 FPS)'}
          >
            {isScreenLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-[#949ba4]" />
            ) : isScreenShareEnabled ? (
              <MonitorOff className="w-5 h-5" />
            ) : (
              <Monitor className="w-5 h-5" />
            )}
          </button>
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-[#111214] text-[#dbdee1] text-xs px-3 py-1.5 rounded-md border border-[#2b2d31] whitespace-nowrap shadow-xl">
            {!isScreenShareSupported
              ? 'Compartilhamento de tela indisponível no dispositivo'
              : isScreenShareEnabled
              ? 'Interromper compartilhamento'
              : 'Compartilhar tela (Full HD 1920x1080 @ 60 FPS)'}
          </div>
        </div>

        {/* Botão de Bate-papo (Chat) */}
        <div className="relative group">
          <button
            onClick={onToggleChat}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer relative ${
              isChatOpen
                ? 'bg-[#5865F2] hover:bg-[#4752C4] text-white shadow-lg shadow-indigo-950/40 border border-[#5865F2]'
                : 'bg-[#313338] hover:bg-[#3b3e45] text-[#dbdee1] border border-[#3f4248]'
            }`}
            aria-label="Abrir ou fechar bate-papo"
          >
            <MessageSquare className="w-5 h-5" />

            {/* Contador de Mensagens Não Lidas */}
            {unreadCount > 0 && !isChatOpen && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#f23f43] text-white text-[10px] font-extrabold flex items-center justify-center shadow-md animate-bounce border border-[#232428]">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-[#111214] text-[#dbdee1] text-xs px-3 py-1.5 rounded-md border border-[#2b2d31] whitespace-nowrap shadow-xl">
            {isChatOpen ? 'Fechar Bate-papo' : 'Abrir Bate-papo da Sala'}
          </div>
        </div>

        {/* Botão Desconectar */}
        <div className="relative group">
          <button
            onClick={handleDisconnect}
            className="w-12 h-12 rounded-full bg-[#f23f43] hover:bg-[#d83a3e] text-white flex items-center justify-center transition-all shadow-lg shadow-rose-950/50 cursor-pointer"
            aria-label="Desconectar da chamada"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-[#111214] text-[#dbdee1] text-xs px-3 py-1.5 rounded-md border border-[#2b2d31] whitespace-nowrap shadow-xl">
            Desconectar da chamada
          </div>
        </div>
      </div>

      {/* Espaçador para alinhamento */}
      <div className="hidden sm:block min-w-48 text-right text-xs text-[#949ba4]">
        Full HD (1080p @ 60 FPS)
      </div>
    </footer>
  );
}
