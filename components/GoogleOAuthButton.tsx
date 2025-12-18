import React, { useCallback, useEffect } from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  View,
  Platform,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { useSSO } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getColors, Shadows } from '@/constants/colors';
import { showToast } from '@/utils/toast';

// Preloads the browser for Android devices to reduce authentication load time
export const useWarmUpBrowser = () => {
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
};

// Handle any pending authentication sessions
WebBrowser.maybeCompleteAuthSession();

interface GoogleOAuthButtonProps {
  mode: 'signin' | 'signup';
  onError?: (error: string) => void;
}

export default function GoogleOAuthButton({
  mode,
  onError,
}: GoogleOAuthButtonProps) {
  useWarmUpBrowser();
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = getColors(scheme === 'dark');
  const shadows = scheme === 'dark' ? Shadows.dark : Shadows.light;
  const [loading, setLoading] = React.useState(false);

  const { startSSOFlow } = useSSO();

  const onPress = useCallback(async () => {
    setLoading(true);
    try {
      const { createdSessionId, setActive, signIn } = await startSSOFlow({
        strategy: 'oauth_google',
        redirectUrl: AuthSession.makeRedirectUri(),
      });

      if (createdSessionId) {
        if (mode === 'signup' && signIn?.status === 'complete') {
          showToast.success('Account already exists. Signing you in...');
        }

        // Set the session active
        await setActive!({ session: createdSessionId });

        // Give Clerk time to fully initialize the session
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Navigate to main index which handles role-based routing
        // The index.tsx will check user role and redirect appropriately
        router.replace('/');
      } else {
        console.log('OAuth flow did not complete');
        showToast.error('Authentication was cancelled or incomplete');
      }
    } catch (err: any) {
      console.error('Google OAuth Error:', JSON.stringify(err, null, 2));
      const errorMessage =
        err.errors?.[0]?.message || 'Google authentication failed';
      if (onError) {
        onError(errorMessage);
      } else {
        showToast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [startSSOFlow, router, onError, mode]);

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading}
      className="py-4 rounded-xl flex-row items-center justify-center"
      style={{
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        ...shadows.small,
      }}
    >
      {loading ? (
        <View className="flex-row items-center">
          <ActivityIndicator size="small" color="#DB4437" />
          <Text
            className="text-lg font-medium ml-3"
            style={{ color: colors.text }}
          >
            Connecting...
          </Text>
        </View>
      ) : (
        <>
          <Ionicons name="logo-google" size={24} color="#DB4437" />
          <Text
            className="text-lg font-medium ml-3"
            style={{ color: colors.text }}
          >
            Sign with Google
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}
