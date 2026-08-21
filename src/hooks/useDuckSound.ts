'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useRoomContext } from '@livekit/components-react';
import { RoomEvent } from 'livekit-client';

export function useDuckSound() {
  const room = useRoomContext();
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Inicializa ou reaproveita o AudioContext
  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtxRef.current = new AudioCtxClass();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => {});
    }
    return audioCtxRef.current;
  }, []);

  // Sintetizador Web Audio de Som de Pato ("Quack!") 100% nativo e sem arquivos externos
  const playQuack = useCallback(
    (type: 'join' | 'leave') => {
      try {
        const ctx = getAudioContext();
        if (!ctx) return;

        const now = ctx.currentTime;

        // Se for 'join', toca um "quack quack" alegre em tom mais alto
        // Se for 'leave', toca um "quack~" em tom descendente
        const count = type === 'join' ? 2 : 1;

        for (let i = 0; i < count; i++) {
          const startTime = now + i * 0.18;
          const duration = 0.22;

          // Oscilador Principal (Onda dente de serra para o timbre anasalado do pato)
          const osc = ctx.createOscillator();
          osc.type = 'sawtooth';

          // Frequência inicial e queda rápida (formante do graznado do pato)
          const startFreq = type === 'join' ? (i === 0 ? 420 : 480) : 340;
          const endFreq = type === 'join' ? (i === 0 ? 180 : 210) : 120;

          osc.frequency.setValueAtTime(startFreq, startTime);
          osc.frequency.exponentialRampToValueAtTime(endFreq, startTime + duration);

          // Filtro Bandpass (Simula o bico do pato / ressonância)
          const filter = ctx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(type === 'join' ? 1200 : 900, startTime);
          filter.Q.setValueAtTime(3.5, startTime);

          // Envelope de Volume (Ganho)
          const gain = ctx.createGain();
          gain.gain.setValueAtTime(0.01, startTime);
          gain.gain.linearRampToValueAtTime(0.35, startTime + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

          // Conexões
          osc.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);

          osc.start(startTime);
          osc.stop(startTime + duration + 0.05);
        }
      } catch (err) {
        console.error('Erro ao tocar som de pato:', err);
      }
    },
    [getAudioContext]
  );

  // Escuta os eventos de conexão e desconexão de participantes na sala LiveKit
  useEffect(() => {
    if (!room) return;

    const handleParticipantConnected = () => {
      playQuack('join');
    };

    const handleParticipantDisconnected = () => {
      playQuack('leave');
    };

    room.on(RoomEvent.ParticipantConnected, handleParticipantConnected);
    room.on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);

    return () => {
      room.off(RoomEvent.ParticipantConnected, handleParticipantConnected);
      room.off(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);
    };
  }, [room, playQuack]);

  return { playQuack };
}
