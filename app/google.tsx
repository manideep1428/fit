import { useEffect, useState } from "react";
import {
  View,
  Text,
  Alert,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useUser } from "@clerk/clerk-expo";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AnimatedButton } from "@/components/AnimatedButton";
import { useRouter, Redirect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getColors, Shadows } from "@/constants/colors";
import { LinearGradient } from "expo-linear-gradient";
import { showToast } from "@/utils/toast";
import * as WebBrowser from "expo-web-browser";
import {
  AuthRequestConfig,
  DiscoveryDocument,
  makeRedirectUri,
  useAuthRequest,
} from "expo-auth-session";

WebBrowser.maybeCompleteAuthSession();

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL || "http://localhost:8081";

// OAuth configuration for Google Calendar
const config: AuthRequestConfig = {
  clientId: "google-calendar",
  scopes: [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/calendar.readonly",
    "openid",
    "profile",
    "email",
  ],
  redirectUri: makeRedirectUri(),
};

const discovery: DiscoveryDocument = {
  authorizationEndpoint: `${BASE_URL}/api/auth/google-calendar/authorize`,
  tokenEndpoint: `${BASE_URL}/api/auth/google-calendar/token`,
};

export default function GoogleCalendarAuth() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = getColors(scheme === "dark");
  const shadows = scheme === "dark" ? Shadows.dark : Shadows.light;

  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>("");
  const [request, response, promptAsync] = useAuthRequest(config, discovery);

  const storeTokens = useMutation(api.googleAuth.storeGoogleTokens);
  const clearTokens = useMutation(api.googleAuth.clearGoogleTokens);

  const tokenStatus = useQuery(
    api.googleAuth.getGoogleTokens,
    user?.id ? { clerkId: user.id } : "skip",
  );

  if (isLoaded && !user) {
    return <Redirect href="/(public)/home" />;
  }

  if (!isLoaded || !user) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ color: colors.text }}>Loading...</Text>
      </View>
    );
  }

  useEffect(() => {
    const configInfo = `Platform: ${Platform.OS}\nUsing: Expo OAuth Server`;
    setDebugInfo(configInfo);
  }, []);

  // Check if user already has tokens
  useEffect(() => {
    if (tokenStatus?.accessToken) {
      setIsConnected(true);
      setConnectionError(null);
    } else {
      setIsConnected(false);
    }
  }, [tokenStatus]);

  // Handle OAuth response
  useEffect(() => {
    handleResponse();
  }, [response]);

  const handleResponse = async () => {
    if (response?.type === "success") {
      setIsLoading(true);
      setConnectionError(null);
      console.log("🟢 [GOOGLE] OAuth success response received");
      console.log("🟢 [GOOGLE] Response params:", response.params);

      try {
        const { code } = response.params;
        console.log(
          "🟢 [GOOGLE] Authorization code:",
          code ? `${code.substring(0, 20)}...` : "null",
        );

        if (!user?.id) {
          const errorMsg = "User not authenticated";
          console.error("❌ [GOOGLE] No user ID found");
          setConnectionError(errorMsg);
          showToast.error(errorMsg);
          Alert.alert(
            "Authentication Error",
            "Please sign in again to connect Google Calendar.",
            [{ text: "OK" }],
          );
          return;
        }

        console.log("🟢 [GOOGLE] User ID:", user.id);

        // Exchange code for tokens
        const formData = new FormData();
        formData.append("code", code);
        formData.append("clerkId", user.id);

        console.log(
          "🟢 [GOOGLE] Sending token exchange request to:",
          `${BASE_URL}/api/auth/google-calendar/token`,
        );

        const tokenResponse = await fetch(
          `${BASE_URL}/api/auth/google-calendar/token`,
          {
            method: "POST",
            body: formData,
          },
        );

        console.log("🟢 [GOOGLE] Token response status:", tokenResponse.status);
        console.log("🟢 [GOOGLE] Token response ok:", tokenResponse.ok);

        if (!tokenResponse.ok) {
          const errorText = await tokenResponse.text();
          console.error("❌ [GOOGLE] Server error response:", errorText);

          // Try to parse as JSON for better error display
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { error: errorText };
          }

          // Show specific help for invalid_client error
          if (errorData.error === "invalid_client") {
            console.error("❌ [GOOGLE] INVALID_CLIENT ERROR - This means:");
            console.error(
              "   1. Redirect URI mismatch in Google Cloud Console",
            );
            console.error(
              "   2. Expected redirect URI: http://localhost:8081/api/auth/google-calendar/callback",
            );
            console.error(
              "   3. Go to: https://console.cloud.google.com/apis/credentials",
            );
            console.error(
              "   4. Add the redirect URI to your OAuth 2.0 Client",
            );
            console.error("   5. Wait 1-2 minutes and try again");
          }

          throw new Error(
            `Server error: ${tokenResponse.status} - ${errorData.error_description || errorData.error}`,
          );
        }

        const tokens = await tokenResponse.json();
        console.log("🟢 [GOOGLE] Tokens received:", {
          hasAccessToken: !!tokens.accessToken,
          hasRefreshToken: !!tokens.refreshToken,
          expiresIn: tokens.expiresIn,
          error: tokens.error,
        });

        if (tokens.error) {
          const errorMsg = tokens.error_description || tokens.error;
          console.error("❌ [GOOGLE] Token error:", errorMsg);
          setConnectionError(errorMsg);
          showToast.error(errorMsg);
          Alert.alert(
            "Connection Failed",
            `Failed to connect Google Calendar: ${errorMsg}\n\nPlease try again.`,
            [
              { text: "Cancel", style: "cancel" },
              { text: "Retry", onPress: handleCalendarSignIn },
            ],
          );
          return;
        }

        // Validate tokens before storing
        if (!tokens.accessToken) {
          console.error("❌ [GOOGLE] No access token in response");
          throw new Error("No access token received from server");
        }

        console.log("🟢 [GOOGLE] Storing tokens in Convex...");

        // Store tokens in Convex user table
        await storeTokens({
          clerkId: user.id,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: tokens.expiresIn,
        });

        console.log("✅ [GOOGLE] Tokens stored successfully");

        setIsConnected(true);
        setConnectionError(null);
        showToast.success("Google Calendar connected successfully!");
        setDebugInfo(
          (prev) => `${prev}\nConnected: ${new Date().toLocaleTimeString()}`,
        );

        Alert.alert(
          "Success!",
          "Your Google Calendar is now connected. Your bookings will be automatically synced.",
          [{ text: "OK" }],
        );
      } catch (error: any) {
        console.error("❌ [GOOGLE] Calendar auth error:", error);
        const errorMessage =
          error.message || "Failed to connect Google Calendar";
        setConnectionError(errorMessage);
        showToast.error(errorMessage);

        Alert.alert(
          "Connection Error",
          `${errorMessage}\n\nPlease check your internet connection and try again.`,
          [
            { text: "Cancel", style: "cancel" },
            { text: "Retry", onPress: handleCalendarSignIn },
          ],
        );
      } finally {
        setIsLoading(false);
      }
    } else if (response?.type === "cancel") {
      console.log("⚠️ [GOOGLE] OAuth cancelled by user");
      showToast.info("Calendar connection cancelled");
    } else if (response?.type === "error") {
      console.error("❌ [GOOGLE] OAuth error:", response.error);
      const errorMsg = response.error?.message || "OAuth authentication failed";
      setConnectionError(errorMsg);
      showToast.error(errorMsg);

      Alert.alert(
        "Authentication Error",
        `${errorMsg}\n\nWould you like to try again?`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Retry", onPress: handleCalendarSignIn },
        ],
      );
    }
  };

  const handleCalendarSignIn = async () => {
    if (!user?.id) {
      Alert.alert("Error", "Please sign in first");
      return;
    }

    if (!request) {
      showToast.error("OAuth request not ready");
      return;
    }

    setIsLoading(true);
    try {
      await promptAsync();
    } catch (error) {
      console.error("Error starting OAuth:", error);
      showToast.error("Failed to start OAuth flow");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    Alert.alert(
      "Disconnect Calendar",
      "Are you sure you want to disconnect Google Calendar?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disconnect",
          style: "destructive",
          onPress: async () => {
            try {
              if (user?.id) {
                await clearTokens({ clerkId: user.id });
              }
              setIsConnected(false);
              showToast.success("Google Calendar disconnected");
            } catch (error) {
              console.error(error);
              showToast.error("Failed to disconnect");
            }
          },
        },
      ],
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        style={{
          paddingTop: 60,
          paddingBottom: 20,
          paddingHorizontal: 20,
        }}
      >
        <View className="flex-row items-center mb-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-4 w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-white flex-1">
            Google Calendar
          </Text>
        </View>
      </LinearGradient>

      <ScrollView className="flex-1 p-6">
        {/* Status Card */}
        <View
          className="rounded-2xl p-6 mb-6"
          style={{
            backgroundColor: colors.surface,
            ...shadows.medium,
          }}
        >
          <View className="flex-row items-center mb-4">
            <View
              className="w-12 h-12 rounded-full items-center justify-center mr-4"
              style={{
                backgroundColor: connectionError
                  ? "#EF444420"
                  : isConnected
                    ? "#10B98120"
                    : "#F59E0B20",
              }}
            >
              <Ionicons
                name={
                  connectionError
                    ? "alert-circle"
                    : isConnected
                      ? "checkmark-circle"
                      : "calendar-outline"
                }
                size={28}
                color={
                  connectionError
                    ? "#EF4444"
                    : isConnected
                      ? "#10B981"
                      : "#F59E0B"
                }
              />
            </View>
            <View className="flex-1">
              <Text
                className="text-lg font-bold mb-1"
                style={{ color: colors.text }}
              >
                {connectionError
                  ? "Connection Error"
                  : isConnected
                    ? "Connected"
                    : "Not Connected"}
              </Text>
              <Text className="text-sm" style={{ color: colors.textSecondary }}>
                {connectionError
                  ? "Failed to connect calendar"
                  : isConnected
                    ? "Your calendar is synced"
                    : "Connect to sync bookings"}
              </Text>
            </View>
          </View>

          {/* Error Message */}
          {connectionError && (
            <View
              className="rounded-xl p-3 mb-4 flex-row items-start"
              style={{ backgroundColor: `${colors.error}15` }}
            >
              <Ionicons
                name="information-circle"
                size={20}
                color={colors.error}
                style={{ marginTop: 1, marginRight: 8 }}
              />
              <Text className="text-sm flex-1" style={{ color: colors.error }}>
                {connectionError}
              </Text>
            </View>
          )}

          {isConnected ? (
            <AnimatedButton onPress={handleDisconnect} variant="outline">
              Disconnect Calendar
            </AnimatedButton>
          ) : (
            <AnimatedButton
              onPress={handleCalendarSignIn}
              disabled={isLoading || !request}
              loading={isLoading}
            >
              {connectionError ? "Retry Connection" : "Connect Google Calendar"}
            </AnimatedButton>
          )}
        </View>

        {/* Info Card */}
        <View
          className="rounded-2xl p-6 mb-6"
          style={{
            backgroundColor: colors.surface,
            ...shadows.small,
          }}
        >
          <Text
            className="text-lg font-bold mb-4"
            style={{ color: colors.text }}
          >
            Benefits
          </Text>

          <View className="space-y-3">
            <View className="flex-row items-start">
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={colors.primary}
                style={{ marginRight: 12, marginTop: 2 }}
              />
              <Text
                className="flex-1 text-base"
                style={{ color: colors.textSecondary }}
              >
                Automatically sync all your bookings to Google Calendar
              </Text>
            </View>

            <View className="flex-row items-start mt-3">
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={colors.primary}
                style={{ marginRight: 12, marginTop: 2 }}
              />
              <Text
                className="flex-1 text-base"
                style={{ color: colors.textSecondary }}
              >
                Get reminders on all your devices
              </Text>
            </View>

            <View className="flex-row items-start mt-3">
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={colors.primary}
                style={{ marginRight: 12, marginTop: 2 }}
              />
              <Text
                className="flex-1 text-base"
                style={{ color: colors.textSecondary }}
              >
                Never miss a training session
              </Text>
            </View>
          </View>
        </View>

        {/* Debug Info (only show in development) */}
        {__DEV__ && debugInfo && (
          <View
            className="rounded-2xl p-4 mb-6"
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text
              className="text-xs font-mono mb-2"
              style={{ color: colors.textSecondary }}
            >
              Debug Info:
            </Text>
            <Text
              className="text-xs font-mono"
              style={{ color: colors.textSecondary }}
            >
              {debugInfo}
            </Text>
            {tokenStatus && (
              <Text
                className="text-xs font-mono mt-2"
                style={{ color: colors.success }}
              >
                Token stored: {tokenStatus.accessToken ? "Yes" : "No"}
              </Text>
            )}
          </View>
        )}

        {/* Troubleshooting Card */}
        <View
          className="rounded-2xl p-6"
          style={{
            backgroundColor: `${colors.warning}10`,
            borderWidth: 1,
            borderColor: `${colors.warning}30`,
          }}
        >
          <View className="flex-row items-center mb-3">
            <Ionicons
              name="information-circle"
              size={24}
              color={colors.warning}
            />
            <Text
              className="text-base font-bold ml-2"
              style={{ color: colors.text }}
            >
              Troubleshooting
            </Text>
          </View>
          <Text
            className="text-sm leading-5"
            style={{ color: colors.textSecondary }}
          >
            If connection fails:
            {"\n"}• Make sure you have Google Play Services installed (Android)
            {"\n"}• Grant calendar permissions when prompted
            {"\n"}• Try clearing app data and reconnecting
            {"\n"}• Check your internet connection
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
