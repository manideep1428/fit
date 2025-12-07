import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image, TextInput, Modal } from 'react-native';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getColors, Shadows } from '@/constants/colors';
import { useLocalSearchParams, useRouter } from 'expo-router';
import GoogleCalendarConnect from '@/components/GoogleCalendarConnect';
import { useGoogleCalendar, formatBookingForCalendar } from '@/utils/googleCalendar';
import { Id } from '@/convex/_generated/dataModel';

const DURATIONS = [
  { value: 40, label: '40 min' },
  { value: 60, label: '1 hour' },
];

export default function BookTrainerScreen() {
  const { user } = useUser();
  const router = useRouter();
  const params = useLocalSearchParams();
  const scheme = useColorScheme();
  const colors = getColors(scheme === 'dark');
  const shadows = scheme === 'dark' ? Shadows.dark : Shadows.light;

  // Mock trainer data - in real app, get from params or query
  const trainerId = (params.trainerId as string) || 'mock-trainer-id';
  const trainerName = (params.trainerName as string) || 'Alex Morgan';
  const trainerSpecialty = (params.trainerSpecialty as string) || 'Weightlifting Specialist';

  const [selectedDuration, setSelectedDuration] = useState(60);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [lastBookingId, setLastBookingId] = useState<Id<"bookings"> | null>(null);

  const availableSlots = useQuery(
    api.bookings.getAvailableSlots,
    trainerId && selectedDate
      ? {
          trainerId,
          date: selectedDate.toISOString().split('T')[0],
          duration: selectedDuration,
        }
      : 'skip'
  );

  const createBooking = useMutation(api.bookings.createBooking);
  const updateBookingCalendarEvent = useMutation(api.bookings.updateBookingCalendarEvent);
  const { getToken } = useAuth();
  const { getCalendarService } = useGoogleCalendar();
  
  // Check if user has Google Calendar connected
  const currentUser = useQuery(
    api.users.getUserByClerkId,
    user?.id ? { clerkId: user.id } : 'skip'
  );

  const handleConfirmBooking = async () => {
    if (!user?.id || !selectedSlot) return;
    setBooking(true);
    try {
      const bookingId = await createBooking({
        trainerId,
        clientId: user.id,
        date: selectedDate.toISOString().split('T')[0],
        startTime: selectedSlot,
        duration: selectedDuration,
      });

      setLastBookingId(bookingId);

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
      console.error('Error creating booking:', error);
    } finally {
      setBooking(false);
    }
  };

  const addToGoogleCalendar = async (bookingId: Id<"bookings">) => {
    try {
      const calendarService = await getCalendarService();
      if (!calendarService) {
        console.log('No calendar service available');
        return;
      }

      // Calculate end time
      const endTime = addMinutesToTime(selectedSlot!, selectedDuration);

      const calendarEvent = formatBookingForCalendar({
        date: selectedDate.toISOString().split('T')[0],
        startTime: selectedSlot!,
        endTime,
        trainerName,
        notes: 'Personal training session',
      });

      const event = await calendarService.createEvent(calendarEvent);
      
      // Save the Google Calendar event ID to the booking
      await updateBookingCalendarEvent({
        bookingId,
        googleCalendarEventId: event.id,
      });

      console.log('Event added to Google Calendar:', event.id);
    } catch (error) {
      console.error('Error adding to Google Calendar:', error);
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
    const [hours, mins] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60);
    const newMins = totalMinutes % 60;
    return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
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
  const monthName = selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' });

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
              <Text className="text-lg font-bold mb-1" style={{ color: colors.text }}>
                {trainerName}
              </Text>
              <Text className="text-sm" style={{ color: colors.textSecondary }}>
                {trainerSpecialty}
              </Text>
            </View>
          </View>

          {/* Duration Selection */}
          <View className="mb-6">
            <Text className="text-base font-semibold mb-3" style={{ color: colors.text }}>
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
                    backgroundColor: selectedDuration === duration.value ? colors.primary : colors.surface,
                    ...shadows.medium,
                  }}
                >
                  <Text
                    className="font-semibold"
                    style={{ color: selectedDuration === duration.value ? '#FFF' : colors.text }}
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
                <Ionicons name="chevron-back" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text className="text-lg font-bold" style={{ color: colors.text }}>
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
                <Ionicons name="chevron-forward" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Day headers */}
            <View className="flex-row mb-2">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                <View key={i} className="flex-1 items-center">
                  <Text className="text-sm font-semibold" style={{ color: colors.textSecondary }}>
                    {day}
                  </Text>
                </View>
              ))}
            </View>

            {/* Calendar grid */}
            <View className="flex-row flex-wrap">
              {calendarDays.map((day, index) => {
                const isSelected = day.toDateString() === selectedDate.toDateString();
                const isPast = day < new Date(new Date().setHours(0, 0, 0, 0));
                return (
                  <TouchableOpacity
                    key={index}
                    disabled={isPast}
                    onPress={() => {
                      setSelectedDate(day);
                      setSelectedSlot(null);
                    }}
                    className="items-center justify-center"
                    style={{ width: '14.28%', height: 48 }}
                  >
                    <View
                      className="w-10 h-10 rounded-full items-center justify-center"
                      style={{
                        backgroundColor: isSelected ? colors.primary : 'transparent',
                        opacity: isPast ? 0.3 : 1,
                      }}
                    >
                      <Text
                        className="font-semibold"
                        style={{ color: isSelected ? '#FFF' : colors.text }}
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
            <Text className="text-base font-semibold mb-3" style={{ color: colors.text }}>
              Available Slots
            </Text>
            {!availableSlots ? (
              <ActivityIndicator color={colors.primary} />
            ) : availableSlots.length === 0 ? (
              <Text style={{ color: colors.textSecondary }}>No available slots for this date</Text>
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
                        backgroundColor: isSelected ? colors.primary : colors.surface,
                        ...shadows.small,
                      }}
                    >
                      <Text
                        className="font-semibold"
                        style={{ color: isSelected ? '#FFF' : colors.text }}
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
              backgroundColor: selectedSlot ? colors.primary : colors.border,
              ...shadows.medium,
            }}
          >
            {booking ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text className="text-white font-bold text-base">Confirm Booking</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Google Calendar Connect Modal */}
      <Modal
        visible={showCalendarModal}
        transparent
        animationType="fade"
        onRequestClose={handleSkipCalendar}
      >
        <View className="flex-1 justify-center items-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View className="mx-6 w-full max-w-md">
            <GoogleCalendarConnect
              onConnected={handleCalendarConnected}
              onSkip={handleSkipCalendar}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
