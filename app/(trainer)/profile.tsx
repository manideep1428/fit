import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Switch,
  Alert,
} from 'react-native';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getColors, Shadows } from '@/constants/colors';
import { useRouter } from 'expo-router';
import { useDarkMode } from '@/hooks/useDarkMode';

export default function ProfileScreen() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = getColors(scheme === 'dark');
  const shadows = scheme === 'dark' ? Shadows.dark : Shadows.light;
  const insets = useSafeAreaInsets();
  const { isDark, toggleDarkMode } = useDarkMode();

  const userData = useQuery(
    api.users.getUserByClerkId,
    user?.id ? { clerkId: user.id } : 'skip'
  );
  const profileImageUrl = useQuery(
    api.users.getProfileImageUrl,
    userData?.profileImageId ? { storageId: userData.profileImageId } : 'skip'
  );

  const [notifications, setNotifications] = useState(true);

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/(auth)/welcome');
          },
        },
      ]
    );
  };

  if (!user) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScrollView className="flex-1">
        <View className="px-6 pb-6" style={{ paddingTop: insets.top + 12 }}>
          {/* Header */}
          <View className="mb-6">
            <Text className="text-2xl font-bold" style={{ color: colors.text }}>
              Account Settings
            </Text>
          </View>

          {/* Profile Image */}
          <View className="items-center mb-8">
            <View className="relative">
              <View
                className="w-28 h-28 rounded-full overflow-hidden items-center justify-center"
                style={{ backgroundColor: colors.primary, ...shadows.large }}
              >
                {profileImageUrl ? (
                  <Image source={{ uri: profileImageUrl }} className="w-full h-full" />
                ) : user.imageUrl ? (
                  <Image source={{ uri: user.imageUrl }} className="w-full h-full" />
                ) : (
                  <Text className="text-white text-4xl font-bold">
                    {user.firstName?.[0] || user.emailAddresses[0]?.emailAddress[0].toUpperCase()}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                className="absolute bottom-0 right-0 w-10 h-10 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.primary, ...shadows.medium }}
              >
                <Ionicons name="camera" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
            <Text className="text-xl font-bold mt-4" style={{ color: colors.text }}>
              {userData?.fullName || user.firstName || 'Trainer'}
            </Text>
            <Text className="text-sm mt-1" style={{ color: colors.textSecondary }}>
              {user.emailAddresses[0]?.emailAddress}
            </Text>
            {userData?.specialty && (
              <View
                className="px-4 py-2 rounded-full mt-2"
                style={{ backgroundColor: colors.primary }}
              >
                <Text className="text-white text-xs font-semibold">{userData.specialty}</Text>
              </View>
            )}
          </View>

          {/* Profile Section */}
          <View className="mb-6">
            <Text className="text-xs font-semibold mb-3 uppercase" style={{ color: colors.textTertiary }}>
              Profile
            </Text>

            {/* Availability */}
            <TouchableOpacity
              onPress={() => router.push('/(trainer)/availability' as any)}
              className="rounded-2xl p-5 mb-3 flex-row items-center justify-between"
              style={{ backgroundColor: colors.surface, ...shadows.small }}
            >
              <View className="flex-row items-center flex-1">
                <View
                  className="w-10 h-10 rounded-full items-center justify-center mr-3"
                  style={{ backgroundColor: colors.background }}
                >
                  <Ionicons name="time-outline" size={20} color={colors.text} />
                </View>
                <Text className="font-semibold" style={{ color: colors.text }}>
                  Availability
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </TouchableOpacity>

            {/* Edit Profile */}
            <TouchableOpacity
              onPress={() => router.push('/edit-profile' as any)}
              className="rounded-2xl p-5 mb-3 flex-row items-center justify-between"
              style={{ backgroundColor: colors.surface, ...shadows.small }}
            >
              <View className="flex-row items-center flex-1">
                <View
                  className="w-10 h-10 rounded-full items-center justify-center mr-3"
                  style={{ backgroundColor: colors.background }}
                >
                  <Ionicons name="person-outline" size={20} color={colors.text} />
                </View>
                <Text className="font-semibold" style={{ color: colors.text }}>
                  Edit Profile
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>

          {/* Preferences Section */}
          <View className="mb-6">
            <Text className="text-xs font-semibold mb-3 uppercase" style={{ color: colors.textTertiary }}>
              Preferences
            </Text>

            {/* Dark Mode */}
            <View
              className="rounded-2xl p-5 mb-3 flex-row items-center justify-between"
              style={{ backgroundColor: colors.surface, ...shadows.small }}
            >
              <View className="flex-row items-center flex-1">
                <View
                  className="w-10 h-10 rounded-full items-center justify-center mr-3"
                  style={{ backgroundColor: colors.background }}
                >
                  <Ionicons name="moon-outline" size={20} color={colors.text} />
                </View>
                <Text className="font-semibold" style={{ color: colors.text }}>
                  Dark Mode
                </Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleDarkMode}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFF"
              />
            </View>

            {/* Notifications */}
            <View
              className="rounded-2xl p-5 mb-3 flex-row items-center justify-between"
              style={{ backgroundColor: colors.surface, ...shadows.small }}
            >
              <View className="flex-row items-center flex-1">
                <View
                  className="w-10 h-10 rounded-full items-center justify-center mr-3"
                  style={{ backgroundColor: colors.background }}
                >
                  <Ionicons name="notifications-outline" size={20} color={colors.text} />
                </View>
                <Text className="font-semibold" style={{ color: colors.text }}>
                  Notifications
                </Text>
              </View>
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFF"
              />
            </View>
          </View>

          {/* Integrations Section */}
          <View className="mb-6">
            <Text className="text-xs font-semibold mb-3 uppercase" style={{ color: colors.textTertiary }}>
              Integrations
            </Text>

            {/* Google Calendar */}
            <TouchableOpacity
              onPress={() => {
                if (!userData?.googleAccessToken) {
                  // Navigate to bookings page where they can connect
                  router.push('/(trainer)/bookings' as any);
                } else {
                  Alert.alert(
                    'Google Calendar Connected',
                    'Your Google Calendar is already connected. You can manage your calendar sync from the bookings page.',
                    [
                      { text: 'OK', style: 'default' },
                      { text: 'Go to Bookings', onPress: () => router.push('/(trainer)/bookings' as any) },
                    ]
                  );
                }
              }}
              className="rounded-2xl p-5 mb-3 flex-row items-center justify-between"
              style={{ backgroundColor: colors.surface, ...shadows.small }}
            >
              <View className="flex-row items-center flex-1">
                <View
                  className="w-10 h-10 rounded-full items-center justify-center mr-3"
                  style={{ backgroundColor: colors.background }}
                >
                  <Ionicons name="calendar-outline" size={20} color={colors.text} />
                </View>
                <View className="flex-1">
                  <Text className="font-semibold" style={{ color: colors.text }}>
                    Google Calendar
                  </Text>
                  <Text className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>
                    {userData?.googleAccessToken ? 'Connected - Tap to manage' : 'Tap to connect'}
                  </Text>
                </View>
              </View>
              {userData?.googleAccessToken ? (
                <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
              ) : (
                <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
              )}
            </TouchableOpacity>
          </View>

          {/* Account Section */}
          <View className="mb-6">
            <Text className="text-xs font-semibold mb-3 uppercase" style={{ color: colors.textTertiary }}>
              Account
            </Text>

            {/* Change Password */}
            <TouchableOpacity
              onPress={() => router.push('/change-password' as any)}
              className="rounded-2xl p-5 mb-3 flex-row items-center justify-between"
              style={{ backgroundColor: colors.surface, ...shadows.small }}
            >
              <View className="flex-row items-center flex-1">
                <View
                  className="w-10 h-10 rounded-full items-center justify-center mr-3"
                  style={{ backgroundColor: colors.background }}
                >
                  <Ionicons name="lock-closed-outline" size={20} color={colors.text} />
                </View>
                <Text className="font-semibold" style={{ color: colors.text }}>
                  Change Password
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </TouchableOpacity>

            {/* Logout */}
            <TouchableOpacity
              onPress={handleLogout}
              className="rounded-2xl p-5 flex-row items-center justify-between"
              style={{ backgroundColor: colors.surface, ...shadows.small }}
            >
              <View className="flex-row items-center flex-1">
                <View
                  className="w-10 h-10 rounded-full items-center justify-center mr-3"
                  style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                >
                  <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                </View>
                <Text className="font-semibold" style={{ color: '#EF4444' }}>
                  Logout
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
