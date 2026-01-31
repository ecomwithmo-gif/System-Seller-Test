/**
 * Amazon SP-API Authentication Module
 * Handles LWA OAuth2 token generation and refresh
 */

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

interface CachedToken {
  accessToken: string;
  expiresAt: number;
}

let cachedToken: CachedToken | null = null;

/**
 * Get a valid access token for SP-API calls
 * Automatically refreshes if expired
 */
export async function getAccessToken(): Promise<string> {
  // Check if we have a valid cached token
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60000) {
    return cachedToken.accessToken;
  }

  // Refresh the token
  const response = await fetch('https://api.amazon.com/auth/o2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: process.env.REFRESH_TOKEN!,
      client_id: process.env.LWA_CLIENT_ID!,
      client_secret: process.env.LWA_CLIENT_SECRET!,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh token: ${error}`);
  }

  const data: TokenResponse = await response.json();

  // Cache the token
  cachedToken = {
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return cachedToken.accessToken;
}

/**
 * Get credentials for API signing
 * Uses AWS credentials if available, otherwise returns empty for token-only auth
 */
export async function getSTSCredentials(): Promise<{
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
}> {
  // If AWS credentials are provided, use them
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    return {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    };
  }

  // Return dummy credentials - we'll skip AWS signing
  return {
    accessKeyId: '',
    secretAccessKey: '',
  };
}

/**
 * Check if AWS signing is available
 */
export function hasAWSCredentials(): boolean {
  return !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
}

/**
 * Validate that all required environment variables are set
 */
export function validateCredentials(): { valid: boolean; missing: string[] } {
  const required = [
    'LWA_CLIENT_ID',
    'LWA_CLIENT_SECRET',
    'REFRESH_TOKEN',
    'SELLER_ID',
    'MARKETPLACE_ID',
  ];

  const missing = required.filter((key) => !process.env[key]);

  return {
    valid: missing.length === 0,
    missing,
  };
}
