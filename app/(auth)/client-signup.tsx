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
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

export default function ClientSignUpScreen() {
  const router = useRouter();
  const { signUp, setActive, isLoaded } = useSignUp();
  const scheme = useColorScheme();
  const colors = getColors(scheme === 'dark');
  const shadows = scheme === 'dark' ? Shadows.dark : Shadows.light;
  const insets = useSafeAreaInsets();

  // Step 1: Check email
  const [email, setEmail] = useState('');
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [emailChecked, setEmailChecked] = useState(false);
  const [invitationData, setInvitationData] = useState<any>(null);

  // Step 2: Create password
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [creatingAccount, setCreatingAccount] = useState(false);

  // Step 3: Verify email
  const [pendingVerification, setPendingVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verifying, setVerifying] = useState(false);

  const checkInvitedEmail = useQuery(
    api.users.checkInvitedEmail,
    email && checkingEmail ? { email: email.toLowerCase() } : 'skip'
  );
  const activatePendingClient = useMutation(api.users.activatePendingClient);

  // Handle email check result
  useEffect(() => {
    if (checkInvitedEmail && checkingEmail) {
      setCheckingEmail(false);
      
      if (!checkInvitedEmail.invited) {
        showToast.error('Email not invited. Please contact your trainer.');
        return;
      }

      if (checkInvitedEmail.isTrainer) {
        showToast.error('This email is registered as a trainer. Please use sign in.');
        return;
      }

      if (!checkInvitedEmail.isPending) {
        showToast.error('Account already exists. Please sign in instead.');
        return;
      }

      // Email is invited and pending - proceed to password creation
      setInvitationData(checkInvitedEmail);
      setEmailChecked(true);
      showToast.success(`Welcome ${checkInvitedEmail.fullName}! Create your password.`);
    }
  }, [checkInvitedEmail, checkingEmail]);

  const handleCheckEmail = () => {
    if (!email) {
      showToast.error('Please enter your email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showToast.error('Please enter a valid email address');
      return;
    }

    setCheckingEmail(true);
  };

  const handleCreateAccount = async () => {
    if (!isLoaded || !signUp) return;

    if (!password || !confirmPassword) {
      showToast.error('Please fill in all password fields');
      return;
    }

    if (password.length < 8) {
      showToast.error('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      showToast.error('Passwords do not match');
      return;
    }

    setCreatingAccount(true);
    try {
      await signUp.create({
        emailAddress: email.toLowerCase(),
        password,
        firstName: invitationData.fullName.split(' ')[0],
        lastName: invitationData.fullName.split(' ').slice(1).join(' ') || undefined,
        unsafeMetadata: {
          role: 'client',
        },
      });

      // Send verification email
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
      showToast.success('Verification code sent to your email');
    } catch (err: any) {
      console.error('Sign up error:', err);
      showToast.error(err.errors?.[0]?.message || 'Failed to create account');
    } finally {
      setCreatingAccount(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (!isLoaded || !signUp) return;

    if (!verificationCode) {
      showToast.error('Please enter the verification code');
      return;
    }

    setVerifying(true);
    try {
      const result = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });

        // Give Clerk time to fully initialize the session
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Activate the pending client in Convex
        try {
          await activatePendingClient({
            email: email.toLowerCase(),
            clerkId: result.createdUserId!,
            fullName: invitationData.fullName,
          });
        } catch (convexErr) {
          console.error('Error activating client:', convexErr);
        }

        showToast.success('Account created successfully!');
        router.replace('/');
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      showToast.error(err.errors?.[0]?.message || 'Failed to verify email');
    } finally {
      setVerifying(false);
    }
  };

  // Step 3: Verification Screen
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
          <Text className="text-2xl font-bold mb-2" style={{ color: colors.text }}>
            Verify Your Email
          </Text>
          <Text className="text-center text-base" style={{ color: colors.textSecondary }}>
            We sent a verification code to{'\n'}
            <Text className="font-semibold">{email}</Text>
          </Text>
        </View>

        <View className="gap-4">
          <View>
            <Text className="text-sm font-medium mb-2" style={{ color: colors.text }}>
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
              <Ionicons name="key-outline" size={20} color={colors.textSecondary} />
              <TextInput
                value={verificationCode}
                onChangeText={setVerificationCode}
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
            disabled={verifying}
            className="py-4 rounded-xl"
            style={{ backgroundColor: colors.primary, ...shadows.medium }}
          >
            {verifying ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-center text-lg font-semibold">
                Verify & Complete
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setPendingVerification(false)}
            className="py-3 items-center"
          >
            <Text className="text-sm" style={{ color: colors.textSecondary }}>
              Back
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Step 2: Create Password Screen
  if (emailChecked && invitationData) {
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
          <View className="flex-1 px-6 pb-8" style={{ paddingTop: insets.top + 12 }}>
            <TouchableOpacity
              onPress={() => {
                setEmailChecked(false);
                setInvitationData(null);
                setPassword('');
                setConfirmPassword('');
              }}
              className="mb-8"
              style={{ alignSelf: 'flex-start' }}
            >
              <Ionicons name="arrow-back" size={28} color={colors.text} />
            </TouchableOpacity>

            <View className="mb-8">
              <Text className="text-3xl font-bold mb-2" style={{ color: colors.text }}>
                Create Your Password
              </Text>
              <Text className="text-base" style={{ color: colors.textSecondary }}>
                You're invited! Set up your account to get started.
              </Text>
            </View>

            {/* Invitation Info */}
            <View
              className="flex-row items-center p-4 rounded-xl mb-6"
              style={{ backgroundColor: `${colors.success}15` }}
            >
              <View
                className="w-12 h-12 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: colors.success }}
              >
                <Ionicons name="checkmark-circle" size={24} color="#FFF" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold" style={{ color: colors.text }}>
                  Welcome, {invitationData.fullName}!
                </Text>
                <Text className="text-sm" style={{ color: colors.textSecondary }}>
                  {email}
                </Text>
              </View>
            </View>

            <View className="gap-4 mb-6">
              {/* Password */}
              <View>
                <Text className="text-sm font-medium mb-2" style={{ color: colors.text }}>
                  Create Password
                </Text>
                <View
                  className="flex-row items-center px-4 py-3 rounded-xl"
                  style={{
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />
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
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Confirm Password */}
              <View>
                <Text className="text-sm font-medium mb-2" style={{ color: colors.text }}>
                  Confirm Password
                </Text>
                <View
                  className="flex-row items-center px-4 py-3 rounded-xl"
                  style={{
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />
                  <TextInput
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Re-enter password"
                    placeholderTextColor={colors.textSecondary}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    className="flex-1 ml-3 text-base"
                    style={{ color: colors.text }}
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    <Ionicons
                      name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleCreateAccount}
              disabled={creatingAccount}
              className="py-4 rounded-xl mb-6"
              style={{ backgroundColor: colors.primary, ...shadows.medium }}
            >
              {creatingAccount ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white text-center text-lg font-semibold">
                  Create Account
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // Step 1: Email Check Screen
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
        <View className="flex-1 px-6 pb-8" style={{ paddingTop: insets.top + 12 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            className="mb-8"
            style={{ alignSelf: 'flex-start' }}
          >
            <Ionicons name="arrow-back" size={28} color={colors.text} />
          </TouchableOpacity>

          <View className="mb-8">
            <Text className="text-3xl font-bold mb-2" style={{ color: colors.text }}>
              Client Sign Up
            </Text>
            <Text className="text-base" style={{ color: colors.textSecondary }}>
              Enter the email your trainer used to invite you
            </Text>
          </View>

          {/* Info Card */}
          <View
            className="p-4 rounded-xl mb-6"
            style={{ backgroundColor: `${colors.primary}15` }}
          >
            <View className="flex-row items-center mb-2">
              <Ionicons name="information-circle" size={20} color={colors.primary} />
              <Text className="text-sm font-semibold ml-2" style={{ color: colors.text }}>
                Invitation Required
              </Text>
            </View>
            <Text className="text-sm" style={{ color: colors.textSecondary }}>
              You can only sign up if your trainer has invited you. Make sure to use the exact email address they provided.
            </Text>
          </View>

          <View className="gap-4 mb-6">
            <View>
              <Text className="text-sm font-medium mb-2" style={{ color: colors.text }}>
                Email Address
              </Text>
              <View
                className="flex-row items-center px-4 py-3 rounded-xl"
                style={{
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
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
          </View>

          <TouchableOpacity
            onPress={handleCheckEmail}
            disabled={checkingEmail}
            className="py-4 rounded-xl mb-6"
            style={{ backgroundColor: colors.primary, ...shadows.medium }}
          >
            {checkingEmail ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-center text-lg font-semibold">
                Continue
              </Text>
            )}
          </TouchableOpacity>

          {/* Sign In Link */}
          <View className="flex-row justify-center">
            <Text className="text-base" style={{ color: colors.textSecondary }}>
              Already have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/sign-in' as any)}>
              <Text className="text-base font-semibold" style={{ color: colors.primary }}>
                Sign In
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
