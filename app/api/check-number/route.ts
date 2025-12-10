import { NextRequest, NextResponse } from 'next/server';
import { getWhatsAppClient, isWhatsAppReady } from '@/lib/whatsapp-service';
import {
  parseJsonBody,
  validateRequired,
  handleError,
  createErrorResponse,
  ErrorCode,
} from '@/lib/api-errors';

export async function POST(request: NextRequest) {
  try {
    // Parse JSON body with error handling
    const { data: body, error: parseError } = await parseJsonBody(request);
    if (parseError) {
      return parseError;
    }

    // Validate required fields
    const validation = validateRequired(body, ['number']);
    if (!validation.valid) {
      return validation.error;
    }

    const { number } = body;

    // Validate number format
    if (typeof number !== 'string') {
      return createErrorResponse(
        ErrorCode.VALIDATION_ERROR,
        'Phone number must be a string',
        400
      );
    }

    // Check WhatsApp connection status
    if (!isWhatsAppReady()) {
      return createErrorResponse(
        ErrorCode.WHATSAPP_NOT_READY,
        'WhatsApp is not connected. Please initialize WhatsApp first.',
        503
      );
    }

    const client = getWhatsAppClient();
    if (!client) {
      return createErrorResponse(
        ErrorCode.WHATSAPP_CLIENT_ERROR,
        'WhatsApp client is not available',
        503
      );
    }

    // Format number
    const formattedNumber = number.replace(/\D/g, '').replace(/^0+/, '');
    
    if (!formattedNumber || formattedNumber.length < 10) {
      return createErrorResponse(
        ErrorCode.INVALID_NUMBER_FORMAT,
        'Invalid phone number format. Number must contain at least 10 digits.',
        400,
        { providedNumber: number }
      );
    }

    const chatId = `${formattedNumber}@c.us`;

    console.log('Checking number:', formattedNumber);
    console.log('Chat ID:', chatId);

    // Check if registered
    let isRegistered: boolean;
    try {
      isRegistered = await client.isRegisteredUser(chatId);
      console.log('Is registered:', isRegistered);
    } catch (error) {
      return handleError(error, 'check-number:isRegisteredUser', 'Failed to check if number is registered');
    }

    // Try to get number ID (for debugging)
    let numberId = null;
    try {
      const contact = await client.getNumberId(formattedNumber);
      numberId = contact;
      console.log('Number ID:', numberId);
    } catch (error) {
      // This is not a critical error, just log it
      console.log('Could not get number ID (non-critical):', error);
    }

    return NextResponse.json({
      success: true,
      data: {
        number: formattedNumber,
        chatId,
        isRegistered,
        numberId,
      },
    });
  } catch (error) {
    return handleError(error, 'check-number:POST', 'Failed to check phone number');
  }
}

