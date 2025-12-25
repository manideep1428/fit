import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getColors, Shadows } from "@/constants/colors";
import { StatusBar } from "expo-status-bar";
import { useUser } from "@clerk/clerk-expo";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

export default function MySubscriptionsScreen() {
  const router = useRouter();
  const { user } = useUser();
  const scheme = useColorScheme();
  const colors = getColors(scheme === "dark");
  const shadows = scheme === "dark" ? Shadows.dark : Shadows.light;
  const insets = useSafeAreaInsets();

  const subscriptions = useQuery(
    api.subscriptions.getClientSubscriptions,
    user?.id ? { clientId: user.id } : "skip"
  );

  const getStatusColor = (status: string, paymentStatus?: string) => {
    if (paymentStatus === "pending") return colors.warning;
    switch (status) {
      case "active":
        return colors.success;
      case "pending":
        return colors.warning;
      case "expired":
        return colors.error;
      case "cancelled":
        return colors.textTertiary;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusText = (status: string, paymentStatus?: string) => {
    if (paymentStatus === "pending") return "Pending Approval";
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const formatCurrency = (amount: number | undefined, currency: string) => {
    const symbols: { [key: string]: string } = {
      INR: "₹",
      USD: "$",
      EUR: "€",
      GBP: "£",
      NOK: "kr",
    };
    const safeAmount = amount || 0;
    return `${symbols[currency] || currency}${safeAmount.toFixed(0)}`;
  };

  const activeSubscriptions =
    subscriptions?.filter(
      (s) => s.status === "active" && s.paymentStatus === "paid"
    ) || [];
  const pendingSubscriptions =
    subscriptions?.filter((s) => s.paymentStatus === "pending") || [];
  const pastSubscriptions =
    subscriptions?.filter(
      (s) =>
        s.status !== "active" ||
        (s.status === "active" &&
          s.paymentStatus !== "paid" &&
          s.paymentStatus !== "pending")
    ) || [];

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />

      {/* Gradient Background */}
      <LinearGradient
        colors={[`${colors.primary}33`, `${colors.primary}0D`, "transparent"]}
        className="absolute top-0 left-0 right-0 h-80"
        pointerEvents="none"
      />

      {/* Header */}
      <View className="px-4 pb-4" style={{ paddingTop: insets.top + 12 }}>
        <View className="flex-row items-center mb-4">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text className="text-2xl font-bold" style={{ color: colors.text }}>
            My Subscriptions
          </Text>
        </View>

        {/* Summary Stats */}
        <View className="flex-row gap-3">
          <View
            className="flex-1 rounded-2xl p-4"
            style={{ backgroundColor: colors.surface, ...shadows.small }}
          >
            <Text
              className="text-3xl font-bold mb-1"
              style={{ color: colors.primary }}
            >
              {activeSubscriptions.length}
            </Text>
            <Text className="text-xs" style={{ color: colors.textSecondary }}>
              Active
            </Text>
          </View>
          <View
            className="flex-1 rounded-2xl p-4"
            style={{ backgroundColor: colors.surface, ...shadows.small }}
          >
            <Text
              className="text-3xl font-bold mb-1"
              style={{ color: colors.warning }}
            >
              {pendingSubscriptions.length}
            </Text>
            <Text className="text-xs" style={{ color: colors.textSecondary }}>
              Pending
            </Text>
          </View>
          <View
            className="flex-1 rounded-2xl p-4"
            style={{ backgroundColor: colors.surface, ...shadows.small }}
          >
            <Text
              className="text-3xl font-bold mb-1"
              style={{ color: colors.text }}
            >
              {subscriptions?.length || 0}
            </Text>
            <Text className="text-xs" style={{ color: colors.textSecondary }}>
              Total
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      >
        {!subscriptions ? (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : subscriptions.length === 0 ? (
          <View
            className="rounded-2xl p-8 items-center mt-4"
            style={{ backgroundColor: colors.surface, ...shadows.medium }}
          >
            <View
              className="w-20 h-20 rounded-full items-center justify-center mb-4"
              style={{ backgroundColor: `${colors.primary}15` }}
            >
              <Ionicons name="card-outline" size={40} color={colors.primary} />
            </View>
            <Text
              className="text-lg font-bold mb-2"
              style={{ color: colors.text }}
            >
              No Subscriptions Yet
            </Text>
            <Text
              className="text-center mb-6"
              style={{ color: colors.textSecondary }}
            >
              Subscribe to a trainer's plan to start booking sessions
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/(client)/find-trainers" as any)}
              className="rounded-xl py-3 px-6 flex-row items-center"
              style={{ backgroundColor: colors.primary }}
            >
              <Ionicons name="search" size={18} color="#FFF" />
              <Text className="text-white font-semibold ml-2">
                Find Trainers
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Pending Subscriptions */}
            {pendingSubscriptions.length > 0 && (
              <View className="mb-6">
                <View className="flex-row items-center mb-3">
                  <Ionicons
                    name="time-outline"
                    size={20}
                    color={colors.warning}
                  />
                  <Text
                    className="text-base font-bold ml-2"
                    style={{ color: colors.text }}
                  >
                    Pending Approval
                  </Text>
                  <View
                    className="ml-2 px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: colors.warning }}
                  >
                    <Text className="text-white text-xs font-bold">
                      {pendingSubscriptions.length}
                    </Text>
                  </View>
                </View>

                {pendingSubscriptions.map((sub: any) => (
                  <View
                    key={sub._id}
                    className="rounded-2xl p-4 mb-3"
                    style={{
                      backgroundColor: colors.surface,
                      ...shadows.medium,
                      borderLeftWidth: 4,
                      borderLeftColor: colors.warning,
                    }}
                  >
                    <View className="flex-row items-start justify-between mb-2">
                      <View className="flex-1">
                        <Text
                          className="text-base font-bold mb-1"
                          style={{ color: colors.text }}
                        >
                          {sub.trainerName}
                        </Text>
                        <View
                          className="px-2 py-0.5 rounded-full self-start mb-2"
                          style={{ backgroundColor: `${colors.primary}20` }}
                        >
                          <Text
                            className="text-xs font-semibold"
                            style={{ color: colors.primary }}
                          >
                            {sub.planName}
                          </Text>
                        </View>
                        <Text
                          className="text-sm"
                          style={{ color: colors.textSecondary }}
                        >
                          {sub.sessionsPerMonth} sessions/month
                        </Text>
                      </View>
                      <View className="items-end">
                        <Text
                          className="text-xl font-bold"
                          style={{ color: colors.primary }}
                        >
                          {formatCurrency(sub.totalAmount, sub.planCurrency)}
                        </Text>
                        <Text
                          className="text-xs"
                          style={{ color: colors.textSecondary }}
                        >
                          {sub.billingMonths === 1
                            ? "per month"
                            : `${sub.billingMonths} months`}
                        </Text>
                      </View>
                    </View>

                    {sub.discount > 0 && (
                      <View
                        className="px-3 py-1.5 rounded-lg self-start mb-3"
                        style={{ backgroundColor: `${colors.success}15` }}
                      >
                        <Text
                          className="text-sm font-semibold"
                          style={{ color: colors.success }}
                        >
                          {sub.discount}% discount applied
                        </Text>
                      </View>
                    )}

                    <View
                      className="p-3 rounded-xl"
                      style={{ backgroundColor: `${colors.warning}10` }}
                    >
                      <View className="flex-row items-center">
                        <Ionicons
                          name="hourglass-outline"
                          size={16}
                          color={colors.warning}
                        />
                        <Text
                          className="text-xs ml-2 flex-1"
                          style={{ color: colors.textSecondary }}
                        >
                          Waiting for trainer approval. You'll be notified once
                          approved.
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Active Subscriptions */}
            <View className="mb-6">
              <View className="flex-row items-center mb-3">
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={colors.success}
                />
                <Text
                  className="text-base font-bold ml-2"
                  style={{ color: colors.text }}
                >
                  Active Subscriptions
                </Text>
              </View>

              {activeSubscriptions.length === 0 ? (
                <View
                  className="rounded-2xl p-6 items-center"
                  style={{ backgroundColor: colors.surface, ...shadows.small }}
                >
                  <Ionicons
                    name="card-outline"
                    size={40}
                    color={colors.textTertiary}
                  />
                  <Text
                    className="mt-3 font-medium"
                    style={{ color: colors.textSecondary }}
                  >
                    No active subscriptions
                  </Text>
                </View>
              ) : (
                activeSubscriptions.map((sub: any) => (
                  <View
                    key={sub._id}
                    className="rounded-2xl p-4 mb-3"
                    style={{
                      backgroundColor: colors.surface,
                      ...shadows.medium,
                      borderLeftWidth: 4,
                      borderLeftColor: colors.success,
                    }}
                  >
                    <View className="flex-row items-start justify-between mb-3">
                      <View className="flex-1">
                        <Text
                          className="text-base font-bold mb-1"
                          style={{ color: colors.text }}
                        >
                          {sub.trainerName}
                        </Text>
                        <View
                          className="px-2 py-0.5 rounded-full self-start mb-2"
                          style={{ backgroundColor: `${colors.primary}20` }}
                        >
                          <Text
                            className="text-xs font-semibold"
                            style={{ color: colors.primary }}
                          >
                            {sub.planName}
                          </Text>
                        </View>
                        <View className="flex-row items-center gap-2">
                          <Ionicons
                            name={
                              sub.billingType === "monthly"
                                ? "refresh"
                                : "calendar"
                            }
                            size={14}
                            color={colors.textSecondary}
                          />
                          <Text
                            className="text-xs"
                            style={{ color: colors.textSecondary }}
                          >
                            {sub.billingType === "monthly"
                              ? "Monthly"
                              : `${sub.billingMonths} months`}{" "}
                            • Ends{" "}
                            {new Date(
                              sub.currentPeriodEnd
                            ).toLocaleDateString()}
                          </Text>
                        </View>
                      </View>
                      <View
                        className="px-2 py-1 rounded-full"
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

                    {/* Session Stats */}
                    <View className="flex-row gap-2 mb-3">
                      <View
                        className="flex-1 rounded-xl p-3"
                        style={{ backgroundColor: `${colors.primary}15` }}
                      >
                        <Text
                          className="text-2xl font-bold"
                          style={{ color: colors.primary }}
                        >
                          {sub.remainingSessions}
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
                          className="text-2xl font-bold"
                          style={{ color: colors.primary }}
                        >
                          {sub.sessionsPerMonth}
                        </Text>
                        <Text
                          className="text-xs"
                          style={{ color: colors.textSecondary }}
                        >
                          Per month
                        </Text>
                      </View>
                    </View>

                    {/* Discount Badge */}
                    {sub.discount > 0 && (
                      <View
                        className="px-3 py-1.5 rounded-lg self-start mb-3"
                        style={{ backgroundColor: `${colors.success}15` }}
                      >
                        <Text
                          className="text-sm font-semibold"
                          style={{ color: colors.success }}
                        >
                          {sub.discount}% discount
                        </Text>
                      </View>
                    )}

                    {/* Low Sessions Warning */}
                    {sub.remainingSessions <= 3 &&
                      sub.remainingSessions > 0 && (
                        <View
                          className="p-3 rounded-xl"
                          style={{ backgroundColor: `${colors.warning}10` }}
                        >
                          <View className="flex-row items-center">
                            <Ionicons
                              name="alert-circle"
                              size={16}
                              color={colors.warning}
                            />
                            <Text
                              className="text-xs ml-2 flex-1"
                              style={{ color: colors.textSecondary }}
                            >
                              Sessions running low! Consider renewing soon.
                            </Text>
                          </View>
                        </View>
                      )}

                    {/* Action Button */}
                    <TouchableOpacity
                      onPress={() =>
                        router.push({
                          pathname: "/(client)/book-trainer",
                          params: {
                            trainerId: sub.trainerId,
                            trainerName: sub.trainerName || "Trainer",
                            trainerSpecialty:
                              sub.trainerSpecialty || "Personal Trainer",
                          },
                        } as any)
                      }
                      className="mt-3 rounded-xl py-3 flex-row items-center justify-center"
                      style={{ backgroundColor: colors.primary }}
                    >
                      <Ionicons name="calendar" size={18} color="#FFF" />
                      <Text className="text-white font-semibold ml-2">
                        Book a Session
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>

            {/* Past Subscriptions */}
            {pastSubscriptions.length > 0 && (
              <View className="mb-6">
                <View className="flex-row items-center mb-3">
                  <Ionicons
                    name="archive-outline"
                    size={20}
                    color={colors.textTertiary}
                  />
                  <Text
                    className="text-base font-bold ml-2"
                    style={{ color: colors.text }}
                  >
                    Past Subscriptions
                  </Text>
                </View>

                {pastSubscriptions.map((sub: any) => (
                  <View
                    key={sub._id}
                    className="rounded-2xl p-4 mb-3"
                    style={{
                      backgroundColor: colors.surface,
                      ...shadows.small,
                      opacity: 0.7,
                    }}
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1">
                        <Text
                          className="text-base font-semibold mb-1"
                          style={{ color: colors.text }}
                        >
                          {sub.planName}
                        </Text>
                        <Text
                          className="text-xs"
                          style={{ color: colors.textSecondary }}
                        >
                          {sub.sessionsPerMonth} sessions/month •{" "}
                          {formatCurrency(sub.totalAmount, sub.planCurrency)}
                        </Text>
                      </View>
                      <View
                        className="px-2 py-1 rounded-full"
                        style={{
                          backgroundColor: `${getStatusColor(sub.status, sub.paymentStatus)}20`,
                        }}
                      >
                        <Text
                          className="text-xs font-bold"
                          style={{
                            color: getStatusColor(
                              sub.status,
                              sub.paymentStatus
                            ),
                          }}
                        >
                          {getStatusText(
                            sub.status,
                            sub.paymentStatus
                          ).toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
