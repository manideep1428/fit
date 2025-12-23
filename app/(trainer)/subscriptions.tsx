import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getColors, Shadows } from "@/constants/colors";
import { StatusBar } from "expo-status-bar";
import { useUser } from "@clerk/clerk-expo";
import { showToast } from "@/utils/toast";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TrainerSubscriptionsScreen() {
  const router = useRouter();
  const { user } = useUser();
  const scheme = useColorScheme();
  const colors = getColors(scheme === "dark");
  const shadows = scheme === "dark" ? Shadows.dark : Shadows.light;
  const insets = useSafeAreaInsets();

  const subscriptions = useQuery(
    api.subscriptions.getTrainerSubscriptions,
    user?.id ? { trainerId: user.id } : "skip"
  );

  const stats = useQuery(
    api.subscriptions.getTrainerSubscriptionStats,
    user?.id ? { trainerId: user.id } : "skip"
  );

  const approveSubscription = useMutation(
    api.subscriptions.approveSubscription
  );
  const renewSubscription = useMutation(api.subscriptions.renewSubscription);
  const cancelSubscription = useMutation(api.subscriptions.cancelSubscription);

  const handleApprove = (subscription: any) => {
    Alert.alert(
      "Approve Subscription",
      `Approve ${subscription.clientName}'s subscription request? They will be able to start booking sessions.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve",
          onPress: async () => {
            try {
              await approveSubscription({ subscriptionId: subscription._id });
              showToast.success("Subscription approved!");
            } catch (error) {
              showToast.error("Failed to approve subscription");
            }
          },
        },
      ]
    );
  };

  const handleRenew = (subscription: any) => {
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
              showToast.success("Subscription renewed!");
            } catch (error) {
              showToast.error("Failed to renew subscription");
            }
          },
        },
      ]
    );
  };

  const handleCancel = (subscription: any) => {
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
              showToast.success("Subscription cancelled");
            } catch (error) {
              showToast.error("Failed to cancel subscription");
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
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

  const formatCurrency = (amount: number, currency: string) => {
    const symbols: { [key: string]: string } = {
      INR: "₹",
      USD: "$",
      EUR: "€",
      GBP: "£",
      NOK: "kr",
    };
    return `${symbols[currency] || currency}${amount.toFixed(0)}`;
  };

  const pendingSubscriptions =
    subscriptions?.filter((s) => s.paymentStatus === "pending") || [];
  const activeSubscriptions =
    subscriptions?.filter(
      (s) => s.status === "active" && s.paymentStatus === "paid"
    ) || [];
  const inactiveSubscriptions =
    subscriptions?.filter((s) => s.status !== "active") || [];

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />

      {/* Header */}
      <View className="px-4 pb-6" style={{ paddingTop: insets.top + 12 }}>
        <View className="flex-row items-center mb-4">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text className="text-2xl font-bold" style={{ color: colors.text }}>
            Subscriptions
          </Text>
        </View>

        {/* Stats */}
        <View className="flex-row gap-3">
          <View
            className="flex-1 rounded-2xl p-4"
            style={{ backgroundColor: colors.surface, ...shadows.small }}
          >
            <Text
              className="text-3xl font-bold mb-1"
              style={{ color: colors.primary }}
            >
              {stats?.activeCount || 0}
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
              {stats?.pendingCount || 0}
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
              {stats?.totalCount || 0}
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
        {/* Pending Requests */}
        {pendingSubscriptions.length > 0 && (
          <View className="mb-6">
            <View className="flex-row items-center mb-3">
              <Ionicons name="time-outline" size={20} color={colors.warning} />
              <Text
                className="text-base font-bold ml-2"
                style={{ color: colors.text }}
              >
                Pending Requests
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
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-1">
                    <Text
                      className="text-lg font-bold mb-1"
                      style={{ color: colors.text }}
                    >
                      {sub.clientName}
                    </Text>
                    <View className="flex-row items-center gap-2">
                      <View
                        className="px-2 py-0.5 rounded-full"
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

                {/* Discount Badge */}
                {sub.discount > 0 && (
                  <View
                    className="mb-3 px-3 py-1.5 rounded-lg self-start"
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
                  className="mb-3 p-3 rounded-xl"
                  style={{ backgroundColor: `${colors.warning}10` }}
                >
                  <View className="flex-row items-center">
                    <Ionicons
                      name="information-circle"
                      size={16}
                      color={colors.warning}
                    />
                    <Text
                      className="text-xs ml-2 flex-1"
                      style={{ color: colors.textSecondary }}
                    >
                      Client is waiting for your approval to start booking
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => handleApprove(sub)}
                  className="rounded-xl py-3 flex-row items-center justify-center"
                  style={{ backgroundColor: colors.success }}
                >
                  <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                  <Text className="text-white font-semibold ml-2">
                    Approve Subscription
                  </Text>
                </TouchableOpacity>
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

          {!subscriptions ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : activeSubscriptions.length === 0 ? (
            <View
              className="rounded-2xl p-8 items-center"
              style={{ backgroundColor: colors.surface, ...shadows.small }}
            >
              <Ionicons
                name="calendar-outline"
                size={48}
                color={colors.textTertiary}
              />
              <Text
                className="mt-3 font-semibold"
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
                      className="text-lg font-bold mb-1"
                      style={{ color: colors.text }}
                    >
                      {sub.clientName}
                    </Text>
                    <View className="flex-row items-center gap-2">
                      <View
                        className="px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: `${colors.primary}20` }}
                      >
                        <Text
                          className="text-xs font-semibold"
                          style={{ color: colors.primary }}
                        >
                          {sub.planName}
                        </Text>
                      </View>
                      <Ionicons
                        name={
                          sub.billingType === "monthly" ? "refresh" : "calendar"
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
                        {new Date(sub.currentPeriodEnd).toLocaleDateString()}
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
                      Left this period
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
                    className="mb-3 px-3 py-1.5 rounded-lg self-start"
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

                {/* Actions */}
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={() => handleRenew(sub)}
                    className="flex-1 rounded-xl py-2.5 flex-row items-center justify-center"
                    style={{ backgroundColor: colors.primary }}
                  >
                    <Ionicons name="refresh" size={16} color="#FFF" />
                    <Text className="ml-2 font-semibold text-white text-sm">
                      Renew
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleCancel(sub)}
                    className="rounded-xl py-2.5 px-4"
                    style={{ backgroundColor: `${colors.error}15` }}
                  >
                    <Ionicons
                      name="close-circle"
                      size={16}
                      color={colors.error}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Inactive Subscriptions */}
        {inactiveSubscriptions.length > 0 && (
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

            {inactiveSubscriptions.map((sub: any) => (
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
                      {sub.clientName}
                    </Text>
                    <View className="flex-row items-center gap-2">
                      <Text
                        className="text-xs"
                        style={{ color: colors.textSecondary }}
                      >
                        {sub.planName}
                      </Text>
                      <Text
                        className="text-xs"
                        style={{ color: colors.textSecondary }}
                      >
                        • {sub.sessionsPerMonth} sessions/month
                      </Text>
                    </View>
                  </View>
                  <View
                    className="px-2 py-1 rounded-full"
                    style={{
                      backgroundColor: `${getStatusColor(sub.status)}20`,
                    }}
                  >
                    <Text
                      className="text-xs font-bold"
                      style={{ color: getStatusColor(sub.status) }}
                    >
                      {sub.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
