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
    return `${safeAmount.toLocaleString()}`;
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
                      {unreadCount > 9 ? "9+" : `${unreadCount}`}
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
              kr {formatCurrency(monthlyEarnings)}
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
              kr {formatCurrency(totalEarnings)}
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
            <View className="flex-row items-center mb-4">
              <View
                className="w-8 h-8 rounded-full items-center justify-center mr-2"
                style={{ backgroundColor: `${colors.warning}15` }}
              >
                <Ionicons name="time" size={16} color={colors.warning} />
              </View>
              <Text
                className="text-lg font-bold flex-1"
                style={{ color: colors.text }}
              >
                Pending Approvals
              </Text>
              <View
                className="px-3 py-1.5 rounded-full"
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
                activeOpacity={0.7}
                className="rounded-3xl mb-4 overflow-hidden"
                style={{
                  backgroundColor: colors.surface,
                  ...shadows.large,
                }}
              >
                {/* Gradient Top Accent */}
                <LinearGradient
                  colors={[`${colors.warning}`, `${colors.warning}CC`]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="h-1.5"
                />
                
                <View className="p-5">
                  {/* Header Row */}
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
                        {getClientName(sub.clientId)[0]}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text
                        className="text-lg font-bold mb-1"
                        style={{ color: colors.text }}
                      >
                        {getClientName(sub.clientId)}
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
                          {getPackageName(sub.packageId)}
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
                        kr {formatCurrency(sub.finalAmount || sub.totalAmount || sub.monthlyAmount)}
                      </Text>
                    </View>
                    <View className="items-end">
                      <View
                        className="px-3 py-1.5 rounded-full mb-1"
                        style={{ backgroundColor: `${colors.warning}20` }}
                      >
                        <Text
                          className="text-xs font-bold"
                          style={{ color: colors.warning }}
                        >
                          AWAITING
                        </Text>
                      </View>
                      <Text
                        className="text-xs"
                        style={{ color: colors.textTertiary }}
                      >
                        {new Date(sub.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </Text>
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View className="flex-row gap-3">
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        handleCancelSubscription(sub);
                      }}
                      className="flex-1 py-3.5 rounded-xl items-center justify-center flex-row"
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
                      onPress={(e) => {
                        e.stopPropagation();
                        handleApprovePayment(sub);
                      }}
                      className="flex-[2] py-3.5 rounded-xl items-center justify-center flex-row"
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
              className="py-16 items-center rounded-3xl"
              style={{ backgroundColor: colors.surface, ...shadows.medium }}
            >
              <View
                className="w-20 h-20 rounded-full items-center justify-center mb-4"
                style={{ backgroundColor: `${colors.primary}10` }}
              >
                <Ionicons
                  name="receipt-outline"
                  size={36}
                  color={colors.primary}
                />
              </View>
              <Text
                className="text-lg font-bold mb-1"
                style={{ color: colors.text }}
              >
                No subscriptions yet
              </Text>
              <Text
                className="text-sm"
                style={{ color: colors.textSecondary }}
              >
                Client subscriptions will appear here
              </Text>
            </View>
          ) : (
            activeSubscriptions.map((sub: any) => {
              const totalSessions = sub.sessionsPerMonth || sub.totalSessions || 0;
              const remaining = sub.remainingSessions || 0;
              const used = totalSessions - remaining;
              const progress = totalSessions > 0 ? (used / totalSessions) * 100 : 0;
              
              return (
                <TouchableOpacity
                  key={sub._id}
                  onPress={() =>
                    router.push(`/(trainer)/payment-details?id=${sub._id}` as any)
                  }
                  activeOpacity={0.7}
                  className="rounded-3xl mb-4 overflow-hidden"
                  style={{
                    backgroundColor: colors.surface,
                    ...shadows.large,
                  }}
                >
      
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
                          {getClientName(sub.clientId)[0]}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text
                          className="text-lg font-bold mb-1"
                          style={{ color: colors.text }}
                        >
                          {getClientName(sub.clientId)}
                        </Text>
                        <View className="flex-row items-center">
                          <View
                            className="px-2 py-0.5 rounded-md mr-2"
                            style={{ backgroundColor: `${getStatusColor(sub.status)}15` }}
                          >
                            <Text
                              className="text-xs font-bold uppercase"
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
                      </View>
                      <View className="items-end">
                        <Text
                          className="text-2xl font-black"
                          style={{ color: colors.text }}
                        >
                          kr {formatCurrency(sub.finalAmount || sub.totalAmount || sub.monthlyAmount)}
                        </Text>
                        <Text
                          className="text-xs"
                          style={{ color: colors.textTertiary }}
                        >
                          {new Date(sub.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            year: "numeric",
                          })}
                        </Text>
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
                          {used}
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
                          {remaining}
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
                          {totalSessions}
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
                          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                        />
                      </View>
                    </View>

                    {/* View Details Link */}
                    <View className="flex-row items-center justify-end mt-3 pt-3 border-t" style={{ borderTopColor: colors.border }}>
                      <Text
                        className="text-sm font-semibold mr-1"
                        style={{ color: colors.primary }}
                      >
                        View Details
                      </Text>
                      <Ionicons name="arrow-forward" size={16} color={colors.primary} />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
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
