'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, Volume2, Square, VolumeX } from 'lucide-react';

export function VoiceTest() {
  const [isTesting, setIsTesting] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [hearFeedback, setHearFeedback] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const stopTest = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    gainNodeRef.current = null;
    setIsTesting(false);
    setVolumeLevel(0);
  };

  const startTest = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      audioCtxRef.current = audioCtx;

      // Se o áudio estivesse suspenso pelo navegador, retoma a execução
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.4;

      // Nó de ganho para retorno de áudio nos alto-falantes/fones
      const gainNode = audioCtx.createGain();
      gainNode.gain.value = hearFeedback ? 1.0 : 0.0;
      gainNodeRef.current = gainNode;

      source.connect(analyser);
      analyser.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      const dataArray = new Uint8Array(analyser.fftSize);

      const updateVolume = () => {
        analyser.getByteTimeDomainData(dataArray);

        // Cálculo de RMS para alta sensibilidade de voz humana
        let sumSquares = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const norm = (dataArray[i] - 128) / 128;
          sumSquares += norm * norm;
        }
        const rms = Math.sqrt(sumSquares / dataArray.length);

        // Escala amplificada para resposta visual instantânea (0 a 100%)
        const percentage = Math.min(100, Math.round(rms * 400));
        setVolumeLevel(percentage);

        animFrameRef.current = requestAnimationFrame(updateVolume);
      };

      setIsTesting(true);
      updateVolume();
    } catch (err) {
      console.error('Erro ao iniciar teste de voz:', err);
      setError('Permissão negada ou microfone não encontrado.');
      stopTest();
    }
  };

  // Atualiza o volume do retorno sem reiniciar o teste
  const toggleHearFeedback = () => {
    const nextState = !hearFeedback;
    setHearFeedback(nextState);
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = nextState ? 1.0 : 0.0;
    }
  };

  useEffect(() => {
    return () => {
      stopTest();
    };
  }, []);

  return (
    <div className="p-4 rounded-xl bg-[#1e1f22] border border-[#313338] space-y-3 select-none">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mic className="w-4 h-4 text-[#5865F2]" />
          <h4 className="text-xs font-bold text-[#f2f3f5] uppercase tracking-wider">
            Teste de Microfone & Retorno de Voz
          </h4>
        </div>
        <button
          type="button"
          onClick={isTesting ? stopTest : startTest}
          className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            isTesting
              ? 'bg-[#f23f43] hover:bg-[#d83a3e] text-white shadow-lg shadow-rose-950/40'
              : 'bg-[#5865F2] hover:bg-[#4752C4] text-white shadow-lg shadow-indigo-950/40'
          }`}
        >
          {isTesting ? (
            <>
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Parar Teste</span>
            </>
          ) : (
            <>
              <Volume2 className="w-3.5 h-3.5" />
              <span>Testar Microfone</span>
            </>
          )}
        </button>
      </div>

      {/* Indicador de Nível de Entrada de Áudio (RMS Reativo) */}
      <div className="space-y-1">
        <div className="flex justify-between text-[11px] text-[#949ba4] font-medium">
          <span>Sensibilidade do Microfone</span>
          <span className={volumeLevel > 5 ? 'text-[#23a55a] font-bold' : ''}>
            {isTesting ? `${volumeLevel}%` : 'Inativo'}
          </span>
        </div>
        <div className="w-full h-3 rounded-full bg-[#2b2d31] overflow-hidden p-0.5 border border-[#383a40]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#23a55a] via-[#f0b232] to-[#f23f43] transition-all duration-75"
            style={{ width: `${isTesting ? Math.max(2, volumeLevel) : 0}%` }}
          />
        </div>
      </div>

      {/* Opção para Ouvir o próprio retorno de áudio */}
      {isTesting && (
        <div className="flex items-center justify-between pt-1 text-xs">
          <label className="flex items-center gap-2 text-[#dbdee1] cursor-pointer">
            <input
              type="checkbox"
              checked={hearFeedback}
              onChange={toggleHearFeedback}
              className="w-4 h-4 rounded bg-[#2b2d31] border-[#383a40] text-[#5865F2] focus:ring-[#5865F2]"
            />
            <span>Ouvir meu retorno de áudio nos fones</span>
          </label>
          {hearFeedback ? (
            <span className="text-[11px] text-[#23a55a] font-medium flex items-center gap-1">
              <Volume2 className="w-3 h-3 animate-pulse" /> Retorno Ativo
            </span>
          ) : (
            <span className="text-[11px] text-[#949ba4] flex items-center gap-1">
              <VolumeX className="w-3 h-3" /> Mudo
            </span>
          )}
        </div>
      )}

      {error && <p className="text-xs text-[#f23f43] font-medium">{error}</p>}
    </div>
  );
}
