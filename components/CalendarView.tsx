import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getColors, Shadows } from '@/constants/colors';
import Animated, { FadeIn, FadeInRight } from 'react-native-reanimated';

interface Booking {
  _id: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  status: string;
  notes?: string;
  scheduleName?: string;
  clientName?: string;
  trainerName?: string;
}

interface CalendarViewProps {
  bookings: Booking[];
  userRole: 'client' | 'trainer';
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarView({ bookings, userRole }: CalendarViewProps) {
  const scheme = useColorScheme();
  const colors = getColors(scheme === 'dark');
  const shadows = scheme === 'dark' ? Shadows.dark : Shadows.light;

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  // Get week dates for selected date
  const getWeekDates = (date: Date) => {
    const week = [];
    const current = new Date(date);
    const day = current.getDay();
    const diff = current.getDate() - day;
    current.setDate(diff);

    for (let i = 0; i < 7; i++) {
      week.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return week;
  };

  const weekDates = getWeekDates(selectedDate);

  // Get month dates for calendar popup
  const getMonthDates = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const dates: (Date | null)[] = [];
    for (let i = 0; i < firstDay.getDay(); i++) {
      dates.push(null);
    }
    for (let day = 1; day <= lastDay.getDate(); day++) {
      dates.push(new Date(year, month, day));
    }
    return dates;
  };

  // Get bookings for a date
  const getBookingsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return bookings.filter(b => b.date === dateStr);
  };

  const selectedDateBookings = getBookingsForDate(selectedDate);

