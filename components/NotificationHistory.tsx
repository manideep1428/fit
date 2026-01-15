import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "@clerk/clerk-expo";
import { useQuery, useMutation } from "convex/react";
import { useRouter } from "expo-router";
import { api } from "@/convex/_generated/api";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getColors, Shadows } from "@/constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  getNotificationIcon,
  getNotificationColor,
  formatNotificationTime,
} from "@/utils/notifications";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";

interface NotificationHistoryProps {
  visible: boolean;
  onClose: () => void;
  userRole?: "trainer" | "client";
}

type FilterType = "all" | "unread" | "bookings" | "trainers";

export default function NotificationHistory({
  visible,
  onClose,
  userRole,
}: NotificationHistoryProps) {
  const { user } = useUser();
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = getColors(scheme === "dark");
  const shadows = scheme === "dark" ? Shadows.dark : Shadows.light;
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  // Fetch current user to get role if not provided
  const currentUser = useQuery(
    api.users.getUserByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  const role = userRole || currentUser?.role || "client";

  // Fetch notifications
  const notifications = useQuery(
    api.notifications.getUserNotifications,
    user?.id ? { userId: user.id } : "skip"
  );

  // Mutations
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);
  const deleteAllNotifications = useMutation(api.notifications.deleteAllNotifications);

  // Menu state
  const [showMenu, setShowMenu] = useState(false);

  const handleMarkAllAsRead = async () => {
    setShowMenu(false);
    if (!user?.id) return;
    try {
      await markAllAsRead({ userId: user.id });
      Toast.show({
        type: "success",
        text1: "All notifications marked as read",
        position: "top",
        visibilityTime: 2000,
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Failed to mark notifications as read",
        position: "top",
        visibilityTime: 2000,
      });
    }
  };

  const handleDeleteAll = () => {
    setShowMenu(false);
    Alert.alert(
      "Delete All Notifications",
      "Are you sure you want to delete all notifications? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (!user?.id) return;
            try {
              await deleteAllNotifications({ userId: user.id });
              Toast.show({
                type: "success",
                text1: "All notifications deleted",
                position: "top",
                visibilityTime: 2000,
              });
            } catch (error) {
              Toast.show({
                type: "error",
                text1: "Failed to delete notifications",
                position: "top",
                visibilityTime: 2000,
              });
            }
          },
        },
      ]
    );
  };

  const handleNotificationPress = async (notification: any) => {
    // Mark as read first
    if (!notification.read) {
      try {
        await markAsRead({ notificationId: notification._id });
      } catch (error) {
        console.error("Error marking notification as read:", error);
      }
    }

    // Close the modal and navigate based on notification type
    onClose();

    const routePrefix = role === "trainer" ? "/(trainer)" : "/(client)";

    // Navigate based on notification type
    switch (notification.type) {
      case "booking_created":
      case "booking_cancelled":
      case "booking_reminder":
        // Navigate to bookings screen
        router.push(`${routePrefix}/bookings` as any);
        break;

      case "subscription_created":
      case "subscription_request":
      case "subscription_request_sent":
      case "subscription_approved":
      case "subscription_ending":
      case "subscription_expired":
        // Navigate to subscriptions screen
        if (role === "trainer") {
          router.push("/(trainer)/subscriptions" as any);
        } else {
          router.push("/(client)/my-subscriptions" as any);
        }
        break;

      case "session_completed":
        // Navigate to session history
        router.push(`${routePrefix}/session-history` as any);
        break;

      case "trainer_added":
        // For clients, go to find trainers or bookings
        if (role === "client") {
          router.push("/(client)/bookings" as any);
        } else {
          router.push("/(trainer)/clients" as any);
        }
        break;

      case "discount_added":
      case "discount_updated":
      case "discount_removed":
        // Navigate to packages/pricing
        if (role === "trainer") {
          router.push("/(trainer)/packages" as any);
        } else {
          router.push("/(client)/pricing" as any);
        }
        break;

      default:
        // Default to bookings
        router.push(`${routePrefix}/bookings` as any);
        break;
    }
  };

  // Filter notifications
  const filteredNotifications =
    notifications?.filter((n: any) => {
      if (activeFilter === "unread") return !n.read;
      if (activeFilter === "bookings")
        return (
          n.type === "booking_created" ||
          n.type === "booking_cancelled" ||
          n.type === "booking_reminder"
        );
      if (activeFilter === "trainers") return n.type === "trainer_added";
      return true;
    }) || [];

  // Group notifications by time
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const newNotifications = filteredNotifications.filter((n: any) => {
    const notifDate = new Date(n.createdAt);
    return notifDate >= today;
  });

  const earlierNotifications = filteredNotifications.filter((n: any) => {
    const notifDate = new Date(n.createdAt);
    return notifDate < today;
  });

  const FilterChip = ({
    label,
    filter,
  }: {
    label: string;
    filter: FilterType;
  }) => {
    const isActive = activeFilter === filter;
    return (
      <TouchableOpacity
        className="h-9 px-5 rounded-xl items-center justify-center"
        style={{
          backgroundColor: isActive ? colors.text : colors.surface,
          borderWidth: isActive ? 0 : 1,
          borderColor: colors.border,
          ...shadows.small,
        }}
        onPress={() => setActiveFilter(filter)}
      >
        <Text
          className="text-sm font-medium"
          style={{
            color: isActive ? colors.background : colors.text,
          }}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const NotificationItem = ({
    notification,
    isLast,
  }: {
    notification: any;
    isLast?: boolean;
  }) => {
    const iconName = getNotificationIcon(notification.type);
    const iconColor = getNotificationColor(notification.type, colors);
    const isUnread = !notification.read;

    return (
      <TouchableOpacity
        className="relative flex-col mx-2 rounded-xl"
        style={{
          opacity: isUnread ? 1 : 0.8,
        }}
        onPress={() => handleNotificationPress(notification)}
        activeOpacity={0.7}
      >
        <View className="flex-row gap-4 p-3 items-start">
          {/* Icon Container */}
          <View className="relative shrink-0">
            <View
              className="w-12 h-12 rounded-full items-center justify-center"
              style={{ backgroundColor: `${iconColor}20` }}
            >
              <Ionicons name={iconName as any} size={24} color={iconColor} />
            </View>
            {/* Unread Dot */}
            {isUnread && (
              <View
                className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
                style={{
                  backgroundColor: colors.primary,
                  borderColor: colors.background,
                }}
              />
            )}
          </View>

          {/* Content */}
          <View className="flex-1 min-w-0">
            <View className="flex-row justify-between items-start mb-0.5">
              <Text
                className="text-base font-semibold leading-tight truncate pr-2 flex-1"
                style={{ color: colors.text }}
              >
                {notification.title || "Notification"}
              </Text>
              <Text
                className="text-xs font-semibold whitespace-nowrap"
                style={{
                  color: isUnread ? colors.primary : colors.textSecondary,
                }}
              >
                {formatNotificationTime(notification.createdAt)}
              </Text>
            </View>
            <Text
              className="text-sm leading-normal"
              style={{ color: colors.textSecondary }}
              numberOfLines={2}
            >
              {notification.message || "No message"}
            </Text>
          </View>
        </View>

        {/* Divider */}
        {!isLast && (
          <View
            className="h-px mx-3 mt-1"
            style={{ backgroundColor: colors.border }}
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View className="flex-1" style={{ backgroundColor: colors.background }}>
        <StatusBar style={scheme === "dark" ? "light" : "dark"} />

        {/* Gradient Background Overlay */}
        <LinearGradient
          colors={[`${colors.primary}15`, `${colors.primary}05`, "transparent"]}
          className="absolute top-0 left-0 right-0 h-64"
          pointerEvents="none"
        />

        {/* TopAppBar */}
        <View
          className="flex-row items-center justify-between px-4 pb-2 border-b"
          style={{
            paddingTop: insets.top + 8,
            backgroundColor: `${colors.background}F2`,
            borderBottomColor: colors.border,
          }}
        >
          <TouchableOpacity
            className="w-10 h-10 items-center justify-center rounded-full"
            onPress={onClose}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text
            className="text-lg font-bold tracking-tight flex-1 text-center"
            style={{ color: colors.text }}
          >
            Notifications
          </Text>
          <View className="relative">
            <TouchableOpacity
              className="w-10 h-10 items-center justify-center rounded-full"
              onPress={() => setShowMenu(!showMenu)}
            >
              <Ionicons name="ellipsis-vertical" size={20} color={colors.text} />
            </TouchableOpacity>

            {/* Dropdown Menu */}
            {showMenu && (
              <View
                className="absolute right-0 top-12 rounded-xl py-2 z-50"
                style={{
                  backgroundColor: colors.surface,
                  ...shadows.medium,
                  minWidth: 180,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <TouchableOpacity
                  className="flex-row items-center px-4 py-3"
                  onPress={handleMarkAllAsRead}
                >
                  <Ionicons name="checkmark-done-outline" size={20} color={colors.primary} />
                  <Text className="ml-3 text-sm font-medium" style={{ color: colors.text }}>
                    Mark all as read
                  </Text>
                </TouchableOpacity>
                <View className="h-px mx-3" style={{ backgroundColor: colors.border }} />
                <TouchableOpacity
                  className="flex-row items-center px-4 py-3"
                  onPress={handleDeleteAll}
                >
                  <Ionicons name="trash-outline" size={20} color={colors.error} />
                  <Text className="ml-3 text-sm font-medium" style={{ color: colors.error }}>
                    Delete all
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Menu Backdrop */}
        {showMenu && (
          <TouchableOpacity
            className="absolute inset-0 z-40"
            style={{ top: insets.top + 60 }}
            activeOpacity={1}
            onPress={() => setShowMenu(false)}
          />
        )}

        {/* Filter Chips */}
        <View style={{ backgroundColor: colors.background }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="px-4 py-3"
            contentContainerStyle={{ gap: 12 }}
          >
            <FilterChip label="All" filter="all" />
            <FilterChip label="Unread" filter="unread" />
            <FilterChip label="Bookings" filter="bookings" />
            <FilterChip label="Trainers" filter="trainers" />
          </ScrollView>
        </View>

        {/* Notifications List */}
        {!notifications ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : filteredNotifications.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <View
              className="w-20 h-20 rounded-full items-center justify-center mb-4"
              style={{ backgroundColor: `${colors.primary}20` }}
            >
              <Ionicons
                name="notifications-outline"
                size={40}
                color={colors.primary}
              />
            </View>
            <Text
              className="text-lg font-bold mb-2"
              style={{ color: colors.text }}
            >
              No notifications
            </Text>
            <Text
              className="text-center px-8"
              style={{ color: colors.textSecondary }}
            >
              {activeFilter === "all"
                ? "You'll see your notifications here when you receive them"
                : `No ${activeFilter} notifications`}
            </Text>
          </View>
        ) : (
          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingBottom: insets.bottom + 20,
            }}
          >
            {/* New Section */}
            {newNotifications.length > 0 && (
              <View>
                <View className="px-4 pb-2 pt-4">
                  <Text
                    className="text-lg font-bold leading-tight"
                    style={{ color: colors.text }}
                  >
                    New
                  </Text>
                </View>
                {newNotifications.map((notification: any, index: number) => (
                  <NotificationItem
                    key={notification._id}
                    notification={notification}
                    isLast={
                      index === newNotifications.length - 1 &&
                      earlierNotifications.length === 0
                    }
                  />
                ))}
              </View>
            )}

            {/* Earlier Section */}
            {earlierNotifications.length > 0 && (
              <View style={{ marginTop: newNotifications.length > 0 ? 16 : 0 }}>
                <View className="px-4 pb-2 pt-2">
                  <Text
                    className="text-lg font-bold leading-tight"
                    style={{ color: colors.text }}
                  >
                    Earlier
                  </Text>
                </View>
                {earlierNotifications.map(
                  (notification: any, index: number) => (
                    <NotificationItem
                      key={notification._id}
                      notification={notification}
                      isLast={index === earlierNotifications.length - 1}
                    />
                  )
                )}
              </View>
            )}

            {/* End of list indicator */}
            <View className="items-center justify-center py-8 opacity-50">
              <View
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: colors.border }}
              />
            </View>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}
