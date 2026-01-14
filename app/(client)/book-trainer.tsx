import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useUser } from "@clerk/clerk-expo";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getColors, Shadows } from "@/constants/colors";
import { useLocalSearchParams, useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const DURATIONS = [
  { value: 45, label: "45 min" },
  { value: 60, label: "1 hour" },
];

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

// Get user's local timezone
const getLocalTimezone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

// Get short timezone label
const getTimezoneLabel = (tz: string): string => {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "short",
    });
    const parts = formatter.formatToParts(now);
    const tzPart = parts.find((p) => p.type === "timeZoneName");
    return tzPart?.value || tz.split("/").pop() || tz;
  } catch {
    return tz.split("/").pop() || tz;
  }
};

// Convert time from one timezone to another
const convertTime = (
  time: string,
  date: string,
  fromTz: string,
  toTz: string
): string => {
  try {
    const [hours, minutes] = time.split(":").map(Number);
    
    // Create date in source timezone
    const sourceDate = new Date(`${date}T${time}:00`);
    
    // Get the time in source timezone
    const sourceFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone: fromTz,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    
    // Get the time in target timezone
    const targetFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone: toTz,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    // Calculate offset difference
    const sourceOffset = getTimezoneOffset(fromTz, sourceDate);
    const targetOffset = getTimezoneOffset(toTz, sourceDate);
    const diffMinutes = targetOffset - sourceOffset;

    const totalMinutes = hours * 60 + minutes + diffMinutes;
    const newHours = Math.floor(((totalMinutes % 1440) + 1440) % 1440 / 60);
    const newMins = ((totalMinutes % 60) + 60) % 60;

    return `${newHours.toString().padStart(2, "0")}:${newMins.toString().padStart(2, "0")}`;
  } catch {
    return time;
  }
};

// Get timezone offset in minutes
const getTimezoneOffset = (tz: string, date: Date): number => {
  const utcDate = new Date(date.toLocaleString("en-US", { timeZone: "UTC" }));
  const tzDate = new Date(date.toLocaleString("en-US", { timeZone: tz }));
  return (tzDate.getTime() - utcDate.getTime()) / 60000;
};

