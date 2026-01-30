/**
 * Test endpoint to verify API routes are working
 * Access: http://localhost:8081/api/auth/google-calendar/test
 */

export async function GET(request: Request) {
  console.log('✅ [TEST API] Test endpoint hit successfully!');
  
  const clientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const baseUrl = process.env.EXPO_PUBLIC_BASE_URL;
  
  return Response.json({
    success: true,
    message: 'API routes are working!',
    timestamp: new Date().toISOString(),
    config: {
      hasClientId: !!clientId,
      clientIdPrefix: clientId?.substring(0, 30) + '...',
      clientIdLength: clientId?.length,
      hasClientSecret: !!clientSecret,
      clientSecretPrefix: clientSecret?.substring(0, 15) + '...',
      clientSecretLength: clientSecret?.length,
      baseUrl: baseUrl,
      expectedRedirectUri: `${baseUrl}/api/auth/google-calendar/callback`,
    },
    instructions: {
      step1: 'Verify the clientId matches your Google Cloud Console',
      step2: 'Verify the clientSecret matches your Google Cloud Console',
      step3: 'Verify the expectedRedirectUri is in your Authorized redirect URIs',
      step4: 'Make sure Client ID and Secret are from the SAME OAuth client',
    }
  });
}
