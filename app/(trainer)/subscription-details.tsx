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

export default function SubscriptionDetailsScreen() {
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
  ) as any; // Type assertion for enriched subscription data

  const renewSubscription = useMutation(api.subscriptions.renewSubscription);
  const cancelSubscription = useMutation(api.subscriptions.cancelSubscription);

  const handleRenew = () => {
    if (!subscription) return;
    Alert.alert(
      "Renew Subscription",
      `Renew ${subscription.clientName}'s subscription for another period?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Renew",
          onPress: async () => {
            try {
              await renewSubscription({
                subscriptionId: subscription._id,
                paymentStatus:
                  subscription.paymentMethod === "offline" ? "pending" : "paid",
              });
              showToast.success("Renewed");
              router.back();
            } catch (error) {
              showToast.error("Renew failed");
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

  if (!subscription) {
    return (
      <View className="flex-1" style={{ backgroundColor: colors.background }}>
        <StatusBar style={scheme === "dark" ? "light" : "dark"} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

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
            Subscription Details
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
            borderLeftColor: colors.success,
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
                style={{ backgroundColor: `${colors.primary}20` }}
              >
                <Text
                  className="text-sm font-semibold"
                  style={{ color: colors.primary }}
                >
                  {subscription.planName}
                </Text>
              </View>
            </View>
            <View
              className="px-3 py-1.5 rounded-full"
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

          <View className="flex-row items-center justify-between">
            <View>
              <Text
                className="text-xs mb-1"
                style={{ color: colors.textSecondary }}
              >
                Subscription Amount
              </Text>
              <Text
                className="text-3xl font-bold"
                style={{ color: colors.primary }}
              >
                {formatCurrency(
                  subscription.totalAmount,
                  subscription.planCurrency
                )}
              </Text>
              <Text className="text-xs" style={{ color: colors.textSecondary }}>
                {subscription.billingMonths === 1
                  ? "per month"
                  : `${subscription.billingMonths} months`}
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
          <View className="flex-row gap-3">
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
                {subscription.sessionsPerMonth - subscription.remainingSessions}
              </Text>
              <Text className="text-xs" style={{ color: colors.textSecondary }}>
                Sessions Used
              </Text>
            </View>
          </View>
          <View
            className="rounded-xl p-4 mt-3"
            style={{ backgroundColor: colors.surface, ...shadows.small }}
          >
            <View
              className="w-12 h-12 rounded-full items-center justify-center mb-3"
              style={{ backgroundColor: `${colors.textTertiary}20` }}
            >
              <Ionicons name="calendar" size={24} color={colors.text} />
            </View>
            <Text
              className="text-3xl font-bold mb-1"
              style={{ color: colors.text }}
            >
              {subscription.sessionsPerMonth}
            </Text>
            <Text className="text-xs" style={{ color: colors.textSecondary }}>
              Total Sessions Per Month
            </Text>
          </View>
        </View>

        {/* Subscription Period */}
        {subscription.currentPeriodStart && subscription.currentPeriodEnd && (
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
                      Period Start
                    </Text>
                  </View>
                  <Text
                    className="text-lg font-bold"
                    style={{ color: colors.text }}
                  >
                    {new Date(
                      subscription.currentPeriodStart
                    ).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
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
                      Period End
                    </Text>
                  </View>
                  <Text
                    className="text-lg font-bold"
                    style={{ color: colors.text }}
                  >
                    {new Date(subscription.currentPeriodEnd).toLocaleDateString(
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

        {/* Billing Details */}
        <View className="mb-4">
          <Text
            className="text-base font-bold mb-3 ml-2"
            style={{ color: colors.text }}
          >
            Billing Details
          </Text>
          <View
            className="rounded-2xl p-4"
            style={{ backgroundColor: colors.surface, ...shadows.medium }}
          >
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-sm" style={{ color: colors.textSecondary }}>
                Billing Type
              </Text>
              <View className="flex-row items-center">
                <Ionicons
                  name={
                    subscription.billingType === "monthly"
                      ? "refresh"
                      : "calendar"
                  }
                  size={16}
                  color={colors.primary}
                />
                <Text
                  className="text-sm font-semibold ml-2"
                  style={{ color: colors.text }}
                >
                  {subscription.billingType === "monthly"
                    ? "Monthly"
                    : `${subscription.billingMonths} Months`}
                </Text>
              </View>
            </View>
            <View
              className="h-px mb-3"
              style={{ backgroundColor: colors.border }}
            />
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-sm" style={{ color: colors.textSecondary }}>
                Payment Method
              </Text>
              <Text
                className="text-sm font-semibold"
                style={{ color: colors.text }}
              >
                {subscription.paymentMethod === "offline"
                  ? "Offline"
                  : "Online"}
              </Text>
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

        {/* Timestamps */}
        {(subscription.createdAt || subscription.approvedAt) && (
          <View className="mb-4">
            <Text
              className="text-base font-bold mb-3 ml-2"
              style={{ color: colors.text }}
            >
              Timeline
            </Text>
            <View
              className="rounded-2xl p-4"
              style={{ backgroundColor: colors.surface, ...shadows.small }}
            >
              {subscription.createdAt && (
                <View className="flex-row items-center mb-3">
                  <Ionicons
                    name="calendar-outline"
                    size={16}
                    color={colors.textSecondary}
                  />
                  <Text
                    className="text-xs ml-2"
                    style={{ color: colors.textSecondary }}
                  >
                    Requested:{" "}
                    {new Date(subscription.createdAt).toLocaleDateString(
                      "en-US",
                      {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </Text>
                </View>
              )}
              {subscription.approvedAt && (
                <View className="flex-row items-center">
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={16}
                    color={colors.success}
                  />
                  <Text
                    className="text-xs ml-2"
                    style={{ color: colors.textSecondary }}
                  >
                    Approved:{" "}
                    {new Date(subscription.approvedAt).toLocaleDateString(
                      "en-US",
                      {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View className="gap-3">
          <TouchableOpacity
            onPress={handleRenew}
            className="rounded-xl py-4 flex-row items-center justify-center"
            style={{ backgroundColor: colors.primary, ...shadows.medium }}
          >
            <Ionicons name="refresh" size={20} color="#FFF" />
            <Text className="ml-2 font-bold text-white text-base">
              Renew Subscription
            </Text>
          </TouchableOpacity>
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
        </View>
      </ScrollView>
    </View>
  );
}
