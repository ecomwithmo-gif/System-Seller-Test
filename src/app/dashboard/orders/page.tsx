"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, formatCurrency, formatDate, getOrderStatusColor } from "@/lib/utils";

interface Order {
  AmazonOrderId: string;
  PurchaseDate: string;
  OrderStatus: string;
  FulfillmentChannel: string;
  OrderTotal?: { Amount: string; CurrencyCode: string };
  NumberOfItemsShipped?: number;
  NumberOfItemsUnshipped?: number;
  ShippingAddress?: { City?: string; StateOrRegion?: string };
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    try {
      setLoading(true);
      // Get orders from the last 30 days
      const createdAfter = new Date();
      createdAfter.setDate(createdAfter.getDate() - 30);
      
      const response = await fetch(
        `/api/sp-api/orders?createdAfter=${createdAfter.toISOString()}&maxResultsPerPage=50`
      );
      const result = await response.json();
      
      if (result.success && result.data?.payload?.Orders) {
        setOrders(result.data.payload.Orders);
      } else {
        setError(result.error || "Failed to load orders");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      !searchQuery ||
      order.AmazonOrderId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || order.OrderStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const orderStatuses = ["all", ...new Set(orders.map((o) => o.OrderStatus))];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
        <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Orders</h1>
          <p className="text-gray-500 dark:text-gray-400">
            View and manage your Amazon orders
          </p>
        </div>
        <Button onClick={fetchOrders} variant="outline">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by Order ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {orderStatuses.map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "amazon" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(status)}
            >
              {status === "all" ? "All" : status}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBox label="Total Orders" value={orders.length} />
        <StatBox
          label="Pending"
          value={orders.filter((o) => o.OrderStatus === "Pending" || o.OrderStatus === "Unshipped").length}
        />
        <StatBox
          label="Shipped"
          value={orders.filter((o) => o.OrderStatus === "Shipped").length}
        />
        <StatBox
          label="Revenue"
          value={formatCurrency(
            orders.reduce((sum, o) => sum + parseFloat(o.OrderTotal?.Amount || "0"), 0)
          )}
          isText
        />
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Orders ({filteredOrders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center py-8">
              <p className="text-red-500">{error}</p>
              <Button onClick={fetchOrders} variant="outline" className="mt-4">
                Try Again
              </Button>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-gray-500">No orders found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Order ID</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Fulfillment</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">Items</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">Total</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Location</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr
                      key={order.AmazonOrderId}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4 font-mono text-sm text-blue-600">
                        {order.AmazonOrderId}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {formatDate(order.PurchaseDate)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={cn("px-2 py-1 rounded-full text-xs font-medium", getOrderStatusColor(order.OrderStatus))}>
                          {order.OrderStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium",
                          order.FulfillmentChannel === "AFN"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-purple-100 text-purple-800"
                        )}>
                          {order.FulfillmentChannel === "AFN" ? "FBA" : "FBM"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {(order.NumberOfItemsShipped || 0) + (order.NumberOfItemsUnshipped || 0)}
                      </td>
                      <td className="py-3 px-4 text-right font-medium">
                        {order.OrderTotal
                          ? formatCurrency(order.OrderTotal.Amount, order.OrderTotal.CurrencyCode)
                          : "—"}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {order.ShippingAddress
                          ? `${order.ShippingAddress.City || ""}, ${order.ShippingAddress.StateOrRegion || ""}`
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatBox({
  label,
  value,
  isText = false,
}: {
  label: string;
  value: number | string;
  isText?: boolean;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">
        {isText ? value : (value as number).toLocaleString()}
      </p>
    </div>
  );
}
