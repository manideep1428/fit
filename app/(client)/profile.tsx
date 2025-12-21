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
import { AnimatedCard } from '@/components/AnimatedCard';
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

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      await updateProfile({
        clerkId: user.id,
        fullName,
        phoneNumber,
        bio,
      });
      setEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout',
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

  const handlePickImage = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to change your profile picture.');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets[0]) return;

      setUploadingImage(true);

      // Get upload URL from Convex
      const uploadUrl = await generateUploadUrl();

      // Fetch the image and upload
      const response = await fetch(result.assets[0].uri);
      const blob = await response.blob();

      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': blob.type },
        body: blob,
      });

      const { storageId } = await uploadResponse.json();

      // Update user profile with new image
      await updateProfile({
        clerkId: user!.id,
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

  // Menu Item Component
  const MenuItem = ({
    icon,
    title,
    onPress,
    rightElement,
    danger = false,
    delay = 0,
  }: {
    icon: string;
    title: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
    danger?: boolean;
    delay?: number;
  }) => (
    <AnimatedCard
      delay={delay}
      onPress={onPress}
      style={{ marginBottom: 10 }}
      elevation="small"
      borderRadius="xlarge"
    >
      <View className="flex-row items-center">
        <View
          className="w-11 h-11 rounded-xl items-center justify-center mr-4"
          style={{ backgroundColor: danger ? 'rgba(239, 68, 68, 0.1)' : `${colors.primary}12` }}
        >
          <Ionicons name={icon as any} size={20} color={danger ? '#EF4444' : colors.primary} />
        </View>
        <Text className="font-semibold flex-1 text-base" style={{ color: danger ? '#EF4444' : colors.text }}>
          {title}
        </Text>
        {rightElement || (onPress && <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />)}
      </View>
    </AnimatedCard>
  );

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header with Gradient */}
        <LinearGradient
          colors={isDark ? ['#1F1F28', colors.background] : ['#F8F6F2', colors.background]}
          style={{ paddingTop: 56, paddingBottom: 24 }}
        >
          <View className="px-6 mb-6">
            <Text className="text-3xl font-bold" style={{ color: colors.text }}>
              Profile
            </Text>
          </View>

          {/* Profile Image */}
          <View className="items-center">
            <View className="relative">
              {/* Outer glow ring */}
              <View
                className="absolute -inset-1 rounded-full"
                style={{
                  backgroundColor: `${colors.primary}20`,
                }}
              />
              <View
                className="w-28 h-28 rounded-full overflow-hidden items-center justify-center"
                style={{
                  backgroundColor: colors.primary,
                  borderWidth: 4,
                  borderColor: colors.surface,
                  ...shadows.large
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
              <TouchableOpacity
                className="absolute bottom-0 right-0 w-10 h-10 rounded-xl items-center justify-center"
                style={{
                  backgroundColor: colors.primary,
                  borderWidth: 3,
                  borderColor: colors.background,
                  ...shadows.medium
                }}
                activeOpacity={0.8}
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
            <Text className="text-xl font-bold mt-4" style={{ color: colors.text }}>
              {userData?.fullName || user.firstName || 'User'}
            </Text>
            <Text className="text-sm mt-1" style={{ color: colors.textSecondary }}>
              {user.emailAddresses[0]?.emailAddress}
            </Text>
          </View>
        </LinearGradient>

        <View className="px-6 pt-2">
          {/* Profile Section */}
          <View className="mb-6">
            <Text className="text-xs font-bold mb-3 uppercase tracking-widest" style={{ color: colors.textTertiary }}>
              Profile
            </Text>

            <MenuItem
              icon="person-outline"
              title="Edit Profile"
              onPress={() => router.push('/edit-profile' as any)}
              delay={300}
            />
          </View>

          {/* Activity Section */}
          <View className="mb-6">
            <Text className="text-xs font-bold mb-3 uppercase tracking-widest" style={{ color: colors.textTertiary }}>
              Activity
            </Text>

            <MenuItem
              icon="time-outline"
              title="Session History"
              onPress={() => router.push('/(client)/session-history')}
              delay={325}
            />
          </View>

          {/* Preferences Section */}
          <View className="mb-6">
            <Text className="text-xs font-bold mb-3 uppercase tracking-widest" style={{ color: colors.textTertiary }}>
              Preferences
            </Text>

            <AnimatedCard
              delay={350}
              style={{ marginBottom: 10 }}
              elevation="small"
              borderRadius="xlarge"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View
                    className="w-11 h-11 rounded-xl items-center justify-center mr-4"
                    style={{ backgroundColor: `${colors.primary}12` }}
                  >
                    <Ionicons name="moon-outline" size={20} color={colors.primary} />
                  </View>
                  <View>
                    <Text className="font-semibold text-base" style={{ color: colors.text }}>
                      Dark Mode
                    </Text>
                    <Text className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>
                      {isDark ? 'Currently enabled' : 'Currently disabled'}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={isDark}
                  onValueChange={toggleDarkMode}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#FFF"
                />
              </View>
            </AnimatedCard>

            <AnimatedCard
              delay={400}
              style={{ marginBottom: 10 }}
              elevation="small"
              borderRadius="xlarge"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View
                    className="w-11 h-11 rounded-xl items-center justify-center mr-4"
                    style={{ backgroundColor: `${colors.primary}12` }}
                  >
                    <Ionicons name="notifications-outline" size={20} color={colors.primary} />
                  </View>
                  <View>
                    <Text className="font-semibold text-base" style={{ color: colors.text }}>
                      Notifications
                    </Text>
                    <Text className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>
                      {notifications ? 'Push notifications on' : 'Push notifications off'}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={notifications}
                  onValueChange={setNotifications}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#FFF"
                />
              </View>
            </AnimatedCard>
          </View>

          {/* Integrations Section */}
          <View className="mb-6">
            <Text className="text-xs font-bold mb-3 uppercase tracking-widest" style={{ color: colors.textTertiary }}>
              Integrations
            </Text>

            <MenuItem
              icon="calendar-outline"
              title={userData?.googleAccessToken ? "Google Calendar Connected" : "Connect Google Calendar"}
              onPress={() => {
                if (!userData?.googleAccessToken) {
                  router.push('/(client)/bookings' as any);
                } else {
                  Alert.alert(
                    'Google Calendar Connected',
                    'Your Google Calendar is already connected.',
                    [{ text: 'OK' }]
                  );
                }
              }}
              rightElement={
                userData?.googleAccessToken ? (
                  <View className="flex-row items-center">
                    <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                  </View>
                ) : undefined
              }
              delay={425}
            />
          </View>

          {/* Account Section */}
          <View className="mb-6">
            <Text className="text-xs font-bold mb-3 uppercase tracking-widest" style={{ color: colors.textTertiary }}>
              Account
            </Text>

            <MenuItem
              icon="lock-closed-outline"
              title="Change Password"
              onPress={() => router.push('/change-password' as any)}
              delay={450}
            />

            <MenuItem
              icon="log-out-outline"
              title="Logout"
              onPress={handleLogout}
              danger={true}
              delay={500}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
