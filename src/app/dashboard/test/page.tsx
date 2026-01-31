"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface TestResult {
  name: string;
  endpoint: string;
  status: "success" | "error" | "skipped";
  responseTime?: number;
  message?: string;
}

interface TestResponse {
  success: boolean;
  summary: {
    total: number;
    success: number;
    errors: number;
  };
  results: TestResult[];
  timestamp: string;
}

export default function TestPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<TestResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runTests() {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch("/api/test-all");
      const data = await response.json();
      
      if (data.missing) {
        setError(`Missing credentials: ${data.missing.join(", ")}`);
      } else {
        setResults(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run tests");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            API Connection Test
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Test all SP-API endpoints at once
          </p>
        </div>
        <Button
          onClick={runTests}
          disabled={loading}
          variant="amazon"
          className="min-w-[140px]"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Testing...
            </>
          ) : (
            <>
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Run All Tests
            </>
          )}
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
          <CardContent className="pt-6">
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </CardContent>
        </Card>
      )}

      {results && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {results.summary.total}
                </div>
                <p className="text-gray-500">Total Tests</p>
              </CardContent>
            </Card>
            <Card className={results.summary.success > 0 ? "border-green-200 bg-green-50 dark:bg-green-900/20" : ""}>
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-green-600">
                  {results.summary.success}
                </div>
                <p className="text-gray-500">Passed</p>
              </CardContent>
            </Card>
            <Card className={results.summary.errors > 0 ? "border-red-200 bg-red-50 dark:bg-red-900/20" : ""}>
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-red-600">
                  {results.summary.errors}
                </div>
                <p className="text-gray-500">Failed</p>
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {results.results.map((result, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      result.status === "success"
                        ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
                        : "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {result.status === "success" ? (
                        <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center">
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-800 flex items-center justify-center">
                          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {result.name}
                        </p>
                        <p className="text-sm text-gray-500 font-mono">
                          {result.endpoint}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${
                        result.status === "success" ? "text-green-600" : "text-red-600"
                      }`}>
                        {result.status === "success" ? "PASS" : "FAIL"}
                      </p>
                      {result.responseTime && (
                        <p className="text-sm text-gray-500">
                          {result.responseTime}ms
                        </p>
                      )}
                      {result.status === "error" && result.message && (
                        <p className="text-xs text-red-500 max-w-xs truncate">
                          {result.message.substring(0, 50)}...
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <p className="text-sm text-gray-500 text-center">
            Last run: {new Date(results.timestamp).toLocaleString()}
          </p>
        </>
      )}

      {!results && !error && !loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Ready to Test
            </h3>
            <p className="text-gray-500 mb-4">
              Click &quot;Run All Tests&quot; to check all SP-API connections
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
