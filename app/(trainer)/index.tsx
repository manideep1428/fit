import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Image } from 'react-native';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getColors, Spacing, BorderRadius, Shadows } from '@/constants/colors';

export default function TrainerHomeScreen() {
    const { user, isLoaded } = useUser();
    const { signOut } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    const scheme = useColorScheme();
    const colors = getColors(scheme === 'dark');
    const shadows = scheme === 'dark' ? Shadows.dark : Shadows.light;

    // Fetch trainer's bookings
    const bookings = useQuery(
        api.bookings.getTrainerBookings,
        user?.id ? { trainerId: user.id } : 'skip'
    );

    useEffect(() => {
        if (!isLoaded) return;
        const role = user?.unsafeMetadata?.role;
        const hasUsername = user?.unsafeMetadata?.username;
        const hasSpecialty = user?.unsafeMetadata?.specialty;
        const profileCompleted = user?.unsafeMetadata?.profileCompleted;

        if (!user) {
            router.replace('/(auth)/welcome');
        } else if (!role) {
            router.replace('/(auth)/role-selection');
        } else if (role !== 'trainer') {
            router.replace('/(client)');
        } else if (!hasUsername || !hasSpecialty || !profileCompleted) {
            // Redirect to setup if profile not completed
            router.replace('/(auth)/trainer-setup');
        } else {
            setLoading(false);
        }
    }, [isLoaded, user]);

    if (loading || !isLoaded) {
        return (
            <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.background }}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <ScrollView className="flex-1" style={{ backgroundColor: colors.background }}>
            <StatusBar style="auto" />

            {/* Header */}
            <View className="px-6 pb-6 pt-16">
                <View className="flex-row justify-between items-center mb-4">
                    <View className="flex-row items-center">
                        {/* Profile */}
                        <View
                            className="w-14 h-14 rounded-full mr-4 overflow-hidden justify-center items-center"
                            style={{ backgroundColor: colors.primary, ...shadows.medium }}
                        >
                            {user?.imageUrl ? (
                                <Image source={{ uri: user.imageUrl }} className="w-full h-full" />
                            ) : (
                                <Text className="text-white text-2xl font-bold">
                                    {user?.firstName?.[0] || 'T'}
                                </Text>
                            )}
                        </View>

                        <View>
                            <Text className="text-xs" style={{ color: colors.textSecondary }}>Welcome back,</Text>
                            <Text className="text-xl font-bold mt-0.5" style={{ color: colors.text }}>
                                {user?.firstName || 'Trainer'}
                            </Text>
                        </View>
                    </View>

                    {/* Notifications */}
                    <TouchableOpacity
                        className="w-12 h-12 rounded-full justify-center items-center"
                        style={{ backgroundColor: colors.surface, ...shadows.small }}
                    >
                        <Ionicons name="notifications-outline" size={24} color={colors.text} />
                    </TouchableOpacity>
                </View>

                {/* Stats Card */}
                {bookings && bookings.length > 0 && (
                  <View
                      className="rounded-2xl p-6 mb-6"
                      style={{ backgroundColor: colors.primary, ...shadows.medium }}
                  >
                      <Text className="text-sm font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.9)' }}>
                          Your Sessions
                      </Text>

                      <Text className="text-4xl font-bold mb-5 text-white">
                          {bookings.filter((b: any) => b.status !== 'cancelled').length}
                      </Text>

                      <View className="flex-row justify-between mb-5">
                          <View>
                              <Text className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.8)' }}>Upcoming</Text>
                              <Text className="text-2xl font-bold text-white">
                                {bookings.filter((b: any) => 
                                  b.status === 'confirmed' && new Date(b.date) >= new Date()
                                ).length}
                              </Text>
                          </View>

                          <TouchableOpacity
                              className="rounded-xl px-5 py-2 justify-center"
                              style={{ backgroundColor: 'rgba(255,255,255,0.25)' }}
                              onPress={() => router.push('/(trainer)/bookings' as any)}
                          >
                              <Text className="text-sm font-semibold text-white">View All</Text>
                          </TouchableOpacity>
                      </View>
                  </View>
                )}

                {/* Quick Actions */}
                <View className="flex-row gap-4 mb-6">
                    {/* Schedule */}
                    <TouchableOpacity
                        className="flex-1 p-5 rounded-xl items-center"
                        style={{ backgroundColor: colors.surface, ...shadows.medium }}
                    >
                        <View
                            className="w-14 h-14 rounded-lg justify-center items-center mb-3"
                            style={{ backgroundColor: `${colors.primary}15` }}
                        >
                            <Ionicons name="calendar-outline" size={28} color={colors.primary} />
                        </View>
                        <Text className="text-sm font-semibold" style={{ color: colors.text }}>Manage Schedule</Text>
                    </TouchableOpacity>

                    {/* Messages */}
                    <TouchableOpacity
                        className="flex-1 p-5 rounded-xl items-center"
                        style={{ backgroundColor: colors.surface, ...shadows.medium }}
                    >
                        <View
                            className="w-14 h-14 rounded-lg justify-center items-center mb-3"
                            style={{ backgroundColor: `${colors.primary}15` }}
                        >
                            <Ionicons name="chatbubble-outline" size={28} color={colors.primary} />
                        </View>
                        <Text className="text-sm font-semibold" style={{ color: colors.text }}>Client Messages</Text>
                    </TouchableOpacity>
                </View>

                {/* Upcoming Sessions */}
                <View>
                    <View className="flex-row justify-between items-center mb-5">
                        <Text className="text-lg font-bold" style={{ color: colors.text }}>
                            Upcoming Sessions
                        </Text>
                        {bookings && bookings.length > 0 && (
                          <TouchableOpacity onPress={() => router.push('/(trainer)/bookings' as any)}>
                              <Text className="text-sm font-semibold" style={{ color: colors.primary }}>View All</Text>
                          </TouchableOpacity>
                        )}
                    </View>

                    {!bookings ? (
                      <View className="items-center py-8">
                        <ActivityIndicator size="large" color={colors.primary} />
                      </View>
                    ) : bookings.length === 0 ? (
                      <View
                        className="rounded-2xl p-8 items-center"
                        style={{ backgroundColor: colors.surface, ...shadows.medium }}
                      >
                        <Ionicons name="calendar-outline" size={64} color={colors.textTertiary} />
                        <Text className="mt-4 font-semibold text-base" style={{ color: colors.textSecondary }}>
                          No upcoming sessions
                        </Text>
                        <Text className="mt-2 text-sm text-center" style={{ color: colors.textTertiary }}>
                          Your booked sessions will appear here
                        </Text>
                      </View>
                    ) : (
                      bookings
                        .filter((b: any) => b.status === 'confirmed' && new Date(b.date) >= new Date())
                        .sort((a: any, b: any) => {
                          const dateA = new Date(a.date + 'T' + a.startTime);
                          const dateB = new Date(b.date + 'T' + b.startTime);
                          return dateA.getTime() - dateB.getTime();
                        })
                        .slice(0, 3)
                        .map((booking: any) => {
                          const bookingDate = new Date(booking.date);
                          const dayName = bookingDate.toLocaleDateString('en-US', { weekday: 'short' });
                          const dayNum = bookingDate.getDate();
                          
                          return (
                            <View
                              key={booking._id}
                              className="rounded-xl p-5 mb-3"
                              style={{ backgroundColor: colors.surface, ...shadows.medium }}
                            >
                              <View className="flex-row items-center mb-3">
                                <View
                                  className="px-3 py-1 rounded-md mr-3 items-center"
                                  style={{ backgroundColor: `${colors.primary}15` }}
                                >
                                  <Text className="text-xs font-bold" style={{ color: colors.primary }}>{dayName}</Text>
                                  <Text className="text-2xl font-bold" style={{ color: colors.primary }}>{dayNum}</Text>
                                </View>

                                <View className="flex-1">
                                  <Text className="text-base font-bold mb-0.5" style={{ color: colors.text }}>
                                    {booking.notes || 'Training Session'}
                                  </Text>
                                  <Text className="text-xs" style={{ color: colors.textSecondary }}>
                                    Client Session
                                  </Text>
                                </View>

                                <View className="items-end">
                                  <Text className="text-sm font-bold" style={{ color: colors.text }}>
                                    {booking.startTime}
                                  </Text>
                                  <Text className="text-xs" style={{ color: colors.textSecondary }}>
                                    {booking.duration} min
                                  </Text>
                                </View>
                              </View>
                            </View>
                          );
                        })
                    )}
                </View>
            </View>
        </ScrollView>
    );
}
