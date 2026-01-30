const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL || "http://localhost:8081";
const APP_SCHEME = process.env.EXPO_PUBLIC_SCHEME || "fit://";

export async function GET(request: Request) {
  console.log("🔵 [CALLBACK API] GET request received");
  console.log("🔵 [CALLBACK API] Request URL:", request.url);

  const incomingParams = new URLSearchParams(request.url.split("?")[1]);
  const combinedPlatformAndState = incomingParams.get("state");
  const code = incomingParams.get("code");
  const error = incomingParams.get("error");

  console.log("🔵 [CALLBACK API] Incoming params:", {
    hasState: !!combinedPlatformAndState,
    hasCode: !!code,
    codeLength: code?.length,
    error,
  });

  if (!combinedPlatformAndState) {
    console.error("❌ [CALLBACK API] Invalid state");
    return Response.json({ error: "Invalid state" }, { status: 400 });
  }

  // Extract platform and original state
  let platform, originalRedirectUri, state;

  try {
    const decodedState = JSON.parse(
      Buffer.from(combinedPlatformAndState, "base64").toString(),
    );
    platform = decodedState.platform;
    originalRedirectUri = decodedState.redirectUri;
    state = decodedState.originalState;
  } catch (e) {
    // Fallback for old format or errors
    const parts = combinedPlatformAndState.split("|");
    platform = parts[0];
    state = parts.slice(1).join("|");
    // Default fallback
    originalRedirectUri =
      platform === "web" ? BASE_URL : APP_SCHEME + "google-calendar";
  }

  console.log("🔵 [CALLBACK API] Extracted:", {
    platform,
    originalRedirectUri,
    state,
  });

  const outgoingParams = new URLSearchParams();

  if (code) {
    outgoingParams.set("code", code);
    console.log("🔵 [CALLBACK API] Code added to outgoing params");
  }

  if (error) {
    outgoingParams.set("error", error);
    console.error("❌ [CALLBACK API] Error from Google:", error);
  }

  if (state) {
    outgoingParams.set("state", state);
  }

  // Redirect back to the app using the preserved redirect URI
  const separator = originalRedirectUri.includes("?") ? "&" : "?";
  const redirectUrl =
    originalRedirectUri + separator + outgoingParams.toString();

  console.log(
    "✅ [CALLBACK API] Redirecting to:",
    redirectUrl.substring(0, 100) + "...",
  );

  return Response.redirect(redirectUrl);
}
