import { useState } from 'react';
import {
  View,
  ActivityIndicator,
  TouchableOpacity,
  Text,
  ScrollView,
  Modal,
} from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getColors, Shadows } from '@/constants/colors';
import CalendarView from '@/components/CalendarView';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import GoogleCalendarConnect from '@/components/GoogleCalendarConnect';

export default function BookingsScreen() {
  const { user } = useUser();
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = getColors(scheme === 'dark');
  const shadows = scheme === 'dark' ? Shadows.dark : Shadows.light;
  const [activeTab, setActiveTab] = useState<'schedule' | 'bookings'>('schedule');
  const [showCalendarModal, setShowCalendarModal] = useState(false);

  // Get current user to check Google Calendar connection
  const currentUser = useQuery(
    api.users.getUserByClerkId,
    user?.id ? { clerkId: user.id } : 'skip'
  );

  const bookings = useQuery(
    api.bookings.getClientBookings,
    user?.id ? { clientId: user.id } : 'skip'
  );

  // Get only the client's assigned trainers
  const clientTrainers = useQuery(
    api.users.getClientTrainers,
    user?.id ? { clientId: user.id } : 'skip'
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

  // Enrich bookings with trainer names and schedule names
  const enrichedBookings = bookings.map((booking: any) => {
    const trainer = clientTrainers.find((t: any) => t.clerkId === booking.trainerId);
    return {
      ...booking,
      trainerName: trainer?.fullName || 'Trainer',
      scheduleName: booking.notes || 'Training Session',
    };
  });

  // Separate current and past bookings
  const now = new Date();
  const currentBookings = enrichedBookings.filter(
    (b: any) => new Date(b.startTime) >= now
  );
  const pastBookings = enrichedBookings.filter((b: any) => new Date(b.startTime) < now);

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

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Header with Calendar Connect Button */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b" style={{ borderBottomColor: colors.border }}>
        <Text className="text-xl font-bold" style={{ color: colors.text }}>
          Bookings
        </Text>
        {!currentUser?.googleAccessToken && (
          <TouchableOpacity
            onPress={() => setShowCalendarModal(true)}
            className="flex-row items-center px-3 py-2 rounded-lg"
            style={{ backgroundColor: colors.primary + '20' }}
          >
            <Ionicons name="calendar-outline" size={18} color={colors.primary} />
            <Text className="ml-2 text-sm font-semibold" style={{ color: colors.primary }}>
              Connect Calendar
            </Text>
          </TouchableOpacity>
        )}
        {currentUser?.googleAccessToken && (
          <View className="flex-row items-center">
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text className="ml-1 text-sm" style={{ color: colors.success }}>
              Calendar Connected
            </Text>
          </View>
        )}
      </View>

      {/* Tab Header */}
      <View className="flex-row border-b" style={{ borderBottomColor: colors.border }}>
        <TouchableOpacity
          className="flex-1 py-4 items-center"
          style={{
            borderBottomWidth: activeTab === 'schedule' ? 2 : 0,
            borderBottomColor: colors.primary,
          }}
          onPress={() => setActiveTab('schedule')}
        >
          <Text
            className="text-base font-semibold"
            style={{
              color: activeTab === 'schedule' ? colors.primary : colors.textSecondary,
            }}
          >
            My Schedule
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 py-4 items-center"
          style={{
            borderBottomWidth: activeTab === 'bookings' ? 2 : 0,
            borderBottomColor: colors.primary,
          }}
          onPress={() => setActiveTab('bookings')}
        >
          <Text
            className="text-base font-semibold"
            style={{
              color: activeTab === 'bookings' ? colors.primary : colors.textSecondary,
            }}
          >
            Bookings
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'schedule' ? (
        <CalendarView bookings={enrichedBookings} userRole="client" />
      ) : (
        <ScrollView className="flex-1">
          {/* My Trainers Section */}
          <View className="p-4">
            <Text className="text-xl font-bold mb-4" style={{ color: colors.text }}>
              My Trainers
            </Text>
            {clientTrainers.length === 0 ? (
              <Text className="text-center py-8" style={{ color: colors.textSecondary }}>
                No trainers assigned yet
              </Text>
            ) : (
              clientTrainers.map((trainer: any) => (
                <TouchableOpacity
                  key={trainer._id}
                  onPress={() => handleBookTrainer(trainer)}
                  className="mb-3 p-4 rounded-lg flex-row items-center"
                  style={{ backgroundColor: colors.cardBackground, ...shadows.small }}
                >
                  <View
                    className="w-12 h-12 rounded-full mr-3 items-center justify-center"
                    style={{ backgroundColor: colors.primary }}
                  >
                    <Text className="text-white text-lg font-bold">
                      {trainer.fullName?.[0] || 'T'}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-semibold" style={{ color: colors.text }}>
                      {trainer.fullName}
                    </Text>
                    <Text className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                      {trainer.specialty || 'Personal Trainer'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* Current Bookings */}
          <View className="p-4 border-t" style={{ borderTopColor: colors.border }}>
            <Text className="text-xl font-bold mb-4" style={{ color: colors.text }}>
              Current Bookings
            </Text>
            {currentBookings.length === 0 ? (
              <Text className="text-center py-8" style={{ color: colors.textSecondary }}>
                No upcoming bookings
              </Text>
            ) : (
              currentBookings.map((booking: any) => (
                <View
                  key={booking._id}
                  className="mb-3 p-4 rounded-lg"
                  style={{ backgroundColor: colors.cardBackground }}
                >
                  <Text className="text-lg font-semibold" style={{ color: colors.text }}>
                    {booking.trainerName}
                  </Text>
                  <Text className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                    {booking.scheduleName}
                  </Text>
                  <Text className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                    {new Date(booking.startTime).toLocaleString()}
                  </Text>
                  <Text
                    className="text-xs mt-2 font-medium"
                    style={{
                      color:
                        booking.status === 'confirmed' ? colors.success : colors.primary,
                    }}
                  >
                    {booking.status?.toUpperCase()}
                  </Text>
                </View>
              ))
            )}
          </View>

          {/* Booking History */}
          <View className="p-4 border-t" style={{ borderTopColor: colors.border }}>
            <Text className="text-xl font-bold mb-4" style={{ color: colors.text }}>
              Booking History
            </Text>
            {pastBookings.length === 0 ? (
              <Text className="text-center py-8" style={{ color: colors.textSecondary }}>
                No past bookings
              </Text>
            ) : (
              pastBookings.map((booking: any) => (
                <View
                  key={booking._id}
                  className="mb-3 p-4 rounded-lg opacity-70"
                  style={{ backgroundColor: colors.cardBackground }}
                >
                  <Text className="text-lg font-semibold" style={{ color: colors.text }}>
                    {booking.trainerName}
                  </Text>
                  <Text className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                    {booking.scheduleName}
                  </Text>
                  <Text className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                    {new Date(booking.startTime).toLocaleString()}
                  </Text>
                  <Text
                    className="text-xs mt-2 font-medium"
                    style={{ color: colors.textSecondary }}
                  >
                    {booking.status?.toUpperCase()}
                  </Text>
                </View>
              ))
            )}
          </View>
        </ScrollView>
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
            <GoogleCalendarConnect
              onConnected={() => setShowCalendarModal(false)}
              onSkip={() => setShowCalendarModal(false)}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
