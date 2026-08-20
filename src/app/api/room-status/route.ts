import { NextResponse } from 'next/server';
import { getRoomServiceClient } from '@/lib/livekit-server';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const roomService = getRoomServiceClient();
    
    // Se as credenciais do servidor não estiverem configuradas, retorna 0 com elegância
    if (!roomService) {
      return NextResponse.json(
        { participantCount: 0 },
        { headers: { 'Cache-Control': 'no-store, max-age=0' } }
      );
    }

    const roomName = 'sala-principal';
    let participantCount = 0;

    try {
      const participants = await roomService.listParticipants(roomName);
      participantCount = participants ? participants.length : 0;
    } catch {
      // Se a sala não existir no LiveKit (ex: fechada por inatividade), o LiveKit lança um erro.
      // Trata como 0 participantes online.
      participantCount = 0;
    }

    return NextResponse.json(
      { participantCount },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (error) {
    console.error('Erro ao consultar status da sala:', error);
    return NextResponse.json(
      { participantCount: 0 },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  }
}
