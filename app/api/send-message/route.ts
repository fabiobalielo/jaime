import { NextRequest, NextResponse } from 'next/server';
import { sendWhatsAppMessage, isWhatsAppReady } from '@/lib/whatsapp-service';
import {
  parseRequestBody,
  validateRequired,
  validateSecretKey,
  handleError,
  createErrorResponse,
  ErrorCode,
} from '@/lib/api-errors';

export async function POST(request: NextRequest) {
  try {
    // Parse request body (supports JSON, form-data, and URL-encoded)
    const { data: body, error: parseError } = await parseRequestBody(request);
    if (parseError) {
      return parseError;
    }

    // Validate secret key if MESSAGE_SECRET_KEY is set
    const secretKeyError = validateSecretKey(request);
    if (secretKeyError) {
      return secretKeyError;
    }

    // Validate required fields
    const validation = validateRequired(body, ['number', 'message', 'name']);
    if (!validation.valid) {
      return validation.error;
    }

    const { name, number, message } = body;

    // Validate field types
    if (typeof number !== 'string') {
      return createErrorResponse(
        ErrorCode.VALIDATION_ERROR,
        'Phone number must be a string',
        400
      );
    }

    if (typeof message !== 'string') {
      return createErrorResponse(
        ErrorCode.VALIDATION_ERROR,
        'Message must be a string',
        400
      );
    }

    if (typeof name !== 'string') {
      return createErrorResponse(
        ErrorCode.VALIDATION_ERROR,
        'Name must be a string',
        400
      );
    }

    // Validate name (required, minimum 3 characters)
    const trimmedName = name.trim();
    if (trimmedName.length < 3) {
      return createErrorResponse(
        ErrorCode.VALIDATION_ERROR,
        'Name must be at least 3 characters long',
        400,
        { providedLength: trimmedName.length }
      );
    }

    // Validate message is not empty
    if (!message.trim()) {
      return createErrorResponse(
        ErrorCode.VALIDATION_ERROR,
        'Message cannot be empty',
        400
      );
    }

    // Check if WhatsApp is ready
    if (!isWhatsAppReady()) {
      return createErrorResponse(
        ErrorCode.WHATSAPP_NOT_READY,
        'WhatsApp is not connected yet. Please check the server terminal for QR code.',
        503,
        { ready: false }
      );
    }

    // Format message with name in bold at the beginning
    // WhatsApp uses *text* for bold formatting
    const formattedMessage = `*${trimmedName}*\n\n${message.trim()}`;

    // Send the message
    const result = await sendWhatsAppMessage(number, formattedMessage);

    if (!result.success) {
      // Map service errors to appropriate error codes
      const errorMessage = result.error || 'Failed to send message';
      let errorCode = ErrorCode.MESSAGE_SEND_FAILED;
      let statusCode = 500;

      if (errorMessage.includes('not registered')) {
        errorCode = ErrorCode.NUMBER_NOT_REGISTERED;
        statusCode = 400;
      } else if (errorMessage.includes('country code') || errorMessage.includes('format')) {
        errorCode = ErrorCode.INVALID_NUMBER_FORMAT;
        statusCode = 400;
      } else if (errorMessage.includes('not ready') || errorMessage.includes('not connected')) {
        errorCode = ErrorCode.WHATSAPP_NOT_READY;
        statusCode = 503;
      }

      return createErrorResponse(errorCode, errorMessage, statusCode, {
        recipient: number,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully',
      data: {
        recipient: number,
        recipientName: trimmedName,
      },
    });
  } catch (error) {
    return handleError(error, 'send-message:POST', 'Failed to send WhatsApp message');
  }
}

export async function GET() {
  try {
    const ready = isWhatsAppReady();
    return NextResponse.json({
      success: true,
      data: {
        ready,
        status: ready ? 'connected' : 'disconnected',
      },
    });
  } catch (error) {
    return handleError(error, 'send-message:GET', 'Failed to get WhatsApp status');
  }
}
