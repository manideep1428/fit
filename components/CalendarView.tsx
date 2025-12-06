import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getColors, Shadows } from '@/constants/colors';

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

export default function CalendarView({ bookings, userRole }: CalendarViewProps) {
  const scheme = useColorScheme();
  const colors = getColors(scheme === 'dark');
  const shadows = scheme === 'dark' ? Shadows.dark : Shadows.light;

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Get the start of the week for the selected date
  const getWeekDates = (date: Date) => {
    const week = [];
    const current = new Date(date);
    const day = current.getDay();
    const diff = current.getDate() - day + (day === 0 ? -6 : 1); // Start from Monday
    current.setDate(diff);

    for (let i = 0; i < 7; i++) {
      week.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return week;
  };

  const weekDates = getWeekDates(selectedDate);

  // Navigate month (limited to one month range)
  const changeMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    
    // Limit to one month from today
    const today = new Date();
    const oneMonthFromNow = new Date(today);
    oneMonthFromNow.setMonth(today.getMonth() + 1);
    
    if (newDate >= today && newDate <= oneMonthFromNow) {
      setCurrentDate(newDate);
      setSelectedDate(newDate);
    }
  };

  // Get bookings for selected date
  const getBookingsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return bookings.filter(b => b.date === dateStr);
  };

  const selectedDateBookings = getBookingsForDate(selectedDate);

  // Generate time slots (9 AM to 6 PM)
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 18; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSameDate = (date1: Date, date2: Date) => {
    return date1.toDateString() === date2.toDateString();
  };

  return (
    <View className="flex-1">
      {/* Header with Month/Year */}
      <View className="px-6 pt-16 pb-3">
        <Text className="text-2xl font-bold text-center mb-4" style={{ color: colors.text }}>
          Schedule
        </Text>
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-xl font-bold" style={{ color: colors.text }}>
            {currentDate.toLocaleDateString('en-US', { month: 'long' })}
          </Text>
          <View className="flex-row items-center gap-4">
            <TouchableOpacity onPress={() => changeMonth('prev')}>
              <Ionicons name="chevron-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text className="text-lg font-semibold" style={{ color: colors.text }}>
              {currentDate.getFullYear()}
            </Text>
            <TouchableOpacity onPress={() => changeMonth('next')}>
              <Ionicons name="chevron-forward" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Week Days */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2">
            {weekDates.map((date, index) => {
              const isSelected = isSameDate(date, selectedDate);
              const isTodayDate = isToday(date);
              
              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => setSelectedDate(date)}
                  className="items-center justify-center rounded-2xl px-4 py-3"
                  style={{
                    backgroundColor: isSelected ? colors.primary : colors.surface,
                    minWidth: 70,
                    ...shadows.small,
                  }}
                >
                  <Text
                    className="text-xs font-medium mb-1"
                    style={{ color: isSelected ? '#FFF' : colors.textSecondary }}
                  >
                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </Text>
                  <Text
                    className="text-2xl font-bold"
                    style={{ color: isSelected ? '#FFF' : isTodayDate ? colors.primary : colors.text }}
                  >
                    {date.getDate()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* Schedule Timeline */}
      <ScrollView className="flex-1 px-6">
        {bookings.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20">
            <Ionicons name="calendar-outline" size={80} color={colors.textTertiary} />
            <Text className="mt-6 text-lg font-semibold" style={{ color: colors.textSecondary }}>
              No bookings yet
            </Text>
            <Text className="mt-2 text-sm text-center px-8" style={{ color: colors.textTertiary }}>
              {userRole === 'client' 
                ? 'Book a session with your trainer to get started'
                : 'Your scheduled sessions will appear here'}
            </Text>
          </View>
        ) : selectedDateBookings.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20">
            <Ionicons name="calendar-clear-outline" size={80} color={colors.textTertiary} />
            <Text className="mt-6 text-lg font-semibold" style={{ color: colors.textSecondary }}>
              No sessions on this day
            </Text>
            <Text className="mt-2 text-sm text-center px-8" style={{ color: colors.textTertiary }}>
              Select another date to view your schedule
            </Text>
          </View>
        ) : (
          timeSlots.map((time, index) => {
            const hour = parseInt(time.split(':')[0]);
            const bookingsAtTime = selectedDateBookings.filter(b => {
              const bookingHour = parseInt(b.startTime.split(':')[0]);
              return bookingHour === hour;
            });

            return (
              <View key={time} className="mb-4">
                <View className="flex-row">
                  {/* Time Label */}
                  <View className="w-16">
                    <Text className="text-sm font-medium" style={{ color: colors.textSecondary }}>
                      {time}
                    </Text>
                  </View>

                  {/* Booking Cards */}
                  <View className="flex-1">
                    {bookingsAtTime.length > 0 ? (
                      bookingsAtTime.map((booking) => (
                        <View
                          key={booking._id}
                          className="rounded-xl p-4 mb-2"
                          style={{
                            backgroundColor: booking.status === 'confirmed' 
                              ? 'rgba(205, 164, 133, 0.2)' 
                              : colors.surface,
                            borderLeftWidth: 3,
                            borderLeftColor: booking.status === 'confirmed' 
                              ? '#CDA485' 
                              : colors.border,
                            ...shadows.small,
                          }}
                        >
                          <Text className="font-bold text-base mb-1" style={{ color: '#CDA485' }}>
                            {booking.scheduleName || 'Training Session'}
                          </Text>
                          <Text className="text-sm mb-1" style={{ color: colors.textSecondary }}>
                            {userRole === 'trainer' 
                              ? booking.clientName || 'Client' 
                              : booking.trainerName || 'Trainer'}, {booking.startTime} - {booking.endTime}
                          </Text>
                        </View>
                      ))
                    ) : (
                      <View
                        className="h-12 rounded-lg"
                        style={{
                          borderTopWidth: 1,
                          borderTopColor: colors.border,
                          opacity: 0.3,
                        }}
                      />
                    )}
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
