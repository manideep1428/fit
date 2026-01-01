import { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getColors, Shadows } from "@/constants/colors";
import { LinearGradient } from "expo-linear-gradient";
import NotificationHistory from "@/components/NotificationHistory";

export default function PaymentsScreen() {
  const { user } = useUser();
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = getColors(scheme === "dark");
  const shadows = scheme === "dark" ? Shadows.dark : Shadows.light;
  const insets = useSafeAreaInsets();
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "expired"
  >("all");
  const [showNotifications, setShowNotifications] = useState(false);

  const subscriptions = useQuery(
    api.subscriptions.getTrainerSubscriptions,
    user?.id ? { trainerId: user.id } : "skip"
  );

  const packages = useQuery(
    api.packages.getTrainerPackages,
    user?.id ? { trainerId: user.id } : "skip"
  );

  const clients = useQuery(api.users.getAllClients);
  const markOfflinePaymentPaid = useMutation(
    api.subscriptions.markOfflinePaymentPaid
  );
  const cancelSubscription = useMutation(api.subscriptions.cancelSubscription);

  // Fetch unread notification count
  const unreadCount = useQuery(
    api.notifications.getUnreadCount,
    user?.id ? { userId: user.id } : "skip"
  );

  if (!user || !subscriptions || !packages || !clients) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: colors.background }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Calculate earnings for current month
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyEarnings = useMemo(() => {
    if (!subscriptions) return 0;
    
    return subscriptions
      .filter((sub: any) => {
        const subDate = new Date(sub.createdAt);
        return (
          sub.paymentStatus === "paid" &&
          subDate.getMonth() === currentMonth &&
          subDate.getFullYear() === currentYear
        );
      })
      .reduce((total: number, sub: any) => total + (sub.finalAmount || sub.totalAmount || 0), 0);
  }, [subscriptions, currentMonth, currentYear]);

  const totalEarnings = useMemo(() => {
    if (!subscriptions) return 0;
    
    return subscriptions
      .filter((sub: any) => sub.paymentStatus === "paid")
      .reduce((total: number, sub: any) => total + (sub.finalAmount || sub.totalAmount || 0), 0);
  }, [subscriptions]);

  const getClientName = (clientId: string) => {
    const client = clients.find((c: any) => c.clerkId === clientId);
    return client?.fullName || "Unknown Client";
  };

  const getPackageName = (packageId: any) => {
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

  const formatCurrency = (amount: number | undefined) => {
    const safeAmount = amount || 0;
    return `$${safeAmount.toLocaleString()}`;
  };

  const handleApprovePayment = (subscription: any) => {
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
            } catch (error) {
              Alert.alert("Error", "Failed to approve payment");
            }
          },
        },
      ]
    );
  };

  const handleCancelSubscription = (subscription: any) => {
    Alert.alert(
      "Cancel Subscription",
      "Are you sure you want to cancel this subscription?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            try {
              await cancelSubscription({ subscriptionId: subscription._id });
            } catch (error) {
              Alert.alert("Error", "Failed to cancel subscription");
            }
          },
        },
      ]
    );
  };

  // Filter subscriptions
  const filteredSubscriptions = subscriptions.filter((sub: any) => {
    if (filterStatus === "all") return true;
    return sub.status === filterStatus;
  });

  // Separate pending payments
  const pendingPayments = subscriptions.filter(
    (s: any) => s.paymentStatus === "pending"
  );
  const activeSubscriptions = filteredSubscriptions.filter(
    (s: any) => s.paymentStatus === "paid"
  );

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Gradient Background */}
      <LinearGradient
        colors={[`${colors.primary}33`, `${colors.primary}0D`, "transparent"]}
        className="absolute top-0 left-0 right-0 h-96"
        pointerEvents="none"
      />

      {/* Header */}
      <View className="px-6 pb-4" style={{ paddingTop: insets.top + 12 }}>
        <View className="flex-row items-center justify-between mb-6">
          <Text className="text-2xl font-bold" style={{ color: colors.text }}>
            Payments
          </Text>
          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              className="relative w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.surface }}
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
                      {unreadCount > 9 ? "9+" : String(unreadCount)}
                    </Text>
                  </View>
                )}
            </TouchableOpacity>
            <TouchableOpacity
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.primary }}
              onPress={() => router.push("/(trainer)/packages" as any)}
            >
              <Ionicons name="cube" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Earnings Cards */}
        <View className="flex-row gap-3 mb-4">
          <View
            className="flex-1 rounded-2xl p-5"
            style={{
              backgroundColor: colors.surface,
              ...shadows.medium,
            }}
          >
            <View className="flex-row items-center mb-2">
              <View
                className="w-10 h-10 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: `${colors.success}20` }}
              >
                <Ionicons name="trending-up" size={20} color={colors.success} />
              </View>
              <Text
                className="text-xs font-semibold"
                style={{ color: colors.textSecondary }}
              >
                This Month
              </Text>
            </View>
            <Text
              className="text-2xl font-bold"
              style={{ color: colors.success }}
            >
              ₹{formatCurrency(monthlyEarnings)}
            </Text>
            <Text
              className="text-xs mt-1"
              style={{ color: colors.textSecondary }}
            >
              Earned in {new Date().toLocaleDateString("en-US", { month: "long" })}
            </Text>
          </View>

          <View
            className="flex-1 rounded-2xl p-5"
            style={{
              backgroundColor: colors.surface,
              ...shadows.medium,
            }}
          >
            <View className="flex-row items-center mb-2">
              <View
                className="w-10 h-10 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: `${colors.primary}20` }}
              >
                <Ionicons name="wallet" size={20} color={colors.primary} />
              </View>
              <Text
                className="text-xs font-semibold"
                style={{ color: colors.textSecondary }}
              >
                Total Earned
              </Text>
            </View>
            <Text
              className="text-2xl font-bold"
              style={{ color: colors.primary }}
            >
              ₹{formatCurrency(totalEarnings)}
            </Text>
            <Text
              className="text-xs mt-1"
              style={{ color: colors.textSecondary }}
            >
              All time earnings
            </Text>
          </View>
        </View>
      </View>

      {/* Filter Tabs */}
      <View className="flex-row mx-6 mb-4 gap-2">
        {(["all", "active", "expired"] as const).map((status) => (
          <TouchableOpacity
            key={status}
            className="flex-1 py-3 rounded-xl items-center"
            style={{
              backgroundColor:
                filterStatus === status ? colors.primary : colors.surface,
              ...shadows.small,
            }}
            onPress={() => setFilterStatus(status)}
          >
            <Text
              className="text-sm font-semibold capitalize"
              style={{
                color: filterStatus === status ? "#FFF" : colors.textSecondary,
              }}
            >
              {status}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Pending Payments Section */}
        {pendingPayments.length > 0 && (
          <View className="mb-6">
            <View className="flex-row items-center mb-3">
              <Ionicons name="alert-circle" size={20} color={colors.warning} />
              <Text
                className="text-lg font-bold ml-2"
                style={{ color: colors.text }}
              >
                Pending Approvals
              </Text>
              <View
                className="ml-2 px-2.5 py-1 rounded-full"
                style={{ backgroundColor: colors.warning }}
              >
                <Text className="text-white text-xs font-bold">
                  {pendingPayments.length}
                </Text>
              </View>
            </View>

            {pendingPayments.map((sub: any) => (
              <TouchableOpacity
                key={sub._id}
                onPress={() =>
                  router.push(`/(trainer)/payment-details?id=${sub._id}` as any)
                }
                className="rounded-2xl p-5 mb-3"
                style={{
                  backgroundColor: colors.surface,
                  ...shadows.medium,
                  borderLeftWidth: 4,
                  borderLeftColor: colors.warning,
                }}
              >
                <View className="flex-row justify-between items-start mb-3">
                  <View className="flex-1">
                    <Text
                      className="text-lg font-bold mb-2"
                      style={{ color: colors.text }}
                    >
                      {getClientName(sub.clientId)}
                    </Text>
                    <View className="flex-row items-center gap-2">
                      <View
                        className="px-2.5 py-1 rounded-full"
                        style={{ backgroundColor: `${colors.warning}20` }}
                      >
                        <Text
                          className="text-xs font-semibold"
                          style={{ color: colors.warning }}
                        >
                          Pending Approval
                        </Text>
                      </View>
                      <Text
                        className="text-xs"
                        style={{ color: colors.textSecondary }}
                      >
                        {getPackageName(sub.packageId)}
                      </Text>
                    </View>
                  </View>
                  <View className="items-end">
                    <Text
                      className="text-2xl font-bold"
                      style={{ color: colors.warning }}
                    >
                      ₹{formatCurrency(sub.finalAmount)}
                    </Text>
                    <Text
                      className="text-xs mt-1"
                      style={{ color: colors.textSecondary }}
                    >
                      {new Date(sub.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View className="flex-row gap-2 mt-2">
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      handleCancelSubscription(sub);
                    }}
                    className="flex-1 py-2.5 rounded-lg items-center justify-center"
                    style={{
                      backgroundColor: colors.surface,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <Text
                      className="text-sm font-semibold"
                      style={{ color: colors.text }}
                    >
                      Reject
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      handleApprovePayment(sub);
                    }}
                    className="flex-[2] py-2.5 rounded-lg items-center justify-center"
                    style={{
                      backgroundColor: colors.primary,
                      ...shadows.small,
                    }}
                  >
                    <Text className="text-sm font-bold text-white">
                      Approve Payment
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Subscriptions List */}
        <View className="mb-4">
          <View className="flex-row items-center mb-3">
            <Ionicons name="people" size={20} color={colors.primary} />
            <Text
              className="text-lg font-bold ml-2"
              style={{ color: colors.text }}
            >
              Subscription List
            </Text>
            <View
              className="ml-2 px-2.5 py-1 rounded-full"
              style={{ backgroundColor: `${colors.primary}20` }}
            >
              <Text
                className="text-xs font-bold"
                style={{ color: colors.primary }}
              >
                {activeSubscriptions.length}
              </Text>
            </View>
          </View>

          {activeSubscriptions.length === 0 ? (
            <View
              className="py-16 items-center rounded-2xl"
              style={{ backgroundColor: colors.surface, ...shadows.small }}
            >
              <View
                className="w-16 h-16 rounded-full items-center justify-center mb-4"
                style={{ backgroundColor: `${colors.textTertiary}20` }}
              >
                <Ionicons
                  name="calendar-outline"
                  size={32}
                  color={colors.textTertiary}
                />
              </View>
              <Text
                className="text-base font-semibold"
                style={{ color: colors.textSecondary }}
              >
                No subscriptions found
              </Text>
              <Text
                className="text-sm mt-1"
                style={{ color: colors.textTertiary }}
              >
                Subscriptions will appear here
              </Text>
            </View>
          ) : (
            activeSubscriptions.map((sub: any) => (
              <TouchableOpacity
                key={sub._id}
                onPress={() =>
                  router.push(`/(trainer)/payment-details?id=${sub._id}` as any)
                }
                className="rounded-2xl p-5 mb-3"
                style={{
                  backgroundColor: colors.surface,
                  ...shadows.medium,
                  borderLeftWidth: 4,
                  borderLeftColor: getStatusColor(sub.status),
                }}
              >
                <View className="flex-row justify-between items-start">
                  <View className="flex-1">
                    <View className="flex-row items-center mb-2">
                      <View
                        className="w-10 h-10 rounded-full items-center justify-center mr-3"
                        style={{ backgroundColor: `${colors.primary}20` }}
                      >
                        <Text
                          className="text-base font-bold"
                          style={{ color: colors.primary }}
                        >
                          {getClientName(sub.clientId)[0]}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text
                          className="text-lg font-bold"
                          style={{ color: colors.text }}
                        >
                          {getClientName(sub.clientId)}
                        </Text>
                      </View>
                    </View>
                    <View className="flex-row items-center gap-2 ml-13">
                      <View
                        className="px-2.5 py-1 rounded-full"
                        style={{
                          backgroundColor: `${getStatusColor(sub.status)}20`,
                        }}
                      >
                        <Text
                          className="text-xs font-semibold uppercase"
                          style={{ color: getStatusColor(sub.status) }}
                        >
                          {sub.status}
                        </Text>
                      </View>
                      <Text
                        className="text-xs"
                        style={{ color: colors.textSecondary }}
                      >
                        {getPackageName(sub.packageId)}
                      </Text>
                    </View>
                    
                    {/* Progress Bar */}
                    <View className="mt-3 ml-13">
                      <View className="flex-row justify-between mb-1">
                        <Text
                          className="text-xs"
                          style={{ color: colors.textSecondary }}
                        >
                          Sessions Progress
                        </Text>
                        <Text
                          className="text-xs font-semibold"
                          style={{ color: colors.primary }}
                        >
                          {sub.remainingSessions} left
                        </Text>
                      </View>
                      <View
                        className="h-2 w-full rounded-full overflow-hidden"
                        style={{ backgroundColor: `${colors.primary}15` }}
                      >
                        <View
                          className="h-full rounded-full"
                          style={{
                            width: `${((sub.sessionsPerMonth - sub.remainingSessions) / sub.sessionsPerMonth) * 100}%`,
                            backgroundColor: colors.primary,
                          }}
                        />
                      </View>
                    </View>
                  </View>
                  
                  <View className="items-end ml-4">
                    <Text
                      className="text-2xl font-bold"
                      style={{ color: colors.primary }}
                    >
                      ₹{formatCurrency(sub.finalAmount)}
                    </Text>
                    <Text
                      className="text-xs mt-1"
                      style={{ color: colors.textSecondary }}
                    >
                      {new Date(sub.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        year: "numeric",
                      })}
                    </Text>
                  </View>
                </View>

                {/* Chevron indicator */}
                <View className="absolute right-4 top-5">
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={colors.textTertiary}
                  />
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Notification History Modal */}
      <NotificationHistory
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </View>
  );
}
