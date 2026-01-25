// NOTE: React Native Google Sign-In package is kept for future calendar integration
// Currently using Clerk OAuth for authentication
// import { GoogleSignin, isSuccessResponse, isErrorWithCode, statusCodes } from "@react-native-google-signin/google-signin";

import { useEffect, useState, useCallback } from "react";
import { View, Text, ActivityIndicator, Alert, ScrollView, TouchableOpacity, Platform } from "react-native";
import { useUser } from "@clerk/clerk-expo";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AnimatedButton } from "@/components/AnimatedButton";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getColors, Shadows } from "@/constants/colors";
import { LinearGradient } from "expo-linear-gradient";
import { showToast } from "@/utils/toast";
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { useSSO } from '@clerk/clerk-expo';

// Preloads the browser for Android devices
export const useWarmUpBrowser = () => {
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
};

WebBrowser.maybeCompleteAuthSession();

export default function GoogleCalendarAuth() {
  useWarmUpBrowser();
  const { user } = useUser();
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = getColors(scheme === "dark");
  const shadows = scheme === "dark" ? Shadows.dark : Shadows.light;
  
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>("");
  const storeTokens = useMutation(api.googleAuth.storeGoogleTokens);
  const clearTokens = useMutation(api.googleAuth.clearGoogleTokens);
  const { startSSOFlow } = useSSO();
  
  const tokenStatus = useQuery(
    api.googleAuth.getGoogleTokens,
    user?.id ? { clerkId: user.id } : "skip"
  );

  useEffect(() => {
    const configInfo = `Platform: ${Platform.OS}\nUsing: Clerk OAuth`;
    setDebugInfo(configInfo);
  }, []);

  useEffect(() => {
    if (tokenStatus?.accessToken) {
      setIsConnected(true);
    }
  }, [tokenStatus]);

  const handleCalendarSignIn = useCallback(async () => {
    if (!user?.id) {
      Alert.alert("Error", "Please sign in first");
      return;
    }

    setIsLoading(true);
    try {
      // Start OAuth flow with Google Calendar scopes
      const { createdSessionId, setActive, signIn, signUp } = await startSSOFlow({
        strategy: 'oauth_google',
        redirectUrl: AuthSession.makeRedirectUri(),
        // Note: Additional scopes for calendar will be handled by Clerk configuration
      });

      // If the OAuth flow completed successfully
      if (createdSessionId) {
        // The user is already authenticated, we just need to get the calendar token
        // This will be handled by your backend/Convex functions
        setIsConnected(true);
        showToast.success("Google Calendar connected successfully!");
        setDebugInfo(prev => `${prev}\nConnected: ${new Date().toLocaleTimeString()}`);
      } else {
        // Handle missing requirements if needed
        if (signIn?.status === 'needs_identifier' || signUp?.status === 'missing_requirements') {
          showToast.info("Please complete the authentication process");
        }
      }
    } catch (error: any) {
      console.error("Calendar sign in error:", error);
      const errorMessage = error.errors?.[0]?.message || "Failed to connect Google Calendar";
      Alert.alert("Error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [user, startSSOFlow]);

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
      ]
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
              style={{ backgroundColor: isConnected ? "#10B98120" : "#F59E0B20" }}
            >
              <Ionicons
                name={isConnected ? "checkmark-circle" : "calendar-outline"}
                size={28}
                color={isConnected ? "#10B981" : "#F59E0B"}
              />
            </View>
            <View className="flex-1">
              <Text
                className="text-lg font-bold mb-1"
                style={{ color: colors.text }}
              >
                {isConnected ? "Connected" : "Not Connected"}
              </Text>
              <Text
                className="text-sm"
                style={{ color: colors.textSecondary }}
              >
                {isConnected
                  ? "Your calendar is synced"
                  : "Connect to sync bookings"}
              </Text>
            </View>
          </View>

          {isConnected ? (
            <AnimatedButton onPress={handleDisconnect} variant="outline">
              Disconnect Calendar
            </AnimatedButton>
          ) : (
            <AnimatedButton
              onPress={handleCalendarSignIn}
              disabled={isLoading}
              loading={isLoading}
            >
              Connect Google Calendar
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
            <Ionicons name="information-circle" size={24} color={colors.warning} />
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