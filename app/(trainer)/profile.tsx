import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
  Switch,
  Alert,
} from 'react-native';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useState, useEffect } from 'react';
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
  const updateProfile = useMutation(api.users.updateUserProfile);
  const profileImageUrl = useQuery(
    api.users.getProfileImageUrl,
    userData?.profileImageId ? { storageId: userData.profileImageId } : 'skip'
  );

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [bio, setBio] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [notifications, setNotifications] = useState(true);
  
  // Change password states
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (userData) {
      setFullName(userData.fullName || '');
      setPhoneNumber(userData.phoneNumber || '');
      setBio(userData.bio || '');
      setSpecialty(userData.specialty || '');
    }
  }, [userData]);

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      await updateProfile({
        clerkId: user.id,
        fullName,
        phoneNumber,
        bio,
        specialty,
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

  const handleChangePassword = async () => {
    if (!user) return;

    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all password fields');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert('Error', 'New password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    setChangingPassword(true);
    try {
      await user.updatePassword({
        currentPassword,
        newPassword,
      });
      
      Alert.alert('Success', 'Password changed successfully');
      setShowChangePassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Error changing password:', error);
      Alert.alert('Error', error.errors?.[0]?.message || 'Failed to change password. Please check your current password.');
    } finally {
      setChangingPassword(false);
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
              {fullName || user.firstName || 'Trainer'}
            </Text>
            <Text className="text-sm mt-1" style={{ color: colors.textSecondary }}>
              {user.emailAddresses[0]?.emailAddress}
            </Text>
            {specialty && (
              <View
                className="px-4 py-2 rounded-full mt-2"
                style={{ backgroundColor: colors.primary }}
              >
                <Text className="text-white text-xs font-semibold">{specialty}</Text>
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
              onPress={() => setEditing(!editing)}
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

            {/* Edit Form */}
            {editing && (
              <View
                className="rounded-2xl p-5 mb-3"
                style={{ backgroundColor: colors.surface, ...shadows.medium }}
              >
                <View className="mb-4">
                  <Text className="text-sm font-semibold mb-2" style={{ color: colors.textSecondary }}>
                    Full Name
                  </Text>
                  <TextInput
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="Enter your name"
                    placeholderTextColor={colors.textTertiary}
                    className="rounded-xl px-4 py-3"
                    style={{ backgroundColor: colors.background, color: colors.text }}
                  />
                </View>

                <View className="mb-4">
                  <Text className="text-sm font-semibold mb-2" style={{ color: colors.textSecondary }}>
                    Specialty
                  </Text>
                  <TextInput
                    value={specialty}
                    onChangeText={setSpecialty}
                    placeholder="e.g., Weightlifting, Yoga, HIIT"
                    placeholderTextColor={colors.textTertiary}
                    className="rounded-xl px-4 py-3"
                    style={{ backgroundColor: colors.background, color: colors.text }}
                  />
                </View>

                <View className="mb-4">
                  <Text className="text-sm font-semibold mb-2" style={{ color: colors.textSecondary }}>
                    Phone Number
                  </Text>
                  <TextInput
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    placeholder="Enter your phone"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="phone-pad"
                    className="rounded-xl px-4 py-3"
                    style={{ backgroundColor: colors.background, color: colors.text }}
                  />
                </View>

                <View className="mb-4">
                  <Text className="text-sm font-semibold mb-2" style={{ color: colors.textSecondary }}>
                    Bio
                  </Text>
                  <TextInput
                    value={bio}
                    onChangeText={setBio}
                    placeholder="Tell clients about your experience and approach"
                    placeholderTextColor={colors.textTertiary}
                    multiline
                    numberOfLines={4}
                    className="rounded-xl px-4 py-3"
                    style={{ backgroundColor: colors.background, color: colors.text, textAlignVertical: 'top' }}
                  />
                </View>

                <TouchableOpacity
                  onPress={handleSave}
                  disabled={saving}
                  className="rounded-xl py-3 items-center"
                  style={{ backgroundColor: colors.primary }}
                >
                  {saving ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text className="text-white font-bold">Save Changes</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
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
                  Alert.alert(
                    'Connect Google Calendar',
                    'To sync your sessions with Google Calendar, please sign out and sign in with Google.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Sign Out', onPress: handleLogout },
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
                    {userData?.googleAccessToken ? 'Connected' : 'Not connected'}
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
              onPress={() => setShowChangePassword(!showChangePassword)}
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

            {/* Change Password Form */}
            {showChangePassword && (
              <View
                className="rounded-2xl p-5 mb-3"
                style={{ backgroundColor: colors.surface, ...shadows.medium }}
              >
                <View className="mb-4">
                  <Text className="text-sm font-semibold mb-2" style={{ color: colors.textSecondary }}>
                    Current Password
                  </Text>
                  <TextInput
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    placeholder="Enter current password"
                    placeholderTextColor={colors.textTertiary}
                    secureTextEntry
                    className="rounded-xl px-4 py-3"
                    style={{ backgroundColor: colors.background, color: colors.text }}
                  />
                </View>

                <View className="mb-4">
                  <Text className="text-sm font-semibold mb-2" style={{ color: colors.textSecondary }}>
                    New Password
                  </Text>
                  <TextInput
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="At least 8 characters"
                    placeholderTextColor={colors.textTertiary}
                    secureTextEntry
                    className="rounded-xl px-4 py-3"
                    style={{ backgroundColor: colors.background, color: colors.text }}
                  />
                </View>

                <View className="mb-4">
                  <Text className="text-sm font-semibold mb-2" style={{ color: colors.textSecondary }}>
                    Confirm New Password
                  </Text>
                  <TextInput
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirm new password"
                    placeholderTextColor={colors.textTertiary}
                    secureTextEntry
                    className="rounded-xl px-4 py-3"
                    style={{ backgroundColor: colors.background, color: colors.text }}
                  />
                </View>

                <TouchableOpacity
                  onPress={handleChangePassword}
                  disabled={changingPassword}
                  className="rounded-xl py-3 items-center"
                  style={{ backgroundColor: colors.primary }}
                >
                  {changingPassword ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text className="text-white font-bold">Update Password</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

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
