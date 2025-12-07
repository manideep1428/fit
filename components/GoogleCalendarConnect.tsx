import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getColors } from '@/constants/colors';
import { showToast } from '@/utils/toast';

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
  const saveGoogleTokens = useMutation(api.users.saveGoogleTokens);
  const scheme = useColorScheme();
  const colors = getColors(scheme === 'dark');

  const handleConnect = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      // Get the Google Calendar token from Clerk
      const token = await getToken({ template: 'integration_google' });

      if (!token) {
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
    } catch (error: any) {
      console.error('Error connecting Google Calendar:', error);
      showToast.error(error.message || 'Failed to connect Google Calendar. Please try again.', 'Connection Failed');
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
          <Ionicons name="calendar" size={32} color={colors.primary} />
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
