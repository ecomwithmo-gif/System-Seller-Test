import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format currency values
 */
export function formatCurrency(amount: number | string, currency: string = 'USD'): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(numAmount);
}

/**
 * Format dates for display
 */
export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  }).format(d);
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffMins > 0) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  return 'Just now';
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Get order status color
 */
export function getOrderStatusColor(status: string): string {
  const colors: Record<string, string> = {
    Pending: 'bg-yellow-100 text-yellow-800',
    Unshipped: 'bg-orange-100 text-orange-800',
    PartiallyShipped: 'bg-blue-100 text-blue-800',
    Shipped: 'bg-green-100 text-green-800',
    Canceled: 'bg-red-100 text-red-800',
    Unfulfillable: 'bg-gray-100 text-gray-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

/**
 * Get inventory status based on quantity
 */
export function getInventoryStatus(quantity: number, reorderLevel: number = 10): {
  status: 'healthy' | 'low' | 'critical' | 'out';
  label: string;
  color: string;
} {
  if (quantity === 0) {
    return { status: 'out', label: 'Out of Stock', color: 'bg-red-100 text-red-800' };
  }
  if (quantity <= reorderLevel / 2) {
    return { status: 'critical', label: 'Critical', color: 'bg-red-100 text-red-800' };
  }
  if (quantity <= reorderLevel) {
    return { status: 'low', label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' };
  }
  return { status: 'healthy', label: 'In Stock', color: 'bg-green-100 text-green-800' };
}

/**
 * Calculate days until stock out based on velocity
 */
export function calculateDaysUntilStockOut(
  currentStock: number,
  dailySalesVelocity: number
): number | null {
  if (dailySalesVelocity <= 0) return null;
  return Math.floor(currentStock / dailySalesVelocity);
}

/**
 * Generate date range for reports
 */
export function getDateRange(days: number): { start: string; end: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  
  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

/**
 * Parse Amazon order ID to extract info
 */
export function parseAmazonOrderId(orderId: string): {
  marketplace: string;
  orderNumber: string;
} {
  // Amazon order IDs typically follow patterns like: 111-1234567-1234567
  const parts = orderId.split('-');
  return {
    marketplace: parts[0] || 'Unknown',
    orderNumber: orderId,
  };
}

/**
 * Sleep utility for rate limiting
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
