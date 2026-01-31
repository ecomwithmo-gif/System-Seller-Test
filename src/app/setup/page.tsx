"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SetupPage() {
  const [status, setStatus] = useState<"checking" | "configured" | "not_configured">("checking");

  useEffect(() => {
    checkConfiguration();
  }, []);

  async function checkConfiguration() {
    try {
      const response = await fetch("/api/health");
      const data = await response.json();
      setStatus(data.configured ? "configured" : "not_configured");
    } catch {
      setStatus("not_configured");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-lg gradient-amazon flex items-center justify-center text-white">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <span className="font-bold text-xl">SP-API Manager</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Configure API Credentials
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Set up your Amazon SP-API credentials to get started
          </p>
        </div>

        {status === "configured" ? (
          <Card className="border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <CardTitle className="text-green-800 dark:text-green-200">Already Configured!</CardTitle>
                  <CardDescription className="text-green-700 dark:text-green-300">
                    Your SP-API credentials are set up
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard">
                <Button variant="amazon" className="w-full">
                  Open Dashboard
                  <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Status Card */}
            {status === "not_configured" && (
              <Card className="mb-6 border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-800 flex items-center justify-center">
                      <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div>
                      <CardTitle className="text-yellow-800 dark:text-yellow-200">Credentials Required</CardTitle>
                      <CardDescription className="text-yellow-700 dark:text-yellow-300">
                        Set environment variables on Vercel to complete setup
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            )}

            {/* Instructions */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Setup Instructions</CardTitle>
                <CardDescription>
                  Add the following environment variables in your Vercel project settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg bg-gray-900 p-4 text-sm font-mono text-gray-100 overflow-x-auto">
                  <p className="text-green-400"># Amazon LWA (Login With Amazon) Credentials</p>
                  <p>LWA_CLIENT_ID=amzn1.application-oa2-client.xxx</p>
                  <p>LWA_CLIENT_SECRET=your_client_secret</p>
                  <p>REFRESH_TOKEN=Atzr|your_refresh_token</p>
                  <p></p>
                  <p className="text-green-400"># AWS IAM Credentials</p>
                  <p>AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXX</p>
                  <p>AWS_SECRET_ACCESS_KEY=your_secret_key</p>
                  <p></p>
                  <p className="text-green-400"># Seller Configuration</p>
                  <p>SELLER_ID=A1XXXXXXXXXXXXX</p>
                  <p>MARKETPLACE_ID=ATVPDKIKX0DER</p>
                </div>
                
                <div className="space-y-3">
                  <h3 className="font-semibold">How to get these credentials:</h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <li>
                      <strong>LWA Credentials</strong>: Create an app in{" "}
                      <a href="https://sellercentral.amazon.com/apps/authorize/consent" target="_blank" rel="noopener noreferrer" className="text-amazon-orange hover:underline">
                        Seller Central → Develop Apps
                      </a>
                    </li>
                    <li>
                      <strong>Refresh Token</strong>: Obtained when you authorize your app to access your seller account
                    </li>
                    <li>
                      <strong>AWS Credentials</strong>: Create an IAM user with SP-API permissions in AWS Console
                    </li>
                    <li>
                      <strong>Seller ID</strong>: Found in Seller Central → Settings → Account Info
                    </li>
                  </ol>
                </div>
              </CardContent>
            </Card>

            {/* Vercel Link */}
            <Card>
              <CardHeader>
                <CardTitle>Add to Vercel</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Go to your Vercel project settings and add the environment variables above.
                </p>
                <div className="flex gap-3">
                  <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer" className="flex-1">
                    <Button variant="outline" className="w-full">
                      Open Vercel Dashboard
                      <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </Button>
                  </a>
                  <Button onClick={checkConfiguration} variant="amazon">
                    <svg className="mr-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Check Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Back Link */}
        <div className="text-center mt-6">
          <Link href="/" className="text-sm text-gray-500 hover:text-amazon-orange">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
