'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useLocalParticipant, useRoomContext, useChat } from '@livekit/components-react';
import { useKrispNoiseFilter } from '@livekit/components-react/krisp';
import { Track } from 'livekit-client';
import { useScreenShareSupport } from '@/hooks/useScreenShareSupport';
import { useMicrophones } from '@/hooks/useMicrophones';
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
  Sparkles,
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
  const { chatMessages } = useChat();

  // Hook Oficial do Krisp Noise Filter da LiveKit
  const { isNoiseFilterEnabled, isNoiseFilterPending, setNoiseFilterEnabled } = useKrispNoiseFilter();

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
      await localParticipant.setMicrophoneEnabled(nextState, {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
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

  const toggleKrispNoiseFilter = async () => {
    if (isNoiseFilterPending) return;
    try {
      await setNoiseFilterEnabled(!isNoiseFilterEnabled);
    } catch (err) {
      console.error('Erro ao alternar supressão de ruído Krisp:', err);
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
          <p className="text-[11px] text-[#949ba4] truncate max-w-40 flex items-center gap-1">
            <span>Full HD 60fps</span>
            {isNoiseFilterEnabled && (
              <span className="text-[#23a55a] font-extrabold text-[10px]">/ Krisp AI</span>
            )}
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

            {/* Seta para abrir menu de microfones e Krisp */}
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
              title="Configurações de Microfone e Krisp AI"
            >
              <ChevronUp className={`w-4 h-4 transition-transform duration-200 ${showMicMenu ? 'rotate-180' : ''}`} />
            </button>

            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-[#111214] text-[#dbdee1] text-xs px-3 py-1.5 rounded-md border border-[#2b2d31] whitespace-nowrap shadow-xl z-30">
              {isMicrophoneEnabled ? 'Desativar microfone' : 'Ativar microfone'}
            </div>
          </div>

          {/* Menu Suspenso de Seleção de Microfone & Krisp AI */}
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

              {/* Seção 2: Supressão de Ruído Krisp AI (Botão Ativar / Desativar) */}
              <div>
                <div className="flex items-center justify-between px-1 py-1 border-b border-[#2b2d31] mb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-[#23a55a]" />
                    <span className="text-[11px] font-bold text-[#b5bac1] uppercase tracking-wider">
                      Supressão de Ruído Krisp AI
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
                  className={`w-full py-2.5 px-3 rounded-lg border text-xs font-bold transition-all cursor-pointer flex items-center justify-between shadow-md ${
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
                <p className="text-[10px] text-[#949ba4] mt-1.5 px-1">
                  Remove automaticamente latidos, teclados, fãs e ruídos ambiente usando Krisp AI.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Botão Dedicado Krisp AI na Barra Central (Ativar / Desativar Rápido) */}
        <div className="relative group">
          <button
            onClick={toggleKrispNoiseFilter}
            disabled={isNoiseFilterPending}
            className={`h-12 px-3.5 rounded-full flex items-center gap-2 transition-all cursor-pointer border text-xs font-bold ${
              isNoiseFilterEnabled
                ? 'bg-[#23a55a]/20 border-[#23a55a] text-[#23a55a] shadow-lg shadow-emerald-950/40'
                : 'bg-[#313338] hover:bg-[#3b3e45] border-[#3f4248] text-[#dbdee1]'
            }`}
            aria-label="Ativar ou desativar supressão de ruído Krisp AI"
          >
            {isNoiseFilterPending ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#5865F2]" />
            ) : (
              <Sparkles className={`w-4 h-4 ${isNoiseFilterEnabled ? 'text-[#23a55a] animate-pulse' : 'text-[#949ba4]'}`} />
            )}
            <span className="hidden lg:inline">
              {isNoiseFilterEnabled ? 'Krisp On' : 'Krisp Off'}
            </span>
          </button>
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-[#111214] text-[#dbdee1] text-xs px-3 py-1.5 rounded-md border border-[#2b2d31] whitespace-nowrap shadow-xl">
            {isNoiseFilterEnabled ? 'Desativar Supressão Krisp AI' : 'Ativar Supressão Krisp AI'}
          </div>
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
