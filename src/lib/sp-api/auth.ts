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

  return data.access_token;
}

/**
 * Get STS credentials for AWS Signature V4 signing
 * Used when role-based authentication is configured
 */
export async function getSTSCredentials(): Promise<{
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
}> {
  // If using IAM user directly (simpler setup)
  if (!process.env.AWS_ROLE_ARN || process.env.AWS_ROLE_ARN === 'arn:aws:iam::YOUR_ACCOUNT:role/YOUR_ROLE') {
    return {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    };
  }

  // If using STS AssumeRole (more secure for production)
  const accessToken = await getAccessToken();
  
  const stsResponse = await fetch('https://sts.amazonaws.com/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      Action: 'AssumeRole',
      Version: '2011-06-15',
      RoleArn: process.env.AWS_ROLE_ARN!,
      RoleSessionName: 'sp-api-session',
      DurationSeconds: '3600',
    }),
  });

  if (!stsResponse.ok) {
    // Fallback to IAM user credentials
    return {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    };
  }

  // Parse XML response (simplified)
  const xml = await stsResponse.text();
  const accessKeyMatch = xml.match(/<AccessKeyId>(.+?)<\/AccessKeyId>/);
  const secretKeyMatch = xml.match(/<SecretAccessKey>(.+?)<\/SecretAccessKey>/);
  const sessionTokenMatch = xml.match(/<SessionToken>(.+?)<\/SessionToken>/);

  return {
    accessKeyId: accessKeyMatch?.[1] || process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: secretKeyMatch?.[1] || process.env.AWS_SECRET_ACCESS_KEY!,
    sessionToken: sessionTokenMatch?.[1],
  };
}

/**
 * Validate that all required environment variables are set
 */
export function validateCredentials(): { valid: boolean; missing: string[] } {
  const required = [
    'LWA_CLIENT_ID',
    'LWA_CLIENT_SECRET',
    'REFRESH_TOKEN',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'SELLER_ID',
    'MARKETPLACE_ID',
  ];

  const missing = required.filter((key) => !process.env[key]);

  return {
    valid: missing.length === 0,
    missing,
  };
}
