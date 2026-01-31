import { NextResponse } from 'next/server';
import { validateCredentials } from '@/lib/sp-api/auth';
import { spApiClient } from '@/lib/sp-api/client';

export async function GET() {
  try {
    const { valid, missing } = validateCredentials();

    if (!valid) {
      return NextResponse.json({
        status: 'not_configured',
        configured: false,
        message: 'Missing required credentials',
        missing,
      });
    }

    // Try to fetch seller info to verify connection
    const result = await spApiClient.getMarketplaceParticipations();

    if (result.success) {
      return NextResponse.json({
        status: 'healthy',
        configured: true,
        message: 'SP-API connection successful',
        marketplaces: result.data,
      });
    } else {
      return NextResponse.json({
        status: 'error',
        configured: true,
        message: result.error || 'Failed to connect to SP-API',
      });
    }
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      configured: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
