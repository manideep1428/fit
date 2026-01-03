import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getColors, Shadows } from '@/constants/colors';
import { useState } from 'react';
import NotificationHistory from '@/components/NotificationHistory';

export default function ClientsScreen() {
  const { user } = useUser();
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = getColors(scheme === 'dark');
  const shadows = scheme === 'dark' ? Shadows.dark : Shadows.light;
  const insets = useSafeAreaInsets();
  const [showNotifications, setShowNotifications] = useState(false);

  const clients = useQuery(
    api.users.getTrainerClients,
    user?.id ? { trainerId: user.id } : 'skip'
  );

  const bookings = useQuery(
    api.bookings.getTrainerBookings,
    user?.id ? { trainerId: user.id } : 'skip'
  );

  // Fetch unread notification count
  const unreadCount = useQuery(
    api.notifications.getUnreadCount,
    user?.id ? { userId: user.id } : "skip"
  );

  if (!user) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Get booking count per client
  const getClientBookingCount = (clientId: string) => {
    return bookings?.filter((b: any) => b.clientId === clientId && b.status !== 'cancelled').length || 0;
  };

  // Get last booking date for client
  const getLastBookingDate = (clientId: string) => {
    const clientBookings = bookings?.filter((b: any) => b.clientId === clientId) || [];
    if (clientBookings.length === 0) return null;

    const sorted = clientBookings.sort((a: any, b: any) => {
      const dateA = new Date(a.date + 'T' + a.startTime);
      const dateB = new Date(b.date + 'T' + b.startTime);
      return dateB.getTime() - dateA.getTime();
    });

    return sorted[0].date;
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScrollView className="flex-1">
        <View className="px-6 pb-6" style={{ paddingTop: insets.top + 12 }}>
          {/* Header */}
          <View className="mb-6 flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-2xl font-bold" style={{ color: colors.text }}>
                My Clients
              </Text>
              <Text className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                {clients?.length || 0} active {clients?.length === 1 ? 'client' : 'clients'}
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              <TouchableOpacity
                className="relative w-10 h-10 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.surface, ...shadows.small }}
                onPress={() => setShowNotifications(true)}
              >
                <Ionicons name="notifications" size={20} color={colors.text} />
                { typeof unreadCount === "number" &&
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
              <TouchableOpacity
                className="w-12 h-12 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.primary, ...shadows.medium }}
                onPress={() => router.push('/(trainer)/add-client' as any)}
              >
                <Ionicons name="person-add" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Stats Cards */}
          <View className="flex-row gap-3 mb-6">
            <View
              className="flex-1 rounded-2xl p-4"
              style={{ backgroundColor: colors.primary, ...shadows.medium }}
            >
              <Ionicons name="people" size={24} color="#FFF" />
              <Text className="text-white text-2xl font-bold mt-2">
                {clients?.length || 0}
              </Text>
              <Text className="text-white text-xs mt-1">Total Clients</Text>
            </View>

            <TouchableOpacity
              className="flex-1 rounded-2xl p-4"
              style={{ backgroundColor: colors.surface, ...shadows.medium }}
              onPress={() => router.push('/(trainer)/session-history' as any)}
              activeOpacity={0.7}
            >
              <Ionicons name="calendar" size={24} color={colors.primary} />
              <Text className="text-2xl font-bold mt-2" style={{ color: colors.text }}>
                {bookings?.filter((b: any) => b.status !== 'cancelled').length || 0}
              </Text>
              <Text className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                Total Sessions
              </Text>
            </TouchableOpacity>
          </View>

          {/* Clients List */}
          {!clients ? (
            <ActivityIndicator color={colors.primary} />
          ) : clients.length === 0 ? (
            <View
              className="rounded-2xl p-8 items-center"
              style={{ backgroundColor: colors.surface, ...shadows.medium }}
            >
              <Ionicons name="people-outline" size={64} color={colors.textTertiary} />
              <Text className="mt-4 font-semibold text-base" style={{ color: colors.textSecondary }}>
                No clients yet
              </Text>
              <Text className="mt-2 text-sm text-center mb-4" style={{ color: colors.textTertiary }}>
                Add clients to start managing their fitness journey
              </Text>
              <TouchableOpacity
                className="px-6 py-3 rounded-full"
                style={{ backgroundColor: colors.primary }}
                onPress={() => router.push('/(trainer)/add-client' as any)}
              >
                <Text className="text-white font-semibold">Add Client</Text>
              </TouchableOpacity>
            </View>
          ) : (
            clients.map((client: any) => {
              const bookingCount = getClientBookingCount(client.clerkId);
              const lastBooking = getLastBookingDate(client.clerkId);
              const isPending = client.clerkId?.startsWith('pending_');

              return (
                <TouchableOpacity
                  key={client._id}
                  className="rounded-2xl p-5 mb-3"
                  style={{ backgroundColor: colors.surface, ...shadows.medium }}
                  onPress={() => !isPending && router.push(`/(trainer)/client-detail?clientId=${client.clerkId}` as any)}
                  disabled={isPending}
                >
                  <View className="flex-row items-center">
                    <View
                      className="w-16 h-16 rounded-full items-center justify-center mr-4"
                      style={{ backgroundColor: isPending ? colors.textTertiary : colors.primary }}
                    >
                      {client.profileImageId ? (
                        <Image
                          source={{ uri: client.profileImageId }}
                          className="w-full h-full rounded-full"
                        />
                      ) : (
                        <Text className="text-white text-2xl font-bold">
                          {client.fullName?.[0] || 'C'}
                        </Text>
                      )}
                    </View>

                    <View className="flex-1">
                      <View className="flex-row items-center">
                        <Text className="font-bold text-base mb-1" style={{ color: colors.text }}>
                          {client.fullName}
                        </Text>
                        {isPending && (
                          <View 
                            className="ml-2 px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: `${colors.warning}20` }}
                          >
                            <Text className="text-xs font-medium" style={{ color: colors.warning }}>
                              Pending
                            </Text>
                          </View>
                        )}
                      </View>
                      {client.email && (
                        <Text className="text-sm mb-1" style={{ color: colors.textSecondary }}>
                          {client.email}
                        </Text>
                      )}
                      {isPending ? (
                        <Text className="text-xs" style={{ color: colors.textTertiary }}>
                          Waiting for client to sign in
                        </Text>
                      ) : (
                        <View className="flex-row items-center gap-3">
                          <View className="flex-row items-center">
                            <Ionicons name="calendar-outline" size={14} color={colors.textTertiary} />
                            <Text className="ml-1 text-xs" style={{ color: colors.textSecondary }}>
                              {bookingCount} {bookingCount === 1 ? 'session' : 'sessions'}
                            </Text>
                          </View>
                          {lastBooking && (
                            <View className="flex-row items-center">
                              <Ionicons name="time-outline" size={14} color={colors.textTertiary} />
                              <Text className="ml-1 text-xs" style={{ color: colors.textSecondary }}>
                                Last: {new Date(lastBooking).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </Text>
                            </View>
                          )}
                        </View>
                      )}
                    </View>

                    {!isPending && (
                      <View
                        className="w-10 h-10 rounded-full items-center justify-center"
                        style={{ backgroundColor: colors.background }}
                      >
                        <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Notification History Modal */}
      <NotificationHistory
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </View>
  );
}
