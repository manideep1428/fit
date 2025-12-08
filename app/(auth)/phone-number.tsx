import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getColors, Shadows } from '@/constants/colors';
import { showToast } from '@/utils/toast';

export default function PhoneNumberScreen() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const scheme = useColorScheme();
  const colors = getColors(scheme === 'dark');
  const shadows = scheme === 'dark' ? Shadows.dark : Shadows.light;

  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  // Check if user already has a phone number, auto-redirect if so
  useEffect(() => {
    if (isLoaded && user) {
      const existingPhone =
        user.unsafeMetadata?.phoneNumber as string | undefined ||
        user.primaryPhoneNumber?.phoneNumber;

      if (existingPhone) {
        // User already has phone number, skip to role selection
        router.replace('/(auth)/role-selection');
      }
    }
  }, [isLoaded, user, router]);

  const handleContinue = async () => {
    if (!user) return;

    if (!phoneNumber) {
      showToast.error('Please enter your phone number');
      return;
    }

    setLoading(true);
    try {
      // Save phone number to user metadata
      await user.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          phoneNumber: phoneNumber,
        },
      });

      // Navigate to role selection
      showToast.success('Phone number saved successfully');
      router.replace('/(auth)/role-selection');
    } catch (err: any) {
      console.error('Error saving phone number:', err);
      showToast.error(err.message || 'Failed to save phone number');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    router.replace('/(auth)/role-selection');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
      style={{ backgroundColor: colors.background }}
    >
      <StatusBar style="auto" />
      <View className="flex-1 px-6 justify-center">
        {/* Icon */}
        <View className="items-center mb-8">
          <View
            className="w-20 h-20 rounded-full items-center justify-center mb-4"
            style={{ backgroundColor: colors.primary + '20' }}
          >
            <Ionicons name="call" size={40} color={colors.primary} />
          </View>
          <Text className="text-2xl font-bold mb-2" style={{ color: colors.text }}>
            Add Phone Number
          </Text>
          <Text className="text-center text-base" style={{ color: colors.textSecondary }}>
            Help trainers and clients reach you easily
          </Text>
        </View>

        {/* Phone Number Input */}
        <View className="mb-6">
          <Text className="text-sm font-medium mb-2" style={{ color: colors.text }}>
            Phone Number
          </Text>
          <View
            className="flex-row items-center px-4 py-3 rounded-xl"
            style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}
          >
            <Ionicons name="call-outline" size={20} color={colors.textSecondary} />
            <TextInput
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="Enter your phone number"
              placeholderTextColor={colors.textSecondary}
              keyboardType="phone-pad"
              autoFocus
              className="flex-1 ml-3 text-base"
              style={{ color: colors.text }}
            />
          </View>
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          onPress={handleContinue}
          disabled={loading}
          className="py-4 rounded-xl mb-3"
          style={{ backgroundColor: colors.primary, ...shadows.medium }}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-center text-lg font-semibold">
              Continue
            </Text>
          )}
        </TouchableOpacity>

        {/* Skip Button */}
        <TouchableOpacity onPress={handleSkip} className="py-3 items-center">
          <Text className="text-sm" style={{ color: colors.textSecondary }}>
            Skip for now
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
