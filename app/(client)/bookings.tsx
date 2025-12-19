import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, TouchableOpacity, Text, ScrollView, Modal, RefreshControl } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useQuery } from 'convex/react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '@/convex/_generated/api';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getColors, Shadows } from '@/constants/colors';
import CalendarView from '@/components/CalendarView';
import { Ionicons } from '@expo/vector-icons';
import GoogleCalendarAuth from '@/components/GoogleCalendarAuth';
import GoogleTokenStatus from '@/components/GoogleTokenStatus';
import Svg, { Path } from 'react-native-svg';
import { useFocusEffect } from '@react-navigation/native';

// Google Calendar SVG Icon
const GoogleCalendarIcon = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path fill="#4285F4" d="M22 6c0-1.1-.9-2-2-2h-3V2h-2v2H9V2H7v2H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6zm-2 14H4V9h16v11z" />
    <Path fill="#34A853" d="M10 17h4v-4h-4v4z" />
    <Path fill="#EA4335" d="M16 11.5h2v2h-2z" />
    <Path fill="#FBBC05" d="M6 11.5h2v2H6z" />
  </Svg>
);

export default function BookingsScreen() {
  const { user } = useUser();
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = getColors(scheme === 'dark');
  const shadows = scheme === 'dark' ? Shadows.dark : Shadows.light;
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'schedule' | 'bookings'>('bookings');
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const currentUser = useQuery(
    api.users.getUserByClerkId,
    user?.id ? { clerkId: user.id } : 'skip'
  );

  const bookings = useQuery(
    api.bookings.getClientBookings,
    user?.id ? { clientId: user.id } : 'skip'
  );

  const clientTrainers = useQuery(
    api.users.getClientTrainers,
    user?.id ? { clientId: user.id } : 'skip'
  );

  if (!user || !bookings || !clientTrainers) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const enrichedBookings = bookings.map((booking: any) => {
    const trainer = clientTrainers.find((t: any) => t.clerkId === booking.trainerId);
    return {
      ...booking,
      trainerName: trainer?.fullName || 'Trainer',
      scheduleName: booking.notes || 'Training Session',
    };
  });

  const now = new Date();
  // Set time to start of current hour to avoid timezone issues
  now.setMinutes(0, 0, 0);
  
  const currentBookings = enrichedBookings.filter((b: any) => {
    const sessionDateTime = new Date(`${b.date}T${b.startTime}:00`);
    return sessionDateTime >= now;
  });
  const pastBookings = enrichedBookings.filter((b: any) => {
    const sessionDateTime = new Date(`${b.date}T${b.startTime}:00`);
    return sessionDateTime < now;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return colors.success;
      case 'pending': return colors.warning;
      case 'cancelled': return colors.error;
      default: return colors.primary;
    }
  };

  const handleBookTrainer = (trainer: any) => {
    router.push({
      pathname: '/(client)/book-trainer',
      params: {
        trainerId: trainer.clerkId,
        trainerName: trainer.fullName,
        trainerSpecialty: trainer.specialty || 'Personal Trainer',
      },
    });
  };

  const isCalendarConnected = !!currentUser?.googleAccessToken;

  // Refresh bookings when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      // Force refresh of queries when screen is focused
      console.log('Bookings screen focused, refreshing data...');
    }, [])
  );

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // The queries will automatically refetch
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Header */}
      <View
        className="px-6 pb-5"
        style={{ backgroundColor: colors.surface, paddingTop: insets.top + 12 }}
      >
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-3xl font-bold" style={{ color: colors.text }}>Bookings</Text>
            <Text className="text-sm mt-1" style={{ color: colors.textSecondary }}>
              Manage your sessions
            </Text>
          </View>

          {/* Google Calendar Status */}
          <GoogleTokenStatus onConnect={() => setShowCalendarModal(true)} />
        </View>
      </View>

      {/* Tab Header */}
      <View
        className="mx-6 my-4 p-1.5 rounded-2xl flex-row"
        style={{ backgroundColor: colors.surfaceSecondary }}
      >
        <TouchableOpacity
          className="flex-1 py-3 rounded-xl items-center flex-row justify-center"
          style={{
            backgroundColor: activeTab === 'bookings' ? colors.surface : 'transparent',
            ...(activeTab === 'bookings' ? shadows.small : {}),
          }}
          onPress={() => setActiveTab('bookings')}
        >
          <Ionicons
            name="list-outline"
            size={18}
            color={activeTab === 'bookings' ? colors.primary : colors.textSecondary}
          />
          <Text
            className="text-sm font-semibold ml-2"
            style={{ color: activeTab === 'bookings' ? colors.primary : colors.textSecondary }}
          >
            Bookings
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 py-3 rounded-xl items-center flex-row justify-center"
          style={{
            backgroundColor: activeTab === 'schedule' ? colors.surface : 'transparent',
            ...(activeTab === 'schedule' ? shadows.small : {}),
          }}
          onPress={() => setActiveTab('schedule')}
        >
          <Ionicons
            name="calendar-outline"
            size={18}
            color={activeTab === 'schedule' ? colors.primary : colors.textSecondary}
          />
          <Text
            className="text-sm font-semibold ml-2"
            style={{ color: activeTab === 'schedule' ? colors.primary : colors.textSecondary }}
          >
            Schedule
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'bookings' ? (
        <ScrollView 
          className="flex-1" 
          contentContainerStyle={{ paddingBottom: 100 }} 
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
          <View className="px-6 pt-2">
            <View className="flex-row items-center mb-4">
              <View
                className="w-8 h-8 rounded-lg items-center justify-center mr-3"
                style={{ backgroundColor: `${colors.primary}15` }}
              >
                <Ionicons name="people" size={16} color={colors.primary} />
              </View>
              <Text className="text-lg font-bold" style={{ color: colors.text }}>
                My Trainers
              </Text>
            </View>

            {clientTrainers.length === 0 ? (
              <View
                className="py-10 items-center rounded-2xl"
                style={{ backgroundColor: colors.surface, ...shadows.small }}
              >
                <Ionicons name="people-outline" size={32} color={colors.textTertiary} />
                <Text className="text-base font-semibold mt-3" style={{ color: colors.textSecondary }}>
                  No trainers yet
                </Text>
              </View>
            ) : (
              clientTrainers.map((trainer: any, index: number) => (
                <View key={trainer._id}>
                  <TouchableOpacity
                    className="rounded-2xl p-4 mb-3 flex-row items-center"
                    style={{ backgroundColor: colors.surface, ...shadows.small }}
                    onPress={() => handleBookTrainer(trainer)}
                  >
                    <View
                      className="w-12 h-12 rounded-full items-center justify-center mr-3"
                      style={{ backgroundColor: colors.primary }}
                    >
                      <Text className="text-white text-lg font-bold">
                        {trainer.fullName?.[0] || 'T'}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-semibold" style={{ color: colors.text }}>
                        {trainer.fullName}
                      </Text>
                      <Text className="text-sm" style={{ color: colors.textSecondary }}>
                        {trainer.specialty || 'Personal Trainer'}
                      </Text>
                    </View>
                    <View
                      className="px-3 py-1.5 rounded-lg"
                      style={{ backgroundColor: colors.primary }}
                    >
                      <Text className="text-white text-xs font-semibold">Book</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>

          {/* Divider */}
          <View className="px-6 py-6">
            <View className="flex-row items-center">
              <View className="flex-1 h-px" style={{ backgroundColor: colors.border }} />
              <Text className="px-4 text-xs font-semibold uppercase" style={{ color: colors.textTertiary }}>
                Sessions
              </Text>
              <View className="flex-1 h-px" style={{ backgroundColor: colors.border }} />
            </View>
          </View>

          {/* Upcoming Bookings */}
          <View className="px-6">
            <View className="flex-row items-center mb-4">
              <View
                className="w-8 h-8 rounded-lg items-center justify-center mr-3"
                style={{ backgroundColor: `${colors.success}15` }}
              >
                <Ionicons name="calendar" size={16} color={colors.success} />
              </View>
              <Text className="text-lg font-bold" style={{ color: colors.text }}>
                Upcoming
              </Text>
              {currentBookings.length > 0 && (
                <View className="ml-2 px-2 py-0.5 rounded-full" style={{ backgroundColor: `${colors.primary}15` }}>
                  <Text className="text-xs font-bold" style={{ color: colors.primary }}>{currentBookings.length}</Text>
                </View>
              )}
            </View>

            {currentBookings.length === 0 ? (
              <View
                className="py-10 items-center rounded-2xl"
                style={{ backgroundColor: colors.surface, ...shadows.small }}
              >
                <Ionicons name="calendar-outline" size={32} color={colors.textTertiary} />
                <Text className="text-base font-semibold mt-3" style={{ color: colors.textSecondary }}>
                  No upcoming sessions
                </Text>
              </View>
            ) : (
              currentBookings.map((booking: any, index: number) => (
                <View
                  key={booking._id}
                  className="rounded-2xl p-4 mb-3 overflow-hidden"
                  style={{ backgroundColor: colors.surface, ...shadows.small }}
                >
                  <View
                    className="absolute left-0 top-0 bottom-0 w-1"
                    style={{ backgroundColor: getStatusColor(booking.status) }}
                  />
                  <View className="pl-2">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-lg font-bold" style={{ color: colors.text }}>
                        {booking.trainerName}
                      </Text>
                      <View
                        className="px-2.5 py-1 rounded-lg"
                        style={{ backgroundColor: `${getStatusColor(booking.status)}15` }}
                      >
                        <Text className="text-xs font-bold uppercase" style={{ color: getStatusColor(booking.status) }}>
                          {booking.status}
                        </Text>
                      </View>
                    </View>
                    <View className="flex-row items-center mt-2">
                      <Ionicons name="fitness-outline" size={14} color={colors.textSecondary} />
                      <Text className="text-sm ml-1.5" style={{ color: colors.textSecondary }}>
                        {booking.scheduleName}
                      </Text>
                    </View>
                    <View className="flex-row items-center mt-1.5">
                      <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                      <Text className="text-sm ml-1.5" style={{ color: colors.textSecondary }}>
                        {new Date(booking.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </Text>
                    </View>
                    <View className="flex-row items-center mt-1">
                      <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                      <Text className="text-sm ml-1.5" style={{ color: colors.textSecondary }}>
                        {new Date(`2000-01-01T${booking.startTime}`).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true,
                        })} - {new Date(`2000-01-01T${booking.endTime}`).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true,
                        })}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Past Sessions */}
          {pastBookings.length > 0 && (
            <View className="px-6 mt-6">
              <View className="flex-row items-center mb-4">
                <View
                  className="w-8 h-8 rounded-lg items-center justify-center mr-3"
                  style={{ backgroundColor: colors.surfaceSecondary }}
                >
                  <Ionicons name="time" size={16} color={colors.textTertiary} />
                </View>
                <Text className="text-lg font-bold" style={{ color: colors.text }}>
                  Past Sessions
                </Text>
              </View>

              {pastBookings.slice(0, 3).map((booking: any, index: number) => (
                <View
                  key={booking._id}
                  className="rounded-2xl p-4 mb-3"
                  style={{ backgroundColor: colors.surface, opacity: 0.7, ...shadows.small }}
                >
                  <View className="flex-row items-start">
                    <View className="flex-1">
                      <Text className="text-base font-semibold" style={{ color: colors.text }}>
                        {booking.trainerName}
                      </Text>
                      <Text className="text-sm mt-1" style={{ color: colors.textTertiary }}>
                        {new Date(booking.date).toLocaleDateString()}
                      </Text>
                    </View>
                    <Text className="text-xs font-medium uppercase" style={{ color: colors.textTertiary }}>
                      Completed
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      ) : (
        <CalendarView bookings={enrichedBookings} userRole="client" />
      )}

      {/* Google Calendar Connect Modal */}
      <Modal
        visible={showCalendarModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCalendarModal(false)}
      >
        <View className="flex-1 justify-center items-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View className="mx-6 w-full max-w-md">
            <GoogleCalendarAuth
              onConnected={() => setShowCalendarModal(false)}
              onSkip={() => setShowCalendarModal(false)}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
