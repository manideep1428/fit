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
import { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import NotificationHistory from "@/components/NotificationHistory";

type TabType = "active" | "pending" | "total";

export default function MySubscriptionsScreen() {
  const router = useRouter();
  const { user } = useUser();
  const scheme = useColorScheme();
  const colors = getColors(scheme === "dark");
  const shadows = scheme === "dark" ? Shadows.dark : Shadows.light;
  const insets = useSafeAreaInsets();
  const [selectedTab, setSelectedTab] = useState<TabType>("pending");
  const [showNotifications, setShowNotifications] = useState(false);

  const subscriptions = useQuery(
    api.subscriptions.getClientSubscriptions,
    user?.id ? { clientId: user.id } : "skip"
  );

  // Fetch unread notification count
  const unreadCount = useQuery(
    api.notifications.getUnreadCount,
    user?.id ? { userId: user.id } : "skip"
  );

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
      (s:any) => s.status === "active" && s.paymentStatus === "paid"
    ) || [];
  const pendingSubscriptions =
    subscriptions?.filter((s:any) => s.paymentStatus === "pending") || [];
  const pastSubscriptions =
    subscriptions?.filter(
      (s : any) =>
        (s.status !== "active" && s.paymentStatus !== "pending") ||
        (s.status === "active" &&
          s.paymentStatus !== "paid" &&
          s.paymentStatus !== "pending")
    ) || [];

  const renderSubscriptionCard : any = (sub: any, isPending: boolean = false) => (
    <View
      key={sub._id}
      className="rounded-2xl p-4 mb-3"
      style={{
        backgroundColor: isPending ? `${colors.warning}08` : colors.surface,
        borderWidth: 1,
        borderColor: isPending ? `${colors.warning}30` : colors.border,
        ...shadows,
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
            className="px-2.5 py-1 rounded-lg self-start mb-2"
            style={{ backgroundColor: `${colors.primary}15` }}
          >
            <Text
              className="text-xs font-semibold"
              style={{ color: colors.primary }}
            >
              {sub.planName}
            </Text>
          </View>
          <Text className="text-sm" style={{ color: colors.textSecondary }}>
            {sub.sessionsPerMonth} sessions/month
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-xs" style={{ color: colors.textSecondary }}>
            {sub.billingMonths === 1 ? "per month" : `${sub.billingMonths} months`}
          </Text>
          <Text
            className="text-xl font-bold"
            style={{ color: colors.text }}
          >
            {formatCurrency(sub.totalAmount, sub.planCurrency)}
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

      {isPending && (
        <View
          className="p-3 rounded-xl flex-row items-center"
          style={{ backgroundColor: `${colors.warning}12` }}
        >
          <Ionicons name="hourglass-outline" size={18} color={colors.warning} />
          <Text
            className="text-xs ml-2 flex-1"
            style={{ color: colors.textSecondary }}
          >
            Waiting for trainer approval. You'll be notified once approved.
          </Text>
        </View>
      )}

      {!isPending && sub.status === "active" && (
        <>
          <View className="flex-row gap-2 mb-3">
            <View
              className="flex-1 rounded-xl p-3"
              style={{ backgroundColor: `${colors.primary}10` }}
            >
              <Text
                className="text-xl font-bold"
                style={{ color: colors.primary }}
              >
                {sub.remainingSessions}
              </Text>
              <Text className="text-xs" style={{ color: colors.textSecondary }}>
                Sessions left
              </Text>
            </View>
            <View
              className="flex-1 rounded-xl p-3"
              style={{ backgroundColor: `${colors.primary}10` }}
            >
              <Text className="text-sm font-bold" style={{ color: colors.primary }}>
                {sub.currentPeriodEnd
                  ? new Date(sub.currentPeriodEnd).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  : "N/A"}
              </Text>
              <Text className="text-xs" style={{ color: colors.textSecondary }}>
                Expires
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/(client)/book-trainer",
                params: {
                  trainerId: sub.trainerId,
                  trainerName: sub.trainerName || "Trainer",
                  trainerSpecialty: sub.trainerSpecialty || "Personal Trainer",
                },
              } as any)
            }
            className="rounded-xl py-3 flex-row items-center justify-center"
            style={{ backgroundColor: colors.primary }}
          >
            <Ionicons name="calendar" size={18} color="#FFF" />
            <Text className="text-white font-semibold ml-2">Book a Session</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );

  const renderPastCard = (sub: any) => (
    <View
      key={sub._id}
      className="rounded-2xl p-4 mb-3 flex-row items-center justify-between"
      style={{
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View className="flex-1">
        <Text className="text-base font-semibold" style={{ color: colors.text }}>
          {sub.planName}
        </Text>
        <Text className="text-xs" style={{ color: colors.textSecondary }}>
          {sub.sessionsPerMonth} sessions/month • {formatCurrency(sub.totalAmount, sub.planCurrency)}
        </Text>
      </View>
      <View
        className="px-3 py-1.5 rounded-lg"
        style={{
          backgroundColor: `${colors.warning}15`,
          borderWidth: 1,
          borderColor: `${colors.warning}30`,
        }}
      >
        <Text
          className="text-xs font-bold"
          style={{ color: colors.warning }}
        >
          {sub.status === "expired" ? "EXPIRED" : sub.status === "cancelled" ? "CANCELLED" : "PENDING APPROVAL"}
        </Text>
      </View>
    </View>
  );

  return (
    <View className="flex-1" style={{ backgroundColor: `${colors.warning}08` }}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />

      {/* Header */}
      <View
        className="px-4 pb-6"
        style={{
          paddingTop: insets.top + 12,
          backgroundColor: colors.surface,
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
          ...shadows.medium,
        }}
      >
        <View className="flex-row items-center mb-6">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: `${colors.text}08` }}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text
            className="text-xl font-bold flex-1 text-center"
            style={{ color: colors.text }}
          >
            My Subscriptions
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

        {/* Stats Tabs */}
        <View
          className="flex-row rounded-2xl p-1"
          style={{ backgroundColor: `${colors.text}05` }}
        >
          <TouchableOpacity
            onPress={() => setSelectedTab("active")}
            className="flex-1 py-3 rounded-xl items-center"
            style={{
              backgroundColor: selectedTab === "active" ? colors.surface : "transparent",
              ...(selectedTab === "active" ? shadows.small : {}),
            }}
          >
            <Text
              className="text-xs mb-1"
              style={{
                color: selectedTab === "active" ? colors.textSecondary : colors.textTertiary,
              }}
            >
              ACTIVE
            </Text>
            <Text
              className="text-3xl font-bold"
              style={{
                color: selectedTab === "active" ? colors.text : colors.textSecondary,
              }}
            >
              {activeSubscriptions.length}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSelectedTab("pending")}
            className="flex-1 py-3 rounded-xl items-center"
            style={{
              backgroundColor: selectedTab === "pending" ? colors.surface : "transparent",
              ...(selectedTab === "pending" ? shadows.small : {}),
            }}
          >
            <Text
              className="text-xs mb-1"
              style={{
                color: selectedTab === "pending" ? colors.warning : colors.textTertiary,
              }}
            >
              PENDING
            </Text>
            <Text
              className="text-3xl font-bold"
              style={{
                color: selectedTab === "pending" ? colors.warning : colors.textSecondary,
              }}
            >
              {pendingSubscriptions.length}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSelectedTab("total")}
            className="flex-1 py-3 rounded-xl items-center"
            style={{
              backgroundColor: selectedTab === "total" ? colors.surface : "transparent",
              ...(selectedTab === "total" ? shadows.small : {}),
            }}
          >
            <Text
              className="text-xs mb-1"
              style={{
                color: selectedTab === "total" ? colors.textSecondary : colors.textTertiary,
              }}
            >
              TOTAL
            </Text>
            <Text
              className="text-3xl font-bold"
              style={{
                color: selectedTab === "total" ? colors.text : colors.textSecondary,
              }}
            >
              {subscriptions?.length || 0}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 20, paddingBottom: insets.bottom + 32 }}
      >
        {!subscriptions ? (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : subscriptions.length === 0 ? (
          <View
            className="rounded-2xl p-8 items-center"
            style={{ backgroundColor: colors.surface, ...shadows.medium }}
          >
            <View
              className="w-16 h-16 rounded-full items-center justify-center mb-4"
              style={{ backgroundColor: `${colors.primary}15` }}
            >
              <Ionicons name="card-outline" size={32} color={colors.primary} />
            </View>
            <Text className="text-lg font-bold mb-2" style={{ color: colors.text }}>
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
              <Text className="text-white font-semibold ml-2">Find Trainers</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Pending Approval Section */}
            {pendingSubscriptions.length > 0 && (
              <View className="mb-6">
                {/* Pending Banner */}
                <TouchableOpacity
                  className="rounded-2xl p-4 mb-4 flex-row items-center"
                  style={{
                    backgroundColor: `${colors.warning}15`,
                    borderWidth: 1,
                    borderColor: `${colors.warning}25`,
                  }}
                  activeOpacity={0.7}
                >
                  <View
                    className="w-10 h-10 rounded-full items-center justify-center mr-3"
                    style={{ backgroundColor: `${colors.warning}25` }}
                  >
                    <Ionicons name="hourglass-outline" size={20} color={colors.warning} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-bold" style={{ color: colors.text }}>
                      {pendingSubscriptions.length} Subscription{pendingSubscriptions.length > 1 ? 's' : ''} Pending
                    </Text>
                    <Text className="text-sm" style={{ color: colors.textSecondary }}>
                      Waiting for trainer approval
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.warning} />
                </TouchableOpacity>

                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center">
                    <View
                      className="w-2 h-2 rounded-full mr-2"
                      style={{ backgroundColor: colors.warning }}
                    />
                    <Text className="text-base font-bold" style={{ color: colors.text }}>
                      Pending Approval
                    </Text>
                  </View>
                  <View
                    className="w-6 h-6 rounded-full items-center justify-center"
                    style={{ backgroundColor: colors.warning }}
                  >
                    <Text className="text-white text-xs font-bold">
                      {pendingSubscriptions.length}
                    </Text>
                  </View>
                </View>
                {pendingSubscriptions.map((sub: any) => renderSubscriptionCard(sub, true))}
              </View>
            )}

            {/* Active Subscriptions Section */}
            <View className="mb-6">
              <View className="flex-row items-center mb-3">
                <View
                  className="w-2 h-2 rounded-full mr-2"
                  style={{ backgroundColor: colors.success }}
                />
                <Text className="text-base font-bold" style={{ color: colors.text }}>
                  Active Subscriptions
                </Text>
              </View>

              {activeSubscriptions.length === 0 ? (
                <View
                  className="rounded-2xl p-6 items-center"
                  style={{
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Ionicons name="card-outline" size={32} color={colors.textTertiary} />
                  <Text
                    className="mt-3 text-sm"
                    style={{ color: colors.textSecondary }}
                  >
                    No active subscriptions
                  </Text>
                </View>
              ) : (
                activeSubscriptions.map((sub: any) => renderSubscriptionCard(sub, false))
              )}
            </View>

            {/* Past Subscriptions Section */}
            {pastSubscriptions.length > 0 && (
              <View className="mb-6">
                <View className="flex-row items-center mb-3">
                  <View
                    className="w-2 h-2 rounded-full mr-2"
                    style={{ backgroundColor: colors.textTertiary }}
                  />
                  <Text className="text-base font-bold" style={{ color: colors.text }}>
                    Past Subscriptions
                  </Text>
                </View>
                {pastSubscriptions.map((sub: any) => renderPastCard(sub))}
              </View>
            )}
          </>
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
