import React, { useState } from "react";
import {
  View,
  ActivityIndicator,
  TouchableOpacity,
  Text,
  ScrollView,
  Modal,
  RefreshControl,
  Image,
  Alert,
} from "react-native";
import { useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getColors, Shadows } from "@/constants/colors";
import CalendarView from "@/components/CalendarView";
import { Ionicons } from "@expo/vector-icons";
import GoogleCalendarAuth from "@/components/GoogleCalendarAuth";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import Toast from "react-native-toast-message";
import { Id } from "@/convex/_generated/dataModel";
import NotificationHistory from "@/components/NotificationHistory";

// Format time from 24h format (HH:mm) to 12h format (h AM/PM)
const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(":").map(Number);
  
  // Handle invalid times
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return time;
  }
  
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  
  // Only show minutes if they're not :00
  if (minutes === 0) {
    return `${displayHours} ${period}`;
  }
  
  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
};

export default function BookingsScreen() {
  const { user } = useUser();
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = getColors(scheme === "dark");
  const shadows = scheme === "dark" ? Shadows.dark : Shadows.light;
  const [activeTab, setActiveTab] = useState<"schedule" | "bookings">(
    "bookings"
  );
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const requestCancellation = useMutation(api.bookings.requestCancellation);

  const currentUser = useQuery(
    api.users.getUserByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  const bookings = useQuery(
    api.bookings.getClientBookings,
    user?.id ? { clientId: user.id } : "skip"
  );

  const clientTrainers = useQuery(
    api.users.getClientTrainers,
    user?.id ? { clientId: user.id } : "skip"
  );

  const subscriptions = useQuery(
    api.subscriptions.getClientSubscriptions,
    user?.id ? { clientId: user.id } : "skip"
  );

  // Fetch unread notification count
  const unreadCount = useQuery(
    api.notifications.getUnreadCount,
    user?.id ? { userId: user.id } : "skip"
  );

  if (!user || !bookings || !clientTrainers) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: colors.background }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const enrichedBookings = bookings.map((booking: any) => {
    const trainer = clientTrainers.find(
      (t: any) => t.clerkId === booking.trainerId
    );
    return {
      ...booking,
      trainerName: trainer?.fullName || "Trainer",
      scheduleName: booking.notes || "Training Session",
    };
  });

  const now = new Date();

  const currentBookings = enrichedBookings
    .filter((b: any) => {
      const sessionDateTime = new Date(`${b.date}T${b.startTime}:00`);
      return sessionDateTime >= now && b.status !== "cancelled";
    })
    .sort((a: any, b: any) => {
      const dateA = new Date(`${a.date}T${a.startTime}:00`);
      const dateB = new Date(`${b.date}T${b.startTime}:00`);
      return dateA.getTime() - dateB.getTime();
    });
    
  const pastBookings = enrichedBookings
    .filter((b: any) => {
      const sessionDateTime = new Date(`${b.date}T${b.startTime}:00`);
      return sessionDateTime < now || b.status === "cancelled";
    })
    .sort((a: any, b: any) => {
      const dateA = new Date(`${a.date}T${a.startTime}:00`);
      const dateB = new Date(`${b.date}T${b.startTime}:00`);
      return dateB.getTime() - dateA.getTime(); // Most recent first
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return colors.success;
      case "pending":
        return colors.warning;
      case "cancelled":
        return colors.error;
      default:
        return colors.primary;
    }
  };

  const handleBookTrainer = (trainer: any) => {
    router.push({
      pathname: "/(client)/book-trainer",
      params: {
        trainerId: trainer.clerkId,
        trainerName: trainer.fullName,
        trainerSpecialty: trainer.specialty || "Personal Trainer",
      },
    });
  };

  // Refresh bookings when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      // Force refresh of queries when screen is focused
    }, [])
  );

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // The queries will automatically refetch
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleCancelRequest = (bookingId: Id<"bookings">, bookingDate: string, bookingTime: string) => {
    Alert.alert(
      "Request Cancellation",
      "Your trainer will need to approve this cancellation. If approved, 1 session will be returned to your package.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Request",
          style: "destructive",
          onPress: async () => {
            try {
              await requestCancellation({
                bookingId,
                requestedBy: user!.id,
              });
              Toast.show({
                type: "success",
                text1: "Cancellation Requested",
                text2: "Waiting for trainer approval",
                position: "top",
                visibilityTime: 3000,
              });
            } catch (error: any) {
              Toast.show({
                type: "error",
                text1: "Request Failed",
                text2: error.message || "Unable to request cancellation",
                position: "top",
                visibilityTime: 3000,
              });
            }
          },
        },
      ]
    );
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Gradient Background Overlay */}
      <LinearGradient
        colors={[`${colors.primary}15`, `${colors.primary}05`, "transparent"]}
        className="absolute top-0 left-0 right-0 h-64"
        pointerEvents="none"
      />

      {/* Header Section */}
      <View className="px-4 pt-16 pb-2">
        <View className="flex-row items-center justify-between mb-1">
          <Text
            className="text-3xl font-bold tracking-tight"
            style={{ color: colors.text }}
          >
            Bookings
          </Text>
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
        </View>
        <Text
          className="text-sm font-medium"
          style={{ color: colors.textSecondary }}
        >
          Manage your sessions
        </Text>
      </View>

      {/* Pending Subscriptions Banner */}
      {subscriptions &&
        subscriptions.filter((s: any) => s.paymentStatus === "pending").length >
          0 && (
          <View className="px-4 pb-2">
            <TouchableOpacity
              onPress={() => router.push("/(client)/my-subscriptions" as any)}
              className="rounded-2xl p-4 flex-row items-center"
              style={{
                backgroundColor: `${colors.warning}15`,
                borderWidth: 1,
                borderColor: `${colors.warning}`,
                ...shadows,
              }}
            >
              <View
                className="w-10 h-10 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: `${colors.warning}30` }}
              >
                <Ionicons
                  name="hourglass-outline"
                  size={20}
                  color={colors.warning}
                />
              </View>
              <View className="flex-1">
                <Text
                  className="font-bold text-sm mb-0.5"
                  style={{ color: colors.text }}
                >
                  {
                    subscriptions.filter(
                      (s: any) => s.paymentStatus === "pending"
                    ).length
                  }{" "}
                  Subscription
                  {subscriptions.filter(
                    (s: any) => s.paymentStatus === "pending"
                  ).length > 1
                    ? "s"
                    : ""}{" "}
                  Pending
                </Text>
                <Text
                  className="text-xs"
                  style={{ color: colors.textSecondary }}
                >
                  Waiting for trainer approval
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.warning}
              />
            </TouchableOpacity>
          </View>
        )}

      {/* Segmented Control */}
      <View className="px-4 py-4">
        <View
          className="flex-row p-1 rounded-full relative"
          style={{ backgroundColor: colors.surfaceSecondary }}
        >
          {/* Active Indicator */}
          <View
            className="absolute h-full rounded-full z-0 transition-all"
            style={{
              width: "50%",
              left: activeTab === "bookings" ? 4 : "50%",
              top: 4,
              bottom: 4,
              backgroundColor: colors.surface,
              ...shadows,
            }}
          />
          <TouchableOpacity
            className="flex-1 relative z-10 py-2.5 items-center rounded-full"
            onPress={() => setActiveTab("bookings")}
          >
            <Text
              className="text-sm font-semibold"
              style={{
                color:
                  activeTab === "bookings" ? colors.text : colors.textSecondary,
              }}
            >
              Bookings
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 relative z-10 py-2.5 items-center rounded-full"
            onPress={() => setActiveTab("schedule")}
          >
            <Text
              className="text-sm font-medium"
              style={{
                color:
                  activeTab === "schedule" ? colors.text : colors.textSecondary,
              }}
            >
              Schedule
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab Content */}
      {activeTab === "bookings" ? (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
        >
          {/* My Trainers Section */}
          <View className="mb-8">
            <View className="flex-row items-center justify-between px-4 mb-3">
              <Text
                className="text-lg font-bold"
                style={{ color: colors.text }}
              >
                My Trainers
              </Text>
              {clientTrainers.length > 0 && (
                <TouchableOpacity>
                  <Text
                    className="text-sm font-semibold"
                    style={{ color: colors.primary }}
                  >
                    See All
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="px-4"
              contentContainerStyle={{ gap: 16, paddingBottom: 8 }}
            >
              {clientTrainers.map((trainer: any) => (
                <TouchableOpacity
                  key={trainer._id}
                  className="items-center"
                  style={{ width: 72 }}
                  onPress={() => handleBookTrainer(trainer)}
                >
                  <View
                    className="w-[72px] h-[72px] rounded-full p-0.5"
                    style={{
                      backgroundColor: colors.surfaceSecondary,
                    }}
                  >
                    <View
                      className="w-full h-full rounded-full items-center justify-center"
                      style={{
                        backgroundColor: colors.primary,
                        borderWidth: 2,
                        borderColor: colors.background,
                      }}
                    >
                      <Text className="text-white text-2xl font-bold">
                        {trainer.fullName?.[0] || "T"}
                      </Text>
                    </View>
                  </View>
                  <Text
                    className="text-xs font-medium mt-2 text-center"
                    numberOfLines={1}
                    style={{ color: colors.text }}
                  >
                    {trainer.fullName?.split(" ")[0] || "Trainer"}
                  </Text>
                </TouchableOpacity>
              ))}

              {/* Add New Trainer */}
              <TouchableOpacity
                className="items-center"
                style={{ width: 72 }}
                onPress={() => router.push("/(client)/find-trainers" as any)}
              >
                <View
                  className="w-[72px] h-[72px] rounded-full items-center justify-center border-2 border-dashed"
                  style={{
                    backgroundColor: colors.surfaceSecondary,
                    borderColor: `${colors.primary}50`,
                  }}
                >
                  <Ionicons name="add" size={32} color={colors.primary} />
                </View>
                <Text
                  className="text-xs font-medium mt-2 text-center"
                  style={{ color: colors.textSecondary }}
                >
                  Add New
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Upcoming Section */}
          <View className="mb-8 px-4">
            <Text
              className="text-lg font-bold mb-4"
              style={{ color: colors.text }}
            >
              Upcoming
            </Text>

            {currentBookings.length === 0 ? (
              <View
                className="rounded-2xl p-8 items-center"
                style={{
                  backgroundColor: colors.surface,
                  ...shadows,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Ionicons
                  name="calendar-outline"
                  size={48}
                  color={colors.textTertiary}
                />
                <Text
                  className="text-base font-semibold mt-3"
                  style={{ color: colors.textSecondary }}
                >
                  No upcoming sessions
                </Text>
                <Text
                  className="text-sm mt-1 text-center"
                  style={{ color: colors.textTertiary }}
                >
                  Book a session with your trainer
                </Text>
              </View>
            ) : (
              currentBookings.map((booking: any) => {
                const isToday =
                  new Date(booking.date).toDateString() ===
                  new Date().toDateString();
                const isTomorrow =
                  new Date(booking.date).toDateString() ===
                  new Date(Date.now() + 86400000).toDateString();

                return (
                  <View
                    key={booking._id}
                    className="rounded-2xl p-4 mb-4"
                    style={{
                      backgroundColor: colors.surface,
                      ...shadows,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <View className="flex-row justify-between items-start mb-4">
                      <View className="flex-row gap-3">
                        <View
                          className="w-12 h-12 rounded-full items-center justify-center"
                          style={{ backgroundColor: colors.primary }}
                        >
                          <Text className="text-white text-lg font-bold">
                            {booking.trainerName?.[0] || "T"}
                          </Text>
                        </View>
                        <View>
                          <Text
                            className="font-bold"
                            style={{ color: colors.text }}
                          >
                            {booking.scheduleName || "Training Session"}
                          </Text>
                          <Text
                            className="text-sm"
                            style={{ color: colors.textSecondary }}
                          >
                            with {booking.trainerName}
                          </Text>
                        </View>
                      </View>
                      <View
                        className="px-3 py-1 rounded-full"
                        style={{
                          backgroundColor: isTomorrow
                            ? `${colors.primary}20`
                            : isToday
                              ? `${colors.success}20`
                              : colors.surfaceSecondary,
                        }}
                      >
                        <Text
                          className="text-xs font-bold"
                          style={{
                            color: isTomorrow
                              ? colors.primary
                              : isToday
                                ? colors.success
                                : colors.text,
                          }}
                        >
                          {isTomorrow
                            ? "Tomorrow"
                            : isToday
                              ? "Today"
                              : new Date(booking.date).toLocaleDateString(
                                  "en-US",
                                  { month: "short", day: "numeric" }
                                )}
                        </Text>
                      </View>
                    </View>

                    <View className="gap-2 mb-4">
                      <View className="flex-row items-center gap-2">
                        <Ionicons
                          name="time-outline"
                          size={18}
                          color={colors.primary}
                        />
                        <Text
                          className="text-sm"
                          style={{ color: colors.text }}
                        >
                          {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                        </Text>
                      </View>
                      <View className="flex-row items-center gap-2">
                        <Ionicons
                          name="location-outline"
                          size={18}
                          color={colors.primary}
                        />
                        <Text
                          className="text-sm"
                          style={{ color: colors.text }}
                        >
                          {booking.location || "Virtual Session"}
                        </Text>
                      </View>
                    </View>

                    {/* Cancel Button or Status */}
                    {booking.status === "cancellation_requested" ? (
                      <View
                        className="rounded-xl py-3 px-4 flex-row items-center justify-center"
                        style={{
                          backgroundColor: `${colors.warning}20`,
                          borderWidth: 1,
                          borderColor: colors.warning,
                        }}
                      >
                        <Ionicons
                          name="hourglass-outline"
                          size={18}
                          color={colors.warning}
                        />
                        <Text
                          className="text-sm font-semibold ml-2"
                          style={{ color: colors.warning }}
                        >
                          Cancellation Pending Approval
                        </Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        className="rounded-xl py-3 items-center"
                        style={{
                          backgroundColor: `${colors.error}15`,
                          borderWidth: 1,
                          borderColor: colors.error,
                        }}
                        onPress={() =>
                          handleCancelRequest(
                            booking._id,
                            booking.date,
                            booking.startTime
                          )
                        }
                      >
                        <Text
                          className="text-sm font-semibold"
                          style={{ color: colors.error }}
                        >
                          Request Cancellation
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })
            )}
          </View>

          {/* Past Sessions Section */}
          {pastBookings.length > 0 && (
            <View className="px-4 pb-8">
              <Text
                className="text-lg font-bold mb-4 opacity-80"
                style={{ color: colors.text }}
              >
                Past Sessions
              </Text>

              <View className="gap-3">
                {pastBookings.slice(0, 5).map((booking: any) => (
                  <View
                    key={booking._id}
                    className="rounded-2xl p-4 opacity-70"
                    style={{
                      backgroundColor: `${colors.surface}99`,
                      borderWidth: 1,
                      borderColor: `${colors.border}80`,
                    }}
                  >
                    <View className="flex-row justify-between items-center">
                      <View className="flex-row gap-3 items-center flex-1">
                        <View
                          className="w-10 h-10 rounded-full items-center justify-center grayscale"
                          style={{ backgroundColor: colors.surfaceSecondary }}
                        >
                          <Text
                            className="text-sm font-bold"
                            style={{ color: colors.textSecondary }}
                          >
                            {booking.trainerName?.[0] || "T"}
                          </Text>
                        </View>
                        <View className="flex-1">
                          <Text
                            className="font-semibold text-sm"
                            style={{ color: colors.text }}
                          >
                            {booking.scheduleName || "Training Session"}
                          </Text>
                          <Text
                            className="text-xs"
                            style={{ color: colors.textSecondary }}
                          >
                            {new Date(booking.date).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                              }
                            )}{" "}
                            •{" "}
                            {formatTime(booking.startTime)}
                          </Text>
                        </View>
                      </View>
                      <View
                        className="px-2 py-1 rounded-md"
                        style={{ backgroundColor: `${colors.success}20` }}
                      >
                        <Text
                          className="text-xs font-medium"
                          style={{ color: colors.success }}
                        >
                          Completed
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      ) : (
        <CalendarView bookings={enrichedBookings} userRole="client" />
      )}

      {/* Floating Action Button */}
      <View className="absolute bottom-6 right-6 z-30">
        <TouchableOpacity
          className="w-14 h-14 rounded-full items-center justify-center"
          style={{
            backgroundColor: colors.primary,
            ...shadows,
            shadowColor: colors.primary,
            shadowOpacity: 0.3,
          }}
          onPress={() => {
            if (clientTrainers.length > 0) {
              handleBookTrainer(clientTrainers[0]);
            } else {
              router.push("/(client)/find-trainers" as any);
            }
          }}
        >
          <Ionicons name="add" size={28} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Google Calendar Connect Modal */}
      <Modal
        visible={showCalendarModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCalendarModal(false)}
      >
        <View
          className="flex-1 justify-end"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <View className="mx-4 mb-8">
            <GoogleCalendarAuth
              onConnected={() => setShowCalendarModal(false)}
              onSkip={() => setShowCalendarModal(false)}
            />
          </View>
        </View>
      </Modal>

      {/* Notification History Modal */}
      <NotificationHistory
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </View>
  );
}
