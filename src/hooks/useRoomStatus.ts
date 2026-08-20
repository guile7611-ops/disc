'use client';

import { useState, useEffect } from 'react';

interface RoomStatusResponse {
  participantCount: number;
}

export function useRoomStatus(enabled: boolean = true) {
  const [participantCount, setParticipantCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let isMounted = true;

    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/room-status', { cache: 'no-store' });
        if (!response.ok) {
          throw new Error('Falha ao obter status da sala');
        }
        const data: RoomStatusResponse = await response.json();
        if (isMounted) {
          setParticipantCount(data.participantCount ?? 0);
          setError(null);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Erro ao consultar /api/room-status:', err);
        if (isMounted) {
          setError('Não foi possível atualizar a quantidade de pessoas.');
          setIsLoading(false);
        }
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 10000); // 10s polling

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [enabled]);

  return { participantCount, isLoading, error };
}
