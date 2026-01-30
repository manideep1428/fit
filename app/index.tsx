import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { useUser, useAuth } from "@clerk/clerk-expo";
import { View, ActivityIndicator } from "react-native";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { getColors } from "@/constants/colors";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function Index() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { isLoaded: isAuthLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = getColors(scheme === "dark");
  const [hasNavigated, setHasNavigated] = useState(false);

  const convexUser = useQuery(
    api.users.getUserByClerkId,
    user?.id ? { clerkId: user.id } : "skip",
  );

  useEffect(() => {
    if (!isAuthLoaded || !isUserLoaded) return;

    if (hasNavigated) return;

    if (!isSignedIn || !user) {
      setHasNavigated(true);
      router.replace("/(public)/home");
      return;
    }

    // Wait for Convex query to complete (not 'skip' and not undefined/loading)
    // convexUser will be null if user doesn't exist in Convex yet
    if (convexUser === undefined) return;

    // Get role from Convex first (more reliable), fallback to Clerk metadata
    const convexRole = convexUser?.role;
    const clerkRole = user.unsafeMetadata?.role as string | undefined;
    const role = convexRole || clerkRole;

    // If user doesn't have a role yet, redirect to role selection
    if (!role) {
      setHasNavigated(true);
      router.replace("/(auth)/role-selection");
      return;
    }

    setHasNavigated(true);

    // Redirect based on role
    if (role === "trainer") {
      // Check if trainer has completed profile setup
      const hasUsername = convexUser?.username || user.unsafeMetadata?.username;
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
      // If role is invalid, redirect to role selection
      router.replace("/(auth)/role-selection");
    }
  }, [
    isAuthLoaded,
    isUserLoaded,
    isSignedIn,
    user,
    convexUser,
    hasNavigated,
    router,
  ]);

  // Show loading screen while checking authentication
  return (
    <View
      className="flex-1 items-center justify-center"
      style={{ backgroundColor: colors.background }}
    >
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}
