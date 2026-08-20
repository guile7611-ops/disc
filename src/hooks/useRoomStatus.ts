'use client';

import { useState, useEffect, useCallback } from 'react';

interface RoomStatusResponse {
  participantCount: number;
}

export function useRoomStatus(enabled: boolean = true) {
  const [participantCount, setParticipantCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/room-status', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Falha ao obter status da sala');
      }
      const data: RoomStatusResponse = await response.json();
      setParticipantCount(data.participantCount ?? 0);
      setError(null);
    } catch (err) {
      console.error('Erro ao consultar /api/room-status:', err);
      setError('Não foi possível atualizar a quantidade de pessoas.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    fetchStatus();
    const interval = setInterval(fetchStatus, 10000); // 10s polling

    return () => clearInterval(interval);
  }, [enabled, fetchStatus]);

  return { participantCount, isLoading, error, refresh: fetchStatus };
}
