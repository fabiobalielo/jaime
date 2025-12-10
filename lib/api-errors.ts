import { NextResponse } from 'next/server';

export enum ErrorCode {
  // Client errors (4xx)
  BAD_REQUEST = 'BAD_REQUEST',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  
  // Server errors (5xx)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  WHATSAPP_NOT_READY = 'WHATSAPP_NOT_READY',
  WHATSAPP_CLIENT_ERROR = 'WHATSAPP_CLIENT_ERROR',
  
  // WhatsApp specific errors
  NUMBER_NOT_REGISTERED = 'NUMBER_NOT_REGISTERED',
  INVALID_NUMBER_FORMAT = 'INVALID_NUMBER_FORMAT',
  MESSAGE_SEND_FAILED = 'MESSAGE_SEND_FAILED',
}

export interface ApiErrorResponse {
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
    timestamp: string;
  };
}

/**
 * Creates a standardized error response
 */
export function createErrorResponse(
  code: ErrorCode,
  message: string,
  status: number,
  details?: unknown
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        details,
        timestamp: new Date().toISOString(),
      },
    },
    { status }
  );
}

/**
 * Handles JSON parsing errors
 */
export async function parseJsonBody<T = unknown>(
  request: Request
): Promise<{ data: T; error: null } | { data: null; error: NextResponse<ApiErrorResponse> }> {
  try {
    const data = await request.json();
    return { data: data as T, error: null };
  } catch (error) {
    return {
      data: null,
      error: createErrorResponse(
        ErrorCode.BAD_REQUEST,
        'Invalid JSON in request body',
        400,
        error instanceof Error ? error.message : 'Unknown parsing error'
      ),
    };
  }
}

/**
 * Parses request body supporting JSON, form-data, and URL-encoded formats
 */
export async function parseRequestBody<T = Record<string, unknown>>(
  request: Request
): Promise<{ data: T; error: null } | { data: null; error: NextResponse<ApiErrorResponse> }> {
  const contentType = request.headers.get('content-type') || '';

  try {
    // Handle JSON
    if (contentType.includes('application/json')) {
      try {
        const data = await request.json();
        return { data: data as T, error: null };
      } catch (error) {
        return {
          data: null,
          error: createErrorResponse(
            ErrorCode.BAD_REQUEST,
            'Invalid JSON in request body',
            400,
            error instanceof Error ? error.message : 'Unknown parsing error'
          ),
        };
      }
    }

    // Handle form-data (multipart/form-data) and URL-encoded (application/x-www-form-urlencoded)
    // request.formData() works for both content types
    if (
      contentType.includes('multipart/form-data') ||
      contentType.includes('application/x-www-form-urlencoded')
    ) {
      try {
        const formData = await request.formData();
        const data: Record<string, unknown> = {};
        
        for (const [key, value] of formData.entries()) {
          // Handle File objects by storing filename
          // For actual file content, you'd need to read the file separately
          if (value instanceof File) {
            data[key] = value.name;
          } else {
            data[key] = value;
          }
        }
        
        return { data: data as T, error: null };
      } catch (error) {
        return {
          data: null,
          error: createErrorResponse(
            ErrorCode.BAD_REQUEST,
            'Invalid form data in request body',
            400,
            error instanceof Error ? error.message : 'Unknown parsing error'
          ),
        };
      }
    }

    // Try to parse as formData if content-type is not specified (fallback)
    // This handles cases where form-data is sent without proper content-type header
    if (!contentType) {
      try {
        const formData = await request.formData();
        const data: Record<string, unknown> = {};
        
        for (const [key, value] of formData.entries()) {
          data[key] = value instanceof File ? value.name : value;
        }
        
        return { data: data as T, error: null };
      } catch {
        // If formData parsing fails, it might be JSON or empty
        // Note: We can't try JSON here because the stream is already consumed
        // This is a limitation - clients should send proper content-type headers
      }
    }

    return {
      data: null,
      error: createErrorResponse(
        ErrorCode.BAD_REQUEST,
        `Unsupported content type: ${contentType || 'not specified'}. Supported types: application/json, multipart/form-data, application/x-www-form-urlencoded`,
        400,
        { contentType: contentType || 'not specified' }
      ),
    };
  } catch (error) {
    return {
      data: null,
      error: createErrorResponse(
        ErrorCode.BAD_REQUEST,
        'Failed to parse request body',
        400,
        error instanceof Error ? error.message : 'Unknown parsing error'
      ),
    };
  }
}

/**
 * Handles unknown errors and converts them to proper error responses
 */
export function handleError(
  error: unknown,
  context: string,
  defaultMessage = 'An unexpected error occurred'
): NextResponse<ApiErrorResponse> {
  console.error(`[${context}] Error:`, error);

  if (error instanceof Error) {
    // Handle specific error types
    if (error.message.includes('not registered') || error.message.includes('NUMBER_NOT_REGISTERED')) {
      return createErrorResponse(
        ErrorCode.NUMBER_NOT_REGISTERED,
        'The phone number is not registered on WhatsApp',
        400,
        error.message
      );
    }

    if (error.message.includes('LID') || error.message.includes('INVALID_NUMBER_FORMAT')) {
      return createErrorResponse(
        ErrorCode.INVALID_NUMBER_FORMAT,
        'Invalid phone number format. Please include country code (e.g., +5511999999999)',
        400,
        error.message
      );
    }

    if (error.message.includes('not ready') || error.message.includes('not connected')) {
      return createErrorResponse(
        ErrorCode.WHATSAPP_NOT_READY,
        'WhatsApp is not connected yet. Please wait for initialization.',
        503,
        error.message
      );
    }

    // Generic error with message
    return createErrorResponse(
      ErrorCode.INTERNAL_ERROR,
      error.message || defaultMessage,
      500,
      { context, stack: process.env.NODE_ENV === 'development' ? error.stack : undefined }
    );
  }

  // Unknown error type
  return createErrorResponse(
    ErrorCode.INTERNAL_ERROR,
    defaultMessage,
    500,
    { context, error: String(error) }
  );
}

/**
 * Validates required fields in request body
 */
export function validateRequired(
  body: Record<string, unknown>,
  fields: string[]
): { valid: true } | { valid: false; error: NextResponse<ApiErrorResponse> } {
  const missing = fields.filter((field) => !body[field] || (typeof body[field] === 'string' && !body[field].trim()));

  if (missing.length > 0) {
    return {
      valid: false,
      error: createErrorResponse(
        ErrorCode.VALIDATION_ERROR,
        `Missing required fields: ${missing.join(', ')}`,
        400,
        { missingFields: missing }
      ),
    };
  }

  return { valid: true };
}

