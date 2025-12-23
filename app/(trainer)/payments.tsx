import { useState } from "react";
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

export default function SubscriptionsScreen() {
  const { user } = useUser();
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = getColors(scheme === "dark");
  const shadows = scheme === "dark" ? Shadows.dark : Shadows.light;
  const insets = useSafeAreaInsets();
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "expired"
  >("all");

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

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return colors.success;
      case "pending":
        return colors.warning;
      default:
        return colors.textSecondary;
    }
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString()}`;
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
      {/* Header */}
      <View className="px-6 pb-4" style={{ paddingTop: insets.top + 12 }}>
        <View className="flex-row items-center justify-between">
          <Text className="text-2xl font-bold" style={{ color: colors.text }}>
            Client Subscriptions
          </Text>
          <TouchableOpacity
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.primary }}
            onPress={() => router.push("/(trainer)/packages" as any)}
          >
            <Ionicons name="cube" size={20} color="#FFF" />
          </TouchableOpacity>
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
              <Text
                className="text-lg font-bold"
                style={{ color: colors.text }}
              >
                Pending Payments
              </Text>
              <View
                className="ml-2 px-2 py-0.5 rounded-full"
                style={{ backgroundColor: colors.warning }}
              >
                <Text className="text-white text-xs font-bold">
                  {pendingPayments.length}
                </Text>
              </View>
            </View>

            {pendingPayments.map((sub: any) => (
              <View
                key={sub._id}
                className="rounded-xl p-4 mb-3"
                style={{
                  backgroundColor: `${colors.warning}15`,
                  borderWidth: 2,
                  borderColor: colors.warning,
                }}
              >
                <View className="flex-row justify-between items-start mb-3">
                  <View className="flex-1">
                    <Text
                      className="text-lg font-bold"
                      style={{ color: colors.text }}
                    >
                      {getClientName(sub.clientId)}
                    </Text>
                    <Text
                      className="text-sm mt-1"
                      style={{ color: colors.textSecondary }}
                    >
                      {getPackageName(sub.packageId)}
                    </Text>
                  </View>
                  <Text
                    className="text-xl font-bold"
                    style={{ color: colors.warning }}
                  >
                    {formatCurrency(sub.finalAmount)}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => handleApprovePayment(sub)}
                  className="rounded-xl py-3 flex-row items-center justify-center"
                  style={{ backgroundColor: colors.success }}
                >
                  <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                  <Text className="text-white font-semibold ml-2">
                    Approve Offline Payment
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Subscriptions List */}
        {activeSubscriptions.length === 0 ? (
          <View className="py-20 items-center">
            <Ionicons
              name="calendar-outline"
              size={48}
              color={colors.textTertiary}
            />
            <Text
              className="text-base font-semibold mt-4"
              style={{ color: colors.textSecondary }}
            >
              No subscriptions found
            </Text>
          </View>
        ) : (
          activeSubscriptions.map((sub: any) => {
            const progressPercentage =
              (sub.remainingSessions / sub.totalSessions) * 100;
            const isExpiringSoon =
              sub.remainingSessions <= 3 && sub.status === "active";

            return (
              <View
                key={sub._id}
                className="rounded-xl p-4 mb-4"
                style={{ backgroundColor: colors.surface, ...shadows.medium }}
              >
                {/* Header */}
                <View className="flex-row justify-between items-start mb-3">
                  <View className="flex-1">
                    <Text
                      className="text-lg font-bold"
                      style={{ color: colors.text }}
                    >
                      {getClientName(sub.clientId)}
                    </Text>
                    <Text
                      className="text-sm mt-1"
                      style={{ color: colors.textSecondary }}
                    >
                      {getPackageName(sub.packageId)}
                    </Text>
                  </View>
                  <View className="items-end">
                    <View
                      className="px-3 py-1 rounded-full mb-1"
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
                    <View
                      className="px-3 py-1 rounded-full"
                      style={{
                        backgroundColor: `${getPaymentStatusColor(sub.paymentStatus)}20`,
                      }}
                    >
                      <Text
                        className="text-xs font-semibold"
                        style={{
                          color: getPaymentStatusColor(sub.paymentStatus),
                        }}
                      >
                        {sub.paymentStatus}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Session Progress */}
                <View className="mb-3">
                  <View className="flex-row justify-between mb-2">
                    <Text
                      className="text-sm font-semibold"
                      style={{ color: colors.text }}
                    >
                      Sessions Used
                    </Text>
                    <Text
                      className="text-sm font-bold"
                      style={{ color: colors.primary }}
                    >
                      {sub.totalSessions - sub.remainingSessions} /{" "}
                      {sub.totalSessions}
                    </Text>
                  </View>
                  <View
                    className="h-2 rounded-full overflow-hidden"
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
                    <Text
                      className="text-xs mt-1"
                      style={{ color: colors.warning }}
                    >
                      ⚠️ Only {sub.remainingSessions} sessions remaining
                    </Text>
                  )}
                </View>

                {/* Details Grid */}
                <View className="flex-row gap-2 mb-3">
                  <View
                    className="flex-1 rounded-lg p-3"
                    style={{ backgroundColor: `${colors.primary}10` }}
                  >
                    <Text
                      className="text-xs mb-1"
                      style={{ color: colors.textSecondary }}
                    >
                      Remaining
                    </Text>
                    <Text
                      className="text-2xl font-bold"
                      style={{ color: colors.primary }}
                    >
                      {sub.remainingSessions}
                    </Text>
                  </View>
                  <View
                    className="flex-1 rounded-lg p-3"
                    style={{ backgroundColor: `${colors.primary}10` }}
                  >
                    <Text
                      className="text-xs mb-1"
                      style={{ color: colors.textSecondary }}
                    >
                      Amount
                    </Text>
                    <Text
                      className="text-xl font-bold"
                      style={{ color: colors.text }}
                    >
                      {formatCurrency(sub.finalAmount)}
                    </Text>
                  </View>
                </View>

                {/* Dates */}
                <View
                  className="flex-row justify-between mb-3 p-3 rounded-lg"
                  style={{ backgroundColor: colors.background }}
                >
                  <View>
                    <Text
                      className="text-xs"
                      style={{ color: colors.textTertiary }}
                    >
                      Start Date
                    </Text>
                    <Text
                      className="text-sm font-semibold mt-0.5"
                      style={{ color: colors.text }}
                    >
                      {new Date(sub.startDate).toLocaleDateString()}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text
                      className="text-xs"
                      style={{ color: colors.textTertiary }}
                    >
                      End Date
                    </Text>
                    <Text
                      className="text-sm font-semibold mt-0.5"
                      style={{ color: colors.text }}
                    >
                      {new Date(sub.endDate).toLocaleDateString()}
                    </Text>
                  </View>
                </View>

                {/* Discount Info */}
                {sub.discount > 0 && (
                  <View
                    className="flex-row items-center mb-3 p-2 rounded-lg"
                    style={{ backgroundColor: `${colors.success}15` }}
                  >
                    <Ionicons
                      name="pricetag"
                      size={16}
                      color={colors.success}
                    />
                    <Text
                      className="text-sm font-semibold ml-2"
                      style={{ color: colors.success }}
                    >
                      {sub.discount}% discount applied
                    </Text>
                  </View>
                )}

                {/* Payment Method */}
                <View className="flex-row items-center mb-3">
                  <Ionicons
                    name={sub.paymentMethod === "online" ? "card" : "cash"}
                    size={16}
                    color={colors.textSecondary}
                  />
                  <Text
                    className="text-sm ml-2"
                    style={{ color: colors.textSecondary }}
                  >
                    Payment:{" "}
                    {sub.paymentMethod === "online" ? "Online" : "Offline"}
                  </Text>
                </View>

                {/* Actions */}
                {sub.status === "active" && (
                  <TouchableOpacity
                    onPress={() => handleCancelSubscription(sub)}
                    className="rounded-lg py-2 items-center"
                    style={{ backgroundColor: `${colors.error}15` }}
                  >
                    <Text
                      className="text-sm font-medium"
                      style={{ color: colors.error }}
                    >
                      Cancel Subscription
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
