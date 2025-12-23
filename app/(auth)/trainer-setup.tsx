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
} from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useUser } from "@clerk/clerk-expo";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getColors, Shadows } from "@/constants/colors";
import { StatusBar } from "expo-status-bar";
import * as ImagePicker from "expo-image-picker";
import { showToast } from "@/utils/toast";

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

  // Step management
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

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

  // Step 4: Packages
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
      currency: "INR",
    },
  ]);

  const [loading, setLoading] = useState(false);

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
      console.error("Error uploading image:", error);
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
          showToast.error("Please add at least one complete package");
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
          description: pkg.description.trim() ? pkg.description.trim() : undefined,
          sessionsPerMonth: parseInt(pkg.sessionsPerMonth),
          monthlyAmount: parseFloat(pkg.monthlyAmount),
          currency: pkg.currency,
        });
      }

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

      showToast.success("Profile setup complete!");
      router.replace("/(trainer)");
    } catch (error) {
      console.error("Error setting up profile:", error);
      showToast.error("Failed to setup profile. Please try again.");
    } finally {
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
        return (
          <View>
            <Text
              className="text-2xl font-bold mb-2"
              style={{ color: colors.text }}
            >
              Your Monthly Packages
            </Text>
            <Text
              className="text-base mb-6"
              style={{ color: colors.textSecondary }}
            >
              Create monthly subscription packages for your clients
            </Text>

            {/* Add Package Button */}
            <TouchableOpacity
              onPress={() => {
                setPackages([
                  ...packages,
                  {
                    name: "",
                    description: "",
                    sessionsPerMonth: "",
                    monthlyAmount: "",
                    currency: "INR",
                  },
                ]);
              }}
              className="flex-row items-center justify-center px-4 py-3 rounded-xl mb-4"
              style={{
                backgroundColor: `${colors.primary}15`,
                borderWidth: 1,
                borderColor: colors.primary,
                borderStyle: "dashed",
              }}
            >
              <Ionicons name="add-circle" size={20} color={colors.primary} />
              <Text
                className="text-sm font-semibold ml-2"
                style={{ color: colors.primary }}
              >
                Add Another Package
              </Text>
            </TouchableOpacity>

            {/* Packages List */}
            {packages.map((pkg, index) => (
              <View
                key={index}
                className="rounded-2xl p-4 mb-4"
                style={{
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  ...shadows.small,
                }}
              >
                <View className="flex-row items-center justify-between mb-3">
                  <Text
                    className="text-base font-bold"
                    style={{ color: colors.text }}
                  >
                    Package {index + 1}
                  </Text>
                  {packages.length > 1 && (
                    <TouchableOpacity
                      onPress={() => {
                        setPackages(packages.filter((_, i) => i !== index));
                      }}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={20}
                        color={colors.error}
                      />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Package Name */}
                <View className="mb-3">
                  <Text
                    className="text-xs font-semibold mb-1.5"
                    style={{ color: colors.textSecondary }}
                  >
                    Package Name *
                  </Text>
                  <TextInput
                    className="rounded-xl py-3 px-4 text-sm"
                    style={{
                      backgroundColor: colors.background,
                      borderWidth: 1,
                      borderColor: colors.border,
                      color: colors.text,
                    }}
                    placeholder="e.g., Starter Pack"
                    placeholderTextColor={colors.textSecondary}
                    value={pkg.name}
                    onChangeText={(text) => {
                      const newPackages = [...packages];
                      newPackages[index].name = text;
                      setPackages(newPackages);
                    }}
                  />
                </View>

                {/* Package Description */}
                <View className="mb-3">
                  <Text
                    className="text-xs font-semibold mb-1.5"
                    style={{ color: colors.textSecondary }}
                  >
                    Description
                  </Text>
                  <TextInput
                    className="rounded-xl py-3 px-4 text-sm"
                    style={{
                      backgroundColor: colors.background,
                      borderWidth: 1,
                      borderColor: colors.border,
                      color: colors.text,
                      minHeight: 60,
                      textAlignVertical: "top",
                    }}
                    placeholder="Brief description of the package"
                    placeholderTextColor={colors.textSecondary}
                    multiline
                    value={pkg.description}
                    onChangeText={(text) => {
                      const newPackages = [...packages];
                      newPackages[index].description = text;
                      setPackages(newPackages);
                    }}
                  />
                </View>

                {/* Sessions and Duration */}
                <View className="mb-3">
                  <Text
                    className="text-xs font-semibold mb-1.5"
                    style={{ color: colors.textSecondary }}
                  >
                    Sessions Per Month *
                  </Text>
                  <TextInput
                    className="rounded-xl py-3 px-4 text-sm"
                    style={{
                      backgroundColor: colors.background,
                      borderWidth: 1,
                      borderColor: colors.border,
                      color: colors.text,
                    }}
                    placeholder="e.g., 12"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                    value={pkg.sessionsPerMonth}
                    onChangeText={(text) => {
                      const newPackages = [...packages];
                      newPackages[index].sessionsPerMonth = text;
                      setPackages(newPackages);
                    }}
                  />
                </View>

                {/* Amount and Currency */}
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Text
                      className="text-xs font-semibold mb-1.5"
                      style={{ color: colors.textSecondary }}
                    >
                      Monthly Amount *
                    </Text>
                    <TextInput
                      className="rounded-xl py-3 px-4 text-sm"
                      style={{
                        backgroundColor: colors.background,
                        borderWidth: 1,
                        borderColor: colors.border,
                        color: colors.text,
                      }}
                      placeholder="e.g., 5000"
                      placeholderTextColor={colors.textSecondary}
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
                      className="text-xs font-semibold mb-1.5"
                      style={{ color: colors.textSecondary }}
                    >
                      Currency
                    </Text>
                    <View
                      className="rounded-xl py-3 px-4 justify-center"
                      style={{
                        backgroundColor: colors.background,
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}
                    >
                      <Text className="text-sm" style={{ color: colors.text }}>
                        {pkg.currency}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
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
    </KeyboardAvoidingView>
  );
}
