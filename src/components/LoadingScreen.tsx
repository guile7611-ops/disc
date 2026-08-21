'use client';

import React, { useState, useEffect } from 'react';
import { PsyduckIcon } from '@/components/PsyduckIcon';
import { Mic, Volume2, ShieldCheck, Sparkles } from 'lucide-react';

interface LoadingScreenProps {
  onFinished: () => void;
}

export function LoadingScreen({ onFinished }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Iniciando Sala Principal...');
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Animação de progresso suave de 0% a 100%
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        // Incremento com variação dinâmica para efeito realista de carregamento
        const increment = Math.floor(Math.random() * 8) + 4;
        const next = Math.min(100, prev + increment);

        // Atualiza a mensagem de acordo com o progresso
        if (next < 30) {
          setStatusMessage('Localizando o Psyduck...');
        } else if (next < 60) {
          setStatusMessage('Detectando microfones e áudio...');
        } else if (next < 90) {
          setStatusMessage('Inicializando canal HD 60 FPS...');
        } else {
          setStatusMessage('Tudo pronto!');
        }

        return next;
      });
    }, 90);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress === 100) {
      const timeout = setTimeout(() => {
        setIsFadingOut(true);
        const fadeTimeout = setTimeout(() => {
          onFinished();
        }, 500); // 500ms para completar o fade-out
        return () => clearTimeout(fadeTimeout);
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [progress, onFinished]);

  return (
    <div
      className={`fixed inset-0 z-50 bg-[#1e1f22] text-[#dbdee1] flex flex-col items-center justify-center p-6 select-none transition-opacity duration-500 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Luzes de Fundo Animadas */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#5865F2]/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-[#23a55a]/15 rounded-full blur-3xl pointer-events-none animate-pulse" />

      <div className="w-full max-w-sm flex flex-col items-center text-center space-y-6 z-10">
        {/* Ícone Animado do Psyduck */}
        <div className="relative group">
          <PsyduckIcon size={190} />
          <div className="absolute -top-2 -right-2 bg-[#5865F2] text-white p-1.5 rounded-full shadow-lg animate-bounce">
            <Sparkles className="w-4 h-4 fill-current" />
          </div>
        </div>

        {/* Título e Subtítulo */}
        <div className="space-y-1">
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center justify-center gap-2">
            <Volume2 className="w-6 h-6 text-[#5865F2]" />
            Sala Principal
          </h2>
          <p className="text-xs text-[#949ba4] font-medium">
            Sua central de áudio HD e transmissão 60 FPS
          </p>
        </div>

        {/* Barra de Carregamento Estilizada */}
        <div className="w-full space-y-2">
          {/* Status e Porcentagem */}
          <div className="flex items-center justify-between text-xs font-bold px-1">
            <span className="text-[#b5bac1] flex items-center gap-1.5 truncate max-w-[220px]">
              <Mic className="w-3.5 h-3.5 text-[#23a55a] animate-pulse" />
              {statusMessage}
            </span>
            <span className="text-[#5865F2] font-extrabold">{progress}%</span>
          </div>

          {/* Trilha do Carregador */}
          <div className="w-full h-3 rounded-full bg-[#2b2d31] p-0.5 border border-[#313338] shadow-inner overflow-hidden relative">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#5865F2] via-[#7983F5] to-[#23a55a] transition-all duration-150 ease-out shadow-[0_0_12px_rgba(88,101,242,0.6)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Rodapé Informativo da Tela de Abertura */}
        <div className="pt-2 flex items-center gap-4 text-[11px] text-[#949ba4]">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#23a55a]" /> Protegido & Criptografado
          </span>
          <span>•</span>
          <span>WebRTC HD</span>
        </div>
      </div>
    </div>
  );
}
