'use client';

import React, { useState } from 'react';
import { useRoomStatus } from '@/hooks/useRoomStatus';
import { validateNickname } from '@/lib/validation';
import { Users, Mic, Monitor, Loader2, ArrowRight, Radio, ShieldCheck } from 'lucide-react';

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
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Elementos decorativos de fundo */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md z-10 space-y-6">
        {/* Logotipo / Cabeçalho */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 text-xs font-medium mb-2">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            Voz & Compartilhamento HD
          </div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Sala Principal
          </h1>
          <p className="text-slate-400 text-sm">
            Conecte-se instantaneamente para conversar por voz e compartilhar sua tela sem complicações.
          </p>
        </div>

        {/* Card da Sala Permanente */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 shadow-2xl shadow-black/50 space-y-6">
          {/* Status da Sala */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/50">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <div>
                <p className="text-xs text-slate-400">Canal Ativo</p>
                <p className="text-sm font-semibold text-slate-200">Sala principal</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs font-medium">
              <Users className="w-4 h-4 text-indigo-400" />
              {isStatusLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
              ) : (
                <span>
                  {participantCount} {participantCount === 1 ? 'conectado' : 'conectados'}
                </span>
              )}
            </div>
          </div>

          {/* Formulário de Nickname */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="nickname" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Seu Nickname
              </label>
              <input
                id="nickname"
                type="text"
                value={nicknameInput}
                onChange={(e) => setNicknameInput(e.target.value)}
                placeholder="Ex: Gabriel_Dev"
                disabled={isJoining}
                maxLength={24}
                autoComplete="off"
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm disabled:opacity-50"
              />
              <p className="text-[11px] text-slate-400">
                Entre 2 e 24 caracteres. Letras, números, espaços, hífen (-) e underline (_).
              </p>
            </div>

            {/* Mensagem de Erro */}
            {displayError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2 animate-in fade-in slide-in-from-top-1">
                <span>⚠️</span>
                <p className="flex-1">{displayError}</p>
              </div>
            )}

            {/* Botão de Envio */}
            <button
              type="submit"
              disabled={isJoining || !nicknameInput.trim()}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium text-sm transition-all duration-200 shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.99]"
            >
              {isJoining ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Conectando à sala...</span>
                </>
              ) : (
                <>
                  <span>Entrar na sala</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Recursos / Permissões */}
          <div className="border-t border-slate-800/80 pt-4 space-y-2 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-slate-400 shrink-0" />
              <span>O navegador solicitará acesso ao seu microfone ao entrar.</span>
            </div>
            <div className="flex items-center gap-2">
              <Monitor className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Transmissão de tela de alta definição (1080p@30fps).</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Conexão criptografada de ponta a ponta via LiveKit Cloud.</span>
            </div>
          </div>
        </div>

        {/* Rodapé informativo */}
        <p className="text-center text-xs text-slate-400">
          A sala é fixa e está sempre disponível para novas chamadas.
        </p>
      </div>
    </main>
  );
}
