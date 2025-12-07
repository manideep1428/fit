import { useState } from 'react';
import { View, ActivityIndicator, TouchableOpacity, Text, ScrollView } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getColors } from '@/constants/colors';
import CalendarView from '@/components/CalendarView';

export default function BookingsScreen() {
  const { user } = useUser();
  const scheme = useColorScheme();
  const colors = getColors(scheme === 'dark');
  const [activeTab, setActiveTab] = useState<'schedule' | 'bookings'>('schedule');

  const bookings = useQuery(
    api.bookings.getTrainerBookings,
    user?.id ? { trainerId: user.id } : 'skip'
  );

  const clients = useQuery(api.users.getAllClients);

  if (!user || !bookings || !clients) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Enrich bookings with client names and schedule names
  const enrichedBookings = bookings.map((booking: any) => {
    const client = clients.find((c: any) => c.clerkId === booking.clientId);
    return {
      ...booking,
      clientName: client?.fullName || 'Client',
      scheduleName: booking.notes || 'Training Session',
    };
  });

  // Separate current and past bookings
  const now = new Date();
  const currentBookings = enrichedBookings.filter((b: any) => new Date(b.startTime) >= now);
  const pastBookings = enrichedBookings.filter((b: any) => new Date(b.startTime) < now);

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Header */}
      <View className="px-6 pt-16 pb-4 border-b" style={{ borderBottomColor: colors.border }}>
        <Text className="text-2xl font-bold" style={{ color: colors.text }}>
          Bookings
        </Text>
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
            style={{ color: activeTab === 'schedule' ? colors.primary : colors.textSecondary }}
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
            style={{ color: activeTab === 'bookings' ? colors.primary : colors.textSecondary }}
          >
            Bookings
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'schedule' ? (
        <CalendarView bookings={enrichedBookings} userRole="trainer" />
      ) : (
        <ScrollView className="flex-1">
          {/* Current Bookings */}
          <View className="p-4">
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
                    {booking.clientName}
                  </Text>
                  <Text className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                    {booking.scheduleName}
                  </Text>
                  <Text className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                    {new Date(booking.startTime).toLocaleString()}
                  </Text>
                  <Text
                    className="text-xs mt-2 font-medium"
                    style={{ color: booking.status === 'confirmed' ? colors.success : colors.primary }}
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
                    {booking.clientName}
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
    </View>
  );
}
