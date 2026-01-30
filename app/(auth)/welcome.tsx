import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import GoogleOAuthButton from "@/components/GoogleOAuthButton";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getColors, BorderRadius } from "@/constants/colors";
import { AnimatedButton } from "@/components/AnimatedButton";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useEffect, useState, useCallback } from "react";
import { useQuery } from "convex/react";
import { useFocusEffect } from "expo-router";
import { api } from "@/convex/_generated/api";

export default function WelcomeScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = getColors(scheme === "dark");
  const insets = useSafeAreaInsets();
  const { isSignedIn, isLoaded: isAuthLoaded } = useAuth();
  const { user, isLoaded: isUserLoaded } = useUser();
  const [isNavigating, setIsNavigating] = useState(false);
  const [loadingButton, setLoadingButton] = useState<
    "trainer" | "client" | "signin" | null
  >(null);

  // Reset loading state when screen comes back into focus
  useFocusEffect(
    useCallback(() => {
      setLoadingButton(null);
    }, []),
  );

  // Query Convex for user data
  const convexUser = useQuery(
    api.users.getUserByClerkId,
    user?.id ? { clerkId: user.id } : "skip",
  );

  // Check if user is already signed in and redirect accordingly
  useEffect(() => {
    if (!isAuthLoaded || !isUserLoaded || isNavigating) return;

    if (isSignedIn && user) {
      // Wait for Convex query to complete
      if (convexUser === undefined) return;

      setIsNavigating(true);

      // Get role from Convex first, fallback to Clerk metadata
      const convexRole = convexUser?.role;
      const clerkRole = user.unsafeMetadata?.role as string | undefined;
      const role = convexRole || clerkRole;

      if (!role) {
        router.replace("/(auth)/role-selection");
        return;
      }

      if (role === "trainer") {
        const hasUsername =
          convexUser?.username || user.unsafeMetadata?.username;
        const hasSpecialty =
          convexUser?.specialty || user.unsafeMetadata?.specialty;

        if (!hasUsername || !hasSpecialty) {
          router.replace("/(auth)/trainer-setup");
        } else {
          router.replace("/(trainer)");
        }
      } else if (role === "client") {
        router.replace("/(client)");
      } else {
        router.replace("/(auth)/role-selection");
      }
    }
  }, [
    isAuthLoaded,
    isUserLoaded,
    isSignedIn,
    user,
    convexUser,
    router,
    isNavigating,
  ]);

  if (
    !isAuthLoaded ||
    !isUserLoaded ||
    (isSignedIn && user && (convexUser === undefined || isNavigating))
  ) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: colors.background }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-sm mt-4" style={{ color: colors.textSecondary }}>
          {isNavigating ? "Redirecting..." : "Loading..."}
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />

      {/* Top Image */}
      <View className="w-full h-[50%]">
        <Image
          source={require("@/assets/images/intro.jpg")}
          className="w-full h-full"
          resizeMode="cover"
        />
      </View>

      {/* Rounded Container Overlay */}
      <View
        className="flex-1 px-6 pt-6 pb-8 -mt-10"
        style={{
          backgroundColor: colors.surface,
          borderTopLeftRadius: BorderRadius.xxlarge,
          borderTopRightRadius: BorderRadius.xxlarge,
          elevation: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
        }}
      >
        <View className="items-center mb-6">
          <Text
            className="text-3xl font-bold mb-3"
            style={{ color: colors.text }}
          >
            Welcome
          </Text>
          <Text
            className="text-sm text-center leading-6 px-4"
            style={{ color: colors.textSecondary }}
          >
            Choose your role to get started with your fitness journey
          </Text>
        </View>

        {/* Buttons */}
        <View className="gap-4">
          <AnimatedButton
            onPress={() => {
              setLoadingButton("trainer");
              router.push("/(auth)/sign-up" as any);
            }}
            variant="primary"
            size="large"
            fullWidth
            loading={loadingButton === "trainer"}
            disabled={loadingButton !== null}
          >
            I'm a Trainer
          </AnimatedButton>

          <AnimatedButton
            onPress={() => {
              setLoadingButton("client");
              router.push("/(auth)/client-signup" as any);
            }}
            variant="secondary"
            size="large"
            fullWidth
            loading={loadingButton === "client"}
            disabled={loadingButton !== null}
          >
            I'm a Client
          </AnimatedButton>

          <View className="flex-row items-center my-2">
            <View
              className="flex-1 h-[1px]"
              style={{ backgroundColor: colors.border }}
            />
            <Text
              className="mx-4 text-sm"
              style={{ color: colors.textSecondary }}
            >
              or
            </Text>
            <View
              className="flex-1 h-[1px]"
              style={{ backgroundColor: colors.border }}
            />
          </View>

          <AnimatedButton
            onPress={() => {
              setLoadingButton("signin");
              router.push("/(auth)/sign-in" as any);
            }}
            variant="outline"
            size="large"
            fullWidth
            loading={loadingButton === "signin"}
            disabled={loadingButton !== null}
          >
            Sign In
          </AnimatedButton>
        </View>

        {/* Legal Links */}
        <View className="flex-row justify-center gap-4 mt-8">
          <TouchableOpacity
            onPress={() => router.push("/(public)/privacy" as any)}
          >
            <Text className="text-xs" style={{ color: colors.textTertiary }}>
              Privacy Policy
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/(public)/terms" as any)}
          >
            <Text className="text-xs" style={{ color: colors.textTertiary }}>
              Terms of Service
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
