import { View, Text, ScrollView, TouchableOpacity, Switch, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-expo';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getColors, Shadows } from '@/constants/colors';
import { StatusBar } from 'expo-status-bar';

export default function NotificationSettingsScreen() {
  const { user } = useUser();
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = getColors(scheme === 'dark');
  const shadows = scheme === 'dark' ? Shadows.dark : Shadows.light;

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

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      
      {/* Header */}
      <View 
        className="px-5 pt-14 pb-5 flex-row items-center justify-between"
        style={{
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center rounded-full"
          style={{ backgroundColor: colors.surface }}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text className="text-xl font-bold" style={{ color: colors.text }}>
          Notifications
        </Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1 px-5 pt-6">
        {/* Session Reminders */}
        <View
          className="rounded-2xl p-5 mb-4"
          style={{ backgroundColor: colors.surface, ...shadows.medium }}
        >
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-1">
              <Text className="text-base font-semibold mb-1" style={{ color: colors.text }}>
                Session Reminders
              </Text>
              <Text className="text-sm" style={{ color: colors.textSecondary }}>
                Get notified before sessions start
              </Text>
            </View>
            <Switch
              value={settings.sessionReminders}
              onValueChange={(value) => setSettings({ ...settings, sessionReminders: value })}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFF"
            />
          </View>

          {settings.sessionReminders && (
            <View className="gap-2">
              <Text className="text-sm font-medium mb-2" style={{ color: colors.text }}>
                Remind me:
              </Text>
              {[10, 5, 1].map((minutes) => (
                <TouchableOpacity
                  key={minutes}
                  className="flex-row items-center justify-between p-3 rounded-xl"
                  style={{ backgroundColor: colors.background }}
                  onPress={() => toggleReminder(minutes)}
                >
                  <Text style={{ color: colors.text }}>
                    {minutes} minute{minutes > 1 ? 's' : ''} before
                  </Text>
                  <View
                    className="w-6 h-6 rounded items-center justify-center"
                    style={{
                      backgroundColor: settings.reminderMinutes.includes(minutes)
                        ? colors.primary
                        : colors.border,
                    }}
                  >
                    {settings.reminderMinutes.includes(minutes) && (
                      <Ionicons name="checkmark" size={16} color="#FFF" />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Other Notifications */}
        <View
          className="rounded-2xl p-5 mb-4"
          style={{ backgroundColor: colors.surface, ...shadows.medium }}
        >
          <Text className="text-base font-semibold mb-4" style={{ color: colors.text }}>
            Activity Notifications
          </Text>

          <View className="gap-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-base mb-1" style={{ color: colors.text }}>
                  New Bookings
                </Text>
                <Text className="text-sm" style={{ color: colors.textSecondary }}>
                  When sessions are booked
                </Text>
              </View>
              <Switch
                value={settings.newBookings}
                onValueChange={(value) => setSettings({ ...settings, newBookings: value })}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFF"
              />
            </View>

            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-base mb-1" style={{ color: colors.text }}>
                  Payment Requests
                </Text>
                <Text className="text-sm" style={{ color: colors.textSecondary }}>
                  When you receive payment requests
                </Text>
              </View>
              <Switch
                value={settings.paymentRequests}
                onValueChange={(value) => setSettings({ ...settings, paymentRequests: value })}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFF"
              />
            </View>

            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-base mb-1" style={{ color: colors.text }}>
                  Goal Updates
                </Text>
                <Text className="text-sm" style={{ color: colors.textSecondary }}>
                  When your progress is updated
                </Text>
              </View>
              <Switch
                value={settings.goalUpdates}
                onValueChange={(value) => setSettings({ ...settings, goalUpdates: value })}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFF"
              />
            </View>

            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-base mb-1" style={{ color: colors.text }}>
                  New Clients
                </Text>
                <Text className="text-sm" style={{ color: colors.textSecondary }}>
                  When trainers add you as a client
                </Text>
              </View>
              <Switch
                value={settings.newClients}
                onValueChange={(value) => setSettings({ ...settings, newClients: value })}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFF"
              />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View
        className="px-5 py-4"
        style={{
          backgroundColor: colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          ...shadows.large,
        }}
      >
        <TouchableOpacity
          className="rounded-2xl py-4 items-center"
          style={{ backgroundColor: colors.primary }}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text className="text-base font-bold text-white">Save Settings</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
