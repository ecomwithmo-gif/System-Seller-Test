"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, getInventoryStatus } from "@/lib/utils";

interface InventoryItem {
  asin: string;
  fnSku: string;
  sellerSku: string;
  productName: string;
  condition: string;
  totalQuantity: number;
  inventoryDetails?: {
    fulfillableQuantity?: number;
    inboundWorkingQuantity?: number;
    inboundShippedQuantity?: number;
    reservedQuantity?: { totalReservedQuantity?: number };
    unfulfillableQuantity?: { totalUnfulfillableQuantity?: number };
  };
}

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "low" | "out">("all");

  useEffect(() => {
    fetchInventory();
  }, []);

  async function fetchInventory() {
    try {
      setLoading(true);
      const response = await fetch("/api/sp-api/inventory");
      const result = await response.json();
      
      if (result.success && result.data?.payload?.inventorySummaries) {
        setInventory(result.data.payload.inventorySummaries);
      } else {
        setError(result.error || "Failed to load inventory");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  const filteredInventory = inventory.filter((item) => {
    // Search filter
    const matchesSearch =
      !searchQuery ||
      item.sellerSku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.asin?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.productName?.toLowerCase().includes(searchQuery.toLowerCase());

    // Status filter
    const status = getInventoryStatus(item.totalQuantity);
    const matchesFilter =
      filter === "all" ||
      (filter === "low" && (status.status === "low" || status.status === "critical")) ||
      (filter === "out" && status.status === "out");

    return matchesSearch && matchesFilter;
  });

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Inventory</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Manage your FBA inventory levels
          </p>
        </div>
        <Button onClick={fetchInventory} variant="outline">
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
            placeholder="Search by SKU, ASIN, or product name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {[
            { value: "all", label: "All" },
            { value: "low", label: "Low Stock" },
            { value: "out", label: "Out of Stock" },
          ].map((option) => (
            <Button
              key={option.value}
              variant={filter === option.value ? "amazon" : "outline"}
              size="sm"
              onClick={() => setFilter(option.value as typeof filter)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatBox
          label="Total SKUs"
          value={inventory.length}
          color="blue"
        />
        <StatBox
          label="Total Units"
          value={inventory.reduce((sum, item) => sum + item.totalQuantity, 0)}
          color="green"
        />
        <StatBox
          label="Low Stock"
          value={inventory.filter((item) => item.totalQuantity > 0 && item.totalQuantity < 10).length}
          color="yellow"
        />
        <StatBox
          label="Out of Stock"
          value={inventory.filter((item) => item.totalQuantity === 0).length}
          color="red"
        />
      </div>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Inventory Items ({filteredInventory.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center py-8">
              <p className="text-red-500">{error}</p>
              <Button onClick={fetchInventory} variant="outline" className="mt-4">
                Try Again
              </Button>
            </div>
          ) : filteredInventory.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <p className="text-gray-500">No inventory items found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">SKU</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">ASIN</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Product</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">Fulfillable</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">Reserved</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">Inbound</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">Total</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInventory.map((item, i) => {
                    const status = getInventoryStatus(item.totalQuantity);
                    return (
                      <tr
                        key={`${item.sellerSku}-${i}`}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <td className="py-3 px-4 font-mono text-sm">{item.sellerSku}</td>
                        <td className="py-3 px-4 font-mono text-sm text-blue-600">
                          <a
                            href={`https://www.amazon.com/dp/${item.asin}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline"
                          >
                            {item.asin}
                          </a>
                        </td>
                        <td className="py-3 px-4 max-w-xs truncate">{item.productName || "—"}</td>
                        <td className="py-3 px-4 text-right">
                          {item.inventoryDetails?.fulfillableQuantity || 0}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {item.inventoryDetails?.reservedQuantity?.totalReservedQuantity || 0}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {(item.inventoryDetails?.inboundWorkingQuantity || 0) +
                            (item.inventoryDetails?.inboundShippedQuantity || 0)}
                        </td>
                        <td className="py-3 px-4 text-right font-bold">{item.totalQuantity}</td>
                        <td className="py-3 px-4">
                          <span className={cn("px-2 py-1 rounded-full text-xs font-medium", status.color)}>
                            {status.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
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
  color,
}: {
  label: string;
  value: number;
  color: "blue" | "green" | "yellow" | "red";
}) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/20",
    green: "bg-green-50 text-green-600 dark:bg-green-900/20",
    yellow: "bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20",
    red: "bg-red-50 text-red-600 dark:bg-red-900/20",
  };

  return (
    <div className={cn("rounded-xl p-4", colorClasses[color])}>
      <p className="text-sm font-medium opacity-80">{label}</p>
      <p className="text-2xl font-bold">{value.toLocaleString()}</p>
    </div>
  );
}