  const isToday = (date: Date) => new Date().toDateString() === date.toDateString();
  const isSameDate = (d1: Date, d2: Date) => d1.toDateString() === d2.toDateString();
  const hasBookings = (date: Date) => getBookingsForDate(date).length > 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return colors.success;
      case 'pending': return colors.warning;
      case 'cancelled': return colors.error;
      default: return colors.primary;
    }
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setCalendarVisible(false);
  };

  const changeMonth = (dir: 'prev' | 'next') => {
    const newDate = new Date(calendarMonth);
    newDate.setMonth(newDate.getMonth() + (dir === 'next' ? 1 : -1));
    setCalendarMonth(newDate);
  };

  return (
    <View className="flex-1">
      {/* Header with week selector */}
      <View className="px-6 pt-5 pb-4">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-lg font-bold" style={{ color: colors.text }}>
            {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Text>
          <TouchableOpacity
            onPress={() => {
              setCalendarMonth(selectedDate);
              setCalendarVisible(true);
            }}
            className="w-10 h-10 rounded-xl items-center justify-center"
            style={{ backgroundColor: colors.surface, ...shadows.small }}
          >
            <Ionicons name="calendar" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Week View */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2">
            {weekDates.map((date, index) => {
              const isSelected = isSameDate(date, selectedDate);
              const isTodayDate = isToday(date);
              const hasBooking = hasBookings(date);

              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => setSelectedDate(date)}
                  className="items-center justify-center rounded-2xl"
                  style={{
                    backgroundColor: isSelected ? colors.primary : colors.surface,
                    width: 52,
                    paddingVertical: 12,
                    ...shadows.small,
                    borderWidth: isTodayDate && !isSelected ? 1.5 : 0,
                    borderColor: colors.primary,
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    className="text-xs font-medium mb-1"
                    style={{ color: isSelected ? '#FFF' : colors.textSecondary }}
                  >
                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </Text>
                  <Text
                    className="text-lg font-bold"
                    style={{ color: isSelected ? '#FFF' : colors.text }}
                  >
                    {date.getDate()}
                  </Text>
                  {/* Booking indicator - green dot */}
                  {hasBooking && (
                    <View
                      className="w-1.5 h-1.5 rounded-full mt-1"
                      style={{ backgroundColor: isSelected ? '#FFF' : colors.success }}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* Divider */}
      <View style={{ height: 1, backgroundColor: colors.border, marginHorizontal: 24 }} />

      {/* Selected Date Bookings */}
      <ScrollView
        className="flex-1 px-6 pt-4"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-sm font-medium mb-3" style={{ color: colors.textSecondary }}>
          {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </Text>

        {selectedDateBookings.length === 0 ? (
          <View
            className="py-10 items-center rounded-2xl"
            style={{ backgroundColor: colors.surface, ...shadows.small }}
          >
            <Ionicons name="calendar-outline" size={32} color={colors.textTertiary} />
            <Text className="text-base font-medium mt-3" style={{ color: colors.textSecondary }}>
              No sessions
            </Text>
          </View>
        ) : (
          selectedDateBookings.map((booking, index) => (
            <Animated.View
              key={booking._id}
              entering={FadeInRight.delay(50 * index)}
              className="rounded-2xl p-4 mb-3"
              style={{ backgroundColor: colors.surface, ...shadows.small, borderLeftWidth: 3, borderLeftColor: getStatusColor(booking.status) }}
            >
              <View className="flex-row items-center justify-between">
                <Text className="font-bold text-base" style={{ color: colors.text }}>
                  {booking.scheduleName || 'Training Session'}
                </Text>
                <Text className="text-xs font-semibold uppercase" style={{ color: getStatusColor(booking.status) }}>
                  {booking.status}
                </Text>
              </View>
              <View className="flex-row items-center mt-2">
                <Ionicons name="person-outline" size={14} color={colors.textSecondary} />
                <Text className="text-sm ml-1.5" style={{ color: colors.textSecondary }}>
                  {userRole === 'trainer' ? booking.clientName || 'Client' : booking.trainerName || 'Trainer'}
                </Text>
              </View>
              <View className="flex-row items-center mt-1">
                <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                <Text className="text-sm ml-1.5" style={{ color: colors.textSecondary }}>
                  {booking.startTime} - {booking.endTime}
                </Text>
              </View>
            </Animated.View>
          ))
        )}
      </ScrollView>

      {/* Calendar Modal */}
      <Modal visible={calendarVisible} transparent animationType="fade">
        <TouchableOpacity
          className="flex-1 items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          activeOpacity={1}
          onPress={() => setCalendarVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            className="mx-6 rounded-3xl p-5"
            style={{ backgroundColor: colors.surface, width: '90%', ...shadows.large }}
          >
            {/* Calendar Header */}
            <View className="flex-row items-center justify-between mb-4">
              <TouchableOpacity onPress={() => changeMonth('prev')}>
                <Ionicons name="chevron-back" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text className="text-lg font-bold" style={{ color: colors.text }}>
                {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </Text>
              <TouchableOpacity onPress={() => changeMonth('next')}>
                <Ionicons name="chevron-forward" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Weekday headers */}
            <View className="flex-row mb-2">
              {WEEKDAYS.map((day) => (
                <View key={day} className="flex-1 items-center">
                  <Text className="text-xs font-medium" style={{ color: colors.textTertiary }}>{day}</Text>
                </View>
              ))}
            </View>

            {/* Calendar Grid */}
            <View className="flex-row flex-wrap">
              {getMonthDates(calendarMonth).map((date, i) => {
                if (!date) return <View key={`e-${i}`} className="w-[14.28%] h-10" />;
                const isSelected = isSameDate(date, selectedDate);
                const isTodayDate = isToday(date);
                const hasBooking = hasBookings(date);

                return (
                  <TouchableOpacity
                    key={date.toISOString()}
                    onPress={() => handleDateSelect(date)}
                    className="w-[14.28%] h-10 items-center justify-center"
                  >
                    <View
                      className="w-8 h-8 rounded-full items-center justify-center"
                      style={{
                        backgroundColor: isSelected ? colors.primary : 'transparent',
                        borderWidth: isTodayDate && !isSelected ? 1 : 0,
                        borderColor: colors.primary,
                      }}
                    >
                      <Text style={{ color: isSelected ? '#FFF' : colors.text, fontWeight: '500', fontSize: 14 }}>
                        {date.getDate()}
                      </Text>
                    </View>
                    {/* Green indicator for bookings */}
                    {hasBooking && (
                      <View
                        className="absolute bottom-0.5 w-1 h-1 rounded-full"
                        style={{ backgroundColor: colors.success }}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Close button */}
            <TouchableOpacity
              className="mt-4 py-3 rounded-xl items-center"
              style={{ backgroundColor: colors.background }}
              onPress={() => setCalendarVisible(false)}
            >
              <Text className="font-semibold" style={{ color: colors.textSecondary }}>Close</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
