import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-expo";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getColors, Shadows } from "@/constants/colors";
import { StatusBar } from "expo-status-bar";
import * as ImagePicker from "expo-image-picker";
import { showToast } from "@/utils/toast";
import { LinearGradient } from "expo-linear-gradient";

const SPECIALTIES = [
  "Strength Training",
  "HIIT",
  "Yoga",
  "Pilates",
  "CrossFit",
  "Boxing",
  "Cardio",
  "Weight Loss",
  "Bodybuilding",
  "Functional Training",
  "Sports Training",
  "Rehabilitation",
];

export default function TrainerSetupScreen() {
  const { user } = useUser();
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = getColors(scheme === "dark");
  const shadows = scheme === "dark" ? Shadows.dark : Shadows.light;

  const updateUserProfile = useMutation(api.users.updateUserProfile);
  const generateUploadUrl = useMutation(api.users.generateUploadUrl);
  const createPackage = useMutation(api.packages.createPackage);
  const saveProgress = useMutation(api.users.saveProfileSetupProgress);
  const markComplete = useMutation(api.users.markProfileSetupComplete);
  const createDefaultAvailability = useMutation(api.availability.createDefaultAvailability);
  const profileProgress = useQuery(
    api.users.getProfileSetupProgress,
    user?.id ? { clerkId: user.id } : "skip"
  );

  // Step management
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  // Availability dialog state
  const [showAvailabilityDialog, setShowAvailabilityDialog] = useState(false);

  // Step 1: Profile basics
  const [profileImage, setProfileImage] = useState<string | null>(
    user?.imageUrl || null
  );
  const [hasChangedImage, setHasChangedImage] = useState(false);
  const [username, setUsername] = useState("");

  // Step 2: Specializations and experience
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [experience, setExperience] = useState("");

  // Step 3: Bio
  const [bio, setBio] = useState("");

  // Step 4: Subscriptions (renamed from Packages)
  const [packages, setPackages] = useState<
    Array<{
      name: string;
      description: string;
      sessionsPerMonth: string;
      monthlyAmount: string;
      currency: string;
    }>
  >([
    {
      name: "",
      description: "",
      sessionsPerMonth: "",
      monthlyAmount: "",
      currency: "NOK", // Changed to Norwegian Krone
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [progressLoaded, setProgressLoaded] = useState(false);

  // Load saved progress on mount
  useEffect(() => {
    if (profileProgress && !progressLoaded && user?.id) {
      if (profileProgress.profileCompleted) {
        // If profile is already completed, redirect to trainer dashboard
        router.replace("/(trainer)");
        return;
      }

      if (profileProgress.formData) {
        try {
          const savedData = JSON.parse(profileProgress.formData);

          // Restore form data
          if (savedData.username) setUsername(savedData.username);
          if (savedData.profileImage) setProfileImage(savedData.profileImage);
          if (savedData.hasChangedImage !== undefined)
            setHasChangedImage(savedData.hasChangedImage);
          if (savedData.specialties) setSpecialties(savedData.specialties);
          if (savedData.experience) setExperience(savedData.experience);
          if (savedData.bio) setBio(savedData.bio);
          if (savedData.packages) setPackages(savedData.packages);

          // Restore current step
          setCurrentStep(profileProgress.step || 1);

          showToast.success("Resuming where you left off!");
        } catch (error) {
          console.error("Error loading saved progress:", error instanceof Error ? error.message : 'Unknown error');
        }
      }

      setProgressLoaded(true);
    }
  }, [profileProgress, progressLoaded, user?.id]);

  // Save progress whenever step or form data changes
  useEffect(() => {
    if (!user?.id || !progressLoaded) return;

    const saveCurrentProgress = async () => {
      try {
        const formData = JSON.stringify({
          username,
          profileImage,
          hasChangedImage,
          specialties,
          experience,
          bio,
          packages,
        });

        await saveProgress({
          clerkId: user.id,
          step: currentStep,
          formData,
        });
      } catch (error) {
        console.error("Error saving progress:", error instanceof Error ? error.message : 'Unknown error');
      }
    };

    // Debounce the save to avoid too many calls
    const timeoutId = setTimeout(saveCurrentProgress, 1000);
    return () => clearTimeout(timeoutId);
  }, [
    currentStep,
    username,
    profileImage,
    hasChangedImage,
    specialties,
    experience,
    bio,
    packages,
    user?.id,
    progressLoaded,
  ]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      alert(
        "Sorry, we need camera roll permissions to upload a profile picture!"
      );
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
        method: "POST",
        headers: { "Content-Type": blob.type },
        body: blob,
      });

      const { storageId } = await result.json();
      return storageId;
    } catch (error) {
      console.error("Error uploading image:", error instanceof Error ? error.message : 'Unknown error');
      return null;
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!username.trim()) {
          showToast.error("Please enter a username");
          return false;
        }
        if (username.trim().length < 3) {
          showToast.error("Username must be at least 3 characters");
          return false;
        }
        return true;
      case 2:
        if (specialties.length === 0) {
          showToast.error("Please select at least one specialization");
          return false;
        }
        return true;
      case 3:
        // Bio is optional, always valid
        return true;
      case 4:
        const validPackages = packages.filter(
          (pkg) =>
            pkg.name.trim() &&
            pkg.sessionsPerMonth.trim() &&
            pkg.monthlyAmount.trim()
        );
        if (validPackages.length === 0) {
          showToast.error("Please add at least one complete subscription plan");
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep) || !user?.id) {
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
        specialty: specialties.join(", "),
        profileImageId: profileImageId,
      });

      // Create packages
      const validPackages = packages.filter(
        (pkg) =>
          pkg.name.trim() &&
          pkg.sessionsPerMonth.trim() &&
          pkg.monthlyAmount.trim()
      );

      for (const pkg of validPackages) {
        await createPackage({
          trainerId: user.id,
          name: pkg.name.trim(),
          description: pkg.description.trim()
            ? pkg.description.trim()
            : undefined,
          sessionsPerMonth: parseInt(pkg.sessionsPerMonth),
          monthlyAmount: parseFloat(pkg.monthlyAmount),
          currency: pkg.currency,
        });
      }

      // Create default availability (Mon-Fri 9AM-5PM)
      await createDefaultAvailability({ trainerId: user.id });

      // Update Clerk metadata
      await user.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          username: username.trim(),
          specialty: specialties.join(", "),
          experience: experience.trim() || undefined,
          profileCompleted: true,
        },
      });

      // Mark profile setup as complete in Convex
      await markComplete({ clerkId: user.id });

      setLoading(false);
      // Show availability dialog instead of navigating immediately
      setShowAvailabilityDialog(true);
    } catch (error) {
      console.error("Error setting up profile:", error instanceof Error ? error.message : 'Unknown error');
      showToast.error("Failed to setup profile. Please try again.");
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <View>
            <Text
              className="text-2xl font-bold mb-2"
              style={{ color: colors.text }}
            >
              Profile Basics
            </Text>
            <Text
              className="text-base mb-8"
              style={{ color: colors.textSecondary }}
            >
              Let's start with your profile photo and username
            </Text>

            {/* Profile Photo */}
            <View className="items-center mb-8">
              <TouchableOpacity onPress={pickImage} className="relative">
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
                    <Ionicons
                      name="person"
                      size={60}
                      color={colors.textTertiary}
                    />
                  )}
                </View>
                <View
                  className="absolute bottom-0 right-0 w-10 h-10 rounded-full items-center justify-center"
                  style={{
                    backgroundColor: colors.primary,
                    ...shadows.medium,
                  }}
                >
                  <Ionicons name="camera" size={20} color="#FFF" />
                </View>
              </TouchableOpacity>
              <Text
                className="text-sm mt-3"
                style={{ color: colors.textSecondary }}
              >
                Tap to upload photo
              </Text>
            </View>

            {/* Username */}
            <View className="mb-6">
              <Text
                className="text-sm font-semibold mb-2"
                style={{ color: colors.text }}
              >
                Username *
              </Text>
              <View className="relative">
                <View className="absolute left-4 top-4 z-10">
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
              <Text
                className="text-xs mt-2"
                style={{ color: colors.textSecondary }}
              >
                This will be visible to clients when they search for trainers
              </Text>
            </View>
          </View>
        );

      case 2:
        return (
          <View>
            <Text
              className="text-2xl font-bold mb-2"
              style={{ color: colors.text }}
            >
              Your Expertise
            </Text>
            <Text
              className="text-base mb-8"
              style={{ color: colors.textSecondary }}
            >
              Tell us about your specializations and experience
            </Text>

            {/* Specializations */}
            <View className="mb-6">
              <Text
                className="text-sm font-semibold mb-3"
                style={{ color: colors.text }}
              >
                Specializations * (Select one or more)
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {SPECIALTIES.map((spec) => (
                  <TouchableOpacity
                    key={spec}
                    onPress={() => {
                      if (specialties.includes(spec)) {
                        setSpecialties(specialties.filter((s) => s !== spec));
                      } else {
                        setSpecialties([...specialties, spec]);
                      }
                    }}
                    className="px-4 py-2.5 rounded-full"
                    style={{
                      backgroundColor: specialties.includes(spec)
                        ? colors.primary
                        : colors.surface,
                      borderWidth: 1,
                      borderColor: specialties.includes(spec)
                        ? colors.primary
                        : colors.border,
                    }}
                  >
                    <Text
                      className="text-sm font-medium"
                      style={{
                        color: specialties.includes(spec)
                          ? "#FFF"
                          : colors.text,
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
              <Text
                className="text-sm font-semibold mb-2"
                style={{ color: colors.text }}
              >
                Years of Experience (Optional)
              </Text>
              <View className="relative">
                <View className="absolute left-4 top-4 z-10">
                  <Ionicons
                    name="trophy"
                    size={20}
                    color={colors.textSecondary}
                  />
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
          </View>
        );

      case 3:
        return (
          <View>
            <Text
              className="text-2xl font-bold mb-2"
              style={{ color: colors.text }}
            >
              About You
            </Text>
            <Text
              className="text-base mb-8"
              style={{ color: colors.textSecondary }}
            >
              Share your story and what makes you unique
            </Text>

            {/* Bio */}
            <View className="mb-6">
              <Text
                className="text-sm font-semibold mb-2"
                style={{ color: colors.text }}
              >
                Bio (Optional)
              </Text>
              <TextInput
                className="rounded-2xl px-4 py-4 text-base"
                style={{
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  color: colors.text,
                  minHeight: 180,
                  textAlignVertical: "top",
                  ...shadows.small,
                }}
                placeholder="Tell clients about your training philosophy, certifications, and what makes you unique..."
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={8}
                value={bio}
                onChangeText={setBio}
              />
              <Text
                className="text-xs mt-2"
                style={{ color: colors.textSecondary }}
              >
                This will appear on your profile. You can skip this for now and
                add it later.
              </Text>
            </View>
          </View>
        );

      case 4:
        const PLAN_COLORS = [
          { gradient: ["#667eea", "#764ba2"], accent: "#667eea" },
          { gradient: ["#f093fb", "#f5576c"], accent: "#f5576c" },
          { gradient: ["#4facfe", "#00f2fe"], accent: "#4facfe" },
          { gradient: ["#43e97b", "#38f9d7"], accent: "#43e97b" },
          { gradient: ["#fa709a", "#fee140"], accent: "#fa709a" },
        ];

        const getPlanColor = (index: number) =>
          PLAN_COLORS[index % PLAN_COLORS.length];

        const getCurrencySymbol = (code: string) => {
          const symbols: { [key: string]: string } = {
            NOK: "kr",
            USD: "$",
            EUR: "€",
            GBP: "£",
          };
          return symbols[code] || code;
        };

        return (
          <View>
            <Text
              className="text-2xl font-bold mb-2"
              style={{ color: colors.text }}
            >
              Your Monthly Subscriptions
            </Text>
            <Text
              className="text-base mb-6"
              style={{ color: colors.textSecondary }}
            >
              Create monthly subscription plans for your clients
            </Text>

            {/* Subscriptions List */}
            {packages.map((pkg, index) => {
              const planColor = getPlanColor(index);
              const hasRequiredFields =
                pkg.name.trim() &&
                pkg.sessionsPerMonth.trim() &&
                pkg.monthlyAmount.trim();

              return (
                <View
                  key={index}
                  className="mb-5 rounded-3xl overflow-hidden"
                  style={shadows.large}
                >
                  {/* Gradient Header */}
                  <LinearGradient
                    colors={planColor.gradient as [string, string]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="p-5 pb-6"
                  >
                    {/* Header Row */}
                    <View className="flex-row items-center justify-between mb-4">
                      <View className="flex-row items-center">
                        <View
                          className="w-10 h-10 rounded-full items-center justify-center mr-3"
                          style={{ backgroundColor: "rgba(255,255,255,0.25)" }}
                        >
                          <Text className="text-white text-lg font-bold">
                            {index + 1}
                          </Text>
                        </View>
                        <Text className="text-white text-lg font-bold">
                          Plan {index + 1}
                        </Text>
                      </View>
                      {packages.length > 1 && (
                        <TouchableOpacity
                          onPress={() => {
                            setPackages(packages.filter((_, i) => i !== index));
                          }}
                          className="w-9 h-9 rounded-full items-center justify-center"
                          style={{ backgroundColor: "rgba(255,255,255,0.25)" }}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={18}
                            color="#FFF"
                          />
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Price Display */}
                    {hasRequiredFields && (
                      <View className="mb-3">
                        <View className="flex-row items-end">
                          <Text className="text-white text-4xl font-bold">
                            {getCurrencySymbol(pkg.currency)}
                            {pkg.monthlyAmount || "0"}
                          </Text>
                          <Text className="text-white/70 text-base mb-2 ml-1">
                            /month
                          </Text>
                        </View>
                        {pkg.sessionsPerMonth && (
                          <View className="flex-row items-center mt-2">
                            <View
                              className="w-6 h-6 rounded-full items-center justify-center mr-2"
                              style={{
                                backgroundColor: "rgba(255,255,255,0.25)",
                              }}
                            >
                              <Ionicons
                                name="calendar"
                                size={14}
                                color="#FFF"
                              />
                            </View>
                            <Text className="text-white/90 text-sm font-medium">
                              {pkg.sessionsPerMonth} sessions per month
                            </Text>
                          </View>
                        )}
                      </View>
                    )}

                    {!hasRequiredFields && (
                      <View className="py-2">
                        <Text className="text-white/70 text-sm">
                          Fill in the details below to preview your plan
                        </Text>
                      </View>
                    )}
                  </LinearGradient>

                  {/* Form Fields */}
                  <View
                    className="p-5"
                    style={{ backgroundColor: colors.surface }}
                  >
                    {/* Plan Name */}
                    <View className="mb-4">
                      <Text
                        className="text-xs font-semibold mb-2"
                        style={{ color: colors.textSecondary }}
                      >
                        PLAN NAME *
                      </Text>
                      <TextInput
                        className="rounded-xl py-3.5 px-4 text-base"
                        style={{
                          backgroundColor: colors.background,
                          borderWidth: 2,
                          borderColor: pkg.name
                            ? planColor.accent + "40"
                            : colors.border,
                          color: colors.text,
                        }}
                        placeholder="e.g., Premium Fitness, Starter Plan"
                        placeholderTextColor={colors.textTertiary}
                        value={pkg.name}
                        onChangeText={(text) => {
                          const newPackages = [...packages];
                          newPackages[index].name = text;
                          setPackages(newPackages);
                        }}
                      />
                    </View>

                    {/* Description */}
                    <View className="mb-4">
                      <Text
                        className="text-xs font-semibold mb-2"
                        style={{ color: colors.textSecondary }}
                      >
                        DESCRIPTION (OPTIONAL)
                      </Text>
                      <TextInput
                        className="rounded-xl py-3.5 px-4 text-base"
                        style={{
                          backgroundColor: colors.background,
                          borderWidth: 2,
                          borderColor: pkg.description
                            ? planColor.accent + "40"
                            : colors.border,
                          color: colors.text,
                          minHeight: 70,
                          textAlignVertical: "top",
                        }}
                        placeholder="Describe what makes this plan special..."
                        placeholderTextColor={colors.textTertiary}
                        multiline
                        numberOfLines={3}
                        value={pkg.description}
                        onChangeText={(text) => {
                          const newPackages = [...packages];
                          newPackages[index].description = text;
                          setPackages(newPackages);
                        }}
                      />
                    </View>

                    {/* Sessions Per Month */}
                    <View className="mb-4">
                      <Text
                        className="text-xs font-semibold mb-2"
                        style={{ color: colors.textSecondary }}
                      >
                        SESSIONS PER MONTH *
                      </Text>
                      <TextInput
                        className="rounded-xl py-3.5 px-4 text-base"
                        style={{
                          backgroundColor: colors.background,
                          borderWidth: 2,
                          borderColor: pkg.sessionsPerMonth
                            ? planColor.accent + "40"
                            : colors.border,
                          color: colors.text,
                        }}
                        placeholder="e.g., 4, 8, 12"
                        placeholderTextColor={colors.textTertiary}
                        keyboardType="numeric"
                        value={pkg.sessionsPerMonth}
                        onChangeText={(text) => {
                          const newPackages = [...packages];
                          newPackages[index].sessionsPerMonth = text;
                          setPackages(newPackages);
                        }}
                      />
                    </View>

                    {/* Monthly Amount & Currency */}
                    <View className="flex-row gap-3">
                      <View className="flex-1">
                        <Text
                          className="text-xs font-semibold mb-2"
                          style={{ color: colors.textSecondary }}
                        >
                          MONTHLY AMOUNT *
                        </Text>
                        <TextInput
                          className="rounded-xl py-3.5 px-4 text-base"
                          style={{
                            backgroundColor: colors.background,
                            borderWidth: 2,
                            borderColor: pkg.monthlyAmount
                              ? planColor.accent + "40"
                              : colors.border,
                            color: colors.text,
                          }}
                          placeholder="e.g., 5000"
                          placeholderTextColor={colors.textTertiary}
                          keyboardType="numeric"
                          value={pkg.monthlyAmount}
                          onChangeText={(text) => {
                            const newPackages = [...packages];
                            newPackages[index].monthlyAmount = text;
                            setPackages(newPackages);
                          }}
                        />
                      </View>
                      <View style={{ width: 100 }}>
                        <Text
                          className="text-xs font-semibold mb-2"
                          style={{ color: colors.textSecondary }}
                        >
                          CURRENCY
                        </Text>
                        <View
                          className="rounded-xl py-3.5 px-4 justify-center"
                          style={{
                            backgroundColor: colors.background,
                            borderWidth: 2,
                            borderColor: colors.border,
                          }}
                        >
                          <Text
                            className="text-base font-semibold text-center"
                            style={{ color: colors.text }}
                          >
                            {pkg.currency}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Completion Status Indicator */}
                    {hasRequiredFields && (
                      <View
                        className="flex-row items-center p-3 rounded-xl mt-4"
                        style={{ backgroundColor: `${planColor.accent}15` }}
                      >
                        <View
                          className="w-6 h-6 rounded-full items-center justify-center mr-2"
                          style={{ backgroundColor: planColor.accent }}
                        >
                          <Ionicons name="checkmark" size={14} color="#FFF" />
                        </View>
                        <Text
                          className="text-sm font-medium"
                          style={{ color: planColor.accent }}
                        >
                          Plan ready to create
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}

            {/* Add Another Subscription Button */}
            <TouchableOpacity
              onPress={() => {
                setPackages([
                  ...packages,
                  {
                    name: "",
                    description: "",
                    sessionsPerMonth: "",
                    monthlyAmount: "",
                    currency: "NOK",
                  },
                ]);
              }}
              className="flex-row items-center justify-center px-5 py-4 rounded-2xl mb-2"
              style={{
                backgroundColor: colors.surface,
                borderWidth: 2,
                borderColor: colors.primary,
                borderStyle: "dashed",
                ...shadows.small,
              }}
            >
              <View
                className="w-9 h-9 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: `${colors.primary}20` }}
              >
                <Ionicons name="add" size={22} color={colors.primary} />
              </View>
              <Text
                className="text-base font-semibold"
                style={{ color: colors.primary }}
              >
                Add Another Plan
              </Text>
            </TouchableOpacity>

            {/* Helper Text */}
            <Text
              className="text-xs text-center mt-2 px-4"
              style={{ color: colors.textSecondary }}
            >
              You can add multiple subscription plans to offer different options
              to your clients
            </Text>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ backgroundColor: colors.background }}
    >
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />

      {/* Header with Progress */}
      <View
        className="px-5 pt-14 pb-5"
        style={{
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <Text
          className="text-2xl font-bold text-center"
          style={{ color: colors.text }}
        >
          Complete Your Profile
        </Text>
        <Text
          className="text-sm text-center mt-2 mb-4"
          style={{ color: colors.textSecondary }}
        >
          Step {currentStep} of {totalSteps}
        </Text>

        {/* Progress Bar */}
        <View
          className="h-2 rounded-full overflow-hidden"
          style={{ backgroundColor: colors.surface }}
        >
          <View
            className="h-full rounded-full"
            style={{
              backgroundColor: colors.primary,
              width: `${(currentStep / totalSteps) * 100}%`,
            }}
          />
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 30,
          paddingBottom: 120,
        }}
        showsVerticalScrollIndicator={false}
      >
        {renderStepContent()}
      </ScrollView>

      {/* Navigation Buttons */}
      <View
        className="absolute bottom-0 left-0 right-0 px-5 py-4"
        style={{
          backgroundColor: colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          ...shadows.large,
        }}
      >
        <View className="flex-row gap-3">
          {currentStep > 1 && (
            <TouchableOpacity
              className="flex-1 rounded-2xl py-4 items-center"
              style={{
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
              }}
              onPress={handleBack}
              disabled={loading}
            >
              <Text
                className="text-base font-bold"
                style={{ color: colors.text }}
              >
                Back
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            className="rounded-2xl py-4 items-center"
            style={{
              flex: currentStep > 1 ? 2 : 1,
              backgroundColor: colors.primary,
            }}
            onPress={currentStep === totalSteps ? handleSubmit : handleNext}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text className="text-base font-bold text-white">
                {currentStep === totalSteps ? "Complete Setup" : "Next"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Default Availability Dialog */}
      <Modal
        visible={showAvailabilityDialog}
        transparent
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View
          className="flex-1 items-center justify-center px-6"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <View
            className="w-full rounded-3xl p-6"
            style={{
              backgroundColor: colors.surface,
              ...shadows.large,
            }}
          >
            {/* Icon */}
            <View className="items-center mb-4">
              <View
                className="w-16 h-16 rounded-full items-center justify-center"
                style={{ backgroundColor: `${colors.primary}20` }}
              >
                <Ionicons name="time-outline" size={32} color={colors.primary} />
              </View>
            </View>

            {/* Title */}
            <Text
              className="text-xl font-bold text-center mb-2"
              style={{ color: colors.text }}
            >
              Default Availability Set
            </Text>

            {/* Description */}
            <Text
              className="text-base text-center mb-4"
              style={{ color: colors.textSecondary }}
            >
              We've set up your default availability:
            </Text>

            {/* Schedule Info */}
            <View
              className="rounded-2xl p-4 mb-4"
              style={{ backgroundColor: colors.background }}
            >
              <View className="flex-row items-center mb-3">
                <Ionicons name="checkmark-circle" size={20} color={colors.success || "#22C55E"} />
                <Text className="ml-2 text-sm font-medium" style={{ color: colors.text }}>
                  Monday - Friday: 9:00 AM - 5:00 PM
                </Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
                <Text className="ml-2 text-sm" style={{ color: colors.textSecondary }}>
                  Saturday & Sunday: Off
                </Text>
              </View>
            </View>

            {/* Info Text */}
            <Text
              className="text-sm text-center mb-6"
              style={{ color: colors.textSecondary }}
            >
              You can change your availability anytime from your profile settings.
            </Text>

            {/* Buttons */}
            <View className="gap-3">
              <TouchableOpacity
                className="rounded-2xl py-4 items-center"
                style={{ backgroundColor: colors.primary }}
                onPress={() => {
                  setShowAvailabilityDialog(false);
                  router.replace("/(trainer)/availability" as any);
                }}
              >
                <Text className="text-base font-bold text-white">
                  Customize Now
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="rounded-2xl py-4 items-center"
                style={{
                  backgroundColor: colors.background,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
                onPress={() => {
                  setShowAvailabilityDialog(false);
                  showToast.success("Profile setup complete!");
                  router.replace("/(trainer)");
                }}
              >
                <Text
                  className="text-base font-bold"
                  style={{ color: colors.text }}
                >
                  Continue to Dashboard
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
