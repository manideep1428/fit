import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getColors, Shadows } from '@/constants/colors';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { showToast } from '@/utils/toast';

export default function EditProfileScreen() {
  const { user } = useUser();
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = getColors(scheme === 'dark');
  const shadows = scheme === 'dark' ? Shadows.dark : Shadows.light;

  const userData = useQuery(
    api.users.getUserByClerkId,
    user?.id ? { clerkId: user.id } : 'skip'
  );
  const updateProfile = useMutation(api.users.updateUserProfile);
  const profileImageUrl = useQuery(
    api.users.getProfileImageUrl,
    userData?.profileImageId ? { storageId: userData.profileImageId } : 'skip'
  );

  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [bio, setBio] = useState('');
  const [specialty, setSpecialty] = useState('');

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
      showToast.success('Profile updated successfully');
      router.back();
    } catch (error) {
      console.error('Error updating profile:', error);
      showToast.error('Failed to update profile');
    } finally {
      setSaving(false);
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
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />

      {/* Header */}
      <View className="px-4 pt-16 pb-4 flex-row items-center justify-between border-b" style={{ borderBottomColor: colors.border }}>
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center"
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text className="text-xl font-semibold flex-1 text-center" style={{ color: colors.text }}>
          Edit Profile
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          className="w-10 h-10 items-center justify-center"
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons name="checkmark" size={24} color={colors.primary} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4 py-6" showsVerticalScrollIndicator={false}>
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
        </View>

        {/* Full Name */}
        <View className="mb-4">
          <Text className="text-sm font-semibold mb-2" style={{ color: colors.text }}>
            Full Name
          </Text>
          <View
            className="flex-row items-center px-4 py-3.5 rounded-xl"
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Ionicons name="person-outline" size={20} color={colors.textSecondary} />
            <TextInput
              className="flex-1 ml-3 text-base"
              style={{ color: colors.text }}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Enter your name"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        </View>

        {/* Specialty */}
        <View className="mb-4">
          <Text className="text-sm font-semibold mb-2" style={{ color: colors.text }}>
            Specialty
          </Text>
          <View
            className="flex-row items-center px-4 py-3.5 rounded-xl"
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Ionicons name="barbell-outline" size={20} color={colors.textSecondary} />
            <TextInput
              className="flex-1 ml-3 text-base"
              style={{ color: colors.text }}
              value={specialty}
              onChangeText={setSpecialty}
              placeholder="e.g., Weightlifting, Yoga, HIIT"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        </View>

        {/* Phone Number */}
        <View className="mb-4">
          <Text className="text-sm font-semibold mb-2" style={{ color: colors.text }}>
            Phone Number
          </Text>
          <View
            className="flex-row items-center px-4 py-3.5 rounded-xl"
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Ionicons name="call-outline" size={20} color={colors.textSecondary} />
            <TextInput
              className="flex-1 ml-3 text-base"
              style={{ color: colors.text }}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="Enter your phone"
              placeholderTextColor={colors.textSecondary}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Bio */}
        <View className="mb-6">
          <Text className="text-sm font-semibold mb-2" style={{ color: colors.text }}>
            Bio
          </Text>
          <View
            className="px-4 py-3.5 rounded-xl"
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <TextInput
              className="text-base min-h-[100px]"
              style={{ color: colors.text, textAlignVertical: 'top' }}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell clients about your experience and approach"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={4}
            />
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          className="rounded-xl py-4 items-center mb-6"
          style={{ backgroundColor: colors.primary, ...shadows.medium }}
        >
          {saving ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text className="text-white font-bold text-base">Save Changes</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
