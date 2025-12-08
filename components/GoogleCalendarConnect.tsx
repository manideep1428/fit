import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getColors } from '@/constants/colors';
import { showToast } from '@/utils/toast';
import Svg, { Path } from 'react-native-svg';

// Google Calendar SVG Icon
const GoogleCalendarIcon = ({ size = 24 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path fill="#4285F4" d="M22 6c0-1.1-.9-2-2-2h-3V2h-2v2H9V2H7v2H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6zm-2 14H4V9h16v11z" />
    <Path fill="#34A853" d="M10 17h4v-4h-4v4z" />
    <Path fill="#EA4335" d="M16 11.5h2v2h-2z" />
    <Path fill="#FBBC05" d="M6 11.5h2v2H6z" />
  </Svg>
);

interface GoogleCalendarConnectProps {
  onConnected?: () => void;
  onSkip?: () => void;
}

export default function GoogleCalendarConnect({
  onConnected,
  onSkip,
}: GoogleCalendarConnectProps) {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const saveGoogleTokens = useMutation(api.users.saveGoogleTokens);
  const scheme = useColorScheme();
  const colors = getColors(scheme === 'dark');

  const handleConnect = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      // Try to get the Google Calendar token from Clerk
      // This requires a JWT template named 'integration_google' in Clerk dashboard
      const token = await getToken({ template: 'integration_google' });

      if (!token) {
        setError('Unable to get calendar access. Please sign in with Google.');
        showToast.error('Please sign in with Google to connect your calendar', 'Authentication Required');
        return;
      }

      // Save the token to Convex
      await saveGoogleTokens({
        clerkId: user.id,
        accessToken: token,
      });

      showToast.success('Your bookings will now sync to your calendar', 'Calendar Connected');
      if (onConnected) onConnected();
    } catch (err: any) {
      console.error('Error connecting Google Calendar:', err);

      // Check if this is a JWT template configuration error
      if (err.message?.includes('No JWT template') || err.message?.includes('integration_google')) {
        setError('Calendar integration is not configured yet. This feature will be available soon!');
        showToast.info('Calendar sync coming soon!', 'Feature Not Available');
      } else {
        setError(err.message || 'Failed to connect. Please try again.');
        showToast.error('Failed to connect Google Calendar', 'Connection Failed');
      }
    } finally {
      setLoading(false);
    }
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
          className="rounded-xl p-3 mb-4 flex-row items-center"
          style={{ backgroundColor: `${colors.warning}15` }}
        >
          <Ionicons name="information-circle" size={20} color={colors.warning} />
          <Text className="ml-2 text-sm flex-1" style={{ color: colors.warning }}>
            {error}
          </Text>
        </View>
      )}

      <TouchableOpacity
        onPress={handleConnect}
        disabled={loading}
        className="rounded-xl py-4 items-center mb-3"
        style={{ backgroundColor: colors.primary }}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <View className="flex-row items-center">
            <Ionicons name="logo-google" size={20} color="#FFF" />
            <Text className="text-white font-semibold text-base ml-2">
              Connect Calendar
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {onSkip && (
        <TouchableOpacity onPress={onSkip} className="py-3 items-center">
          <Text className="text-sm" style={{ color: colors.textSecondary }}>
            Skip for now
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
