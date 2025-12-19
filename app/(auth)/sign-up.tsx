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
  const [selectedRole, setSelectedRole] = useState<'trainer' | 'client' | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const createUser = useMutation(api.users.createUser);

  const handleSignUp = async () => {
    if (!isLoaded || !signUp) return;

    if (!fullName || !email || !password || !phoneNumber || !selectedRole) {
      showToast.error('Please fill in all fields and select a role');
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
          role: selectedRole,
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

        // Create user in Convex with the selected role
        try {
          await createUser({
            clerkId: result.createdUserId!,
            email: email,
            fullName: fullName,
            phoneNumber: phoneNumber,
            role: selectedRole!,
          });

          showToast.success('Account created successfully!');

          // Navigate based on role
          if (selectedRole === 'trainer') {
            router.replace('/(auth)/trainer-setup');
          } else {
            router.replace('/(client)');
          }
        } catch (convexErr: any) {
          console.error('Convex user creation error:', convexErr);
          // Still navigate even if Convex fails - user can be created later
          if (selectedRole === 'trainer') {
            router.replace('/(auth)/trainer-setup');
          } else {
            router.replace('/(client)');
          }
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
      setResendCooldown(60); // 60 second cooldown
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

          {/* Resend Code */}
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
              Create Account
            </Text>
            <Text className="text-base" style={{ color: colors.textSecondary }}>
              Start your fitness journey today
            </Text>
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

            {/* Role Selection */}
            <View>
              <Text
                className="text-sm font-medium mb-3"
                style={{ color: colors.text }}
              >
                I am a
              </Text>
              <View className="gap-3">
                {/* Trainer Option */}
                <TouchableOpacity
                  onPress={() => setSelectedRole('trainer')}
                  disabled={loading}
                  className="p-4 rounded-xl border-2"
                  style={{
                    backgroundColor:
                      selectedRole === 'trainer' ? colors.primary : colors.surface,
                    borderColor:
                      selectedRole === 'trainer' ? colors.primary : colors.border,
                  }}
                >
                  <View className="flex-row items-center">
                    <View
                      className="w-12 h-12 rounded-full items-center justify-center mr-3"
                      style={{
                        backgroundColor:
                          selectedRole === 'trainer'
                            ? 'rgba(255,255,255,0.2)'
                            : `${colors.primary}15`,
                      }}
                    >
                      <Ionicons
                        name="barbell-outline"
                        size={24}
                        color={selectedRole === 'trainer' ? '#FFF' : colors.primary}
                      />
                    </View>
                    <View className="flex-1">
                      <Text
                        className="text-lg font-semibold mb-1"
                        style={{
                          color: selectedRole === 'trainer' ? '#FFF' : colors.text,
                        }}
                      >
                        Trainer
                      </Text>
                      <Text
                        className="text-sm"
                        style={{
                          color:
                            selectedRole === 'trainer'
                              ? 'rgba(255,255,255,0.8)'
                              : colors.textSecondary,
                        }}
                      >
                        Manage clients and create workout plans
                      </Text>
                    </View>
                    {selectedRole === 'trainer' && (
                      <Ionicons name="checkmark-circle" size={24} color="white" />
                    )}
                  </View>
                </TouchableOpacity>

                {/* Client Option */}
                <TouchableOpacity
                  onPress={() => setSelectedRole('client')}
                  disabled={loading}
                  className="p-4 rounded-xl border-2"
                  style={{
                    backgroundColor:
                      selectedRole === 'client' ? colors.primary : colors.surface,
                    borderColor:
                      selectedRole === 'client' ? colors.primary : colors.border,
                  }}
                >
                  <View className="flex-row items-center">
                    <View
                      className="w-12 h-12 rounded-full items-center justify-center mr-3"
                      style={{
                        backgroundColor:
                          selectedRole === 'client'
                            ? 'rgba(255,255,255,0.2)'
                            : `${colors.primary}15`,
                      }}
                    >
                      <Ionicons
                        name="person-outline"
                        size={24}
                        color={selectedRole === 'client' ? '#FFF' : colors.primary}
                      />
                    </View>
                    <View className="flex-1">
                      <Text
                        className="text-lg font-semibold mb-1"
                        style={{
                          color: selectedRole === 'client' ? '#FFF' : colors.text,
                        }}
                      >
                        Client
                      </Text>
                      <Text
                        className="text-sm"
                        style={{
                          color:
                            selectedRole === 'client'
                              ? 'rgba(255,255,255,0.8)'
                              : colors.textSecondary,
                        }}
                      >
                        Track workouts and follow training plans
                      </Text>
                    </View>
                    {selectedRole === 'client' && (
                      <Ionicons name="checkmark-circle" size={24} color="white" />
                    )}
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Sign Up Button */}
          <TouchableOpacity
            onPress={handleSignUp}
            disabled={loading || !selectedRole}
            className="py-4 rounded-xl mb-6"
            style={{ 
              backgroundColor: selectedRole && !loading ? colors.primary : colors.border, 
              ...shadows.medium 
            }}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-center text-lg font-semibold">
                Sign Up
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
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
