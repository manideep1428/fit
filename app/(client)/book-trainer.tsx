import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useUser, useAuth } from "@clerk/clerk-expo";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getColors, Shadows } from "@/constants/colors";
import { useLocalSearchParams, useRouter } from "expo-router";
import GoogleCalendarAuth from "@/components/GoogleCalendarAuth";
import {
  useGoogleCalendar,
  formatBookingForCalendar,
} from "@/utils/googleCalendar";
import { Id } from "@/convex/_generated/dataModel";
import Toast from "react-native-toast-message";

const DURATIONS = [
  { value: 45, label: "45 min" },
  { value: 60, label: "1 hour" },
];

export default function BookTrainerScreen() {
  const { user } = useUser();
  const router = useRouter();
  const params = useLocalSearchParams();
  const scheme = useColorScheme();
  const colors = getColors(scheme === "dark");
  const shadows = scheme === "dark" ? Shadows.dark : Shadows.light;

  // Mock trainer data - in real app, get from params or query
  const trainerId = (params.trainerId as string) || "mock-trainer-id";
  const trainerName = (params.trainerName as string) || "Alex Morgan";
  const trainerSpecialty =
    (params.trainerSpecialty as string) || "Weightlifting Specialist";

  const [selectedDuration, setSelectedDuration] = useState(60);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [lastBookingId, setLastBookingId] = useState<Id<"bookings"> | null>(
    null
  );

  const availableSlots = useQuery(
    api.bookings.getAvailableSlots,
    trainerId && selectedDate
      ? {
          trainerId,
          date: selectedDate.toISOString().split("T")[0],
          duration: selectedDuration,
        }
      : "skip"
  );

  const createBooking = useMutation(api.bookings.createBooking);
  const updateBookingCalendarEvent = useMutation(
    api.bookings.updateBookingCalendarEvent
  );
  const { getToken } = useAuth();
  const { getCalendarService } = useGoogleCalendar();

  // Check if user has Google Calendar connected
  const currentUser = useQuery(
    api.users.getUserByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  // Check if client has active subscription with this trainer
  const activeSubscription = useQuery(
    api.subscriptions.getActiveClientSubscription,
    user?.id && trainerId ? { clientId: user.id, trainerId } : "skip"
  );

  // Get all client subscriptions to check for pending ones
  const allSubscriptions = useQuery(
    api.subscriptions.getClientSubscriptions,
    user?.id ? { clientId: user.id } : "skip"
  );

  // Get trainer's active packages
  const trainerPackages = useQuery(
    api.packages.getActiveTrainerPackages,
    trainerId ? { trainerId } : "skip"
  );

  const handleConfirmBooking = async () => {
    if (!user?.id || !selectedSlot) return;
    setBooking(true);
    try {
      const bookingId = await createBooking({
        trainerId,
        clientId: user.id,
        date: selectedDate.toISOString().split("T")[0],
        startTime: selectedSlot,
        duration: selectedDuration,
      });

      setLastBookingId(bookingId);

      // Show success toast
      Toast.show({
        type: "success",
        text1: "Booking Confirmed!",
        text2: `Session booked for ${selectedDate.toLocaleDateString()} at ${selectedSlot}`,
        position: "top",
        visibilityTime: 4000,
      });

      // Check if user has Google Calendar connected
      if (currentUser?.googleAccessToken) {
        // User already has calendar connected, add event automatically
        await addToGoogleCalendar(bookingId);
        router.back();
      } else {
        // Show modal to connect Google Calendar
        setShowCalendarModal(true);
      }
    } catch (error) {
      console.error("Error creating booking:", error);
      Toast.show({
        type: "error",
        text1: "Booking Failed",
        text2: "Unable to create booking. Please try again.",
        position: "top",
        visibilityTime: 3000,
      });
    } finally {
      setBooking(false);
    }
  };

  const addToGoogleCalendar = async (bookingId: Id<"bookings">) => {
    try {
      const calendarService = await getCalendarService();
      if (!calendarService) {
        console.log("No calendar service available");
        return;
      }

      // Calculate end time
      const endTime = addMinutesToTime(selectedSlot!, selectedDuration);

      const calendarEvent = formatBookingForCalendar({
        date: selectedDate.toISOString().split("T")[0],
        startTime: selectedSlot!,
        endTime,
        trainerName,
        notes: "Personal training session",
      });

      const event = await calendarService.createEvent(calendarEvent);

      // Save the Google Calendar event ID to the booking
      await updateBookingCalendarEvent({
        bookingId,
        googleCalendarEventId: event.id,
      });

      console.log("Event added to Google Calendar:", event.id);
    } catch (error) {
      console.error("Error adding to Google Calendar:", error);
    }
  };

  const handleCalendarConnected = async () => {
    if (lastBookingId) {
      await addToGoogleCalendar(lastBookingId);
    }
    setShowCalendarModal(false);
    router.back();
  };

  const handleSkipCalendar = () => {
    setShowCalendarModal(false);
    router.back();
  };

  // Helper function to add minutes to time
  const addMinutesToTime = (time: string, minutes: number): string => {
    const [hours, mins] = time.split(":").map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60);
    const newMins = totalMinutes % 60;
    return `${newHours.toString().padStart(2, "0")}:${newMins.toString().padStart(2, "0")}`;
  };

  // Generate calendar days for current month
  const generateCalendarDays = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const calendarDays = generateCalendarDays();
  const monthName = selectedDate.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScrollView className="flex-1">
        <View className="px-6 pt-16 pb-6">
          {/* Header */}
          <View className="flex-row items-center mb-6">
            <TouchableOpacity onPress={() => router.back()} className="mr-4">
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text className="text-2xl font-bold" style={{ color: colors.text }}>
              Book a Session
            </Text>
          </View>

          {/* Trainer Info */}
          <View
            className="rounded-2xl p-5 mb-6 flex-row items-center"
            style={{ backgroundColor: colors.surface, ...shadows.medium }}
          >
            <View
              className="w-16 h-16 rounded-full mr-4 items-center justify-center overflow-hidden"
              style={{ backgroundColor: colors.primary }}
            >
              <Text className="text-white text-2xl font-bold">
                {trainerName[0]}
              </Text>
            </View>
            <View className="flex-1">
              <Text
                className="text-lg font-bold mb-1"
                style={{ color: colors.text }}
              >
                {trainerName}
              </Text>
              <Text className="text-sm" style={{ color: colors.textSecondary }}>
                {trainerSpecialty}
              </Text>
            </View>
          </View>

          {/* Subscription Status */}
          {activeSubscription === undefined ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : activeSubscription ? (
            <View
              className="rounded-2xl p-4 mb-6"
              style={{
                backgroundColor: colors.success + "15",
                borderWidth: 1,
                borderColor: colors.success,
              }}
            >
              <View className="flex-row items-center">
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color={colors.success}
                />
                <View className="flex-1 ml-3">
                  <Text
                    className="font-semibold"
                    style={{ color: colors.text }}
                  >
                    Active Package
                  </Text>
                  <Text
                    className="text-sm mt-1"
                    style={{ color: colors.textSecondary }}
                  >
                    {activeSubscription.remainingSessions} sessions remaining
                  </Text>
                </View>
              </View>
            </View>
          ) : allSubscriptions &&
            allSubscriptions.filter(
              (s: any) =>
                s.trainerId === trainerId && s.paymentStatus === "pending"
            ).length > 0 ? (
            <>
              <View
                className="rounded-2xl p-5 mb-6"
                style={{
                  backgroundColor: colors.warning + "15",
                  borderWidth: 1,
                  borderColor: colors.warning,
                }}
              >
                <View className="flex-row items-center mb-3">
                  <Ionicons
                    name="hourglass-outline"
                    size={24}
                    color={colors.warning}
                  />
                  <Text
                    className="font-semibold ml-3 flex-1"
                    style={{ color: colors.text }}
                  >
                    Subscription Pending Approval
                  </Text>
                </View>
                <Text
                  className="text-sm mb-4"
                  style={{ color: colors.textSecondary }}
                >
                  Your subscription request is waiting for trainer approval.
                  You'll be able to book sessions once approved.
                </Text>
                <TouchableOpacity
                  className="rounded-xl py-3 items-center"
                  style={{ backgroundColor: colors.warning, ...shadows.small }}
                  onPress={() =>
                    router.push("/(client)/my-subscriptions" as any)
                  }
                >
                  <View className="flex-row items-center">
                    <Ionicons name="eye" size={20} color="white" />
                    <Text className="text-white font-bold ml-2">
                      View Subscription Status
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View
                className="rounded-2xl p-5 mb-4"
                style={{
                  backgroundColor: colors.warning + "15",
                  borderWidth: 1,
                  borderColor: colors.warning,
                }}
              >
                <View className="flex-row items-center mb-3">
                  <Ionicons
                    name="alert-circle"
                    size={24}
                    color={colors.warning}
                  />
                  <Text
                    className="font-semibold ml-3 flex-1"
                    style={{ color: colors.text }}
                  >
                    No Active Package
                  </Text>
                </View>
                <Text
                  className="text-sm mb-4"
                  style={{ color: colors.textSecondary }}
                >
                  You need to purchase a package before booking sessions with
                  this trainer.
                </Text>
                <TouchableOpacity
                  className="rounded-xl py-3 items-center"
                  style={{ backgroundColor: colors.primary, ...shadows.small }}
                  onPress={() => router.push("/(client)/pricing")}
                >
                  <View className="flex-row items-center">
                    <Ionicons name="cart" size={20} color="white" />
                    <Text className="text-white font-bold ml-2">
                      Buy a Package
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Available Packages */}
              <View className="mb-6">
                <Text
                  className="text-lg font-bold mb-3"
                  style={{ color: colors.text }}
                >
                  Available Packages
                </Text>
                {!trainerPackages ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : trainerPackages.length === 0 ? (
                  <View
                    className="rounded-xl p-6 items-center"
                    style={{ backgroundColor: colors.surface }}
                  >
                    <Ionicons
                      name="cube-outline"
                      size={48}
                      color={colors.textTertiary}
                    />
                    <Text
                      className="mt-3 text-sm"
                      style={{ color: colors.textSecondary }}
                    >
                      No packages available
                    </Text>
                  </View>
                ) : (
                  trainerPackages.map((pkg: any) => {
                    // Use monthlyAmount from the package schema
                    const basePrice = pkg.monthlyAmount || 0;
                    const discountedPrice = pkg.discount
                      ? basePrice - (basePrice * pkg.discount) / 100
                      : basePrice;
                    return (
                      <View
                        key={pkg._id}
                        className="rounded-xl p-4 mb-3"
                        style={{
                          backgroundColor: colors.surface,
                          ...shadows.medium,
                        }}
                      >
                        <View className="flex-row justify-between items-start mb-2">
                          <Text
                            className="text-lg font-bold flex-1"
                            style={{ color: colors.text }}
                          >
                            {pkg.name}
                          </Text>
                          <View>
                            {pkg.discount && pkg.discount > 0 && (
                              <Text
                                className="text-xs line-through"
                                style={{ color: colors.textTertiary }}
                              >
                                {pkg.currency} {basePrice}
                              </Text>
                            )}
                            <Text
                              className="text-xl font-bold"
                              style={{ color: colors.primary }}
                            >
                              {pkg.currency} {discountedPrice.toFixed(2)}
                            </Text>
                            {pkg.discount && pkg.discount > 0 && (
                              <View className="bg-green-500 px-2 py-0.5 rounded mt-1">
                                <Text className="text-white text-xs font-bold">
                                  {pkg.discount}% OFF
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                        <Text
                          className="text-sm mb-3"
                          style={{ color: colors.textSecondary }}
                        >
                          {pkg.description || "Monthly subscription package"}
                        </Text>
                        <View className="flex-row gap-2 mb-3">
                          <View
                            className="flex-1 rounded-lg p-2"
                            style={{ backgroundColor: colors.primary + "15" }}
                          >
                            <Text
                              className="text-lg font-bold"
                              style={{ color: colors.primary }}
                            >
                              {pkg.sessionsPerMonth || 0}
                            </Text>
                            <Text
                              className="text-xs"
                              style={{ color: colors.textSecondary }}
                            >
                              Sessions/Month
                            </Text>
                          </View>
                          <View
                            className="flex-1 rounded-lg p-2"
                            style={{ backgroundColor: colors.primary + "15" }}
                          >
                            <Text
                              className="text-lg font-bold"
                              style={{ color: colors.primary }}
                            >
                              Monthly
                            </Text>
                            <Text
                              className="text-xs"
                              style={{ color: colors.textSecondary }}
                            >
                              Renewal
                            </Text>
                          </View>
                        </View>
                        <TouchableOpacity
                          className="rounded-xl py-3 items-center"
                          style={{ backgroundColor: colors.primary }}
                          onPress={() => {
                            router.push({
                              pathname: "/(client)/pricing",
                              params: { trainerId },
                            } as any);
                          }}
                        >
                          <Text className="text-white font-semibold">
                            Purchase Package
                          </Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })
                )}
              </View>
            </>
          )}

          {/* Only show booking UI if has active subscription */}
          {activeSubscription && (
            <>
              {/* Duration Selection */}
              <View className="mb-6">
                <Text
                  className="text-base font-semibold mb-3"
                  style={{ color: colors.text }}
                >
                  Select Duration
                </Text>
                <View className="flex-row gap-3">
                  {DURATIONS.map((duration) => (
                    <TouchableOpacity
                      key={duration.value}
                      onPress={() => {
                        setSelectedDuration(duration.value);
                        setSelectedSlot(null);
                      }}
                      className="flex-1 rounded-xl py-4 items-center"
                      style={{
                        backgroundColor:
                          selectedDuration === duration.value
                            ? colors.primary
                            : colors.surface,
                        ...shadows.medium,
                      }}
                    >
                      <Text
                        className="font-semibold"
                        style={{
                          color:
                            selectedDuration === duration.value
                              ? "#FFF"
                              : colors.text,
                        }}
                      >
                        {duration.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Calendar */}
              <View className="mb-6">
                <View className="flex-row justify-between items-center mb-4">
                  <TouchableOpacity
                    onPress={() => {
                      const newDate = new Date(selectedDate);
                      newDate.setMonth(newDate.getMonth() - 1);
                      setSelectedDate(newDate);
                      setSelectedSlot(null);
                    }}
                  >
                    <Ionicons
                      name="chevron-back"
                      size={24}
                      color={colors.text}
                    />
                  </TouchableOpacity>
                  <Text
                    className="text-lg font-bold"
                    style={{ color: colors.text }}
                  >
                    {monthName}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      const newDate = new Date(selectedDate);
                      newDate.setMonth(newDate.getMonth() + 1);
                      setSelectedDate(newDate);
                      setSelectedSlot(null);
                    }}
                  >
                    <Ionicons
                      name="chevron-forward"
                      size={24}
                      color={colors.text}
                    />
                  </TouchableOpacity>
                </View>

                {/* Day headers */}
                <View className="flex-row mb-2">
                  {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                    <View key={i} className="flex-1 items-center">
                      <Text
                        className="text-sm font-semibold"
                        style={{ color: colors.textSecondary }}
                      >
                        {day}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Calendar grid */}
                <View className="flex-row flex-wrap">
                  {calendarDays.map((day, index) => {
                    const isSelected =
                      day.toDateString() === selectedDate.toDateString();
                    const isPast =
                      day < new Date(new Date().setHours(0, 0, 0, 0));
                    return (
                      <TouchableOpacity
                        key={index}
                        disabled={isPast}
                        onPress={() => {
                          setSelectedDate(day);
                          setSelectedSlot(null);
                        }}
                        className="items-center justify-center"
                        style={{ width: "14.28%", height: 48 }}
                      >
                        <View
                          className="w-10 h-10 rounded-full items-center justify-center"
                          style={{
                            backgroundColor: isSelected
                              ? colors.primary
                              : "transparent",
                            opacity: isPast ? 0.3 : 1,
                          }}
                        >
                          <Text
                            className="font-semibold"
                            style={{ color: isSelected ? "#FFF" : colors.text }}
                          >
                            {day.getDate()}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Available Slots */}
              <View className="mb-6">
                <Text
                  className="text-base font-semibold mb-3"
                  style={{ color: colors.text }}
                >
                  Available Slots
                </Text>
                {!availableSlots ? (
                  <ActivityIndicator color={colors.primary} />
                ) : availableSlots.length === 0 ? (
                  <Text style={{ color: colors.textSecondary }}>
                    No available slots for this date
                  </Text>
                ) : (
                  <View className="flex-row flex-wrap gap-3">
                    {availableSlots.map((slot: string) => {
                      const isSelected = selectedSlot === slot;
                      return (
                        <TouchableOpacity
                          key={slot}
                          onPress={() => setSelectedSlot(slot)}
                          className="rounded-xl px-6 py-3"
                          style={{
                            backgroundColor: isSelected
                              ? colors.primary
                              : colors.surface,
                            ...shadows.small,
                          }}
                        >
                          <Text
                            className="font-semibold"
                            style={{ color: isSelected ? "#FFF" : colors.text }}
                          >
                            {slot}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* Confirm Button */}
              <TouchableOpacity
                onPress={handleConfirmBooking}
                disabled={!selectedSlot || booking}
                className="rounded-xl py-4 items-center"
                style={{
                  backgroundColor: selectedSlot
                    ? colors.primary
                    : colors.border,
                  ...shadows.medium,
                }}
              >
                {booking ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text className="text-white font-bold text-base">
                    Confirm Booking
                  </Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>

      {/* Google Calendar Connect Modal */}
      <Modal
        visible={showCalendarModal}
        transparent
        animationType="fade"
        onRequestClose={handleSkipCalendar}
      >
        <View
          className="flex-1 justify-center items-center"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <View className="mx-6 w-full max-w-md">
            <GoogleCalendarAuth
              onConnected={handleCalendarConnected}
              onSkip={handleSkipCalendar}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
