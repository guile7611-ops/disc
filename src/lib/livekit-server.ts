import { RoomServiceClient } from 'livekit-server-sdk';

/**
 * Converte a URL do WebSocket para o protocolo HTTP(S) esperado pelo RoomServiceClient.
 */
export function getLiveKitHost(): string {
  const rawUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || '';
  if (!rawUrl) return '';
  return rawUrl.replace(/^wss:\/\//i, 'https://').replace(/^ws:\/\//i, 'http://');
}

/**
 * Cria uma instância do cliente de API do servidor LiveKit.
 */
export function getRoomServiceClient(): RoomServiceClient | null {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const host = getLiveKitHost();

  if (!apiKey || !apiSecret || !host) {
    return null;
  }

  return new RoomServiceClient(host, apiKey, apiSecret);
}
