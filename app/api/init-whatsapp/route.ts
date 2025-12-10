import { NextRequest, NextResponse } from 'next/server';
import { initializeWhatsApp, isWhatsAppReady } from '@/lib/whatsapp-service';
import { handleError, validateSecretKey } from '@/lib/api-errors';

// This route initializes WhatsApp when the server starts
export async function GET(request: NextRequest) {
  try {
    // Validate secret key if MESSAGE_SECRET_KEY is set
    const secretKeyError = validateSecretKey(request);
    if (secretKeyError) {
      return secretKeyError;
    }
    if (isWhatsAppReady()) {
      return NextResponse.json({
        success: true,
        message: 'WhatsApp already initialized and ready',
        ready: true,
      });
    }

    // Initialize in background if not already done
    initializeWhatsApp().catch((error) => {
      console.error('[init-whatsapp] Background initialization error:', error);
      // Log error but don't fail the request since it's async
    });

    return NextResponse.json({
      success: true,
      message: 'WhatsApp initialization started. Check server terminal for QR code.',
      ready: false,
    });
  } catch (error) {
    return handleError(error, 'init-whatsapp:GET', 'Failed to initialize WhatsApp');
  }
}

export async function POST(request: NextRequest) {
  try {
    // Validate secret key if MESSAGE_SECRET_KEY is set
    const secretKeyError = validateSecretKey(request);
    if (secretKeyError) {
      return secretKeyError;
    }
    if (isWhatsAppReady()) {
      return NextResponse.json({
        success: true,
        message: 'WhatsApp already initialized and ready',
        ready: true,
      });
    }

    // Try to initialize synchronously (with timeout)
    const initPromise = initializeWhatsApp();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Initialization timeout')), 30000)
    );

    try {
      await Promise.race([initPromise, timeoutPromise]);
      return NextResponse.json({
        success: true,
        message: 'WhatsApp initialization completed',
        ready: isWhatsAppReady(),
      });
    } catch (initError) {
      // If it's a timeout, initialization is still running in background
      if (initError instanceof Error && initError.message === 'Initialization timeout') {
        return NextResponse.json({
          success: true,
          message: 'WhatsApp initialization is in progress. Check server terminal for QR code.',
          ready: false,
        });
      }
      throw initError;
    }
  } catch (error) {
    return handleError(error, 'init-whatsapp:POST', 'Failed to initialize WhatsApp');
  }
}

