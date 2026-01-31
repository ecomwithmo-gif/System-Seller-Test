import { NextRequest, NextResponse } from 'next/server';
import { spApiClient } from '@/lib/sp-api/client';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const createdAfter = searchParams.get('createdAfter') || undefined;
    const createdBefore = searchParams.get('createdBefore') || undefined;
    const orderStatuses = searchParams.get('orderStatuses')?.split(',') || undefined;
    const maxResultsPerPage = parseInt(searchParams.get('maxResultsPerPage') || '20');
    const nextToken = searchParams.get('nextToken') || undefined;

    const result = await spApiClient.getOrders({
      createdAfter,
      createdBefore,
      orderStatuses,
      maxResultsPerPage,
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
