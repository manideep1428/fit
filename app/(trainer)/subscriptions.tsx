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
import { LinearGradient } from "expo-linear-gradient";

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
      NOK: "kr ",
      USD: "$",
      EUR: "€",
      GBP: "£",
      INR: "₹",
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
          onPress={() => router.push('/(trainer)/payments' as any)}
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
          className="flex-row gap-3 px-4 pt-4 pb-2"
          contentContainerStyle={{ paddingRight: 16 }}
        >
          <View
            className="min-w-[150px] flex-1 flex-col gap-3 rounded-2xl p-5"
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              ...shadows.medium,
            }}
          >
            <View
              className="w-10 h-10 rounded-xl items-center justify-center"
              style={{ backgroundColor: `${colors.primary}15` }}
            >
              <Ionicons name="people" size={20} color={colors.primary} />
            </View>
            <View>
              <Text
                className="text-xs font-semibold mb-1"
                style={{ color: colors.textSecondary }}
              >
                Active Clients
              </Text>
              <Text
                className="text-3xl font-black"
                style={{ color: colors.text }}
              >
                {stats?.activeCount || 0}
              </Text>
            </View>
          </View>

          <View
            className="min-w-[150px] flex-1 flex-col gap-3 rounded-2xl p-5"
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              ...shadows.medium,
            }}
          >
            <View
              className="w-10 h-10 rounded-xl items-center justify-center"
              style={{ backgroundColor: `${colors.warning}15` }}
            >
              <Ionicons name="time" size={20} color={colors.warning} />
            </View>
            <View>
              <Text
                className="text-xs font-semibold mb-1"
                style={{ color: colors.textSecondary }}
              >
                Pending
              </Text>
              <Text
                className="text-3xl font-black"
                style={{ color: colors.text }}
              >
                {stats?.pendingCount || 0}
              </Text>
            </View>
          </View>

          <View
            className="min-w-[150px] flex-1 flex-col gap-3 rounded-2xl p-5"
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              ...shadows.medium,
            }}
          >
            <View
              className="w-10 h-10 rounded-xl items-center justify-center"
              style={{ backgroundColor: `${colors.success}15` }}
            >
              <Ionicons name="cash" size={20} color={colors.success} />
            </View>
            <View>
              <Text
                className="text-xs font-semibold mb-1"
                style={{ color: colors.textSecondary }}
              >
                Total
              </Text>
              <Text
                className="text-3xl font-black"
                style={{ color: colors.text }}
              >
                {stats?.totalCount || 0}
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Pending Payments */}
        {pendingSubscriptions.length > 0 && (
          <View className="mt-2">
            <View className="flex-row items-center justify-between px-4 pb-3 pt-5">
              <View className="flex-row items-center">
                <View
                  className="w-9 h-9 rounded-xl items-center justify-center mr-3"
                  style={{ backgroundColor: `${colors.warning}15` }}
                >
                  <Ionicons name="time" size={18} color={colors.warning} />
                </View>
                <Text
                  className="text-xl font-black"
                  style={{ color: colors.text }}
                >
                  Pending Payments
                </Text>
              </View>
              <View
                className="px-3 py-1.5 rounded-full min-w-[28px] items-center"
                style={{ backgroundColor: colors.warning }}
              >
                <Text className="text-white text-xs font-black">
                  {pendingSubscriptions.length}
                </Text>
              </View>
            </View>

            <View className="px-4 flex-col gap-4">
              {pendingSubscriptions.map((sub: any) => (
                <View
                  key={sub._id}
                  className="rounded-3xl overflow-hidden"
                  style={{
                    backgroundColor: colors.surface,
                    ...shadows.medium,
                  }}
                >
                  {/* Gradient Top Accent */}
                  <LinearGradient
                    colors={[colors.warning, `${colors.warning}99`]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    className="h-1.5"
                  />
                  
                  <View className="p-5">
                    {/* Header */}
                    <View className="flex-row items-center mb-4">
                      <View
                        className="w-14 h-14 rounded-2xl items-center justify-center mr-4"
                        style={{
                          backgroundColor: `${colors.warning}12`,
                          borderWidth: 1,
                          borderColor: `${colors.warning}20`,
                        }}
                      >
                        <Text
                          className="text-xl font-bold"
                          style={{ color: colors.warning }}
                        >
                          {sub.clientName?.[0] || "C"}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text
                          className="text-lg font-bold mb-1"
                          style={{ color: colors.text }}
                        >
                          {sub.clientName}
                        </Text>
                        <View className="flex-row items-center">
                          <View
                            className="w-2 h-2 rounded-full mr-2"
                            style={{ backgroundColor: colors.warning }}
                          />
                          <Text
                            className="text-sm"
                            style={{ color: colors.textSecondary }}
                          >
                            {sub.planName} • {sub.sessionsPerMonth} Sessions
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Amount Card */}
                    <View
                      className="rounded-2xl p-4 mb-4 flex-row items-center justify-between"
                      style={{ backgroundColor: `${colors.warning}08` }}
                    >
                      <View>
                        <Text
                          className="text-xs font-medium mb-1"
                          style={{ color: colors.textSecondary }}
                        >
                          Amount to Approve
                        </Text>
                        <Text
                          className="text-3xl font-black"
                          style={{ color: colors.warning }}
                        >
                          {formatCurrency(sub.totalAmount, sub.planCurrency)}
                        </Text>
                      </View>
                      <View
                        className="px-3 py-1.5 rounded-full"
                        style={{ backgroundColor: `${colors.warning}20` }}
                      >
                        <Text
                          className="text-xs font-bold"
                          style={{ color: colors.warning }}
                        >
                          AWAITING
                        </Text>
                      </View>
                    </View>

                    {/* Action Buttons */}
                    <View className="flex-row gap-3">
                      <TouchableOpacity
                        onPress={() => handleReject(sub)}
                        className="flex-1 h-12 rounded-xl items-center justify-center flex-row"
                        style={{
                          backgroundColor: `${colors.error}10`,
                          borderWidth: 1,
                          borderColor: `${colors.error}20`,
                        }}
                      >
                        <Ionicons name="close" size={18} color={colors.error} />
                        <Text
                          className="text-sm font-bold ml-2"
                          style={{ color: colors.error }}
                        >
                          Reject
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleApprove(sub)}
                        className="flex-[2] h-12 rounded-xl items-center justify-center flex-row"
                        style={{
                          backgroundColor: colors.success,
                          ...shadows.medium,
                        }}
                      >
                        <Ionicons name="checkmark-circle" size={18} color="#FFF" />
                        <Text className="text-sm font-bold text-white ml-2">
                          Approve Payment
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Active Subscriptions */}
        <View className="mt-2">
          <View className="flex-row items-center px-4 pb-3 pt-5">
            <View
              className="w-9 h-9 rounded-xl items-center justify-center mr-3"
              style={{ backgroundColor: `${colors.success}15` }}
            >
              <Ionicons name="checkmark-circle" size={18} color={colors.success} />
            </View>
            <Text
              className="text-xl font-black"
              style={{ color: colors.text }}
            >
              Active Subscriptions
            </Text>
          </View>

          {!subscriptions ? (
            <View className="py-8 items-center">
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : activeSubscriptions.length === 0 ? (
            <View
              className="mx-4 rounded-3xl p-10 items-center"
              style={{ 
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                ...shadows.medium 
              }}
            >
              <View
                className="w-20 h-20 rounded-2xl items-center justify-center mb-5"
                style={{ backgroundColor: `${colors.primary}12` }}
              >
                <Ionicons
                  name="people-outline"
                  size={36}
                  color={colors.primary}
                />
              </View>
              <Text
                className="text-xl font-black mb-2"
                style={{ color: colors.text }}
              >
                No Active Subscriptions
              </Text>
              <Text
                className="text-sm text-center leading-5"
                style={{ color: colors.textSecondary }}
              >
                Active client subscriptions will appear here
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
                    className="rounded-3xl overflow-hidden"
                    style={{
                      backgroundColor: colors.surface,
                      ...shadows.medium,
                    }}
                  >
                    {/* Gradient Top Accent */}
                    <LinearGradient
                      colors={[colors.success, `${colors.success}99`]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      className="h-1"
                    />
                    
                    <View className="p-5">
                      {/* Header */}
                      <View className="flex-row items-center mb-4">
                        <View
                          className="w-14 h-14 rounded-2xl items-center justify-center mr-4"
                          style={{ 
                            backgroundColor: `${colors.primary}10`,
                            borderWidth: 1,
                            borderColor: `${colors.primary}15`,
                          }}
                        >
                          <Text
                            className="text-xl font-bold"
                            style={{ color: colors.primary }}
                          >
                            {sub.clientName?.[0] || "C"}
                          </Text>
                        </View>
                        <View className="flex-1">
                          <Text
                            className="text-lg font-bold mb-1"
                            style={{ color: colors.text }}
                          >
                            {sub.clientName}
                          </Text>
                          <View className="flex-row items-center">
                            <Text
                              className="text-sm"
                              style={{ color: colors.textSecondary }}
                            >
                              Ends{" "}
                              {new Date(sub.currentPeriodEnd).toLocaleDateString(
                                "en-US",
                                { month: "short", day: "numeric" }
                              )}
                            </Text>
                            <View
                              className="w-1 h-1 rounded-full mx-2"
                              style={{ backgroundColor: colors.textTertiary }}
                            />
                            <Text
                              className="text-sm font-semibold"
                              style={{ color: colors.primary }}
                            >
                              {formatCurrency(sub.totalAmount, sub.planCurrency)}/mo
                            </Text>
                          </View>
                        </View>
                        <View className="flex-row gap-2">
                          <TouchableOpacity
                            onPress={() => handleRenew(sub)}
                            className="w-10 h-10 rounded-xl items-center justify-center"
                            style={{ backgroundColor: `${colors.primary}10` }}
                          >
                            <Ionicons
                              name="refresh"
                              size={18}
                              color={colors.primary}
                            />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleCancel(sub)}
                            className="w-10 h-10 rounded-xl items-center justify-center"
                            style={{ backgroundColor: `${colors.error}10` }}
                          >
                            <Ionicons
                              name="trash-outline"
                              size={18}
                              color={colors.error}
                            />
                          </TouchableOpacity>
                        </View>
                      </View>

                      {/* Stats Row */}
                      <View
                        className="flex-row rounded-2xl p-3 mb-3"
                        style={{ backgroundColor: `${colors.primary}06` }}
                      >
                        <View className="flex-1 items-center border-r" style={{ borderRightColor: colors.border }}>
                          <Text
                            className="text-2xl font-black"
                            style={{ color: colors.primary }}
                          >
                            {sessionsUsed}
                          </Text>
                          <Text
                            className="text-xs"
                            style={{ color: colors.textSecondary }}
                          >
                            Used
                          </Text>
                        </View>
                        <View className="flex-1 items-center border-r" style={{ borderRightColor: colors.border }}>
                          <Text
                            className="text-2xl font-black"
                            style={{ color: colors.success }}
                          >
                            {sub.remainingSessions}
                          </Text>
                          <Text
                            className="text-xs"
                            style={{ color: colors.textSecondary }}
                          >
                            Remaining
                          </Text>
                        </View>
                        <View className="flex-1 items-center">
                          <Text
                            className="text-2xl font-black"
                            style={{ color: colors.text }}
                          >
                            {sub.sessionsPerMonth}
                          </Text>
                          <Text
                            className="text-xs"
                            style={{ color: colors.textSecondary }}
                          >
                            Total
                          </Text>
                        </View>
                      </View>

                      {/* Progress Bar */}
                      <View>
                        <View className="flex-row justify-between mb-2">
                          <Text
                            className="text-xs font-medium"
                            style={{ color: colors.textSecondary }}
                          >
                            Session Progress
                          </Text>
                          <Text
                            className="text-xs font-bold"
                            style={{ color: colors.primary }}
                          >
                            {Math.round(progress)}%
                          </Text>
                        </View>
                        <View
                          className="h-2.5 w-full rounded-full overflow-hidden"
                          style={{ backgroundColor: `${colors.primary}12` }}
                        >
                          <LinearGradient
                            colors={[colors.primary, `${colors.primary}CC`]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            className="h-full rounded-full"
                            style={{ width: `${progress}%` }}
                          />
                        </View>
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
          <View className="mt-2">
            <View className="flex-row items-center px-4 pb-3 pt-5">
              <View
                className="w-9 h-9 rounded-xl items-center justify-center mr-3"
                style={{ backgroundColor: `${colors.textTertiary}15` }}
              >
                <Ionicons name="archive" size={18} color={colors.textTertiary} />
              </View>
              <Text
                className="text-xl font-black"
                style={{ color: colors.text }}
              >
                Past Subscriptions
              </Text>
            </View>

            <View className="px-4 pt-2 flex-col gap-3 pb-8">
              {pastSubscriptions.map((sub: any) => (
                <View
                  key={sub._id}
                  className="flex-row items-center justify-between rounded-2xl p-4 opacity-60"
                  style={{
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <View className="flex-row items-center gap-3 flex-1">
                    <View
                      className="w-12 h-12 rounded-xl items-center justify-center"
                      style={{ backgroundColor: `${colors.textTertiary}20` }}
                    >
                      <Text
                        className="text-lg font-bold"
                        style={{ color: colors.textTertiary }}
                      >
                        {sub.clientName?.[0] || "C"}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text
                        className="font-bold text-base mb-0.5"
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
                          year: "numeric",
                        })}
                      </Text>
                    </View>
                  </View>
                  <View
                    className="px-3 py-1.5 rounded-lg"
                    style={{ backgroundColor: `${colors.textTertiary}15` }}
                  >
                    <Text
                      className="text-xs font-semibold"
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
