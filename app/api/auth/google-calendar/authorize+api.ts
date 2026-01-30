// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID!;
const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL || "http://localhost:8081";
const APP_SCHEME = process.env.EXPO_PUBLIC_SCHEME || "fit://";
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";

// Google Calendar scopes
const CALENDAR_SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.readonly",
  "openid",
  "profile",
  "email",
].join(" ");

export async function GET(request: Request) {
  console.log("🔵 [AUTHORIZE API] GET request received");

  if (!GOOGLE_CLIENT_ID) {
    console.error("❌ [AUTHORIZE API] Missing GOOGLE_CLIENT_ID");
    return Response.json(
      { error: "Missing GOOGLE_CLIENT_ID environment variable" },
      { status: 500 },
    );
  }

  const url = new URL(request.url);
  const redirectUri = url.searchParams.get("redirect_uri");
  const state = url.searchParams.get("state") || "";

  console.log("🔵 [AUTHORIZE API] Request params:", {
    redirectUri,
    state,
    fullUrl: request.url,
  });

  let platform;
  if (redirectUri === APP_SCHEME) {
    platform = "mobile";
  } else if (redirectUri === BASE_URL) {
    platform = "web";
  } else {
    console.error("❌ [AUTHORIZE API] Invalid redirect_uri:", redirectUri);
    return Response.json({ error: "Invalid redirect_uri" }, { status: 400 });
  }

  if (!state) {
    console.error("❌ [AUTHORIZE API] Invalid state");
    return Response.json({ error: "Invalid state" }, { status: 400 });
  }

  // Combine platform and original redirect URI into state
  // Format: platform|originalRedirectUri|state
  const stateData = {
    platform,
    redirectUri,
    originalState: state,
  };

  const combinedState = Buffer.from(JSON.stringify(stateData)).toString(
    "base64",
  );
  console.log("🔵 [AUTHORIZE API] Combined state:", combinedState);

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: BASE_URL + "/api/auth/google-calendar/callback",
    response_type: "code",
    scope: CALENDAR_SCOPES,
    state: combinedState,
    access_type: "offline", // Request refresh token
    prompt: "consent", // Force consent to get refresh token
  });

  const authUrl = GOOGLE_AUTH_URL + "?" + params.toString();
  console.log(
    "✅ [AUTHORIZE API] Redirecting to Google OAuth:",
    authUrl.substring(0, 100) + "...",
  );

  return Response.redirect(authUrl);
}
