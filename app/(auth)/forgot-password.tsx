import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSignIn } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getColors, Shadows } from "@/constants/colors";
import { showToast } from "@/utils/toast";

type Step = "email" | "code" | "password";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { signIn, setActive, isLoaded } = useSignIn();
  const scheme = useColorScheme();
  const colors = getColors(scheme === "dark");
  const shadows = scheme === "dark" ? Shadows.dark : Shadows.light;
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSendCode = async () => {
    if (!isLoaded || !signIn) return;

    if (!email) {
      showToast.error("Please enter your email");
      return;
    }

    setLoading(true);
    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: email,
      });
      setStep("code");
      showToast.success("Verification code sent to your email");
    } catch (err: any) {
      console.error("Send code error:", err);
      showToast.error(err.errors?.[0]?.message || "Failed to send code");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!isLoaded || !signIn) return;

    if (!code) {
      showToast.error("Please enter the verification code");
      return;
    }

    setLoading(true);
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code,
      });

      if (result.status === "needs_new_password") {
        setStep("password");
        showToast.success("Code verified! Set your new password");
      }
    } catch (err: any) {
      console.error("Verify code error:", err);
      showToast.error(err.errors?.[0]?.message || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };


  const handleResetPassword = async () => {
    if (!isLoaded || !signIn) return;

    if (!newPassword || !confirmPassword) {
      showToast.error("Please fill in all fields");
      return;
    }

    if (newPassword.length < 8) {
      showToast.error("Password must be at least 8 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const result = await signIn.resetPassword({
        password: newPassword,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        showToast.success("Password reset successfully!");
        router.replace("/");
      }
    } catch (err: any) {
      console.error("Reset password error:", err);
      showToast.error(err.errors?.[0]?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!isLoaded || !signIn) return;

    setLoading(true);
    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: email,
      });
      showToast.success("New code sent to your email");
    } catch (err: any) {
      console.error("Resend code error:", err);
      showToast.error(err.errors?.[0]?.message || "Failed to resend code");
    } finally {
      setLoading(false);
    }
  };

  const renderEmailStep = () => (
    <>
      <View className="mb-8">
        <Text className="text-3xl font-bold mb-2" style={{ color: colors.text }}>
          Forgot Password?
        </Text>
        <Text className="text-base" style={{ color: colors.textSecondary }}>
          Enter your email and we'll send you a verification code to reset your password
        </Text>
      </View>

      <View className="mb-6">
        <Text className="text-sm font-medium mb-2" style={{ color: colors.text }}>
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

      <TouchableOpacity
        onPress={handleSendCode}
        disabled={loading}
        className="py-4 rounded-xl"
        style={{ backgroundColor: colors.primary, ...shadows.medium }}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white text-center text-lg font-semibold">
            Send Code
          </Text>
        )}
      </TouchableOpacity>
    </>
  );


  const renderCodeStep = () => (
    <>
      <View className="mb-8">
        <Text className="text-3xl font-bold mb-2" style={{ color: colors.text }}>
          Enter Code
        </Text>
        <Text className="text-base" style={{ color: colors.textSecondary }}>
          We sent a verification code to {email}
        </Text>
      </View>

      <View className="mb-6">
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
          <Ionicons name="keypad-outline" size={20} color={colors.textSecondary} />
          <TextInput
            value={code}
            onChangeText={setCode}
            placeholder="Enter 6-digit code"
            placeholderTextColor={colors.textSecondary}
            keyboardType="number-pad"
            maxLength={6}
            className="flex-1 ml-3 text-base tracking-widest"
            style={{ color: colors.text }}
          />
        </View>
      </View>

      <TouchableOpacity
        onPress={handleVerifyCode}
        disabled={loading}
        className="py-4 rounded-xl mb-4"
        style={{ backgroundColor: colors.primary, ...shadows.medium }}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white text-center text-lg font-semibold">
            Verify Code
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={handleResendCode} disabled={loading}>
        <Text className="text-center text-base" style={{ color: colors.primary }}>
          Didn't receive the code? Resend
        </Text>
      </TouchableOpacity>
    </>
  );

  const renderPasswordStep = () => (
    <>
      <View className="mb-8">
        <Text className="text-3xl font-bold mb-2" style={{ color: colors.text }}>
          New Password
        </Text>
        <Text className="text-base" style={{ color: colors.textSecondary }}>
          Create a strong password for your account
        </Text>
      </View>

      <View className="gap-4 mb-6">
        <View>
          <Text className="text-sm font-medium mb-2" style={{ color: colors.text }}>
            New Password
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
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="At least 8 characters"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              className="flex-1 ml-3 text-base"
              style={{ color: colors.text }}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>

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
              placeholder="Confirm your password"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              className="flex-1 ml-3 text-base"
              style={{ color: colors.text }}
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
              <Ionicons
                name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <TouchableOpacity
        onPress={handleResetPassword}
        disabled={loading}
        className="py-4 rounded-xl"
        style={{ backgroundColor: colors.primary, ...shadows.medium }}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white text-center text-lg font-semibold">
            Reset Password
          </Text>
        )}
      </TouchableOpacity>
    </>
  );


  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
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
              if (step === "email") {
                router.back();
              } else if (step === "code") {
                setStep("email");
                setCode("");
              } else {
                setStep("code");
                setNewPassword("");
                setConfirmPassword("");
              }
            }}
            className="mb-8"
            style={{ alignSelf: "flex-start" }}
          >
            <Ionicons name="arrow-back" size={28} color={colors.text} />
          </TouchableOpacity>

          {/* Progress Indicator */}
          <View className="flex-row mb-8 gap-2">
            {["email", "code", "password"].map((s, index) => (
              <View
                key={s}
                className="flex-1 h-1 rounded-full"
                style={{
                  backgroundColor:
                    index <= ["email", "code", "password"].indexOf(step)
                      ? colors.primary
                      : colors.border,
                }}
              />
            ))}
          </View>

          {step === "email" && renderEmailStep()}
          {step === "code" && renderCodeStep()}
          {step === "password" && renderPasswordStep()}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
