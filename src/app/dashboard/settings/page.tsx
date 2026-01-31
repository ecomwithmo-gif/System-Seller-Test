"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Configure your SP-API connection and preferences
        </p>
      </div>

      {/* API Credentials */}
      <Card>
        <CardHeader>
          <CardTitle>API Credentials</CardTitle>
          <CardDescription>
            Your Amazon SP-API credentials. These are stored in environment variables.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                LWA Client ID
              </label>
              <Input
                type="password"
                value="••••••••••••••••"
                disabled
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Set via LWA_CLIENT_ID environment variable
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Seller ID
              </label>
              <Input
                type="text"
                value={process.env.NEXT_PUBLIC_SELLER_ID || "Not configured"}
                disabled
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Marketplace
              </label>
              <Input
                type="text"
                value={process.env.NEXT_PUBLIC_MARKETPLACE_ID || "ATVPDKIKX0DER (US)"}
                disabled
                className="mt-1"
              />
            </div>
          </div>
          <div className="pt-4 border-t">
            <p className="text-sm text-gray-500">
              To update credentials, modify your <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">.env.local</code> file
              and restart the application.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Connection Test */}
      <Card>
        <CardHeader>
          <CardTitle>Connection Status</CardTitle>
          <CardDescription>
            Test your connection to Amazon SP-API
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-medium">Connected to SP-API</span>
            </div>
            <Button variant="outline" size="sm" onClick={() => window.location.href = "/api/health"}>
              Test Connection
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* API Endpoints */}
      <Card>
        <CardHeader>
          <CardTitle>Enabled API Endpoints</CardTitle>
          <CardDescription>
            All SP-API endpoints integrated in this application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              "Orders API",
              "FBA Inventory API",
              "Catalog Items API",
              "Listings Items API",
              "Product Pricing API",
              "Product Fees API",
              "Fulfillment Inbound API",
              "Fulfillment Outbound API",
              "Shipping API",
              "Merchant Fulfillment API",
              "Reports API",
              "Feeds API",
              "Finances API",
              "Sellers API",
              "Messaging API",
              "Solicitations API",
              "Notifications API",
              "AWD API",
              "Sales API",
              "Listings Restrictions API",
            ].map((api) => (
              <div
                key={api}
                className="flex items-center gap-2 p-2 rounded-lg bg-green-50 dark:bg-green-900/20"
              >
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-green-800 dark:text-green-200">{api}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>Resources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            <a
              href="https://developer-docs.amazon.com/sp-api/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <span className="font-medium">SP-API Documentation</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
            <a
              href="https://sellercentral.amazon.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <span className="font-medium">Seller Central</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
            <a
              href="https://github.com/amzn/selling-partner-api-models"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <span className="font-medium">SP-API Models (GitHub)</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
