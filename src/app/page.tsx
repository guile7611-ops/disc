'use client';

import React, { useState } from 'react';
import { HomeView } from '@/components/HomeView';
import { RoomContainer } from '@/components/RoomContainer';

export default function Page() {
  const [token, setToken] = useState<string | null>(null);
  const [wsUrl, setWsUrl] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState<boolean>(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const handleJoinRoom = async (nickname: string) => {
    setIsJoining(true);
    setJoinError(null);

    try {
      const response = await fetch('/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nickname }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Falha ao solicitar autorização de entrada.');
      }

      if (!data.token || !data.wsUrl) {
        throw new Error('Resposta inválida do servidor de autorização.');
      }

      setToken(data.token);
      setWsUrl(data.wsUrl);
    } catch (err) {
      console.error('Erro ao conectar:', err);
      setJoinError(
        err instanceof Error ? err.message : 'Não foi possível conectar à sala. Tente novamente.'
      );
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeaveRoom = () => {
    setToken(null);
    setWsUrl(null);
  };

  if (token && wsUrl) {
    return (
      <RoomContainer
        token={token}
        wsUrl={wsUrl}
        onLeave={handleLeaveRoom}
      />
    );
  }

  return (
    <HomeView
      onJoinRoom={handleJoinRoom}
      isJoining={isJoining}
      joinError={joinError}
    />
  );
}
