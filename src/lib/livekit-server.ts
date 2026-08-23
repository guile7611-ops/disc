import { RoomServiceClient } from 'livekit-server-sdk';

/**
 * Sanitiza e normaliza qualquer string de URL do LiveKit para garantir o protocolo correto.
 */
export function sanitizeLiveKitUrl(rawUrl: string, targetProtocol: 'ws' | 'http' = 'ws'): string {
  if (!rawUrl) return '';

  // Remove aspas simples/duplas e espaços em branco
  let cleaned = rawUrl.trim().replace(/^["']|["']$/g, '');
  if (!cleaned) return '';

  // Se o usuário não colocou protocolo nenhum (ex: "meu-app.livekit.cloud")
  if (!cleaned.includes('://')) {
    cleaned = (targetProtocol === 'ws' ? 'wss://' : 'https://') + cleaned;
  } else {
    // Se já tem protocolo, ajusta para o protocolo desejado
    if (targetProtocol === 'ws') {
      cleaned = cleaned.replace(/^https:\/\//i, 'wss://').replace(/^http:\/\//i, 'ws://');
    } else {
      cleaned = cleaned.replace(/^wss:\/\//i, 'https://').replace(/^ws:\/\//i, 'http://');
    }
  }

  // Remove barras extras no final
  return cleaned.replace(/\/+$/, '');
}

/**
 * Retorna a URL do WebSocket (wss:// ou ws://) para conexão de clientes.
 */
export function getLiveKitWsUrl(): string {
  const rawUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || process.env.LIVEKIT_URL || '';
  return sanitizeLiveKitUrl(rawUrl, 'ws');
}

/**
 * Converte a URL para o protocolo HTTP(S) esperado pelo RoomServiceClient.
 */
export function getLiveKitHost(): string {
  const rawUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || process.env.LIVEKIT_URL || '';
  return sanitizeLiveKitUrl(rawUrl, 'http');
}

/**
 * Cria uma instância do cliente de API do servidor LiveKit.
 */
export function getRoomServiceClient(): RoomServiceClient | null {
  const apiKey = (process.env.LIVEKIT_API_KEY || '').trim().replace(/^["']|["']$/g, '');
  const apiSecret = (process.env.LIVEKIT_API_SECRET || '').trim().replace(/^["']|["']$/g, '');
  const host = getLiveKitHost();

  if (!apiKey || !apiSecret || !host) {
    return null;
  }

  return new RoomServiceClient(host, apiKey, apiSecret);
}

