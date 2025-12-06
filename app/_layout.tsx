import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Redirect, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import 'react-native-reanimated';
import { ClerkProvider } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { useNotifications } from '@/hooks/useNotifications';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';

import "../global.css"

function AppContent() {
  useNotifications();
  
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(trainer)" options={{ headerShown: false }} />
        <Stack.Screen name="(client)" options={{ headerShown: false }} />
      </Stack>
    </SafeAreaView>
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
      <StatusBar style={isDark ? 'light' : 'dark'} />
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
