import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Redirect, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import 'react-native-reanimated';
import { ClerkProvider } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { useNotifications } from '@/hooks/useNotifications';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import Toast from 'react-native-toast-message';
import { toastConfig } from '@/components/ToastConfig';
import { getColors } from '@/constants/colors';
import { useColorScheme } from '@/hooks/use-color-scheme';

import "../global.css"

function AppContent() {
  useNotifications();
  const scheme = useColorScheme();
  const colors = getColors(scheme === 'dark');
  
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(trainer)" options={{ headerShown: false }} />
        <Stack.Screen name="(client)" options={{ headerShown: false }} />
        <Stack.Screen name="change-password" options={{ headerShown: false }} />
        <Stack.Screen name="edit-profile" options={{ headerShown: false }} />
        <Stack.Screen name="edit-profile-form" options={{ headerShown: false }} />
      </Stack>
    </View>
  );
}

export const unstable_settings = {
  initialRouteName: 'index',
};


const convex = new ConvexReactClient("https://mellow-shepherd-472.convex.cloud", {
  unsavedChangesWarning: false,
});

function ThemedApp() {
  const { isDark } = useTheme();
  
  return (
    <NavigationThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <AppContent />
      <StatusBar style="auto" />
      <Toast config={toastConfig} />
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

  if (!publishableKey) {
    throw new Error('Missing Clerk Publishable Key');
  }

  return (
    <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
      <ConvexProvider client={convex}>
        <ThemeProvider>
          <ThemedApp />
        </ThemeProvider>
      </ConvexProvider>
    </ClerkProvider>
  );
}
