import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, TextInput, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@clerk/clerk-expo';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getColors, BorderRadius } from '@/constants/colors';
import { showToast } from '@/utils/toast';
import * as WebBrowser from 'expo-web-browser';
import Svg, { Path } from 'react-native-svg';
import GoogleTokenHelper from './GoogleTokenHelper';

// Google Calendar SVG Icon
const GoogleCalendarIcon = ({ size = 24 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path fill="#4285F4" d="M22 6c0-1.1-.9-2-2-2h-3V2h-2v2H9V2H7v2H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6zm-2 14H4V9h16v11z" />
    <Path fill="#34A853" d="M10 17h4v-4h-4v4z" />
    <Path fill="#EA4335" d="M16 11.5h2v2h-2z" />
    <Path fill="#FBBC05" d="M6 11.5h2v2H6z" />
  </Svg>
);

interface GoogleCalendarAuthProps {
  onConnected?: () => void;
  onSkip?: () => void;
  buttonText?: string;
  showSkip?: boolean;
}

export default function GoogleCalendarAuth({
  onConnected,
  onSkip,
  buttonText = 'Connect Google Calendar',
  showSkip = true,
}: GoogleCalendarAuthProps) {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [showHelper, setShowHelper] = useState(false);
  const [manualToken, setManualToken] = useState('');
  const saveGoogleTokens = useMutation(api.users.saveGoogleTokens);
  const scheme = useColorScheme();
  const colors = getColors(scheme === 'dark');

  // Google OAuth URLs and configuration
  const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
  const REDIRECT_URI = 'https://your-app.com/oauth/callback'; // Replace with your domain
  
  const generateAuthUrl = () => {
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID || '',
      redirect_uri: REDIRECT_URI,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events',
      access_type: 'offline',
      prompt: 'consent',
    });
    
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  };

  const handleConnect = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'Please sign in first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID !== 'your-google-client-id') {
        // Open Google OAuth in browser
        const authUrl = generateAuthUrl();
        const result = await WebBrowser.openBrowserAsync(authUrl);
        
        if (result.type === 'cancel') {
          setError('Authentication was cancelled');
          return;
        }
        
        // For now, show manual input since we can't easily capture the redirect
        setShowManualInput(true);
        setError('Please copy the authorization code from the browser and paste it below.');
      } else {
        // Demo mode - create a test token
        const demoToken = `demo_google_token_${user.id}_${Date.now()}`;
        
        await saveGoogleTokens({
          clerkId: user.id,
          accessToken: demoToken,
          refreshToken: `refresh_${demoToken}`,
          expiresIn: 3600,
        });

        console.log('Demo Google Calendar token saved:', demoToken);
        showToast.success('Google Calendar connected (Demo Mode)');
        if (onConnected) onConnected();
      }
    } catch (err: any) {
      console.error('Error connecting Google Calendar:', err);
      setError(err.message || 'Failed to connect Google Calendar');
      showToast.error('Failed to connect Google Calendar');
    } finally {
      setLoading(false);
    }
  };

  const handleManualTokenSubmit = async () => {
    if (!user?.id || !manualToken.trim()) return;

    setLoading(true);
    try {
      // In a real implementation, you would exchange this code for tokens
      // For now, we'll just save it as a demo token
      await saveGoogleTokens({
        clerkId: user.id,
        accessToken: manualToken.trim(),
        refreshToken: `refresh_${manualToken.trim()}`,
        expiresIn: 3600,
      });

      console.log('Manual Google Calendar token saved:', manualToken.trim());
      showToast.success('Google Calendar connected successfully!');
      if (onConnected) onConnected();
    } catch (err: any) {
      console.error('Error saving token:', err);
      setError('Failed to save token');
    } finally {
      setLoading(false);
    }
  };

  const handleGetToken = () => {
    Alert.alert(
      'Get Google Calendar Token',
      'To get your Google Calendar token:\n\n1. Go to Google Cloud Console\n2. Create OAuth 2.0 credentials\n3. Enable Calendar API\n4. Use the OAuth playground to get tokens\n\nFor demo purposes, you can also just tap "Demo Mode" below.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Demo Mode', 
          onPress: async () => {
            const demoToken = `demo_google_token_${user?.id}_${Date.now()}`;
            await saveGoogleTokens({
              clerkId: user!.id,
              accessToken: demoToken,
              refreshToken: `refresh_${demoToken}`,
              expiresIn: 3600,
            });
            showToast.success('Demo token created for testing');
            if (onConnected) onConnected();
          }
        },
        { text: 'Open Guide', onPress: () => setShowHelper(true) },
      ]
    );
  };

  return (
    <View className="p-6 rounded-2xl" style={{ backgroundColor: colors.surface }}>
      <View className="items-center mb-4">
        <View
          className="w-16 h-16 rounded-full items-center justify-center mb-3"
          style={{ backgroundColor: colors.primary + '20' }}
        >
          <GoogleCalendarIcon size={32} />
        </View>
        <Text className="text-xl font-bold mb-2" style={{ color: colors.text }}>
          Connect Google Calendar
        </Text>
        <Text
          className="text-center text-sm"
          style={{ color: colors.textSecondary }}
        >
          Sync your training sessions to Google Calendar and never miss a workout
        </Text>
      </View>

      <View className="space-y-3 mb-6">
        <View className="flex-row items-center">
          <Ionicons name="checkmark-circle" size={20} color={colors.success} />
          <Text className="ml-2 text-sm" style={{ color: colors.text }}>
            Automatic calendar sync
          </Text>
        </View>
        <View className="flex-row items-center">
          <Ionicons name="checkmark-circle" size={20} color={colors.success} />
          <Text className="ml-2 text-sm" style={{ color: colors.text }}>
            Get reminders before sessions
          </Text>
        </View>
        <View className="flex-row items-center">
          <Ionicons name="checkmark-circle" size={20} color={colors.success} />
          <Text className="ml-2 text-sm" style={{ color: colors.text }}>
            Manage all your appointments in one place
          </Text>
        </View>
      </View>

      {/* Error Message */}
      {error && (
        <View
          className="rounded-xl p-3 mb-4 flex-row items-start"
          style={{ backgroundColor: `${colors.warning}15` }}
        >
          <Ionicons name="information-circle" size={20} color={colors.warning} style={{ marginTop: 1 }} />
          <Text className="ml-2 text-sm flex-1" style={{ color: colors.warning }}>
            {error}
          </Text>
        </View>
      )}

      {/* Manual Token Input */}
      {showManualInput && (
        <View className="mb-4">
          <Text className="text-sm font-medium mb-2" style={{ color: colors.text }}>
            Authorization Code:
          </Text>
          <TextInput
            value={manualToken}
            onChangeText={setManualToken}
            placeholder="Paste authorization code here"
            placeholderTextColor={colors.textTertiary}
            className="px-4 py-3 mb-3"
            style={{
              backgroundColor: colors.background,
              color: colors.text,
              borderRadius: BorderRadius.medium,
              borderWidth: 1,
              borderColor: colors.border,
            }}
            multiline
          />
          <TouchableOpacity
            onPress={handleManualTokenSubmit}
            disabled={loading || !manualToken.trim()}
            className="rounded-xl py-3 items-center"
            style={{ 
              backgroundColor: loading || !manualToken.trim() ? colors.border : colors.success,
            }}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text className="text-white font-semibold">Submit Code</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {!showManualInput && (
        <>
          <TouchableOpacity
            onPress={handleConnect}
            disabled={loading}
            className="rounded-xl py-4 items-center mb-3"
            style={{ 
              backgroundColor: loading ? colors.border : colors.primary,
            }}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <View className="flex-row items-center">
                <Ionicons name="logo-google" size={20} color="#FFF" />
                <Text className="text-white font-semibold text-base ml-2">
                  {buttonText}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleGetToken}
            className="rounded-xl py-3 items-center mb-3"
            style={{ backgroundColor: colors.surfaceSecondary }}
          >
            <Text className="font-semibold" style={{ color: colors.text }}>
              Get Token Manually
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowHelper(true)}
            className="rounded-xl py-3 items-center mb-3"
            style={{ backgroundColor: `${colors.primary}15` }}
          >
            <View className="flex-row items-center">
              <Ionicons name="help-circle-outline" size={18} color={colors.primary} />
              <Text className="font-semibold ml-2" style={{ color: colors.primary }}>
                Setup Guide
              </Text>
            </View>
          </TouchableOpacity>
        </>
      )}

      {showSkip && onSkip && (
        <TouchableOpacity onPress={onSkip} className="py-3 items-center">
          <Text className="text-sm" style={{ color: colors.textSecondary }}>
            Skip for now
          </Text>
        </TouchableOpacity>
      )}

      {/* Helper Modal */}
      <Modal
        visible={showHelper}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <GoogleTokenHelper onClose={() => setShowHelper(false)} />
      </Modal>
    </View>
  );
}