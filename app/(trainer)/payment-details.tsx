import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getColors, Shadows } from "@/constants/colors";
import { StatusBar } from "expo-status-bar";
import { useUser } from "@clerk/clerk-expo";
import { showToast } from "@/utils/toast";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Id } from "@/convex/_generated/dataModel";

export default function PaymentDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useUser();
  const scheme = useColorScheme();
  const colors = getColors(scheme === "dark");
  const shadows = scheme === "dark" ? Shadows.dark : Shadows.light;
  const insets = useSafeAreaInsets();

  const subscription = useQuery(
    api.subscriptions.getSubscriptionById,
    id ? { subscriptionId: id as Id<"clientSubscriptions"> } : "skip"
  ) as any;

  const packages = useQuery(
    api.packages.getTrainerPackages,
    user?.id ? { trainerId: user.id } : "skip"
  );

  const markOfflinePaymentPaid = useMutation(
    api.subscriptions.markOfflinePaymentPaid
  );
  const cancelSubscription = useMutation(api.subscriptions.cancelSubscription);

  const handleApprovePayment = () => {
    if (!subscription) return;
    Alert.alert(
      "Approve Payment",
      "Confirm that the client has paid offline?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve",
          onPress: async () => {
            try {
              await markOfflinePaymentPaid({
                subscriptionId: subscription._id,
              });
              showToast.success("Approved");
              router.back();
            } catch (error) {
              showToast.error("Approve failed");
            }
          },
        },
      ]
    );
  };

  const handleCancel = () => {
    if (!subscription) return;
    Alert.alert(
      "Cancel Subscription",
      `Are you sure you want to cancel ${subscription.clientName}'s subscription?`,
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            try {
              await cancelSubscription({ subscriptionId: subscription._id });
              showToast.success("Cancelled");
              router.back();
            } catch (error) {
              showToast.error("Cancel failed");
            }
          },
        },
      ]
    );
  };

  const formatCurrency = (amount: number | undefined) => {
    const safeAmount = amount || 0;
    return `$${safeAmount.toLocaleString()}`;
  };

  const getPackageName = (packageId: any) => {
    if (!packages) return "Loading...";
    const pkg = packages.find((p: any) => p._id === packageId);
    return pkg?.name || "Unknown Package";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return colors.success;
      case "expired":
        return colors.error;
      case "cancelled":
        return colors.textTertiary;
      default:
        return colors.textSecondary;
    }
  };

  if (!subscription || !packages) {
    return (
      <View className="flex-1" style={{ backgroundColor: colors.background }}>
        <StatusBar style={scheme === "dark" ? "light" : "dark"} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  const isPending = subscription.paymentStatus === "pending";
  const progressPercentage =
    (subscription.remainingSessions / subscription.totalSessions) * 100;
  const isExpiringSoon =
    subscription.remainingSessions <= 3 && subscription.status === "active";

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
            Payment Details
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      >
        {/* Client Info Card */}
        <View
          className="rounded-2xl p-6 mb-4"
          style={{
            backgroundColor: colors.surface,
            ...shadows.medium,
            borderLeftWidth: 4,
            borderLeftColor: isPending
              ? colors.warning
              : getStatusColor(subscription.status),
          }}
        >
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-1">
              <Text
                className="text-2xl font-bold mb-2"
                style={{ color: colors.text }}
              >
                {subscription.clientName}
              </Text>
              <View
                className="px-3 py-1 rounded-full self-start"
                style={{
                  backgroundColor: `${isPending ? colors.warning : getStatusColor(subscription.status)}20`,
                }}
              >
                <Text
                  className="text-sm font-semibold"
                  style={{
                    color: isPending
                      ? colors.warning
                      : getStatusColor(subscription.status),
                  }}
                >
                  {isPending
                    ? "Pending Approval"
                    : subscription.status.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>

          <View className="flex-row items-center justify-between">
            <View>
              <Text
                className="text-xs mb-1"
                style={{ color: colors.textSecondary }}
              >
                Payment Amount
              </Text>
              <Text
                className="text-3xl font-bold"
                style={{
                  color: isPending ? colors.warning : colors.primary,
                }}
              >
                {formatCurrency(subscription.finalAmount)}
              </Text>
              <Text
                className="text-xs mt-1"
                style={{ color: colors.textSecondary }}
              >
                {getPackageName(subscription.packageId)}
              </Text>
            </View>
          </View>
        </View>

        {/* Session Stats */}
        <View className="mb-4">
          <Text
            className="text-base font-bold mb-3 ml-2"
            style={{ color: colors.text }}
          >
            Session Statistics
          </Text>
          <View className="flex-row gap-3 mb-3">
            <View
              className="flex-1 rounded-xl p-4"
              style={{ backgroundColor: colors.surface, ...shadows.small }}
            >
              <View
                className="w-12 h-12 rounded-full items-center justify-center mb-3"
                style={{ backgroundColor: `${colors.primary}20` }}
              >
                <Ionicons name="hourglass" size={24} color={colors.primary} />
              </View>
              <Text
                className="text-3xl font-bold mb-1"
                style={{ color: colors.primary }}
              >
                {subscription.remainingSessions}
              </Text>
              <Text className="text-xs" style={{ color: colors.textSecondary }}>
                Sessions Remaining
              </Text>
            </View>
            <View
              className="flex-1 rounded-xl p-4"
              style={{ backgroundColor: colors.surface, ...shadows.small }}
            >
              <View
                className="w-12 h-12 rounded-full items-center justify-center mb-3"
                style={{ backgroundColor: `${colors.success}20` }}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color={colors.success}
                />
              </View>
              <Text
                className="text-3xl font-bold mb-1"
                style={{ color: colors.success }}
              >
                {subscription.totalSessions - subscription.remainingSessions}
              </Text>
              <Text className="text-xs" style={{ color: colors.textSecondary }}>
                Sessions Used
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View
            className="rounded-xl p-4"
            style={{ backgroundColor: colors.surface, ...shadows.small }}
          >
            <View className="flex-row justify-between mb-2">
              <Text
                className="text-sm font-semibold"
                style={{ color: colors.text }}
              >
                Progress
              </Text>
              <Text
                className="text-sm font-bold"
                style={{ color: colors.primary }}
              >
                {subscription.totalSessions - subscription.remainingSessions} /{" "}
                {subscription.totalSessions}
              </Text>
            </View>
            <View
              className="h-3 rounded-full overflow-hidden"
              style={{ backgroundColor: colors.border }}
            >
              <View
                className="h-full rounded-full"
                style={{
                  width: `${100 - progressPercentage}%`,
                  backgroundColor: isExpiringSoon
                    ? colors.warning
                    : colors.primary,
                }}
              />
            </View>
            {isExpiringSoon && (
              <View
                className="flex-row items-center mt-3 p-2 rounded-lg"
                style={{ backgroundColor: `${colors.warning}15` }}
              >
                <Ionicons
                  name="alert-circle"
                  size={16}
                  color={colors.warning}
                />
                <Text
                  className="text-xs ml-2"
                  style={{ color: colors.warning }}
                >
                  Only {subscription.remainingSessions} sessions remaining
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Subscription Period */}
        {subscription.startDate && subscription.endDate && (
          <View className="mb-4">
            <Text
              className="text-base font-bold mb-3 ml-2"
              style={{ color: colors.text }}
            >
              Subscription Period
            </Text>
            <View
              className="rounded-2xl p-4"
              style={{
                backgroundColor: colors.surface,
                ...shadows.medium,
              }}
            >
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-1">
                  <View className="flex-row items-center mb-2">
                    <Ionicons
                      name="play-circle"
                      size={20}
                      color={colors.primary}
                    />
                    <Text
                      className="text-xs font-semibold ml-2"
                      style={{ color: colors.textSecondary }}
                    >
                      Start Date
                    </Text>
                  </View>
                  <Text
                    className="text-lg font-bold"
                    style={{ color: colors.text }}
                  >
                    {new Date(subscription.startDate).toLocaleDateString(
                      "en-US",
                      {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      }
                    )}
                  </Text>
                </View>
              </View>
              <View
                className="h-px mb-4"
                style={{ backgroundColor: colors.border }}
              />
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <View className="flex-row items-center mb-2">
                    <Ionicons
                      name="stop-circle"
                      size={20}
                      color={colors.error}
                    />
                    <Text
                      className="text-xs font-semibold ml-2"
                      style={{ color: colors.textSecondary }}
                    >
                      End Date
                    </Text>
                  </View>
                  <Text
                    className="text-lg font-bold"
                    style={{ color: colors.text }}
                  >
                    {new Date(subscription.endDate).toLocaleDateString(
                      "en-US",
                      {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      }
                    )}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Payment Details */}
        <View className="mb-4">
          <Text
            className="text-base font-bold mb-3 ml-2"
            style={{ color: colors.text }}
          >
            Payment Details
          </Text>
          <View
            className="rounded-2xl p-4"
            style={{ backgroundColor: colors.surface, ...shadows.medium }}
          >
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-sm" style={{ color: colors.textSecondary }}>
                Payment Method
              </Text>
              <View className="flex-row items-center">
                <Ionicons
                  name={
                    subscription.paymentMethod === "online" ? "card" : "cash"
                  }
                  size={16}
                  color={colors.primary}
                />
                <Text
                  className="text-sm font-semibold ml-2"
                  style={{ color: colors.text }}
                >
                  {subscription.paymentMethod === "online"
                    ? "Online"
                    : "Offline"}
                </Text>
              </View>
            </View>
            <View
              className="h-px mb-3"
              style={{ backgroundColor: colors.border }}
            />
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-sm" style={{ color: colors.textSecondary }}>
                Payment Status
              </Text>
              <View
                className="px-3 py-1 rounded-full"
                style={{
                  backgroundColor: `${isPending ? colors.warning : colors.success}20`,
                }}
              >
                <Text
                  className="text-sm font-bold"
                  style={{
                    color: isPending ? colors.warning : colors.success,
                  }}
                >
                  {subscription.paymentStatus.toUpperCase()}
                </Text>
              </View>
            </View>
            {subscription.discount > 0 && (
              <>
                <View
                  className="h-px mb-3"
                  style={{ backgroundColor: colors.border }}
                />
                <View className="flex-row items-center justify-between">
                  <Text
                    className="text-sm"
                    style={{ color: colors.textSecondary }}
                  >
                    Discount Applied
                  </Text>
                  <View
                    className="px-3 py-1 rounded-full"
                    style={{ backgroundColor: `${colors.success}20` }}
                  >
                    <Text
                      className="text-sm font-bold"
                      style={{ color: colors.success }}
                    >
                      {subscription.discount}% OFF
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View className="gap-3">
          {isPending && (
            <TouchableOpacity
              onPress={handleApprovePayment}
              className="rounded-xl py-4 flex-row items-center justify-center"
              style={{ backgroundColor: colors.success, ...shadows.medium }}
            >
              <Ionicons name="checkmark-circle" size={20} color="#FFF" />
              <Text className="ml-2 font-bold text-white text-base">
                Approve Offline Payment
              </Text>
            </TouchableOpacity>
          )}
          {subscription.status === "active" && (
            <TouchableOpacity
              onPress={handleCancel}
              className="rounded-xl py-4 flex-row items-center justify-center"
              style={{ backgroundColor: `${colors.error}15` }}
            >
              <Ionicons name="close-circle" size={20} color={colors.error} />
              <Text
                className="ml-2 font-bold text-base"
                style={{ color: colors.error }}
              >
                Cancel Subscription
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
