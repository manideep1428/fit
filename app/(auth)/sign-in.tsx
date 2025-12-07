import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSignIn, useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import GoogleOAuthButton from '@/components/GoogleOAuthButton';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getColors, Shadows } from '@/constants/colors';
import { showToast } from '@/utils/toast';

export default function SignInScreen() {
  const router = useRouter();
  const { signIn, setActive, isLoaded } = useSignIn();
  const { getToken, userId } = useAuth();
  const scheme = useColorScheme();
  const colors = getColors(scheme === 'dark');
  const shadows = scheme === 'dark' ? Shadows.dark : Shadows.light;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [needsCalendarConnect, setNeedsCalendarConnect] = useState(false);

  const saveGoogleTokens = useMutation(api.users.saveGoogleTokens);

  const handleSignIn = async () => {
    if (!isLoaded || !signIn) return;

    if (!email || !password) {
      showToast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        
        // Check if user has Google Calendar token
        setNeedsCalendarConnect(true);
      }
    } catch (err: any) {
      console.error('Sign in error:', err);
      showToast.error(err.errors?.[0]?.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleCalendarConnect = async () => {
    if (!userId) return;

    try {
      const token = await getToken({ template: 'integration_google' });
      
      if (token) {
        await saveGoogleTokens({
          clerkId: userId,
          accessToken: token,
        });
      }
      
      // Navigate to role selection or main app
      router.replace('/(auth)/role-selection');
    } catch (error) {
      console.error('Error checking calendar token:', error);
      // Continue anyway
      router.replace('/(auth)/role-selection');
    }
  };

  const handleSkipCalendar = () => {
    router.replace('/(auth)/role-selection');
  };

  if (needsCalendarConnect) {
    return (
      <View className="flex-1 px-6 justify-center" style={{ backgroundColor: colors.background }}>
        <StatusBar style="auto" />
        
        <View className="p-6 rounded-2xl" style={{ backgroundColor: colors.surface, ...shadows.medium }}>
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
            <Text className="text-center text-sm" style={{ color: colors.textSecondary }}>
              Sync your training sessions to Google Calendar
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleCalendarConnect}
            className="rounded-xl py-4 items-center mb-3"
            style={{ backgroundColor: colors.primary }}
          >
            <View className="flex-row items-center">
              <Ionicons name="logo-google" size={20} color="#FFF" />
              <Text className="text-white font-semibold text-base ml-2">
                Connect Calendar
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSkipCalendar} className="py-3 items-center">
            <Text className="text-sm" style={{ color: colors.textSecondary }}>
              Skip for now
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
      style={{ backgroundColor: colors.background }}
    >
      <StatusBar style="auto" />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 px-6 pt-16 pb-8">
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => router.back()}
            className="mb-8"
            style={{ alignSelf: 'flex-start' }}
          >
            <Ionicons name="arrow-back" size={28} color={colors.text} />
          </TouchableOpacity>

          {/* Header */}
          <View className="mb-8">
            <Text className="text-3xl font-bold mb-2" style={{ color: colors.text }}>
              Welcome Back
            </Text>
            <Text className="text-base" style={{ color: colors.textSecondary }}>
              Sign in to continue your fitness journey
            </Text>
          </View>

          {/* Form */}
          <View className="gap-4 mb-6">
            {/* Email Input */}
            <View>
              <Text className="text-sm font-medium mb-2" style={{ color: colors.text }}>
                Email
              </Text>
              <View
                className="flex-row items-center px-4 py-3 rounded-xl"
                style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}
              >
                <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  className="flex-1 ml-3 text-base"
                  style={{ color: colors.text }}
                />
              </View>
            </View>

            {/* Password Input */}
            <View>
              <Text className="text-sm font-medium mb-2" style={{ color: colors.text }}>
                Password
              </Text>
              <View
                className="flex-row items-center px-4 py-3 rounded-xl"
                style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}
              >
                <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.textSecondary}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  className="flex-1 ml-3 text-base"
                  style={{ color: colors.text }}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Sign In Button */}
          <TouchableOpacity
            onPress={handleSignIn}
            disabled={loading}
            className="py-4 rounded-xl mb-4"
            style={{ backgroundColor: colors.primary, ...shadows.medium }}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-center text-lg font-semibold">
                Sign In
              </Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View className="flex-row items-center my-6">
            <View className="flex-1 h-px" style={{ backgroundColor: colors.border }} />
            <Text className="mx-4 text-sm" style={{ color: colors.textSecondary }}>
              Or continue with
            </Text>
            <View className="flex-1 h-px" style={{ backgroundColor: colors.border }} />
          </View>

          {/* Google Sign In */}
          <GoogleOAuthButton mode="signin" />

          {/* Sign Up Link */}
          <View className="flex-row justify-center mt-6">
            <Text className="text-base" style={{ color: colors.textSecondary }}>
              Don't have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/sign-up' as any)}>
              <Text className="text-base font-semibold" style={{ color: colors.primary }}>
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
