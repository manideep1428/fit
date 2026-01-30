const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const refreshToken = body.refreshToken;

    if (!refreshToken) {
      return Response.json(
        { error: 'Missing refresh token' },
        { status: 400 }
      );
    }

    // Use refresh token to get new access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return Response.json(
        {
          error: tokenData.error,
          error_description: tokenData.error_description,
        },
        { status: 400 }
      );
    }

    // Return new access token
    return Response.json({
      accessToken: tokenData.access_token,
      expiresIn: tokenData.expires_in,
      scope: tokenData.scope,
      tokenType: tokenData.token_type,
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    return Response.json(
      { error: 'Failed to refresh access token' },
      { status: 500 }
    );
  }
}