export default function BookTrainerScreen() {
  const { user } = useUser();
  const router = useRouter();
  const params = useLocalSearchParams();
  const scheme = useColorScheme();
  const colors = getColors(scheme === "dark");
  const shadows = scheme === "dark" ? Shadows.dark : Shadows.light;
  const insets = useSafeAreaInsets();

  const trainerId = (params.trainerId as string) || "mock-trainer-id";
  const trainerName = (params.trainerName as string) || "Alex Morgan";
  const trainerSpecialty =
    (params.trainerSpecialty as string) || "Weightlifting Specialist";

  const [selectedDuration, setSelectedDuration] = useState(60);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedSlotTrainerTime, setSelectedSlotTrainerTime] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);
  const [showLocalTime, setShowLocalTime] = useState(true); // Toggle for timezone display

  const localTimezone = useMemo(() => getLocalTimezone(), []);

  // Get available dates for the current month
  const availableDatesData = useQuery(
    api.availability.getAvailableDatesForMonth,
    trainerId
      ? {
          trainerId,
          year: calendarMonth.getFullYear(),
          month: calendarMonth.getMonth(),
        }
      : "skip"
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

  const activeSubscription = useQuery(
    api.subscriptions.getActiveClientSubscription,
    user?.id && trainerId ? { clientId: user.id, trainerId } : "skip"
  );

  const trainerTimezone = availableDatesData?.timezone || "Europe/Oslo";
  const isSameTimezone = localTimezone === trainerTimezone;

  // Convert slots to display timezone
  const displaySlots = useMemo(() => {
    if (!availableSlots || !selectedDate) return [];
    
    const dateStr = selectedDate.toISOString().split("T")[0];
    
    if (showLocalTime && !isSameTimezone) {
      return availableSlots.map((slot: string) => ({
        display: convertTime(slot, dateStr, trainerTimezone, localTimezone),
        original: slot,
      }));
    }
    
    return availableSlots.map((slot: string) => ({
      display: slot,
      original: slot,
    }));
  }, [availableSlots, selectedDate, showLocalTime, trainerTimezone, localTimezone, isSameTimezone]);

  // Generate calendar grid
  const calendarData = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay();
    
    const days: (Date | null)[] = [];
    
    for (let i = 0; i < startPadding; i++) {
      days.push(null);
    }
    
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  }, [calendarMonth]);

  const availableDatesSet = useMemo(() => {
    return new Set(availableDatesData?.availableDates || []);
  }, [availableDatesData]);

  const isDateAvailable = (date: Date | null) => {
    if (!date) return false;
    const dateStr = date.toISOString().split("T")[0];
    return availableDatesSet.has(dateStr);
  };

  const isDateSelected = (date: Date | null) => {
    if (!date || !selectedDate) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    return date.toDateString() === new Date().toDateString();
  };

  const handleSlotSelect = (displayTime: string, originalTime: string) => {
    setSelectedSlot(displayTime);
    setSelectedSlotTrainerTime(originalTime);
  };

  const handleConfirmBooking = async () => {
    if (!user?.id || !selectedSlotTrainerTime || !selectedDate) return;
    setBooking(true);
    try {
      // Always send trainer's timezone time to backend
      await createBooking({
        trainerId,
        clientId: user.id,
        date: selectedDate.toISOString().split("T")[0],
        startTime: selectedSlotTrainerTime,
        duration: selectedDuration,
      });

      Toast.show({
        type: "success",
        text1: "Booking Confirmed!",
        text2: `Session booked for ${selectedDate.toLocaleDateString()} at ${selectedSlot}`,
        position: "top",
        visibilityTime: 4000,
      });

      router.back();
    } catch (error) {
      console.error("Error creating booking:", error instanceof Error ? error.message : 'Unknown error');
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

  const monthName = calendarMonth.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  const selectedDateFormatted = selectedDate
    ? selectedDate.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    : null;

  const currentDisplayTimezone = showLocalTime ? localTimezone : trainerTimezone;

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View style={{ paddingTop: insets.top }}>
          {/* Header */}
          <View className="px-5 py-4 flex-row items-center">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 items-center justify-center rounded-full mr-3"
              style={{ backgroundColor: colors.surface }}
            >
              <Ionicons name="arrow-back" size={20} color={colors.text} />
            </TouchableOpacity>
            <View className="flex-1">
              <Text className="text-xl font-bold" style={{ color: colors.text }}>
                Book Session
              </Text>
            </View>
          </View>

          {/* Trainer Card */}
          <View
            className="mx-5 rounded-2xl p-4 flex-row items-center mb-4"
            style={{ backgroundColor: colors.surface, ...shadows.small }}
          >
            <View
              className="w-12 h-12 rounded-full mr-3 items-center justify-center"
              style={{ backgroundColor: colors.primary }}
            >
              <Text className="text-white text-lg font-bold">
                {trainerName[0]}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold" style={{ color: colors.text }}>
                {trainerName}
              </Text>
              <Text className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>
                {trainerSpecialty}
              </Text>
            </View>
          </View>

          {/* Subscription Status */}
          {activeSubscription === undefined ? (
            <View className="mx-5 mb-4">
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : activeSubscription ? (
            <View
              className="mx-5 rounded-xl p-3 mb-4 flex-row items-center"
              style={{
                backgroundColor: colors.success + "15",
                borderWidth: 1,
                borderColor: colors.success,
              }}
            >
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text className="ml-2 text-sm font-medium" style={{ color: colors.text }}>
                {activeSubscription.remainingSessions} sessions remaining
              </Text>
            </View>
          ) : (
            <View
              className="mx-5 rounded-xl p-4 mb-4"
              style={{
                backgroundColor: colors.warning + "15",
                borderWidth: 1,
                borderColor: colors.warning,
              }}
            >
              <View className="flex-row items-center mb-2">
                <Ionicons name="alert-circle" size={20} color={colors.warning} />
                <Text className="ml-2 font-semibold" style={{ color: colors.text }}>
                  No Active Package
                </Text>
              </View>
              <Text className="text-sm mb-3" style={{ color: colors.textSecondary }}>
                Purchase a package to book sessions
              </Text>
              <TouchableOpacity
                className="rounded-xl py-2.5 items-center"
                style={{ backgroundColor: colors.primary }}
                onPress={() => router.push("/(client)/subscriptions")}
              >
                <Text className="text-white font-semibold text-sm">Buy Package</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Only show booking UI if has active subscription */}
          {activeSubscription && (
            <>
              {/* Duration Selection */}
              <View className="mx-5 mb-4">
                <Text className="text-sm font-semibold mb-2" style={{ color: colors.text }}>
                  Duration
                </Text>
                <View className="flex-row gap-2">
                  {DURATIONS.map((duration) => (
                    <TouchableOpacity
                      key={duration.value}
                      onPress={() => {
                        setSelectedDuration(duration.value);
                        setSelectedSlot(null);
                        setSelectedSlotTrainerTime(null);
                      }}
                      className="flex-1 rounded-xl py-3 items-center"
                      style={{
                        backgroundColor:
                          selectedDuration === duration.value
                            ? colors.primary
                            : colors.surface,
                        ...shadows.small,
                      }}
                    >
                      <Text
                        className="font-semibold text-sm"
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

              {/* Cal.com Style Calendar + Time Slots */}
              <View
                className="mx-5 rounded-2xl overflow-hidden mb-4"
                style={{ backgroundColor: colors.surface, ...shadows.medium }}
              >
                {/* Calendar Section */}
                <View className="p-4">
                  {/* Month Navigation */}
                  <View className="flex-row justify-between items-center mb-4">
                    <TouchableOpacity
                      onPress={() => {
                        const newDate = new Date(calendarMonth);
                        newDate.setMonth(newDate.getMonth() - 1);
                        setCalendarMonth(newDate);
                      }}
                      className="w-8 h-8 items-center justify-center rounded-full"
                      style={{ backgroundColor: colors.surfaceSecondary }}
                    >
                      <Ionicons name="chevron-back" size={18} color={colors.text} />
                    </TouchableOpacity>
                    <Text className="text-base font-bold" style={{ color: colors.text }}>
                      {monthName}
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        const newDate = new Date(calendarMonth);
                        newDate.setMonth(newDate.getMonth() + 1);
                        setCalendarMonth(newDate);
                      }}
                      className="w-8 h-8 items-center justify-center rounded-full"
                      style={{ backgroundColor: colors.surfaceSecondary }}
                    >
                      <Ionicons name="chevron-forward" size={18} color={colors.text} />
                    </TouchableOpacity>
                  </View>

                  {/* Weekday Headers */}
                  <View className="flex-row mb-2">
                    {WEEKDAYS.map((day) => (
                      <View key={day} className="flex-1 items-center">
                        <Text
                          className="text-xs font-medium"
                          style={{ color: colors.textTertiary }}
                        >
                          {day}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Calendar Grid */}
                  <View className="flex-row flex-wrap">
                    {calendarData.map((date, index) => {
                      const available = isDateAvailable(date);
                      const selected = isDateSelected(date);
                      const today = isToday(date);

                      return (
                        <TouchableOpacity
                          key={index}
                          disabled={!available}
                          onPress={() => {
                            if (date && available) {
                              setSelectedDate(date);
                              setSelectedSlot(null);
                              setSelectedSlotTrainerTime(null);
                            }
                          }}
                          className="items-center justify-center"
                          style={{ width: "14.28%", height: 44 }}
                        >
                          {date && (
                            <View
                              className="w-9 h-9 rounded-full items-center justify-center"
                              style={{
                                backgroundColor: selected
                                  ? colors.primary
                                  : available
                                  ? colors.primary + "20"
                                  : "transparent",
                                borderWidth: today && !selected ? 1 : 0,
                                borderColor: colors.primary,
                              }}
                            >
                              <Text
                                className="text-sm font-medium"
                                style={{
                                  color: selected
                                    ? "#FFF"
                                    : available
                                    ? colors.text
                                    : colors.textTertiary,
                                  opacity: available ? 1 : 0.4,
                                }}
                              >
                                {date.getDate()}
                              </Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Divider */}
                <View style={{ height: 1, backgroundColor: colors.border }} />

                {/* Time Slots Section */}
                <View className="p-4">
                  {selectedDate ? (
                    <>
                      {/* Timezone Toggle */}
                      <View className="flex-row items-center justify-between mb-3">
                        <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                          {selectedDateFormatted}
                        </Text>
                        {!isSameTimezone && (
                          <TouchableOpacity
                            onPress={() => setShowLocalTime(!showLocalTime)}
                            className="flex-row items-center px-2 py-1 rounded-lg"
                            style={{ backgroundColor: colors.surfaceSecondary }}
                          >
                            <Ionicons 
                              name="globe-outline" 
                              size={14} 
                              color={colors.primary} 
                            />
                            <Text 
                              className="text-xs ml-1 font-medium" 
                              style={{ color: colors.primary }}
                            >
                              {getTimezoneLabel(currentDisplayTimezone)}
                            </Text>
                            <Ionicons 
                              name="swap-horizontal" 
                              size={12} 
                              color={colors.textTertiary}
                              style={{ marginLeft: 4 }}
                            />
                          </TouchableOpacity>
                        )}
                      </View>

                      {/* Timezone Info */}
                      {!isSameTimezone && (
                        <View 
                          className="flex-row items-center mb-3 px-2 py-1.5 rounded-lg"
                          style={{ backgroundColor: colors.primary + "10" }}
                        >
                          <Ionicons name="information-circle" size={14} color={colors.primary} />
                          <Text className="text-xs ml-1.5" style={{ color: colors.textSecondary }}>
                            {showLocalTime 
                              ? `Showing your local time (${getTimezoneLabel(localTimezone)})`
                              : `Showing trainer's time (${getTimezoneLabel(trainerTimezone)})`
                            }
                          </Text>
                        </View>
                      )}

                      {!availableSlots ? (
                        <View className="py-4 items-center">
                          <ActivityIndicator color={colors.primary} />
                        </View>
                      ) : displaySlots.length === 0 ? (
                        <View className="py-4 items-center">
                          <Ionicons
                            name="calendar-outline"
                            size={32}
                            color={colors.textTertiary}
                          />
                          <Text
                            className="text-sm mt-2"
                            style={{ color: colors.textSecondary }}
                          >
                            No available slots
                          </Text>
                        </View>
                      ) : (
                        <ScrollView
                          horizontal={false}
                          showsVerticalScrollIndicator={false}
                          style={{ maxHeight: 200 }}
                        >
                          <View className="flex-row flex-wrap gap-2">
                            {displaySlots.map((slot: { display: string; original: string }) => {
                              const isSelected = selectedSlotTrainerTime === slot.original;
                              return (
                                <TouchableOpacity
                                  key={slot.original}
                                  onPress={() => handleSlotSelect(slot.display, slot.original)}
                                  className="rounded-lg px-4 py-2.5"
                                  style={{
                                    backgroundColor: isSelected
                                      ? colors.primary
                                      : colors.surfaceSecondary,
                                    borderWidth: 1,
                                    borderColor: isSelected
                                      ? colors.primary
                                      : colors.border,
                                  }}
                                >
                                  <Text
                                    className="text-sm font-medium"
                                    style={{
                                      color: isSelected ? "#FFF" : colors.text,
                                    }}
                                  >
                                    {slot.display}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        </ScrollView>
                      )}
                    </>
                  ) : (
                    <View className="py-6 items-center">
                      <Ionicons
                        name="calendar"
                        size={32}
                        color={colors.textTertiary}
                      />
                      <Text
                        className="text-sm mt-2"
                        style={{ color: colors.textSecondary }}
                      >
                        Select a date to see available times
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Confirm Button */}
              <View className="mx-5 mb-6">
                <TouchableOpacity
                  onPress={handleConfirmBooking}
                  disabled={!selectedSlot || booking}
                  className="rounded-xl py-4 items-center"
                  style={{
                    backgroundColor: selectedSlot ? colors.primary : colors.border,
                    ...shadows.medium,
                  }}
                >
                  {booking ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text className="text-white font-bold text-base">
                      {selectedSlot
                        ? `Confirm ${selectedDateFormatted} at ${selectedSlot}`
                        : "Select date & time"}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
