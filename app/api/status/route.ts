import { NextResponse } from 'next/server';
import { isWhatsAppReady, getWhatsAppClient } from '@/lib/whatsapp-service';
import { handleError } from '@/lib/api-errors';

export async function GET() {
  try {
    const client = getWhatsAppClient();
    const ready = isWhatsAppReady();

    // Debug info (only in development)
    const debugInfo =
      process.env.NODE_ENV === 'development'
        ? {
            ready,
            hasClient: !!client,
            clientState: client ? 'exists' : 'null',
            globalReady: (global as any).whatsappReady,
            globalClient: !!(global as any).whatsappClient,
            timestamp: new Date().toISOString(),
          }
        : undefined;

    if (debugInfo) {
      console.log('Status check:', debugInfo);
    }

    return NextResponse.json({
      success: true,
      data: {
        ready,
        status: ready ? 'connected' : 'disconnected',
        ...(debugInfo && { debug: debugInfo }),
      },
    });
  } catch (error) {
    return handleError(error, 'status:GET', 'Failed to get WhatsApp status');
  }
}
