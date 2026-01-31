import { NextResponse } from 'next/server';
import { spApiClient } from '@/lib/sp-api/client';
import { getDateRange } from '@/lib/utils';

export async function GET() {
  try {
    // Fetch data from multiple APIs in parallel
    const [inventoryResult, ordersResult] = await Promise.all([
      spApiClient.getInventorySummaries(),
      spApiClient.getOrders({
        createdAfter: getDateRange(30).start,
        maxResultsPerPage: 50,
      }),
    ]);

    // Process inventory data
    let totalQuantity = 0;
    let lowStockCount = 0;
    
    if (inventoryResult.success && inventoryResult.data) {
      const payload = (inventoryResult.data as { payload?: { inventorySummaries?: Array<{ totalQuantity?: number }> } }).payload;
      const summaries = payload?.inventorySummaries || [];
      
      for (const item of summaries) {
        totalQuantity += item.totalQuantity || 0;
        if ((item.totalQuantity || 0) < 10) {
          lowStockCount++;
        }
      }
    }

    // Process orders data
    let pendingOrders = 0;
    let shippedOrders = 0;
    let totalRevenue = 0;
    
    if (ordersResult.success && ordersResult.data) {
      const payload = (ordersResult.data as { payload?: { Orders?: Array<{ OrderStatus?: string; OrderTotal?: { Amount?: string } }> } }).payload;
      const orders = payload?.Orders || [];
      
      for (const order of orders) {
        if (order.OrderStatus === 'Pending' || order.OrderStatus === 'Unshipped') {
          pendingOrders++;
        } else if (order.OrderStatus === 'Shipped') {
          shippedOrders++;
        }
        
        if (order.OrderTotal?.Amount) {
          totalRevenue += parseFloat(order.OrderTotal.Amount) * 100; // Convert to cents
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        inventory: {
          totalQuantity,
          lowStockCount,
        },
        orders: {
          pending: pendingOrders,
          shipped: shippedOrders,
          total: pendingOrders + shippedOrders,
        },
        revenue: totalRevenue,
        shipments: 0, // Placeholder
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch dashboard data',
    });
  }
}
