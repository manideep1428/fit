import { GoogleSignin, isSuccessResponse, isErrorWithCode, statusCodes } from "@react-native-google-signin/google-signin";
import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, Alert, ScrollView, TouchableOpacity } from "react-native";
import { useUser } from "@clerk/clerk-expo";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AnimatedButton } from "@/components/AnimatedButton";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getColors, Shadows } from "@/constants/colors";
import { LinearGradient } from "expo-linear-gradient";

export default function GoogleCalendarAuth() {
  const { user } = useUser();
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = getColors(scheme === "dark");
  const shadows = scheme === "dark" ? Shadows.dark : Shadows.light;
  
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const storeTokens = useMutation(api.googleAuth.storeGoogleTokens);
  const clearTokens = useMutation(api.googleAuth.clearGoogleTokens);
  
  const tokenStatus = useQuery(
    api.googleAuth.getGoogleTokens,
    user?.id ? { clerkId: user.id } : "skip"
  );

  useEffect(() => {
    GoogleSignin.configure({
      iosClientId: "1083333912631-gdfm0chhuaedqpth2hqlun6270g5srrq.apps.googleusercontent.com",
      webClientId: "1083333912631-2une8flb8bm7j1b90pg71muc98mu5t8v.apps.googleusercontent.com",
      offlineAccess: true, // Required to get refresh token
      scopes: ["https://www.googleapis.com/auth/calendar"],
    });

    checkCurrentUser();
  }, []);

  useEffect(() => {
    if (tokenStatus?.accessToken) {
      setIsConnected(true);
    }
  }, [tokenStatus]);

  const checkCurrentUser = async () => {
    try {
      const currentUser = await GoogleSignin.getCurrentUser();
      setIsConnected(!!currentUser);
    } catch (error) {
      setIsConnected(false);
    }
  };

  const handleCalendarSignIn = async () => {
    if (!user?.id) {
      Alert.alert("Error", "Please sign in first");
      return;
    }

    setIsLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();

      if (isSuccessResponse(response)) {
        const { serverAuthCode } = response.data;

        // Get tokens
        const tokens = await GoogleSignin.getTokens();

        // Store tokens in Convex
        await storeTokens({
          clerkId: user.id,
          accessToken: tokens.accessToken,
          refreshToken: serverAuthCode || undefined,
          expiresIn: 3600, // Google tokens typically expire in 1 hour
        });

        setIsConnected(true);
        Alert.alert("Success", "Google Calendar connected successfully!");
      }
    } catch (error) {
      if (isErrorWithCode(error)) {
        switch (error.code) {
          case statusCodes.SIGN_IN_CANCELLED:
            console.log("User cancelled sign in");
            break;
          case statusCodes.IN_PROGRESS:
            console.log("Sign in already in progress");
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            Alert.alert("Error", "Play Services not available");
            break;
          default:
            Alert.alert("Error", error.message);
        }
      } else {
        Alert.alert("Error", "Failed to connect Google Calendar");
        console.error(error);
      }
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
              await GoogleSignin.signOut();
              setIsConnected(false);
              Alert.alert("Success", "Google Calendar disconnected");
            } catch (error) {
              console.error(error);
              Alert.alert("Error", "Failed to disconnect");
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
          className="rounded-2xl p-6"
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
      </ScrollView>
    </View>
  );
}