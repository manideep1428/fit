import { View, Text, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GoogleOAuthButton from '@/components/GoogleOAuthButton';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getColors, BorderRadius } from '@/constants/colors';
import { AnimatedButton } from '@/components/AnimatedButton';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useEffect, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

export default function WelcomeScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = getColors(scheme === 'dark');
  const insets = useSafeAreaInsets();
  const { isSignedIn, isLoaded: isAuthLoaded } = useAuth();
  const { user, isLoaded: isUserLoaded } = useUser();
  const [isNavigating, setIsNavigating] = useState(false);

  // Query Convex for user data
  const convexUser = useQuery(
    api.users.getUserByClerkId,
    user?.id ? { clerkId: user.id } : 'skip'
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

      // If user doesn't have a role yet, redirect to role selection
      if (!role) {
        router.replace('/(auth)/role-selection');
        return;
      }

      // Redirect based on role
      if (role === 'trainer') {
        // Check if trainer has completed profile setup
        const hasUsername = convexUser?.username || user.unsafeMetadata?.username;
        const hasSpecialty = convexUser?.specialty || user.unsafeMetadata?.specialty;

        if (!hasUsername || !hasSpecialty) {
          router.replace('/(auth)/trainer-setup');
        } else {
          router.replace('/(trainer)');
        }
      } else if (role === 'client') {
        router.replace('/(client)');
      } else {
        // If role is invalid, redirect to role selection
        router.replace('/(auth)/role-selection');
      }
    }
  }, [isAuthLoaded, isUserLoaded, isSignedIn, user, convexUser, router, isNavigating]);

  // Show loading screen while checking authentication or navigating
  if (!isAuthLoaded || !isUserLoaded || (isSignedIn && user && (convexUser === undefined || isNavigating))) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-sm mt-4" style={{ color: colors.textSecondary }}>
          {isNavigating ? 'Redirecting...' : 'Loading...'}
        </Text>
      </View>
    );
  }
     

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />

      {/* Top Image */}
      <View className="w-full h-[60%]">
        <Image
          source={require('@/assets/images/intro.jpg')}
          className="w-full h-full"
          resizeMode="cover"
        />
      </View>

      {/* Rounded Container Overlay */}
      <View
        className="flex-1 px-6 pt-8 pb-8 -mt-10"
        style={{
          backgroundColor: colors.surface,
          borderTopLeftRadius: BorderRadius.xxlarge,
          borderTopRightRadius: BorderRadius.xxlarge,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
        }}
      >
        <View className="items-center mb-8">
          <Text className="text-3xl font-bold mb-3" style={{ color: colors.text }}>
            Welcome
          </Text>
          <Text className="text-sm text-center leading-6 px-4" style={{ color: colors.textSecondary }}>
            Choose your role to get started with your fitness journey
          </Text>
        </View>

        {/* Buttons */}
        <View className="gap-4">
          <AnimatedButton
            onPress={() => router.push('/(auth)/sign-up' as any)}
            variant="primary"
            size="large"
            fullWidth
          >
            I'm a Trainer
          </AnimatedButton>

          <AnimatedButton
            onPress={() => router.push('/(auth)/client-signup' as any)}
            variant="secondary"
            size="large"
            fullWidth
          >
            I'm a Client
          </AnimatedButton>

          <AnimatedButton
            onPress={() => router.push('/(auth)/sign-in' as any)}
            variant="outline"
            size="large"
            fullWidth
          >
            Sign In
          </AnimatedButton>
        </View>
      </View>
    </View>
  );
}
