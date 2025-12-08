import { View, Text, ScrollView, TouchableOpacity, Switch, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-expo';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getColors, Shadows, BorderRadius } from '@/constants/colors';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeIn } from 'react-native-reanimated';
import { AnimatedButton } from '@/components/AnimatedButton';

export default function NotificationSettingsScreen() {
  const { user } = useUser();
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = getColors(scheme === 'dark');
  const shadows = scheme === 'dark' ? Shadows.dark : Shadows.light;
  const insets = useSafeAreaInsets();

  const updateNotificationSettings = useMutation(api.users.updateNotificationSettings);

  const userData = useQuery(
    api.users.getUserByClerkId,
    user?.id ? { clerkId: user.id } : 'skip'
  );

  const [settings, setSettings] = useState({
    sessionReminders: true,
    reminderMinutes: [10, 5],
    paymentRequests: true,
    goalUpdates: true,
    newClients: true,
    newBookings: true,
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userData?.notificationSettings) {
      setSettings(userData.notificationSettings);
    }
  }, [userData]);

  const handleSave = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      await updateNotificationSettings({
        clerkId: user.id,
        settings,
      });
      router.back();
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const toggleReminder = (minutes: number) => {
    const current = settings.reminderMinutes;
    if (current.includes(minutes)) {
      setSettings({
        ...settings,
        reminderMinutes: current.filter(m => m !== minutes),
      });
    } else {
      setSettings({
        ...settings,
        reminderMinutes: [...current, minutes].sort((a, b) => b - a),
      });
    }
  };

  // Simple toggle row
  const ToggleRow = ({
    title,
    subtitle,
    value,
    onValueChange,
    isLast = false,
  }: {
    title: string;
    subtitle: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
    isLast?: boolean;
  }) => (
    <View
      className="flex-row items-center py-4"
      style={{
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: colors.border
      }}
    >
      <View className="flex-1">
        <Text className="text-base font-medium" style={{ color: colors.text }}>
          {title}
        </Text>
        <Text className="text-sm mt-0.5" style={{ color: colors.textSecondary }}>
          {subtitle}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor="#FFF"
      />
    </View>
  );

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />

      {/* Minimal Header */}
      <View className="px-6 pb-4 flex-row items-center" style={{ paddingTop: insets.top + 12 }}>
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center rounded-full mr-4"
          style={{ backgroundColor: colors.surface }}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text className="text-2xl font-bold" style={{ color: colors.text }}>
          Notifications
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Session Reminders */}
        <Animated.View entering={FadeIn.delay(100)}>
          <Text className="text-xs font-semibold uppercase tracking-wide mb-2 mt-4" style={{ color: colors.textTertiary }}>
            Reminders
          </Text>

          <View
            className="rounded-2xl px-4"
            style={{ backgroundColor: colors.surface, ...shadows.small }}
          >
            <ToggleRow
              title="Session Reminders"
              subtitle="Get notified before sessions"
              value={settings.sessionReminders}
              onValueChange={(value) => setSettings({ ...settings, sessionReminders: value })}
              isLast={!settings.sessionReminders}
            />

            {settings.sessionReminders && (
              <View className="pb-4">
                <Text className="text-sm font-medium mb-3" style={{ color: colors.textSecondary }}>
                  Remind me:
                </Text>
                <View className="flex-row gap-2">
                  {[10, 5, 1].map((minutes) => {
                    const isActive = settings.reminderMinutes.includes(minutes);
                    return (
                      <TouchableOpacity
                        key={minutes}
                        className="px-4 py-2.5 rounded-full"
                        style={{
                          backgroundColor: isActive ? colors.primary : colors.background,
                          borderWidth: 1,
                          borderColor: isActive ? colors.primary : colors.border,
                        }}
                        onPress={() => toggleReminder(minutes)}
                        activeOpacity={0.7}
                      >
                        <Text
                          className="text-sm font-medium"
                          style={{ color: isActive ? '#FFF' : colors.textSecondary }}
                        >
                          {minutes}m
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Activity Notifications */}
        <Animated.View entering={FadeIn.delay(200)}>
          <Text className="text-xs font-semibold uppercase tracking-wide mb-2 mt-6" style={{ color: colors.textTertiary }}>
            Activity
          </Text>

          <View
            className="rounded-2xl px-4"
            style={{ backgroundColor: colors.surface, ...shadows.small }}
          >
            <ToggleRow
              title="New Bookings"
              subtitle="When sessions are booked"
              value={settings.newBookings}
              onValueChange={(value) => setSettings({ ...settings, newBookings: value })}
            />

            <ToggleRow
              title="Payment Requests"
              subtitle="When you receive payment requests"
              value={settings.paymentRequests}
              onValueChange={(value) => setSettings({ ...settings, paymentRequests: value })}
            />

            <ToggleRow
              title="Goal Updates"
              subtitle="When your progress is updated"
              value={settings.goalUpdates}
              onValueChange={(value) => setSettings({ ...settings, goalUpdates: value })}
            />

            <ToggleRow
              title="New Clients"
              subtitle="When trainers add you as a client"
              value={settings.newClients}
              onValueChange={(value) => setSettings({ ...settings, newClients: value })}
              isLast
            />
          </View>
        </Animated.View>
        {/* Save Button */}
        <TouchableOpacity
          className="mt-8 py-4 rounded-2xl items-center"
          style={{ backgroundColor: colors.primary }}
          onPress={handleSave}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text className="text-base font-semibold text-white">Save</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
