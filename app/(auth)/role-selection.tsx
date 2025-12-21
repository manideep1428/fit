import { View, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useUser } from '@clerk/clerk-expo';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getColors } from '@/constants/colors';

// This page now just redirects based on existing role
// New users are either trainers (from sign-up) or clients (invited by trainers)
export default function RoleSelectionScreen() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const scheme = useColorScheme();
  const colors = getColors(scheme === 'dark');

  // Check if user already exists in Convex with a role
  const convexUser = useQuery(
    api.users.getUserByClerkId,
    user?.id ? { clerkId: user.id } : 'skip'
  );

  // Redirect based on existing role
  useEffect(() => {
    if (!isLoaded || !user) return;

    // Wait for Convex query
    if (convexUser === undefined) return;

    // Check Convex first, then Clerk metadata
    const existingRole =
      convexUser?.role || (user.unsafeMetadata?.role as string | undefined);

    if (existingRole === 'trainer') {
      const hasUsername = convexUser?.username || user.unsafeMetadata?.username;
      const hasSpecialty = convexUser?.specialty || user.unsafeMetadata?.specialty;

      if (!hasUsername || !hasSpecialty) {
        router.replace('/(auth)/trainer-setup');
      } else {
        router.replace('/(trainer)');
      }
    } else if (existingRole === 'client') {
      router.replace('/(client)');
    } else {
      // No role - redirect to welcome to sign up as trainer or sign in as invited client
      router.replace('/(auth)/welcome');
    }
  }, [isLoaded, user, convexUser, router]);

  return (
    <View
      className="flex-1 items-center justify-center"
      style={{ backgroundColor: colors.background }}
    >
      <StatusBar style="auto" />
      <ActivityIndicator size="large" color={colors.primary} />
      <Text className="text-sm mt-4" style={{ color: colors.textSecondary }}>
        Checking your account...
      </Text>
    </View>
  );
}
