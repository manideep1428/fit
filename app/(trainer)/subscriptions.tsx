import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
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
import { useState } from "react";
import NotificationHistory from "@/components/NotificationHistory";

export default function TrainerSubscriptionsScreen() {
  const router = useRouter();
  const { user } = useUser();
  const scheme = useColorScheme();
  const colors = getColors(scheme === "dark");
  const shadows = scheme === "dark" ? Shadows.dark : Shadows.light;
  const insets = useSafeAreaInsets();
  const [showNotifications, setShowNotifications] = useState(false);

  const subscriptions = useQuery(
    api.subscriptions.getTrainerSubscriptions,
    user?.id ? { trainerId: user.id } : "skip"
  );

  const stats = useQuery(
    api.subscriptions.getTrainerSubscriptionStats,
    user?.id ? { trainerId: user.id } : "skip"
  );

  // Fetch unread notification count
  const unreadCount = useQuery(
    api.notifications.getUnreadCount,
    user?.id ? { userId: user.id } : "skip"
  );

  const approveSubscription = useMutation(
    api.subscriptions.approveSubscription
  );
  const renewSubscription = useMutation(api.subscriptions.renewSubscription);
  const cancelSubscription = useMutation(api.subscriptions.cancelSubscription);

  const handleApprove = (subscription: any) => {
    Alert.alert(
      "Approve Subscription",
      `Approve ${subscription.clientName}'s subscription request?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve",
          onPress: async () => {
            try {
              await approveSubscription({ subscriptionId: subscription._id });
              showToast.success("Approved");
            } catch (error) {
              showToast.error("Approve failed");
            }
          },
        },
      ]
    );
  };

  const handleReject = (subscription: any) => {
    Alert.alert(
      "Reject Subscription",
      `Reject ${subscription.clientName}'s subscription request?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: async () => {
            try {
              await cancelSubscription({ subscriptionId: subscription._id });
              showToast.success("Rejected");
            } catch (error) {
              showToast.error("Reject failed");
            }
          },
        },
      ]
    );
  };

  const handleRenew = (subscription: any) => {
    Alert.alert(
      "Renew Subscription",
      `Renew ${subscription.clientName}'s subscription?`,
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
            } catch (error) {
              showToast.error("Renew failed");
            }
          },
        },
      ]
    );
  };

  const handleCancel = (subscription: any) => {
    Alert.alert(
      "Cancel Subscription",
      `Cancel ${subscription.clientName}'s subscription?`,
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            try {
              await cancelSubscription({ subscriptionId: subscription._id });
              showToast.success("Cancelled");
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

  const pendingSubscriptions =
    subscriptions?.filter((s: any) => s.paymentStatus === "pending") || [];
  const activeSubscriptions =
    subscriptions?.filter(
      (s: any) => s.status === "active" && s.paymentStatus === "paid"
    ) || [];
  const pastSubscriptions =
    subscriptions?.filter((s: any) => s.status !== "active") || [];

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />

      {/* Header */}
      <View
        className="px-4 pb-2 border-b flex-row items-center justify-between"
        style={{
          paddingTop: insets.top + 16,
          borderBottomColor: colors.border,
          backgroundColor: `${colors.background}E6`,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-12 h-12 rounded-full items-center justify-center -ml-2"
          style={{
            backgroundColor: "transparent",
          }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text
          className="text-lg font-bold flex-1 text-center"
          style={{ color: colors.text }}
        >
          Subscriptions
        </Text>
        <TouchableOpacity
          className="relative w-10 h-10 rounded-full items-center justify-center"
          style={{ backgroundColor: `${colors.text}08` }}
          onPress={() => setShowNotifications(true)}
        >
          <Ionicons name="notifications" size={20} color={colors.text} />
          {unreadCount &&
            typeof unreadCount === "number" &&
            unreadCount > 0 && (
              <View
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.error }}
              >
                <Text className="text-white text-xs font-bold">
                  {unreadCount > 9 ? "9+" : `${unreadCount}`}
                </Text>
              </View>
            )}
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      >
        {/* Stats */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="flex-row gap-3 p-4"
          contentContainerStyle={{ paddingRight: 16 }}
        >
          <View
            className="min-w-[140px] flex-1 flex-col gap-2 rounded-xl p-5"
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              ...shadows.small,
            }}
          >
            <View className="flex-row items-center gap-2">
              <Ionicons name="people" size={18} color={colors.primary} />
              <Text
                className="text-sm font-medium"
                style={{ color: colors.textSecondary }}
              >
                Active
              </Text>
            </View>
            <View className="flex-row items-baseline gap-1">
              <Text
                className="text-2xl font-bold"
                style={{ color: colors.text }}
              >
                {stats?.activeCount || 0}
              </Text>
              <Text
                className="text-sm font-normal"
                style={{ color: colors.textSecondary }}
              >
                Clients
              </Text>
            </View>
          </View>

          <View
            className="min-w-[140px] flex-1 flex-col gap-2 rounded-xl p-5"
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              ...shadows.small,
            }}
          >
            <View className="flex-row items-center gap-2">
              <Ionicons name="time" size={18} color={colors.warning} />
              <Text
                className="text-sm font-medium"
                style={{ color: colors.textSecondary }}
              >
                Pending
              </Text>
            </View>
            <Text className="text-2xl font-bold" style={{ color: colors.text }}>
              {stats?.pendingCount || 0}
            </Text>
          </View>

          <View
            className="min-w-[140px] flex-1 flex-col gap-2 rounded-xl p-5"
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              ...shadows.small,
            }}
          >
            <View className="flex-row items-center gap-2">
              <Ionicons name="cash" size={18} color={colors.success} />
              <Text
                className="text-sm font-medium"
                style={{ color: colors.textSecondary }}
              >
                Total
              </Text>
            </View>
            <View className="flex-row items-baseline gap-1">
              <Text
                className="text-2xl font-bold"
                style={{ color: colors.text }}
              >
                {stats?.totalCount || 0}
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Pending Payments */}
        {pendingSubscriptions.length > 0 && (
          <View>
            <View className="flex-row items-center justify-between px-4 pb-2 pt-4">
              <Text
                className="text-lg font-bold"
                style={{ color: colors.text }}
              >
                Pending Payments
              </Text>
              <View
                className="px-2 py-1 rounded-full"
                style={{ backgroundColor: `${colors.warning}20` }}
              >
                <Text
                  className="text-xs font-bold"
                  style={{ color: colors.warning }}
                >
                  Action Needed
                </Text>
              </View>
            </View>

            <View className="px-4 flex-col gap-4">
              {pendingSubscriptions.map((sub: any) => (
                <View
                  key={sub._id}
                  className="flex-col gap-4 rounded-xl p-4"
                  style={{
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.border,
                    ...shadows.small,
                  }}
                >
                  <View className="flex-row items-start justify-between gap-4">
                    <View className="flex-row items-center gap-3 flex-1">
                      <View
                        className="w-12 h-12 rounded-full items-center justify-center"
                        style={{
                          backgroundColor: colors.primary,
                          borderWidth: 2,
                          borderColor: colors.surface,
                          ...shadows.small,
                        }}
                      >
                        <Text className="text-white text-lg font-bold">
                          {sub.clientName?.[0] || "C"}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text
                          className="text-base font-bold"
                          style={{ color: colors.text }}
                        >
                          {sub.clientName}
                        </Text>
                        <Text
                          className="text-sm"
                          style={{ color: colors.textSecondary }}
                        >
                          {sub.planName} • {sub.sessionsPerMonth} Sessions
                        </Text>
                      </View>
                    </View>
                    <Text
                      className="text-lg font-bold"
                      style={{ color: colors.text }}
                    >
                      {formatCurrency(sub.totalAmount, sub.planCurrency)}
                    </Text>
                  </View>

                  <View className="flex-row gap-2 w-full">
                    <TouchableOpacity
                      onPress={() => handleReject(sub)}
                      className="flex-1 h-10 rounded-lg items-center justify-center"
                      style={{
                        backgroundColor: colors.surface,
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}
                    >
                      <Text
                        className="text-sm font-medium"
                        style={{ color: colors.text }}
                      >
                        Reject
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleApprove(sub)}
                      className="flex-[2] h-10 rounded-lg items-center justify-center"
                      style={{
                        backgroundColor: colors.primary,
                        ...shadows.medium,
                      }}
                    >
                      <Text className="text-sm font-bold text-white">
                        Approve Payment
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Active Subscriptions */}
        <View>
          <Text
            className="text-lg font-bold px-4 pb-2 pt-4"
            style={{ color: colors.text }}
          >
            Active Subscriptions
          </Text>

          {!subscriptions ? (
            <View className="py-8 items-center">
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : activeSubscriptions.length === 0 ? (
            <View
              className="mx-4 rounded-xl p-8 items-center"
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
            <View className="px-4 pt-2 flex-col gap-4">
              {activeSubscriptions.map((sub: any) => {
                const progress =
                  ((sub.sessionsPerMonth - sub.remainingSessions) /
                    sub.sessionsPerMonth) *
                  100;
                const sessionsUsed =
                  sub.sessionsPerMonth - sub.remainingSessions;

                return (
                  <View
                    key={sub._id}
                    className="rounded-xl p-4"
                    style={{
                      backgroundColor: colors.surface,
                      borderWidth: 1,
                      borderColor: colors.border,
                      ...shadows.small,
                    }}
                  >
                    <View className="flex-row justify-between items-start mb-3">
                      <View className="flex-row items-center gap-3 flex-1">
                        <View
                          className="w-10 h-10 rounded-full items-center justify-center"
                          style={{ backgroundColor: colors.primary }}
                        >
                          <Text className="text-white text-base font-bold">
                            {sub.clientName?.[0] || "C"}
                          </Text>
                        </View>
                        <View className="flex-1">
                          <Text
                            className="font-bold"
                            style={{ color: colors.text }}
                          >
                            {sub.clientName}
                          </Text>
                          <Text
                            className="text-xs"
                            style={{ color: colors.textSecondary }}
                          >
                            Ends{" "}
                            {new Date(sub.currentPeriodEnd).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                              }
                            )}{" "}
                            •{" "}
                            {formatCurrency(sub.totalAmount, sub.planCurrency)}
                            /mo
                          </Text>
                        </View>
                      </View>
                      <View className="flex-row gap-2">
                        <TouchableOpacity
                          onPress={() => handleRenew(sub)}
                          className="w-8 h-8 rounded-full items-center justify-center"
                          style={{ backgroundColor: `${colors.primary}15` }}
                        >
                          <Ionicons
                            name="refresh"
                            size={16}
                            color={colors.primary}
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleCancel(sub)}
                          className="w-8 h-8 rounded-full items-center justify-center"
                          style={{ backgroundColor: `${colors.error}15` }}
                        >
                          <Ionicons
                            name="trash"
                            size={16}
                            color={colors.error}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View className="flex-col gap-2">
                      <View className="flex-row justify-between">
                        <Text
                          className="text-sm font-medium"
                          style={{ color: colors.textSecondary }}
                        >
                          Progress
                        </Text>
                        <Text
                          className="text-sm font-bold"
                          style={{ color: colors.primary }}
                        >
                          {sessionsUsed}/{sub.sessionsPerMonth} Sessions
                        </Text>
                      </View>
                      <View
                        className="h-2 w-full rounded-full overflow-hidden"
                        style={{ backgroundColor: `${colors.primary}20` }}
                      >
                        <View
                          className="h-full rounded-full"
                          style={{
                            width: `${progress}%`,
                            backgroundColor: colors.primary,
                          }}
                        />
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Past Subscriptions */}
        {pastSubscriptions.length > 0 && (
          <View>
            <Text
              className="text-lg font-bold px-4 pb-2 pt-4"
              style={{ color: colors.text }}
            >
              Past Subscriptions
            </Text>

            <View className="px-4 pt-2 flex-col gap-4 pb-8">
              {pastSubscriptions.map((sub: any) => (
                <View
                  key={sub._id}
                  className="flex-row items-center justify-between rounded-xl p-4 opacity-70"
                  style={{
                    backgroundColor: `${colors.surface}66`,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <View className="flex-row items-center gap-3 flex-1">
                    <View
                      className="w-10 h-10 rounded-full items-center justify-center"
                      style={{ backgroundColor: colors.textTertiary }}
                    >
                      <Text
                        className="text-base font-bold"
                        style={{ color: colors.surface }}
                      >
                        {sub.clientName?.[0] || "C"}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text
                        className="font-bold"
                        style={{ color: colors.text }}
                      >
                        {sub.clientName}
                      </Text>
                      <Text
                        className="text-xs"
                        style={{ color: colors.textSecondary }}
                      >
                        Completed{" "}
                        {new Date(sub.updatedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </Text>
                    </View>
                  </View>
                  <View
                    className="px-2 py-1 rounded"
                    style={{ backgroundColor: `${colors.textTertiary}20` }}
                  >
                    <Text
                      className="text-xs font-medium"
                      style={{ color: colors.textSecondary }}
                    >
                      {sub.planName}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Notification History Modal */}
      <NotificationHistory
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </View>
  );
}
