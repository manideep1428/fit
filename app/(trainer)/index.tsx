import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Image } from 'react-native';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useQuery } from 'convex/react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { api } from '@/convex/_generated/api';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getColors, Spacing, BorderRadius, Shadows } from '@/constants/colors';
import { AnimatedCard } from '@/components/AnimatedCard';
import { GlassCard } from '@/components/GlassCard';

export default function TrainerHomeScreen() {
  const { user, isLoaded } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const scheme = useColorScheme();
  const colors = getColors(scheme === 'dark');
  const shadows = scheme === 'dark' ? Shadows.dark : Shadows.light;
  const insets = useSafeAreaInsets();

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
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />

      {/* Header */}
      <View className="px-5 pb-6" style={{ paddingTop: insets.top + 12 }}>
        <Animated.View
          entering={FadeInDown.duration(400).delay(100)}
          className="flex-row justify-between items-center mb-6"
        >
          <View className="flex-row items-center">
            {/* Profile */}
            <TouchableOpacity
              onPress={() => router.push('/(trainer)/profile' as any)}
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
            </TouchableOpacity>

            <View>
              <Text className="text-xs font-medium" style={{ color: colors.textSecondary }}>Welcome back,</Text>
              <Text className="text-xl font-bold mt-0.5" style={{ color: colors.text }}>
                {user?.firstName || 'Trainer'}
              </Text>
            </View>
          </View>

          {/* Notifications */}
          <TouchableOpacity
            className="w-12 h-12 rounded-full justify-center items-center"
            style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, ...shadows.small }}
            onPress={() => router.push('/(trainer)/notification-settings' as any)}
          >
            <Ionicons name="notifications-outline" size={22} color={colors.text} />
          </TouchableOpacity>
        </Animated.View>

        {/* Stats Card with Gradient */}
        {bookings && bookings.length > 0 && (
          <GlassCard
            style={{
              marginBottom: 24,
              backgroundColor: colors.primary,
              borderWidth: 0,
            }}
            intensity="heavy"
            borderRadius="xlarge"
          >
            <Animated.View entering={FadeIn.delay(200)}>
              <Text className="text-sm font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.9)' }}>
                Your Sessions
              </Text>

              <Text className="text-5xl font-bold mb-5 text-white" style={{ letterSpacing: -2 }}>
                {bookings.filter((b: any) => b.status !== 'cancelled').length}
              </Text>

              <View className="flex-row justify-between items-center">
                <View>
                  <Text className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.8)' }}>Upcoming</Text>
                  <Text className="text-2xl font-bold text-white">
                    {bookings.filter((b: any) =>
                      b.status === 'confirmed' && new Date(b.date) >= new Date()
                    ).length}
                  </Text>
                </View>

                <TouchableOpacity
                  className="rounded-2xl px-6 py-3 justify-center"
                  style={{ backgroundColor: 'rgba(255,255,255,0.25)' }}
                  onPress={() => router.push('/(trainer)/bookings' as any)}
                >
                  <Text className="text-sm font-semibold text-white">View All</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </GlassCard>
        )}

        {/* Quick Actions */}
        <Animated.View entering={FadeIn.delay(300)} className="mb-6">
          <AnimatedCard
            delay={350}
            elevation="medium"
            borderRadius="xlarge"
            onPress={() => { }}
          >
            <View className="flex-row items-center">
              <View
                className="w-14 h-14 rounded-2xl justify-center items-center mr-4"
                style={{ backgroundColor: `${colors.primary}15` }}
              >
                <Ionicons name="calendar-outline" size={28} color={colors.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold mb-0.5" style={{ color: colors.text }}>Manage Schedule</Text>
                <Text className="text-sm" style={{ color: colors.textSecondary }}>View and edit your availability</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </View>
          </AnimatedCard>
        </Animated.View>

        {/* Upcoming Sessions */}
        <View>
          <Animated.View
            entering={FadeIn.delay(400)}
            className="flex-row justify-between items-center mb-4"
          >
            <Text className="text-lg font-bold" style={{ color: colors.text }}>
              Upcoming Sessions
            </Text>
            {bookings && bookings.length > 0 && (
              <TouchableOpacity onPress={() => router.push('/(trainer)/bookings' as any)}>
                <Text className="text-sm font-semibold" style={{ color: colors.primary }}>View All</Text>
              </TouchableOpacity>
            )}
          </Animated.View>

          {!bookings ? (
            <View className="items-center py-8">
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : bookings.length === 0 ? (
            <AnimatedCard
              delay={450}
              style={{ alignItems: 'center', paddingVertical: 40 }}
              elevation="medium"
              borderRadius="xlarge"
            >
              <View
                className="w-20 h-20 rounded-full items-center justify-center mb-4"
                style={{ backgroundColor: `${colors.primary}10` }}
              >
                <Ionicons name="calendar-outline" size={36} color={colors.primary} />
              </View>
              <Text className="font-semibold text-base mb-2" style={{ color: colors.text }}>
                No upcoming sessions
              </Text>
              <Text className="text-sm text-center px-6" style={{ color: colors.textSecondary }}>
                Your booked sessions will appear here
              </Text>
            </AnimatedCard>
          ) : (
            bookings
              .filter((b: any) => b.status === 'confirmed' && new Date(b.date) >= new Date())
              .sort((a: any, b: any) => {
                const dateA = new Date(a.date + 'T' + a.startTime);
                const dateB = new Date(b.date + 'T' + b.startTime);
                return dateA.getTime() - dateB.getTime();
              })
              .slice(0, 3)
              .map((booking: any, index: number) => {
                const bookingDate = new Date(booking.date);
                const dayName = bookingDate.toLocaleDateString('en-US', { weekday: 'short' });
                const dayNum = bookingDate.getDate();

                return (
                  <AnimatedCard
                    key={booking._id}
                    delay={500 + index * 80}
                    style={{ marginBottom: 12 }}
                    elevation="medium"
                    borderRadius="large"
                  >
                    <View className="flex-row items-center">
                      <View
                        className="px-3 py-2 rounded-xl mr-4 items-center"
                        style={{ backgroundColor: `${colors.primary}15`, minWidth: 56 }}
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
                  </AnimatedCard>
                );
              })
          )}
        </View>
      </View>
    </ScrollView>
  );
}
