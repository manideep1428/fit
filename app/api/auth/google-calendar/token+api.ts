/**
 * Google Calendar OAuth Token Exchange API
 *
 * IMPORTANT: Make sure your Google Cloud Console OAuth 2.0 Client has these settings:
 *
 * 1. Authorized redirect URIs must include:
 *    - http://localhost:8081/api/auth/google-calendar/callback (for development)
 *    - https://your-production-domain.com/api/auth/google-calendar/callback (for production)
 *
 * 2. The Client ID and Client Secret must match the Web application credentials
 *
 * 3. Enable the Google Calendar API in your Google Cloud project
 *
 * Common errors:
 * - "invalid_client" or "Unauthorized" = redirect_uri mismatch or wrong credentials
 * - "invalid_grant" = authorization code expired or already used
 */

const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim()!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET?.trim()!;
const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL || "http://localhost:8081";
const GOOGLE_REDIRECT_URI = `${BASE_URL}/api/auth/google-calendar/callback`;

export async function POST(request: Request) {
  const requestId = Math.random().toString(36).substring(7);
  console.log(
    `🔵 [TOKEN API ${requestId}] POST request received at ${new Date().toISOString()}`,
  );

  try {
    // Parse FormData from request
    const formData = await request.formData();
    console.log(`🔵 [TOKEN API ${requestId}] FormData parsed`);

    // Extract values from FormData
    let code: string | null = null;
    let clerkId: string | null = null;

    // Iterate through FormData entries
    for (const [key, value] of formData as any) {
      console.log(
        `🔵 [TOKEN API ${requestId}] FormData entry: ${key} = ${value ? "***" : "null"}`,
      );
      if (key === "code") {
        code = value as string;
      } else if (key === "clerkId") {
        clerkId = value as string;
      }
    }

    console.log(`🔵 [TOKEN API ${requestId}] Extracted values:`, {
      hasCode: !!code,
      codeLength: code?.length,
      hasClerkId: !!clerkId,
      clerkId: clerkId,
    });

    if (!code) {
      console.error(`❌ [TOKEN API ${requestId}] Missing authorization code`);
      return Response.json(
        { error: "Missing authorization code" },
        { status: 400 },
      );
    }

    if (!clerkId) {
      console.error(`❌ [TOKEN API ${requestId}] Missing user ID`);
      return Response.json({ error: "Missing user ID" }, { status: 400 });
    }

    console.log(
      `🔵 [TOKEN API ${requestId}] Exchanging code for tokens with Google...`,
    );
    console.log(`🔵 [TOKEN API ${requestId}] Config:`, {
      hasClientId: !!GOOGLE_CLIENT_ID,
      clientIdPrefix: GOOGLE_CLIENT_ID?.substring(0, 20),
      hasClientSecret: !!GOOGLE_CLIENT_SECRET,
      clientSecretPrefix: GOOGLE_CLIENT_SECRET?.substring(0, 10),
      redirectUri: GOOGLE_REDIRECT_URI,
      baseUrl: BASE_URL,
    });

    const tokenRequestBody = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: GOOGLE_REDIRECT_URI,
      grant_type: "authorization_code",
      code: code,
    });

    console.log(`🔵 [TOKEN API ${requestId}] Token request body:`, {
      client_id: GOOGLE_CLIENT_ID?.substring(0, 20) + "...",
      client_secret: GOOGLE_CLIENT_SECRET?.substring(0, 10) + "...",
      redirect_uri: GOOGLE_REDIRECT_URI,
      grant_type: "authorization_code",
      code: code.substring(0, 20) + "...",
    });

    // Exchange authorization code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: tokenRequestBody,
    });

    console.log(
      `🔵 [TOKEN API ${requestId}] Google response status:`,
      tokenResponse.status,
    );

    const tokenData = await tokenResponse.json();
    console.log(`🔵 [TOKEN API ${requestId}] Google response data:`, {
      hasAccessToken: !!tokenData.access_token,
      hasRefreshToken: !!tokenData.refresh_token,
      expiresIn: tokenData.expires_in,
      error: tokenData.error,
      errorDescription: tokenData.error_description,
    });

    if (tokenData.error) {
      console.error(`❌ [TOKEN API ${requestId}] Google OAuth error:`, {
        error: tokenData.error,
        description: tokenData.error_description,
      });
      return Response.json(
        {
          error: tokenData.error,
          error_description: tokenData.error_description,
        },
        { status: 400 },
      );
    }

    console.log(
      `✅ [TOKEN API ${requestId}] Successfully obtained tokens from Google`,
    );

    // Return tokens to be stored by the client
    return Response.json({
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresIn: tokenData.expires_in,
      scope: tokenData.scope,
      tokenType: tokenData.token_type,
    });
  } catch (error) {
    console.error(`❌ [TOKEN API ${requestId}] Token exchange error:`, error);
    return Response.json(
      { error: "Failed to exchange authorization code" },
      { status: 500 },
    );
  }
}
