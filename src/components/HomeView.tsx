'use client';

import React, { useState } from 'react';
import { useRoomStatus } from '@/hooks/useRoomStatus';
import { validateNickname } from '@/lib/validation';
import { VoiceTest } from '@/components/VoiceTest';
import { Users, Mic, Monitor, Loader2, ArrowRight, Volume2, ShieldCheck, Zap } from 'lucide-react';

interface HomeViewProps {
  onJoinRoom: (nickname: string) => Promise<void>;
  isJoining: boolean;
  joinError: string | null;
}

export function HomeView({ onJoinRoom, isJoining, joinError }: HomeViewProps) {
  const [nicknameInput, setNicknameInput] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const { participantCount, isLoading: isStatusLoading } = useRoomStatus(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    const validation = validateNickname(nicknameInput);
    if (!validation.isValid) {
      setLocalError(validation.error || 'Nickname inválido.');
      return;
    }

    try {
      await onJoinRoom(validation.sanitized);
    } catch {
      // O erro global de conexão será exibido via props joinError
    }
  };

  const displayError = localError || joinError;

  return (
    <main className="min-h-screen bg-[#1e1f22] text-[#dbdee1] flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Elementos decorativos estilo Discord */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[#5865F2]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-[#23a55a]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md z-10 space-y-6">
        {/* Logotipo / Cabeçalho */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#2b2d31] border border-[#313338] text-[#23a55a] text-xs font-bold mb-2">
            <Zap className="w-3.5 h-3.5 fill-current animate-pulse" />
            Transmissão de Tela 60 FPS & Voz HD
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2">
            <Volume2 className="w-8 h-8 text-[#5865F2]" />
            Sala Principal
          </h1>
          <p className="text-[#949ba4] text-sm">
            Conecte-se ao canal de voz e compartilhe múltiplas telas ao mesmo tempo em 60 FPS.
          </p>
        </div>

        {/* Card do Canal Estilo Servidor do Discord */}
        <div className="bg-[#2b2d31] border border-[#313338] rounded-2xl p-6 shadow-2xl shadow-black/80 space-y-6">
          {/* Status do Canal de Voz */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-[#1e1f22] border border-[#313338]">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#23a55a] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#23a55a]"></span>
              </span>
              <div>
                <p className="text-xs font-bold text-[#949ba4] uppercase tracking-wider">Canal de Voz</p>
                <p className="text-sm font-extrabold text-white flex items-center gap-1.5">
                  <span>🔊 sala-principal</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#2b2d31] border border-[#313338] text-[#dbdee1] text-xs font-bold">
              <Users className="w-4 h-4 text-[#5865F2]" />
              {isStatusLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#949ba4]" />
              ) : (
                <span>
                  {participantCount} {participantCount === 1 ? 'membro' : 'membros'}
                </span>
              )}
            </div>
          </div>

          {/* Teste de Microfone & Voz */}
          <VoiceTest />

          {/* Formulário de Nickname */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="nickname" className="block text-xs font-bold text-[#b5bac1] uppercase tracking-wider">
                Seu Nickname no Canal
              </label>
              <input
                id="nickname"
                type="text"
                value={nicknameInput}
                onChange={(e) => setNicknameInput(e.target.value)}
                placeholder="Ex: Alex_Discord"
                disabled={isJoining}
                maxLength={24}
                autoComplete="off"
                className="w-full px-4 py-3 rounded-lg bg-[#1e1f22] border border-[#383a40] text-white placeholder-[#80848e] focus:outline-none focus:ring-2 focus:ring-[#5865F2] focus:border-transparent transition-all text-sm font-medium disabled:opacity-50"
              />
              <p className="text-[11px] text-[#949ba4]">
                Mínimo 2 e máximo 24 caracteres. Letras, números, espaços, hífen (-) e underline (_).
              </p>
            </div>

            {/* Mensagem de Erro */}
            {displayError && (
              <div className="p-3 rounded-lg bg-[#f23f43]/10 border border-[#f23f43]/30 text-[#f23f43] text-xs flex items-start gap-2 font-medium">
                <span>⚠️</span>
                <p className="flex-1">{displayError}</p>
              </div>
            )}

            {/* Botão Entrar na Sala */}
            <button
              type="submit"
              disabled={isJoining || !nicknameInput.trim()}
              className="w-full py-3.5 px-4 rounded-lg bg-[#5865F2] hover:bg-[#4752C4] active:bg-[#3c45a5] text-white font-bold text-sm transition-all duration-200 shadow-lg shadow-[#5865F2]/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isJoining ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Entrando no canal de voz...</span>
                </>
              ) : (
                <>
                  <span>Entrar no canal de voz</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Recursos / Permissões */}
          <div className="border-t border-[#313338] pt-4 space-y-2 text-xs text-[#949ba4]">
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-[#23a55a] shrink-0" />
              <span>Indicadores visuais de fala reluzentes quando você fala.</span>
            </div>
            <div className="flex items-center gap-2">
              <Monitor className="w-4 h-4 text-[#5865F2] shrink-0" />
              <span>Transmissões simultâneas de tela a <strong>60 FPS</strong>.</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#23a55a] shrink-0" />
              <span>WebRTC criptografado via LiveKit Cloud.</span>
            </div>
          </div>
        </div>

        {/* Rodapé informativo */}
        <p className="text-center text-xs text-[#949ba4]">
          Canal permanente. A sala permanece ativa para todos os membros.
        </p>
      </div>
    </main>
  );
}
