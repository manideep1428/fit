import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useUser } from '@clerk/clerk-expo';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getColors, Shadows } from '@/constants/colors';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';

const SPECIALTIES = [
  'Strength Training',
  'HIIT',
  'Yoga',
  'Pilates',
  'CrossFit',
  'Boxing',
  'Cardio',
  'Weight Loss',
  'Bodybuilding',
  'Functional Training',
  'Sports Training',
  'Rehabilitation',
];

export default function TrainerSetupScreen() {
  const { user } = useUser();
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = getColors(scheme === 'dark');
  const shadows = scheme === 'dark' ? Shadows.dark : Shadows.light;

  const updateUserProfile = useMutation(api.users.updateUserProfile);
  const generateUploadUrl = useMutation(api.users.generateUploadUrl);

  const [profileImage, setProfileImage] = useState<string | null>(user?.imageUrl || null);
  const [hasChangedImage, setHasChangedImage] = useState(false);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [experience, setExperience] = useState('');
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      alert('Sorry, we need camera roll permissions to upload a profile picture!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setProfileImage(result.assets[0].uri);
      setHasChangedImage(true);
    }
  };

  const uploadImage = async (uri: string) => {
    try {
      // Get upload URL from Convex
      const uploadUrl = await generateUploadUrl();
      
      // Fetch the image and convert to blob
      const response = await fetch(uri);
      const blob = await response.blob();
      
      // Upload to Convex storage
      const result = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': blob.type },
        body: blob,
      });
      
      const { storageId } = await result.json();
      return storageId;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const handleSubmit = async () => {
    if (!username.trim() || !specialty || !user?.id) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      let profileImageId = undefined;
      
      // Upload image only if user changed it
      if (hasChangedImage && profileImage) {
        profileImageId = await uploadImage(profileImage);
      }

      // Update Convex user profile
      await updateUserProfile({
        clerkId: user.id,
        fullName: user.fullName || undefined,
        username: username.trim(),
        phoneNumber: user.primaryPhoneNumber?.phoneNumber || undefined,
        bio: bio.trim() || undefined,
        specialty: specialty,
        profileImageId: profileImageId,
      });

      // Update Clerk metadata to store additional info
      await user.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          username: username.trim(),
          specialty: specialty,
          experience: experience.trim() || undefined,
          profileCompleted: true,
        },
      });

      router.replace('/(trainer)');
    } catch (error) {
      console.error('Error setting up profile:', error);
      alert('Failed to setup profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      className="flex-1" 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ backgroundColor: colors.background }}
    >
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      
      {/* Header */}
      <View 
        className="px-5 pt-14 pb-5"
        style={{
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <Text className="text-2xl font-bold text-center" style={{ color: colors.text }}>
          Complete Your Profile
        </Text>
        <Text className="text-sm text-center mt-2" style={{ color: colors.textSecondary }}>
          Help clients find and connect with you
        </Text>
      </View>

      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 30, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Photo */}
        <View className="items-center mb-8">
          <TouchableOpacity
            onPress={pickImage}
            className="relative"
          >
            <View
              className="w-32 h-32 rounded-full items-center justify-center overflow-hidden"
              style={{ backgroundColor: colors.surface, ...shadows.large }}
            >
              {profileImage ? (
                <Image
                  source={{ uri: profileImage }}
                  className="w-full h-full"
                />
              ) : (
                <Ionicons name="person" size={60} color={colors.textTertiary} />
              )}
            </View>
            <View
              className="absolute bottom-0 right-0 w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.primary, ...shadows.medium }}
            >
              <Ionicons name="camera" size={20} color="#FFF" />
            </View>
          </TouchableOpacity>
          <Text className="text-sm mt-3" style={{ color: colors.textSecondary }}>
            Tap to upload photo
          </Text>
        </View>

        {/* Username */}
        <View className="mb-6">
          <Text className="text-sm font-semibold mb-2" style={{ color: colors.text }}>
            Username *
          </Text>
          <View className="relative">
            <View 
              className="absolute left-4 top-4 z-10"
            >
              <Ionicons name="at" size={20} color={colors.textSecondary} />
            </View>
            <TextInput
              className="rounded-2xl py-4 pl-12 pr-4 text-base"
              style={{
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                color: colors.text,
                ...shadows.small,
              }}
              placeholder="your_username"
              placeholderTextColor={colors.textSecondary}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Specialty */}
        <View className="mb-6">
          <Text className="text-sm font-semibold mb-2" style={{ color: colors.text }}>
            Specialty *
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {SPECIALTIES.map((spec) => (
              <TouchableOpacity
                key={spec}
                onPress={() => setSpecialty(spec)}
                className="px-4 py-2.5 rounded-full"
                style={{
                  backgroundColor: specialty === spec ? colors.primary : colors.surface,
                  borderWidth: 1,
                  borderColor: specialty === spec ? colors.primary : colors.border,
                }}
              >
                <Text
                  className="text-sm font-medium"
                  style={{
                    color: specialty === spec ? '#FFF' : colors.text,
                  }}
                >
                  {spec}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Experience */}
        <View className="mb-6">
          <Text className="text-sm font-semibold mb-2" style={{ color: colors.text }}>
            Years of Experience
          </Text>
          <View className="relative">
            <View 
              className="absolute left-4 top-4 z-10"
            >
              <Ionicons name="trophy" size={20} color={colors.textSecondary} />
            </View>
            <TextInput
              className="rounded-2xl py-4 pl-12 pr-4 text-base"
              style={{
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                color: colors.text,
                ...shadows.small,
              }}
              placeholder="e.g., 5+ years"
              placeholderTextColor={colors.textSecondary}
              value={experience}
              onChangeText={setExperience}
            />
          </View>
        </View>

        {/* Bio */}
        <View className="mb-6">
          <Text className="text-sm font-semibold mb-2" style={{ color: colors.text }}>
            About Me
          </Text>
          <TextInput
            className="rounded-2xl px-4 py-4 text-base"
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              color: colors.text,
              minHeight: 120,
              textAlignVertical: 'top',
              ...shadows.small,
            }}
            placeholder="Tell clients about your training philosophy, certifications, and what makes you unique..."
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={5}
            value={bio}
            onChangeText={setBio}
          />
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View
        className="absolute bottom-0 left-0 right-0 px-5 py-4"
        style={{
          backgroundColor: colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          ...shadows.large,
        }}
      >
        <TouchableOpacity
          className="rounded-2xl py-4 items-center"
          style={{ 
            backgroundColor: colors.primary,
            opacity: (!username.trim() || !specialty || loading) ? 0.5 : 1,
          }}
          onPress={handleSubmit}
          disabled={loading || !username.trim() || !specialty}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text className="text-base font-bold text-white">Complete Setup</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
