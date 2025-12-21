import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSignUp } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getColors, Shadows } from '@/constants/colors';
import { showToast } from '@/utils/toast';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

export default function SignUpScreen() {
  const router = useRouter();
  const { signUp, setActive, isLoaded } = useSignUp();
  const scheme = useColorScheme();
  const colors = getColors(scheme === 'dark');
  const shadows = scheme === 'dark' ? Shadows.dark : Shadows.light;
  const insets = useSafeAreaInsets();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const createUser = useMutation(api.users.createUser);

  const handleSignUp = async () => {
    if (!isLoaded || !signUp) return;

    if (!fullName || !email || !password || !phoneNumber) {
      showToast.error('Please fill in all fields');
      return;
    }

    if (password.length < 8) {
      showToast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      await signUp.create({
        emailAddress: email,
        password,
        firstName: fullName.split(' ')[0],
        lastName: fullName.split(' ').slice(1).join(' ') || undefined,
        unsafeMetadata: {
          phoneNumber: phoneNumber,
          role: 'trainer', // Always trainer for signup
        },
      });

      // Send verification email
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err: any) {
      console.error('Sign up error:', err);
      if (err.errors?.[0]?.code === 'form_identifier_exists') {
        showToast.error('Email already registered. Please sign in instead.');
      } else {
        showToast.error(err.errors?.[0]?.message || 'Failed to sign up');
      }
    } finally {
      setLoading(false);
    }
  };

  // Cooldown timer effect
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleVerifyEmail = async () => {
    if (!isLoaded || !signUp) return;

    if (!code) {
      showToast.error('Please enter the verification code');
      return;
    }

    setLoading(true);
    try {
      const result = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });

        // Give Clerk time to fully initialize the session
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Create user in Convex as trainer
        try {
          await createUser({
            clerkId: result.createdUserId!,
            email: email,
            fullName: fullName,
            phoneNumber: phoneNumber,
            role: 'trainer',
          });

          showToast.success('Account created successfully!');
          router.replace('/(auth)/trainer-setup');
        } catch (convexErr: any) {
          console.error('Convex user creation error:', convexErr);
          router.replace('/(auth)/trainer-setup');
        }
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      showToast.error(err.errors?.[0]?.message || 'Failed to verify email');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!isLoaded || !signUp || resendCooldown > 0) return;

    setResending(true);
    try {
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      showToast.success('Verification code sent!');
      setResendCooldown(60);
    } catch (err: any) {
      console.error('Resend error:', err);
      showToast.error(err.errors?.[0]?.message || 'Failed to resend code');
    } finally {
      setResending(false);
    }
  };

  if (pendingVerification) {
    return (
      <View
        className="flex-1 px-6 justify-center"
        style={{ backgroundColor: colors.background }}
      >
        <StatusBar style="auto" />

        <View className="items-center mb-8">
          <View
            className="w-20 h-20 rounded-full items-center justify-center mb-4"
            style={{ backgroundColor: colors.primary + '20' }}
          >
            <Ionicons name="mail-outline" size={40} color={colors.primary} />
          </View>
          <Text
            className="text-2xl font-bold mb-2"
            style={{ color: colors.text }}
          >
            Verify Your Email
          </Text>
          <Text
            className="text-center text-base"
            style={{ color: colors.textSecondary }}
          >
            We sent a verification code to{'\n'}
            <Text className="font-semibold">{email}</Text>
          </Text>
        </View>

        <View className="gap-4">
          <View>
            <Text
              className="text-sm font-medium mb-2"
              style={{ color: colors.text }}
            >
              Verification Code
            </Text>
            <View
              className="flex-row items-center px-4 py-3 rounded-xl"
              style={{
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Ionicons
                name="key-outline"
                size={20}
                color={colors.textSecondary}
              />
              <TextInput
                value={code}
                onChangeText={setCode}
                placeholder="Enter 6-digit code"
                placeholderTextColor={colors.textSecondary}
                keyboardType="number-pad"
                maxLength={6}
                className="flex-1 ml-3 text-base"
                style={{ color: colors.text }}
              />
            </View>
          </View>

          <TouchableOpacity
            onPress={handleVerifyEmail}
            disabled={loading}
            className="py-4 rounded-xl"
            style={{ backgroundColor: colors.primary, ...shadows.medium }}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-center text-lg font-semibold">
                Verify Email
              </Text>
            )}
          </TouchableOpacity>

          <View className="flex-row justify-center items-center py-3">
            <Text className="text-sm" style={{ color: colors.textSecondary }}>
              Didn't receive the code?{' '}
            </Text>
            {resendCooldown > 0 ? (
              <Text className="text-sm font-semibold" style={{ color: colors.textTertiary }}>
                Resend in {resendCooldown}s
              </Text>
            ) : (
              <TouchableOpacity onPress={handleResendCode} disabled={resending}>
                {resending ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text className="text-sm font-semibold" style={{ color: colors.primary }}>
                    Resend Code
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            onPress={() => setPendingVerification(false)}
            className="py-3 items-center"
          >
            <Text className="text-sm" style={{ color: colors.textSecondary }}>
              Back to sign up
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
        <View
          className="flex-1 px-6 pb-8"
          style={{ paddingTop: insets.top + 12 }}
        >
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
            <Text
              className="text-3xl font-bold mb-2"
              style={{ color: colors.text }}
            >
              Become a Trainer
            </Text>
            <Text className="text-base" style={{ color: colors.textSecondary }}>
              Create your trainer account and start managing clients
            </Text>
          </View>

          {/* Trainer Badge */}
          <View 
            className="flex-row items-center p-4 rounded-xl mb-6"
            style={{ backgroundColor: `${colors.primary}15` }}
          >
            <View
              className="w-12 h-12 rounded-full items-center justify-center mr-3"
              style={{ backgroundColor: colors.primary }}
            >
              <Ionicons name="barbell-outline" size={24} color="#FFF" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold" style={{ color: colors.text }}>
                Trainer Account
              </Text>
              <Text className="text-sm" style={{ color: colors.textSecondary }}>
                Manage clients, bookings & schedules
              </Text>
            </View>
          </View>

          {/* Form */}
          <View className="gap-4 mb-6">
            {/* Full Name Input */}
            <View>
              <Text
                className="text-sm font-medium mb-2"
                style={{ color: colors.text }}
              >
                Full Name
              </Text>
              <View
                className="flex-row items-center px-4 py-3 rounded-xl"
                style={{
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={colors.textSecondary}
                />
                <TextInput
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Enter your full name"
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="words"
                  className="flex-1 ml-3 text-base"
                  style={{ color: colors.text }}
                />
              </View>
            </View>

            {/* Email Input */}
            <View>
              <Text
                className="text-sm font-medium mb-2"
                style={{ color: colors.text }}
              >
                Email
              </Text>
              <View
                className="flex-row items-center px-4 py-3 rounded-xl"
                style={{
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={colors.textSecondary}
                />
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

            {/* Phone Number Input */}
            <View>
              <Text
                className="text-sm font-medium mb-2"
                style={{ color: colors.text }}
              >
                Phone Number
              </Text>
              <View
                className="flex-row items-center px-4 py-3 rounded-xl"
                style={{
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Ionicons
                  name="call-outline"
                  size={20}
                  color={colors.textSecondary}
                />
                <TextInput
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholder="Enter your phone number"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="phone-pad"
                  className="flex-1 ml-3 text-base"
                  style={{ color: colors.text }}
                />
              </View>
            </View>

            {/* Password Input */}
            <View>
              <Text
                className="text-sm font-medium mb-2"
                style={{ color: colors.text }}
              >
                Password
              </Text>
              <View
                className="flex-row items-center px-4 py-3 rounded-xl"
                style={{
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={colors.textSecondary}
                />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="At least 8 characters"
                  placeholderTextColor={colors.textSecondary}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  className="flex-1 ml-3 text-base"
                  style={{ color: colors.text }}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Sign Up Button */}
          <TouchableOpacity
            onPress={handleSignUp}
            disabled={loading}
            className="py-4 rounded-xl mb-6"
            style={{ 
              backgroundColor: !loading ? colors.primary : colors.border, 
              ...shadows.medium 
            }}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-center text-lg font-semibold">
                Create Trainer Account
              </Text>
            )}
          </TouchableOpacity>

          {/* Sign In Link */}
          <View className="flex-row justify-center">
            <Text className="text-base" style={{ color: colors.textSecondary }}>
              Already have an account?{' '}
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(auth)/sign-in' as any)}
            >
              <Text
                className="text-base font-semibold"
                style={{ color: colors.primary }}
              >
                Sign In
              </Text>
            </TouchableOpacity>
          </View>

          {/* Client Info */}
          <View 
            className="mt-8 p-4 rounded-xl"
            style={{ backgroundColor: colors.surfaceSecondary }}
          >
            <View className="flex-row items-center mb-2">
              <Ionicons name="information-circle-outline" size={20} color={colors.textSecondary} />
              <Text className="text-sm font-semibold ml-2" style={{ color: colors.text }}>
                Are you a client?
              </Text>
            </View>
            <Text className="text-sm" style={{ color: colors.textSecondary }}>
              Clients can only sign in after being invited by their trainer. Ask your trainer to add you using your email address.
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
