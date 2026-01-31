import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.LWA_CLIENT_ID;
  const clientSecret = process.env.LWA_CLIENT_SECRET;
  const refreshToken = process.env.REFRESH_TOKEN;

  // Check if credentials exist
  const credentialsPresent = {
    LWA_CLIENT_ID: !!clientId,
    LWA_CLIENT_SECRET: !!clientSecret,
    REFRESH_TOKEN: !!refreshToken,
    SELLER_ID: !!process.env.SELLER_ID,
    MARKETPLACE_ID: !!process.env.MARKETPLACE_ID,
  };

  // Try to refresh token
  let tokenResult: { success: boolean; error?: string; data?: unknown } = {
    success: false,
  };

  if (clientId && clientSecret && refreshToken) {
    try {
      const response = await fetch('https://api.amazon.com/auth/o2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: clientId,
          client_secret: clientSecret,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        tokenResult = {
          success: true,
          data: {
            token_type: data.token_type,
            expires_in: data.expires_in,
            // Don't expose actual token
            access_token_received: !!data.access_token,
          },
        };
      } else {
        tokenResult = {
          success: false,
          error: JSON.stringify(data),
        };
      }
    } catch (error) {
      tokenResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  return NextResponse.json({
    credentials: credentialsPresent,
    tokenRefresh: tokenResult,
    hints: {
      client_id_format: clientId?.startsWith('amzn1.application-oa2-client.') 
        ? 'OK' 
        : 'Should start with amzn1.application-oa2-client.',
      client_secret_format: clientSecret?.startsWith('amzn1.oa2-cs.v1.') 
        ? 'OK' 
        : 'Should start with amzn1.oa2-cs.v1.',
      refresh_token_format: refreshToken?.startsWith('Atzr|') 
        ? 'OK' 
        : 'Should start with Atzr|',
    },
  });
}
