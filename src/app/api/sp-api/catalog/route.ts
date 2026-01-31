import { NextRequest, NextResponse } from 'next/server';
import { spApiClient } from '@/lib/sp-api/client';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const keywords = searchParams.get('keywords')?.split(',') || undefined;
    const identifiers = searchParams.get('identifiers')?.split(',') || undefined;
    const identifiersType = searchParams.get('identifiersType') as 'ASIN' | 'UPC' | 'EAN' | 'SKU' | undefined;
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const pageToken = searchParams.get('pageToken') || undefined;

    const result = await spApiClient.searchCatalogItems({
      keywords,
      identifiers,
      identifiersType,
      pageSize,
      pageToken,
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
