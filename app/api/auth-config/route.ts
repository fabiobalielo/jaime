import { NextResponse } from 'next/server';

/**
 * Endpoint to check if secret key authentication is required
 * This endpoint does NOT require authentication itself
 */
export async function GET() {
  try {
    const secretKeyRequired = !!process.env.MESSAGE_SECRET_KEY;

    return NextResponse.json({
      success: true,
      data: {
        secretKeyRequired,
        message: secretKeyRequired
          ? 'Secret key authentication is required for all API endpoints'
          : 'API endpoints are open (no authentication required)',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Failed to check authentication configuration',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

