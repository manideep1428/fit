import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getColors, Shadows } from "@/constants/colors";
import { StatusBar } from "expo-status-bar";
import { useUser } from "@clerk/clerk-expo";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

export default function TrainerDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useUser();
  const scheme = useColorScheme();
  const colors = getColors(scheme === "dark");
  const shadows = scheme === "dark" ? Shadows.dark : Shadows.light;
  const insets = useSafeAreaInsets();

  const trainerId = params.trainerId as string;
  const trainerName = params.trainerName as string;
  const trainerSpecialty =
    (params.trainerSpecialty as string) || "Personal Trainer";

  // Fetch trainer details
  const trainer = useQuery(
    api.users.getUserByClerkId,
    trainerId ? { clerkId: trainerId } : "skip",
  );

  // Fetch client's subscription with this trainer
  const subscriptions = useQuery(
    api.subscriptions.getClientSubscriptions,
    user?.id ? { clientId: user.id } : "skip",
  );

  // Fetch client's bookings with this trainer
  const bookings = useQuery(
    api.bookings.getClientBookings,
    user?.id ? { clientId: user.id } : "skip",
  );

  // Filter bookings for this trainer
  const trainerBookings =
    bookings?.filter((b: any) => b.trainerId === trainerId) || [];

  // Get active subscription with this trainer
  const activeSubscription = subscriptions?.find(
    (s: any) =>
      s.trainerId === trainerId &&
      s.status === "active" &&
      s.paymentStatus === "paid",
  );

  // Calculate stats
  const completedSessions = trainerBookings.filter(
    (b: any) => b.status === "completed",
  ).length;

  const upcomingSessions = trainerBookings.filter((b: any) => {
    const sessionDateTime = new Date(`${b.date}T${b.startTime}:00`);
    return sessionDateTime >= new Date() && b.status !== "cancelled";
  }).length;

  const handleBookSession = () => {
    router.push({
      pathname: "/(client)/book-trainer",
      params: {
        trainerId: trainerId,
        trainerName: trainerName || trainer?.fullName,
        trainerSpecialty:
          trainerSpecialty || trainer?.specialty || "Personal Trainer",
      },
    } as any);
  };

  const handleViewPackages = () => {
    router.push({
      pathname: "/(client)/trainer-subscriptions",
      params: {
        trainerId: trainerId,
        trainerName: trainerName || trainer?.fullName,
      },
    } as any);
  };

  if (!trainerId) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: colors.background }}
      >
        <Text style={{ color: colors.text }}>Trainer not found</Text>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />

      {/* Header with Gradient */}
      <LinearGradient
        colors={[colors.primary, `${colors.primary}CC`, `${colors.primary}66`]}
        className="absolute top-0 left-0 right-0 h-72"
      />

      {/* Back Button */}
      <View
        className="absolute top-0 left-0 right-0 z-10 px-4 flex-row items-center justify-between"
        style={{ paddingTop: insets.top + 8 }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.2)" }}
        >
          <Ionicons name="arrow-back" size={22} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >
        {/* Trainer Profile Section */}
        <View className="items-center pt-20 pb-8 px-6">
          <View
            className="w-28 h-28 rounded-full overflow-hidden items-center justify-center mb-4"
            style={{
              backgroundColor: "#FFF",
              borderWidth: 4,
              borderColor: "rgba(255,255,255,0.3)",
              ...shadows.large,
            }}
          >
            {trainer?.profileImageId ? (
              <Image
                source={{ uri: trainer.profileImageId }}
                className="w-full h-full"
              />
            ) : (
              <View
                className="w-full h-full items-center justify-center"
                style={{ backgroundColor: colors.primary }}
              >
                <Text className="text-4xl font-bold text-white">
                  {(trainerName || trainer?.fullName)?.[0] || "T"}
                </Text>
              </View>
            )}
          </View>
          <Text className="text-2xl font-bold text-white mb-1">
            {trainerName || trainer?.fullName || "Trainer"}
          </Text>
          <View className="flex-row items-center">
            <Ionicons name="fitness" size={16} color="rgba(255,255,255,0.8)" />
            <Text className="text-sm text-white opacity-80 ml-1">
              {trainerSpecialty || trainer?.specialty || "Personal Trainer"}
            </Text>
          </View>
        </View>

        {/* Content */}
        <View
          className="flex-1 rounded-t-3xl px-4 pt-6"
          style={{ backgroundColor: colors.background, marginTop: -20 }}
        >
          {/* Stats Cards */}
          <View className="flex-row gap-3 mb-6">
            <View
              className="flex-1 rounded-2xl p-4 items-center"
              style={{ backgroundColor: colors.surface, ...shadows.small }}
            >
              <Text
                className="text-3xl font-bold mb-1"
                style={{ color: colors.primary }}
              >
                {completedSessions}
              </Text>
              <Text
                className="text-xs text-center"
                style={{ color: colors.textSecondary }}
              >
                Completed{"\n"}Sessions
              </Text>
            </View>
            <View
              className="flex-1 rounded-2xl p-4 items-center"
              style={{ backgroundColor: colors.surface, ...shadows.small }}
            >
              <Text
                className="text-3xl font-bold mb-1"
                style={{ color: colors.success }}
              >
                {upcomingSessions}
              </Text>
              <Text
                className="text-xs text-center"
                style={{ color: colors.textSecondary }}
              >
                Upcoming{"\n"}Sessions
              </Text>
            </View>
            <View
              className="flex-1 rounded-2xl p-4 items-center"
              style={{ backgroundColor: colors.surface, ...shadows.small }}
            >
              <Text
                className="text-3xl font-bold mb-1"
                style={{ color: colors.warning }}
              >
                {activeSubscription?.remainingSessions || 0}
              </Text>
              <Text
                className="text-xs text-center"
                style={{ color: colors.textSecondary }}
              >
                Sessions{"\n"}Remaining
              </Text>
            </View>
          </View>

          {/* Active Subscription Card */}
          {activeSubscription ? (
            <View className="mb-6">
              <Text
                className="text-lg font-bold mb-3"
                style={{ color: colors.text }}
              >
                Active Package
              </Text>
              <View
                className="rounded-2xl p-4"
                style={{
                  backgroundColor: colors.surface,
                  ...shadows.medium,
                  borderLeftWidth: 4,
                  borderLeftColor: colors.success,
                }}
              >
                <View className="flex-row items-center justify-between mb-3">
                  <View>
                    <Text
                      className="text-base font-bold"
                      style={{ color: colors.text }}
                    >
                      {activeSubscription.planName}
                    </Text>
                    <Text
                      className="text-sm"
                      style={{ color: colors.textSecondary }}
                    >
                      {activeSubscription.sessionsPerMonth} sessions/month
                    </Text>
                  </View>
                  <View
                    className="px-3 py-1 rounded-full"
                    style={{ backgroundColor: `${colors.success}20` }}
                  >
                    <Text
                      className="text-xs font-bold"
                      style={{ color: colors.success }}
                    >
                      ACTIVE
                    </Text>
                  </View>
                </View>
                <View className="flex-row gap-2">
                  <View
                    className="flex-1 rounded-xl p-3"
                    style={{ backgroundColor: `${colors.primary}15` }}
                  >
                    <Text
                      className="text-xl font-bold"
                      style={{ color: colors.primary }}
                    >
                      {activeSubscription.remainingSessions}
                    </Text>
                    <Text
                      className="text-xs"
                      style={{ color: colors.textSecondary }}
                    >
                      Sessions left
                    </Text>
                  </View>
                  <View
                    className="flex-1 rounded-xl p-3"
                    style={{ backgroundColor: `${colors.primary}15` }}
                  >
                    <Text
                      className="text-sm font-bold"
                      style={{ color: colors.primary }}
                    >
                      {activeSubscription.currentPeriodEnd
                        ? new Date(
                            activeSubscription.currentPeriodEnd,
                          ).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })
                        : "N/A"}
                    </Text>
                    <Text
                      className="text-xs"
                      style={{ color: colors.textSecondary }}
                    >
                      Expires
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ) : (
            <View className="mb-6">
              <Text
                className="text-lg font-bold mb-3"
                style={{ color: colors.text }}
              >
                No Active Package
              </Text>
              <View
                className="rounded-2xl p-5 items-center"
                style={{
                  backgroundColor: colors.surface,
                  ...shadows.medium,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderStyle: "dashed",
                }}
              >
                <View
                  className="w-14 h-14 rounded-full items-center justify-center mb-3"
                  style={{ backgroundColor: `${colors.warning}15` }}
                >
                  <Ionicons
                    name="card-outline"
                    size={28}
                    color={colors.warning}
                  />
                </View>
                <Text
                  className="text-base font-semibold mb-1 text-center"
                  style={{ color: colors.text }}
                >
                  Subscribe to Book Sessions
                </Text>
                <Text
                  className="text-sm text-center mb-4"
                  style={{ color: colors.textSecondary }}
                >
                  Get a package to start booking sessions with this trainer
                </Text>
                <TouchableOpacity
                  onPress={handleViewPackages}
                  className="rounded-xl py-3 px-6 flex-row items-center"
                  style={{ backgroundColor: colors.primary }}
                >
                  <Ionicons name="pricetag" size={18} color="#FFF" />
                  <Text className="text-white font-semibold ml-2">
                    View Packages
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* About Section */}
          {trainer?.bio && (
            <View className="mb-6">
              <Text
                className="text-lg font-bold mb-3"
                style={{ color: colors.text }}
              >
                About
              </Text>
              <View
                className="rounded-2xl p-4"
                style={{ backgroundColor: colors.surface, ...shadows.small }}
              >
                <Text
                  className="text-sm leading-relaxed"
                  style={{ color: colors.textSecondary }}
                >
                  {trainer.bio}
                </Text>
              </View>
            </View>
          )}

          {/* Quick Actions */}
          <View className="mb-6">
            <Text
              className="text-lg font-bold mb-3"
              style={{ color: colors.text }}
            >
              Quick Actions
            </Text>
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() =>
                  router.push(
                    "/(client)/session-history?from=trainer-details" as any,
                  )
                }
                className="flex-1 rounded-2xl p-4 flex-row items-center"
                style={{ backgroundColor: colors.surface, ...shadows.small }}
              >
                <View
                  className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                  style={{ backgroundColor: `${colors.primary}15` }}
                >
                  <Ionicons name="time" size={20} color={colors.primary} />
                </View>
                <View className="flex-1">
                  <Text
                    className="text-sm font-semibold"
                    style={{ color: colors.text }}
                  >
                    Session History
                  </Text>
                  <Text
                    className="text-xs"
                    style={{ color: colors.textSecondary }}
                  >
                    View past sessions
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
            <View className="flex-row gap-3 mt-3">
              <TouchableOpacity
                onPress={handleViewPackages}
                className="flex-1 rounded-2xl p-4 flex-row items-center"
                style={{ backgroundColor: colors.surface, ...shadows.small }}
              >
                <View
                  className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                  style={{ backgroundColor: `${colors.success}15` }}
                >
                  <Ionicons name="pricetag" size={20} color={colors.success} />
                </View>
                <View className="flex-1">
                  <Text
                    className="text-sm font-semibold"
                    style={{ color: colors.text }}
                  >
                    View Packages
                  </Text>
                  <Text
                    className="text-xs"
                    style={{ color: colors.textSecondary }}
                  >
                    Browse subscription plans
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Floating Book Button */}
      <View
        className="absolute bottom-0 left-0 right-0 px-4 pb-4"
        style={{
          paddingBottom: insets.bottom + 16,
          backgroundColor: colors.background,
        }}
      >
        <LinearGradient
          colors={["transparent", colors.background]}
          className="absolute top-0 left-0 right-0 -mt-8 h-8"
          pointerEvents="none"
        />
        <TouchableOpacity
          onPress={activeSubscription ? handleBookSession : handleViewPackages}
          className="rounded-2xl py-4 flex-row items-center justify-center"
          style={{
            backgroundColor: colors.primary,
            ...shadows.large,
          }}
        >
          <Ionicons
            name={activeSubscription ? "calendar" : "pricetag"}
            size={22}
            color="#FFF"
          />
          <Text className="text-lg font-bold ml-2 text-white">
            {activeSubscription ? "Book a Session" : "View Packages"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
