"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const reportTypes = [
  { id: "GET_FBA_MYI_UNSUPPRESSED_INVENTORY_DATA", name: "FBA Inventory Report", description: "Current FBA inventory levels" },
  { id: "GET_FLAT_FILE_ALL_ORDERS_DATA_BY_LAST_UPDATE_GENERAL", name: "All Orders Report", description: "All orders data" },
  { id: "GET_V2_SETTLEMENT_REPORT_DATA_FLAT_FILE", name: "Settlement Report", description: "Payment settlement data" },
  { id: "GET_AMAZON_FULFILLED_SHIPMENTS_DATA_GENERAL", name: "FBA Shipments Report", description: "Amazon fulfilled shipments" },
  { id: "GET_FBA_ESTIMATED_FBA_FEES_TXT_DATA", name: "FBA Fees Report", description: "Estimated FBA fees per item" },
  { id: "GET_MERCHANT_LISTINGS_ALL_DATA", name: "All Listings Report", description: "All active and inactive listings" },
];

export default function ReportsPage() {
  const [generating, setGenerating] = useState<string | null>(null);

  async function generateReport(reportType: string) {
    setGenerating(reportType);
    try {
      const response = await fetch("/api/sp-api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportType }),
      });
      const result = await response.json();
      if (result.success) {
        alert(`Report requested! Report ID: ${result.data?.reportId}`);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      alert("Failed to generate report");
    } finally {
      setGenerating(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Generate and download SP-API reports
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportTypes.map((report) => (
          <Card key={report.id} className="hover:border-amazon-orange/50 transition-colors">
            <CardHeader>
              <CardTitle className="text-lg">{report.name}</CardTitle>
              <CardDescription>{report.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => generateReport(report.id)}
                disabled={generating === report.id}
              >
                {generating === report.id ? (
                  <>
                    <svg className="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Generate Report
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <svg className="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500">No reports generated yet</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
