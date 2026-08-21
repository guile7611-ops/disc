'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useMicrophones } from '@/hooks/useMicrophones';
import { useNoiseSuppression, NoiseSuppressionMode } from '@/hooks/useNoiseSuppression';
import { Mic, Volume2, Square, VolumeX, Settings2, Check, Sliders } from 'lucide-react';

export function VoiceTest() {
  const [isTesting, setIsTesting] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [hearFeedback, setHearFeedback] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { devices, selectedDeviceId, setSelectedDeviceId, refreshDevices } = useMicrophones();
  const { mode: noiseMode, setMode: setNoiseMode, options: noiseOptions, getAudioConstraints } = useNoiseSuppression();

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

  const startTest = async (overrideDeviceId?: string) => {
    stopTest();
    setError(null);

    const deviceToUse = overrideDeviceId || selectedDeviceId;
    const noiseConstraints = getAudioConstraints();

    try {
      const constraints: MediaStreamConstraints = {
        audio: deviceToUse
          ? {
              deviceId: { exact: deviceToUse },
              ...noiseConstraints,
            }
          : {
              ...noiseConstraints,
            },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      audioCtxRef.current = audioCtx;

      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.4;

      const gainNode = audioCtx.createGain();
      gainNode.gain.value = hearFeedback ? 1.0 : 0.0;
      gainNodeRef.current = gainNode;

      source.connect(analyser);
      analyser.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      const dataArray = new Uint8Array(analyser.fftSize);

      const updateVolume = () => {
        analyser.getByteTimeDomainData(dataArray);

        let sumSquares = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const norm = (dataArray[i] - 128) / 128;
          sumSquares += norm * norm;
        }
        const rms = Math.sqrt(sumSquares / dataArray.length);

        const percentage = Math.min(100, Math.round(rms * 400));
        setVolumeLevel(percentage);

        animFrameRef.current = requestAnimationFrame(updateVolume);
      };

      setIsTesting(true);
      updateVolume();
      refreshDevices();
    } catch (err) {
      console.error('Erro ao iniciar teste de voz:', err);
      setError('Não foi possível acessar o microfone selecionado.');
      stopTest();
    }
  };

  const handleMicSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    setSelectedDeviceId(newId);
    if (isTesting) {
      startTest(newId);
    }
  };

  const handleNoiseModeChange = (newMode: NoiseSuppressionMode) => {
    setNoiseMode(newMode);
    if (isTesting) {
      startTest();
    }
  };

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
    <div className="p-4 rounded-xl bg-[#1e1f22] border border-[#313338] space-y-4 select-none">
      {/* Cabeçalho do Teste */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mic className="w-4 h-4 text-[#5865F2]" />
          <h4 className="text-xs font-bold text-[#f2f3f5] uppercase tracking-wider">
            Configuração e Teste de Microfone
          </h4>
        </div>
        <button
          type="button"
          onClick={isTesting ? stopTest : () => startTest()}
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

      {/* Seletor de Microfone */}
      <div className="space-y-1.5">
        <label htmlFor="mic-select" className="block text-[11px] font-bold text-[#949ba4] uppercase tracking-wider flex items-center gap-1">
          <Settings2 className="w-3 h-3 text-[#5865F2]" />
          Dispositivo de Entrada (Microfone)
        </label>
        <div className="relative">
          <select
            id="mic-select"
            value={selectedDeviceId}
            onChange={handleMicSelectChange}
            className="w-full px-3 py-2 rounded-lg bg-[#2b2d31] border border-[#383a40] text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#5865F2] focus:border-transparent appearance-none cursor-pointer pr-8 truncate"
          >
            {devices.length === 0 ? (
              <option value="">Nenhum microfone encontrado</option>
            ) : (
              devices.map((device, index) => (
                <option key={device.deviceId || index} value={device.deviceId}>
                  {device.label || `Microfone ${index + 1}`}
                </option>
              ))
            )}
          </select>
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#949ba4]">
            ▼
          </div>
        </div>
      </div>

      {/* Seletor de Níveis de Supressão de Ruído (IA RNNoise, Médio, Baixo, Desativado) */}
      <div className="space-y-1.5 pt-1">
        <label className="block text-[11px] font-bold text-[#949ba4] uppercase tracking-wider flex items-center gap-1">
          <Sliders className="w-3 h-3 text-[#23a55a]" />
          Nível de Supressão de Ruído (Filtro Anti-ruído)
        </label>
        <div className="grid grid-cols-2 gap-2">
          {noiseOptions.map((opt) => {
            const isSelected = noiseMode === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleNoiseModeChange(opt.id)}
                className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#5865F2]/20 border-[#5865F2] text-white shadow-md'
                    : 'bg-[#2b2d31] border-[#383a40] text-[#dbdee1] hover:bg-[#35373c]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold truncate">{opt.label}</span>
                  <span
                    className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                      isSelected ? 'bg-[#5865F2] text-white' : 'bg-[#1e1f22] text-[#949ba4]'
                    }`}
                  >
                    {opt.badge}
                  </span>
                </div>
                <p className="text-[10px] text-[#949ba4] leading-tight line-clamp-2">{opt.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Indicador de Nível de Entrada de Áudio (RMS Reativo) */}
      <div className="space-y-1 pt-1">
        <div className="flex justify-between text-[11px] text-[#949ba4] font-medium">
          <span>Sensibilidade da Voz</span>
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
            <span>Ouvir meu retorno nos fones</span>
          </label>
          {hearFeedback ? (
            <span className="text-[11px] text-[#23a55a] font-medium flex items-center gap-1">
              <Check className="w-3 h-3 text-[#23a55a]" /> Retorno Ativo
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
