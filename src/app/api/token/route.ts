import { NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';
import { validateNickname } from '@/lib/validation';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { nickname } = body;

    // 1. Validação e sanitização do nickname no servidor
    const validation = validateNickname(nickname);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

    if (!apiKey || !apiSecret || !wsUrl) {
      return NextResponse.json(
        { error: 'As variáveis de ambiente do LiveKit não estão configuradas no servidor.' },
        { status: 500 }
      );
    }

    // 2. Gerar identidade única e definir sala fixa
    const identity = crypto.randomUUID();
    const roomName = 'sala-principal';

    // 3. Criar AccessToken do LiveKit
    const at = new AccessToken(apiKey, apiSecret, {
      identity,
      name: validation.sanitized,
      ttl: '1h',
    });

    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: false,
    });

    const token = await at.toJwt();

    return NextResponse.json({
      token,
      wsUrl,
    });
  } catch (error) {
    console.error('Erro ao gerar token do LiveKit:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar a solicitação de token.' },
      { status: 500 }
    );
  }
}
