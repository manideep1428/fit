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
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getColors, Shadows } from '@/constants/colors';
import { useRouter } from 'expo-router';
import { useDarkMode } from '@/hooks/useDarkMode';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';

export default function ProfileScreen() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = getColors(scheme === 'dark');
  const shadows = scheme === 'dark' ? Shadows.dark : Shadows.light;
  const { isDark, toggleDarkMode } = useDarkMode();

  const userData = useQuery(
    api.users.getUserByClerkId,
    user?.id ? { clerkId: user.id } : 'skip'
  );
  const updateProfile = useMutation(api.users.updateUserProfile);
  const generateUploadUrl = useMutation(api.users.generateUploadUrl);
  const profileImageUrl = useQuery(
    api.users.getProfileImageUrl,
    userData?.profileImageId ? { storageId: userData.profileImageId } : 'skip'
  );

  const [uploadingImage, setUploadingImage] = useState(false);
  const [notifications, setNotifications] = useState(true);

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/welcome');
        },
      },
    ]);
  };

  const handlePickImage = async () => {
    if (!user?.id) return;

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission needed',
          'Please grant camera roll permissions to change your profile picture.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images' as any,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets[0]) return;

      setUploadingImage(true);

      const uploadUrl = await generateUploadUrl();
      const response = await fetch(result.assets[0].uri);
      const blob = await response.blob();

      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': blob.type },
        body: blob,
      });

      const { storageId } = await uploadResponse.json();

      await updateProfile({
        clerkId: user.id,
        profileImageId: storageId,
      });

      Alert.alert('Success', 'Profile picture updated!');
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
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
      {/* Gradient Background Overlay */}
      <LinearGradient
        colors={[`${colors.primary}33`, `${colors.primary}0D`, 'transparent']}
        className="absolute top-0 left-0 right-0 h-80"
        pointerEvents="none"
      />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-4 pt-16 pb-4">
          <Text className="text-lg font-bold text-center" style={{ color: colors.text }}>
            Profile
          </Text>
        </View>

        {/* Profile Header */}
        <View className="items-center mt-2 mb-8">
          <View className="relative">
            {/* Glow Ring */}
            <View
              className="absolute -inset-1 rounded-full opacity-40"
              style={{
                backgroundColor: colors.primary,
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.6,
                shadowRadius: 20,
              }}
            />

            {/* Avatar */}
            <View
              className="w-32 h-32 rounded-full overflow-hidden items-center justify-center"
              style={{
                backgroundColor: colors.primary,
                borderWidth: 4,
                borderColor: colors.background,
              }}
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

            {/* Camera Button */}
            <TouchableOpacity
              className="absolute bottom-1 right-1 w-10 h-10 rounded-full items-center justify-center"
              style={{
                backgroundColor: colors.primary,
                borderWidth: 2,
                borderColor: colors.background,
                ...shadows.medium,
              }}
              onPress={handlePickImage}
              disabled={uploadingImage}
            >
              {uploadingImage ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Ionicons name="camera" size={18} color="#FFF" />
              )}
            </TouchableOpacity>
          </View>

          <View className="mt-4 items-center">
            <Text className="text-2xl font-bold" style={{ color: colors.text }}>
              {userData?.fullName || user.firstName || 'User'}
            </Text>
            <Text className="text-sm font-medium mt-1" style={{ color: colors.textSecondary }}>
              {user.emailAddresses[0]?.emailAddress}
            </Text>
          </View>
        </View>

        {/* Content Sections */}
        <View className="px-4 pb-8">
          {/* PROFILE Section */}
          <View className="mb-6">
            <Text
              className="text-xs font-bold uppercase tracking-widest mb-3 ml-2"
              style={{ color: colors.textTertiary }}
            >
              Profile
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/edit-profile-form' as any)}
              className="rounded-xl p-4 flex-row items-center justify-between"
              style={{
                backgroundColor: colors.surface,
                ...shadows.small,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <View className="flex-row items-center gap-4">
                <View
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{ backgroundColor: `${colors.primary}1A` }}
                >
                  <Ionicons name="create-outline" size={20} color={colors.primary} />
                </View>
                <Text className="font-medium text-base" style={{ color: colors.text }}>
                  Edit Profile
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>

          {/* ACTIVITY Section */}
          <View className="mb-6">
            <Text
              className="text-xs font-bold uppercase tracking-widest mb-3 ml-2"
              style={{ color: colors.textTertiary }}
            >
              Activity
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(client)/session-history')}
              className="rounded-xl p-4 flex-row items-center justify-between"
              style={{
                backgroundColor: colors.surface,
                ...shadows.small,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <View className="flex-row items-center gap-4">
                <View
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{ backgroundColor: '#F9731620' }}
                >
                  <Ionicons name="time-outline" size={20} color="#F97316" />
                </View>
                <Text className="font-medium text-base" style={{ color: colors.text }}>
                  Session History
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>

          {/* PREFERENCES Section */}
          <View className="mb-6">
            <Text
              className="text-xs font-bold uppercase tracking-widest mb-3 ml-2"
              style={{ color: colors.textTertiary }}
            >
              Preferences
            </Text>
            <View className="gap-2">
              {/* Dark Mode */}
              <View
                className="rounded-xl p-4 flex-row items-center justify-between"
                style={{
                  backgroundColor: colors.surface,
                  ...shadows.small,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <View className="flex-row items-center gap-4">
                  <View
                    className="w-10 h-10 rounded-full items-center justify-center"
                    style={{ backgroundColor: '#A855F720' }}
                  >
                    <Ionicons name="moon-outline" size={20} color="#A855F7" />
                  </View>
                  <Text className="font-medium text-base" style={{ color: colors.text }}>
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
                className="rounded-xl p-4 flex-row items-center justify-between"
                style={{
                  backgroundColor: colors.surface,
                  ...shadows.small,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <View className="flex-row items-center gap-4">
                  <View
                    className="w-10 h-10 rounded-full items-center justify-center"
                    style={{ backgroundColor: '#EF444420' }}
                  >
                    <Ionicons name="notifications-outline" size={20} color="#EF4444" />
                  </View>
                  <Text className="font-medium text-base" style={{ color: colors.text }}>
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
          </View>

          {/* INTEGRATIONS Section */}
          <View className="mb-6">
            <Text
              className="text-xs font-bold uppercase tracking-widest mb-3 ml-2"
              style={{ color: colors.textTertiary }}
            >
              Integrations
            </Text>
            <TouchableOpacity
              onPress={() => {
                if (!userData?.googleAccessToken) {
                  router.push('/(client)/bookings' as any);
                } else {
                  Alert.alert('Google Calendar Connected', 'Your Google Calendar is already connected.', [
                    { text: 'OK' },
                  ]);
                }
              }}
              className="rounded-xl p-4 flex-row items-center justify-between"
              style={{
                backgroundColor: colors.surface,
                ...shadows.small,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <View className="flex-row items-center gap-4">
                <View
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{ backgroundColor: '#10B98120' }}
                >
                  <Ionicons name="calendar-outline" size={20} color="#10B981" />
                </View>
                <Text className="font-medium text-base" style={{ color: colors.text }}>
                  Google Calendar
                </Text>
              </View>
              {userData?.googleAccessToken ? (
                <Text className="text-sm font-medium" style={{ color: colors.primary }}>
                  Connected
                </Text>
              ) : (
                <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
              )}
            </TouchableOpacity>
          </View>

          {/* ACCOUNT Section */}
          <View className="mb-6">
            <Text
              className="text-xs font-bold uppercase tracking-widest mb-3 ml-2"
              style={{ color: colors.textTertiary }}
            >
              Account
            </Text>
            <View className="gap-2">
              {/* Change Password */}
              <TouchableOpacity
                onPress={() => router.push('/change-password' as any)}
                className="rounded-xl p-4 flex-row items-center justify-between"
                style={{
                  backgroundColor: colors.surface,
                  ...shadows.small,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <View className="flex-row items-center gap-4">
                  <View
                    className="w-10 h-10 rounded-full items-center justify-center"
                    style={{ backgroundColor: `${colors.textTertiary}20` }}
                  >
                    <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />
                  </View>
                  <Text className="font-medium text-base" style={{ color: colors.text }}>
                    Change Password
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
              </TouchableOpacity>

              {/* Logout */}
              <TouchableOpacity
                onPress={handleLogout}
                className="rounded-xl p-4 flex-row items-center justify-between"
                style={{
                  backgroundColor: colors.surface,
                  ...shadows.small,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <View className="flex-row items-center gap-4">
                  <View
                    className="w-10 h-10 rounded-full items-center justify-center"
                    style={{ backgroundColor: '#EF444420' }}
                  >
                    <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                  </View>
                  <Text className="font-medium text-base" style={{ color: '#EF4444' }}>
                    Logout
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Version Info */}
          <View className="py-6 items-center">
            <Text className="text-xs" style={{ color: colors.textTertiary }}>
              App Version 2.4.0 (Build 302)
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
