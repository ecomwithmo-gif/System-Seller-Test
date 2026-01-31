import { NextResponse } from 'next/server';
import { spApiClient } from '@/lib/sp-api/client';
import { validateCredentials } from '@/lib/sp-api/auth';

interface TestResult {
  name: string;
  endpoint: string;
  status: 'success' | 'error' | 'skipped';
  responseTime?: number;
  message?: string;
  data?: unknown;
}

export async function GET() {
  const { valid, missing } = validateCredentials();

  if (!valid) {
    return NextResponse.json({
      success: false,
      message: 'Missing credentials',
      missing,
    });
  }

  const results: TestResult[] = [];

  // Test functions with their names
  const tests = [
    {
      name: 'Sellers API',
      endpoint: '/sellers/v1/marketplaceParticipations',
      fn: () => spApiClient.getMarketplaceParticipations(),
    },
    {
      name: 'Orders API',
      endpoint: '/orders/v0/orders',
      fn: () => spApiClient.getOrders({ 
        createdAfter: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        maxResultsPerPage: 5 
      }),
    },
    {
      name: 'FBA Inventory API',
      endpoint: '/fba/inventory/v1/summaries',
      fn: () => spApiClient.getInventorySummaries(),
    },
    {
      name: 'Catalog API',
      endpoint: '/catalog/2022-04-01/items',
      fn: () => spApiClient.searchCatalogItems({ keywords: ['test'], pageSize: 1 }),
    },
    {
      name: 'Reports API',
      endpoint: '/reports/2021-06-30/reports',
      fn: () => spApiClient.getReports({ pageSize: 5 }),
    },
    {
      name: 'Finances API',
      endpoint: '/finances/v0/financialEvents',
      fn: () => spApiClient.listFinancialEvents({
        postedAfter: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        maxResultsPerPage: 5,
      }),
    },
    {
      name: 'Notifications API',
      endpoint: '/notifications/v1/destinations',
      fn: () => spApiClient.getDestinations(),
    },
    {
      name: 'Fulfillment Inbound API',
      endpoint: '/fba/inbound/v0/shipments',
      fn: () => spApiClient.getInboundShipments({
        lastUpdatedAfter: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      }),
    },
  ];

  // Run all tests
  for (const test of tests) {
    const startTime = Date.now();
    try {
      const result = await test.fn();
      const responseTime = Date.now() - startTime;

      if (result.success) {
        results.push({
          name: test.name,
          endpoint: test.endpoint,
          status: 'success',
          responseTime,
          message: 'OK',
          data: result.data,
        });
      } else {
        results.push({
          name: test.name,
          endpoint: test.endpoint,
          status: 'error',
          responseTime,
          message: result.error || `HTTP ${result.statusCode}`,
        });
      }
    } catch (error) {
      results.push({
        name: test.name,
        endpoint: test.endpoint,
        status: 'error',
        responseTime: Date.now() - startTime,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Small delay between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  const successCount = results.filter(r => r.status === 'success').length;
  const errorCount = results.filter(r => r.status === 'error').length;

  return NextResponse.json({
    success: errorCount === 0,
    summary: {
      total: results.length,
      success: successCount,
      errors: errorCount,
    },
    results,
    timestamp: new Date().toISOString(),
  });
}
