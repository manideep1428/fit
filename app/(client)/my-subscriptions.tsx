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
import { LinearGradient } from "expo-linear-gradient";

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
      NOK: "kr ",
      USD: "$",
      EUR: "€",
      GBP: "£",
      INR: "₹",
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
      className="rounded-3xl mb-4 overflow-hidden"
      style={{
        backgroundColor: colors.surface,
        ...shadows.large,
      }}
    >
      {/* Gradient Top Accent */}
      <LinearGradient
        colors={isPending 
          ? [colors.warning, `${colors.warning}99`] 
          : [colors.success, `${colors.success}99`]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        className={isPending ? "h-1.5" : "h-1"}
      />
      
      <View className="p-5">
        {/* Header */}
        <View className="flex-row items-center mb-4">
          <View
            className="w-14 h-14 rounded-2xl items-center justify-center mr-4"
            style={{ 
              backgroundColor: isPending ? `${colors.warning}12` : `${colors.primary}10`,
              borderWidth: 1,
              borderColor: isPending ? `${colors.warning}20` : `${colors.primary}15`,
            }}
          >
            <Text
              className="text-xl font-bold"
              style={{ color: isPending ? colors.warning : colors.primary }}
            >
              {sub.trainerName?.[0] || "T"}
            </Text>
          </View>
          <View className="flex-1">
            <Text
              className="text-lg font-bold mb-1"
              style={{ color: colors.text }}
            >
              {sub.trainerName}
            </Text>
            <View className="flex-row items-center">
              <View
                className="px-2 py-0.5 rounded-md mr-2"
                style={{ backgroundColor: `${colors.primary}12` }}
              >
                <Text
                  className="text-xs font-semibold"
                  style={{ color: colors.primary }}
                >
                  {sub.planName}
                </Text>
              </View>
              <Text className="text-xs" style={{ color: colors.textSecondary }}>
                {sub.sessionsPerMonth} sessions/mo
              </Text>
            </View>
          </View>
        </View>

        {/* Amount Card */}
        <View
          className="rounded-2xl p-4 mb-4 flex-row items-center justify-between"
          style={{ backgroundColor: isPending ? `${colors.warning}08` : `${colors.primary}06` }}
        >
          <View>
            <Text
              className="text-xs font-medium mb-1"
              style={{ color: colors.textSecondary }}
            >
              {sub.billingMonths === 1 ? "Monthly" : `${sub.billingMonths} Months`}
            </Text>
            <Text
              className="text-3xl font-black"
              style={{ color: isPending ? colors.warning : colors.text }}
            >
              {formatCurrency(sub.totalAmount, sub.planCurrency)}
            </Text>
          </View>
          {sub.discount > 0 && (
            <View
              className="px-3 py-1.5 rounded-full"
              style={{ backgroundColor: `${colors.success}15` }}
            >
              <Text
                className="text-xs font-bold"
                style={{ color: colors.success }}
              >
                {sub.discount}% OFF
              </Text>
            </View>
          )}
        </View>

        {isPending ? (
          <View
            className="p-4 rounded-2xl flex-row items-center"
            style={{ backgroundColor: `${colors.warning}10` }}
          >
            <View
              className="w-10 h-10 rounded-full items-center justify-center mr-3"
              style={{ backgroundColor: `${colors.warning}20` }}
            >
              <Ionicons name="hourglass" size={18} color={colors.warning} />
            </View>
            <View className="flex-1">
              <Text
                className="text-sm font-semibold mb-0.5"
                style={{ color: colors.text }}
              >
                Awaiting Approval
              </Text>
              <Text
                className="text-xs"
                style={{ color: colors.textSecondary }}
              >
                You'll be notified once your trainer approves
              </Text>
            </View>
          </View>
        ) : sub.status === "active" && (
          <>
            {/* Stats Row */}
            <View
              className="flex-row rounded-2xl p-3 mb-4"
              style={{ backgroundColor: `${colors.primary}06` }}
            >
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
                  Sessions Left
                </Text>
              </View>
              <View className="flex-1 items-center">
                <Text
                  className="text-sm font-bold"
                  style={{ color: colors.primary }}
                >
                  {sub.currentPeriodEnd
                    ? new Date(sub.currentPeriodEnd).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                    : "N/A"}
                </Text>
                <Text
                  className="text-xs"
                  style={{ color: colors.textSecondary }}
                >
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
              className="rounded-xl py-3.5 flex-row items-center justify-center"
              style={{ backgroundColor: colors.primary, ...shadows.medium }}
            >
              <Ionicons name="calendar" size={18} color="#FFF" />
              <Text className="text-white font-bold ml-2">Book a Session</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );

  const renderPastCard = (sub: any) => (
    <View
      key={sub._id}
      className="rounded-2xl mb-3 overflow-hidden"
      style={{
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        opacity: 0.8,
      }}
    >
      <View className="p-4 flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <View
            className="w-12 h-12 rounded-xl items-center justify-center mr-3"
            style={{ backgroundColor: `${colors.textTertiary}15` }}
          >
            <Text
              className="text-lg font-bold"
              style={{ color: colors.textTertiary }}
            >
              {sub.trainerName?.[0] || "T"}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold" style={{ color: colors.text }}>
              {sub.planName}
            </Text>
            <Text className="text-xs" style={{ color: colors.textSecondary }}>
              {sub.sessionsPerMonth} sessions • {formatCurrency(sub.totalAmount, sub.planCurrency)}
            </Text>
          </View>
        </View>
        <View
          className="px-3 py-1.5 rounded-lg"
          style={{
            backgroundColor: sub.status === "expired" 
              ? `${colors.error}12` 
              : sub.status === "cancelled" 
                ? `${colors.textTertiary}15` 
                : `${colors.warning}12`,
          }}
        >
          <Text
            className="text-xs font-bold"
            style={{ 
              color: sub.status === "expired" 
                ? colors.error 
                : sub.status === "cancelled" 
                  ? colors.textTertiary 
                  : colors.warning 
            }}
          >
            {sub.status === "expired" ? "EXPIRED" : sub.status === "cancelled" ? "CANCELLED" : "PENDING"}
          </Text>
        </View>
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
