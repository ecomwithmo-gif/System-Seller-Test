import { NextRequest, NextResponse } from 'next/server';
import { spApiClient } from '@/lib/sp-api/client';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const reportTypes = searchParams.get('reportTypes')?.split(',') || undefined;
    const processingStatuses = searchParams.get('processingStatuses')?.split(',') || undefined;
    const createdSince = searchParams.get('createdSince') || undefined;
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const nextToken = searchParams.get('nextToken') || undefined;

    const result = await spApiClient.getReports({
      reportTypes,
      processingStatuses,
      createdSince,
      pageSize,
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reportType, dataStartTime, dataEndTime, reportOptions } = body;

    const result = await spApiClient.createReport({
      reportType,
      dataStartTime,
      dataEndTime,
      reportOptions,
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
