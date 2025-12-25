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
import { useSignIn, useSignUp } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getColors, Shadows } from "@/constants/colors";
import { showToast } from "@/utils/toast";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function SignInScreen() {
  const router = useRouter();
  const { signIn, setActive, isLoaded } = useSignIn();
  const {
    signUp,
    setActive: setSignUpActive,
    isLoaded: isSignUpLoaded,
  } = useSignUp();
  const scheme = useColorScheme();
  const colors = getColors(scheme === "dark");
  const shadows = scheme === "dark" ? Shadows.dark : Shadows.light;
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // For new client signup flow
  const [isNewClient, setIsNewClient] = useState(false);
  const [clientName, setClientName] = useState("");

  const activatePendingClient = useMutation(api.users.activatePendingClient);

  const handleSignIn = async () => {
    if (!isLoaded || !signIn) return;

    if (!email || !password) {
      showToast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });
      console.log("Sign in result:", result);

      if (result.status === "complete") {
        console.log("Sign in complete", result.createdSessionId);
        await setActive({ session: result.createdSessionId });

        // Give Clerk time to fully initialize the session
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Navigate to root - the app's auth routing will handle
        // directing users to the appropriate page based on their role
        router.replace("/");
      }
    } catch (err: any) {
      console.error("Sign in error:", err);

      // Check if user doesn't exist - might be an invited client
      if (err.errors?.[0]?.code === "form_identifier_not_found") {
        // Show option to create account as invited client
        setIsNewClient(true);
        showToast.info(
          "Account not found. If you were invited by a trainer, create your account below."
        );
      } else {
        showToast.error(err.errors?.[0]?.message || "Failed to sign in");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClientSignUp = async () => {
    if (!isSignUpLoaded || !signUp) {
      console.log("Sign up not loaded or not available");
      return;
    }

    if (!email || !password || !clientName) {
      showToast.error("Please fill in all fields");
      return;
    }

    if (password.length < 8) {
      showToast.error("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      console.log("Creating client sign up from sign-in page...");

      // Create the account
      const result = await signUp.create({
        emailAddress: email,
        password,
        firstName: clientName.split(" ")[0],
        lastName: clientName.split(" ").slice(1).join(" ") || undefined,
        unsafeMetadata: {
          role: "client",
        },
      });

      // Check if signup is complete (no verification required in Clerk settings)
      if (result.status === "complete" && result.createdSessionId) {
        await setSignUpActive({ session: result.createdSessionId });

        // Give Clerk time to fully initialize the session
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Activate the pending client in Convex
        try {
          await activatePendingClient({
            email: email.toLowerCase(),
            clerkId: result.createdUserId!,
            fullName: clientName,
          });
        } catch (convexErr) {
          console.error("Error activating client:", convexErr);
        }

        showToast.success("Account created successfully!");
        router.replace("/(client)");
      } else {
        // If signup is not complete, Clerk requires email verification
        // Show a helpful error message
        console.log("Signup not complete, status:", result.status);
        showToast.error(
          "Email verification required. Please disable email verification in Clerk dashboard for this app, or use the signup page instead."
        );
      }
    } catch (err: any) {
      console.error("Client sign up error:", err);
      showToast.error(err.errors?.[0]?.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  // New client signup form
  if (isNewClient) {
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
          <View
            className="flex-1 px-6 pb-8"
            style={{ paddingTop: insets.top + 12 }}
          >
            <TouchableOpacity
              onPress={() => setIsNewClient(false)}
              className="mb-8"
              style={{ alignSelf: "flex-start" }}
            >
              <Ionicons name="arrow-back" size={28} color={colors.text} />
            </TouchableOpacity>

            <View className="mb-8">
              <Text
                className="text-3xl font-bold mb-2"
                style={{ color: colors.text }}
              >
                Complete Your Account
              </Text>
              <Text
                className="text-base"
                style={{ color: colors.textSecondary }}
              >
                Your trainer has invited you. Create your password to get
                started.
              </Text>
            </View>

            {/* Client Badge */}
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
                <Text
                  className="text-base font-semibold"
                  style={{ color: colors.text }}
                >
                  Invited Client
                </Text>
                <Text
                  className="text-sm"
                  style={{ color: colors.textSecondary }}
                >
                  {email}
                </Text>
              </View>
            </View>

            <View className="gap-4 mb-6">
              <View>
                <Text
                  className="text-sm font-medium mb-2"
                  style={{ color: colors.text }}
                >
                  Your Name
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
                    value={clientName}
                    onChangeText={setClientName}
                    placeholder="Enter your name"
                    placeholderTextColor={colors.textSecondary}
                    autoCapitalize="words"
                    className="flex-1 ml-3 text-base"
                    style={{ color: colors.text }}
                  />
                </View>
              </View>

              <View>
                <Text
                  className="text-sm font-medium mb-2"
                  style={{ color: colors.text }}
                >
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
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleClientSignUp}
              disabled={loading}
              className="py-4 rounded-xl mb-6"
              style={{ backgroundColor: colors.primary, ...shadows.medium }}
            >
              {loading ? (
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
        <View
          className="flex-1 px-6 pb-8"
          style={{ paddingTop: insets.top + 12 }}
        >
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => router.back()}
            className="mb-8"
            style={{ alignSelf: "flex-start" }}
          >
            <Ionicons name="arrow-back" size={28} color={colors.text} />
          </TouchableOpacity>

          {/* Header */}
          <View className="mb-8">
            <Text
              className="text-3xl font-bold mb-2"
              style={{ color: colors.text }}
            >
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
                  placeholder="Enter your password"
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
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
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
            className="py-4 rounded-xl mb-6"
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

          {/* Sign Up Link */}
          <View className="flex-row justify-center">
            <Text className="text-base" style={{ color: colors.textSecondary }}>
              Don't have an account?{" "}
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/(auth)/sign-up" as any)}
            >
              <Text
                className="text-base font-semibold"
                style={{ color: colors.primary }}
              >
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
