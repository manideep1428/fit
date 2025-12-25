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
              <TouchableOpacity
                key={sub._id}
                onPress={() =>
                  router.push(`/(trainer)/payment-details?id=${sub._id}` as any)
                }
                className="rounded-xl p-4 mb-3"
                style={{
                  backgroundColor: colors.surface,
                  ...shadows.medium,
                  borderLeftWidth: 4,
                  borderLeftColor: colors.warning,
                }}
              >
                <View className="flex-row justify-between items-center">
                  <View className="flex-1">
                    <Text
                      className="text-lg font-bold mb-1"
                      style={{ color: colors.text }}
                    >
                      {getClientName(sub.clientId)}
                    </Text>
                    <View
                      className="px-2 py-0.5 rounded-full self-start"
                      style={{ backgroundColor: `${colors.warning}20` }}
                    >
                      <Text
                        className="text-xs font-semibold"
                        style={{ color: colors.warning }}
                      >
                        Pending Approval
                      </Text>
                    </View>
                  </View>
                  <View className="items-end">
                    <Text
                      className="text-2xl font-bold"
                      style={{ color: colors.warning }}
                    >
                      {formatCurrency(sub.finalAmount)}
                    </Text>
                    <Text
                      className="text-xs"
                      style={{ color: colors.textSecondary }}
                    >
                      {getPackageName(sub.packageId)}
                    </Text>
                  </View>
                </View>

                {/* Chevron indicator */}
                <View
                  className="absolute right-4 top-1/2"
                  style={{ transform: [{ translateY: -12 }] }}
                >
                  <Ionicons
                    name="chevron-forward"
                    size={24}
                    color={colors.textTertiary}
                  />
                </View>
              </TouchableOpacity>
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
          activeSubscriptions.map((sub: any) => (
            <TouchableOpacity
              key={sub._id}
              onPress={() =>
                router.push(`/(trainer)/payment-details?id=${sub._id}` as any)
              }
              className="rounded-xl p-4 mb-4"
              style={{
                backgroundColor: colors.surface,
                ...shadows.medium,
                borderLeftWidth: 4,
                borderLeftColor: getStatusColor(sub.status),
              }}
            >
              <View className="flex-row justify-between items-center">
                <View className="flex-1">
                  <Text
                    className="text-lg font-bold mb-1"
                    style={{ color: colors.text }}
                  >
                    {getClientName(sub.clientId)}
                  </Text>
                  <View className="flex-row items-center gap-2">
                    <View
                      className="px-2 py-0.5 rounded-full"
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
                </View>
                <View className="items-end">
                  <Text
                    className="text-2xl font-bold"
                    style={{ color: colors.primary }}
                  >
                    {formatCurrency(sub.finalAmount)}
                  </Text>
                  <Text
                    className="text-xs"
                    style={{ color: colors.textSecondary }}
                  >
                    {sub.remainingSessions} sessions left
                  </Text>
                </View>
              </View>

              {/* Chevron indicator */}
              <View
                className="absolute right-4 top-1/2"
                style={{ transform: [{ translateY: -12 }] }}
              >
                <Ionicons
                  name="chevron-forward"
                  size={24}
                  color={colors.textTertiary}
                />
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}
