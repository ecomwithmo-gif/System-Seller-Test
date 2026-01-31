import { NextRequest, NextResponse } from 'next/server';
import { spApiClient } from '@/lib/sp-api/client';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const nextToken = searchParams.get('nextToken') || undefined;

    const result = await spApiClient.getInventorySummaries({
      nextToken,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result.data,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
      }, { status: result.statusCode || 500 });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
