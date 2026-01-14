import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getColors, Shadows } from '@/constants/colors';
import { LinearGradient } from 'expo-linear-gradient';

export default function SessionHistoryScreen() {
  const { user } = useUser();
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = getColors(scheme === 'dark');
  const shadows = scheme === 'dark' ? Shadows.dark : Shadows.light;
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

    const bookings = useQuery(
        api.bookings.getClientBookings,
        user?.id ? { clientId: user.id } : 'skip'
    );

    const trainers = useQuery(api.users.getAllTrainers);

    if (!user || !bookings || !trainers) {
        return (
            <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.background }}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    // Enrich bookings with trainer names
    const enrichedBookings = bookings.map((booking: any) => {
        const trainer = trainers.find((t: any) => t.clerkId === booking.trainerId);
        return {
            ...booking,
            trainerName: trainer?.fullName || 'Trainer',
            scheduleName: booking.notes || 'Training Session',
        };
    });

    // Get all sessions sorted by date
    const now = new Date();
    // Set time to start of current hour to avoid timezone issues
    now.setMinutes(0, 0, 0);
    
    const upcomingSessions = enrichedBookings
        .filter((b: any) => {
            const sessionDate = new Date(`${b.date}T${b.startTime}:00`);
            return sessionDate >= now && b.status !== 'cancelled';
        })
        .sort((a: any, b: any) => {
            const dateA = new Date(`${a.date}T${a.startTime}:00`);
            const dateB = new Date(`${b.date}T${b.startTime}:00`);
            return dateA.getTime() - dateB.getTime();
        });

    const pastSessions = enrichedBookings
        .filter((b: any) => {
            const sessionDate = new Date(`${b.date}T${b.startTime}:00`);
            return sessionDate < now;
        })
        .sort((a: any, b: any) => {
            const dateA = new Date(`${a.date}T${a.startTime}:00`);
            const dateB = new Date(`${b.date}T${b.startTime}:00`);
            return dateB.getTime() - dateA.getTime();
        });

    const displayedSessions = activeTab === 'upcoming' ? upcomingSessions : pastSessions;

    // Calculate total sessions
    const totalSessions = pastSessions.length;
    const completedSessions = pastSessions.filter((s: any) => s.status === 'confirmed').length;

  // Group sessions by month
  const groupedSessions: { [key: string]: any[] } = {};
  displayedSessions.forEach((session: any) => {
    const date = new Date(session.date);
    const monthYear = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    if (!groupedSessions[monthYear]) {
      groupedSessions[monthYear] = [];
    }
    groupedSessions[monthYear].push(session);
  });

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Gradient Background Overlay */}
      <LinearGradient
        colors={[`${colors.primary}15`, `${colors.primary}05`, 'transparent']}
        className="absolute top-0 left-0 right-0 h-64"
        pointerEvents="none"
      />

      {/* Header */}
      <View
        className="px-4 py-3 flex-row items-center justify-between border-b"
        style={{
          paddingTop: 48,
          backgroundColor: `${colors.background}F2`,
          borderBottomColor: colors.border,
        }}
      >
        <TouchableOpacity
          className="p-2 rounded-full"
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text className="text-lg font-bold tracking-tight" style={{ color: colors.text }}>
          Sessions
        </Text>
        <View className="w-10" />
      </View>

      {/* Tab Switcher */}
      <View
        className="mx-4 my-4 p-1.5 rounded-2xl flex-row"
        style={{ backgroundColor: colors.surfaceSecondary }}
      >
        <TouchableOpacity
          className="flex-1 py-3 rounded-xl items-center"
          style={{
            backgroundColor: activeTab === 'upcoming' ? colors.surface : 'transparent',
            ...(activeTab === 'upcoming' ? shadows.small : {}),
          }}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text
            className="text-sm font-semibold"
            style={{ color: activeTab === 'upcoming' ? colors.primary : colors.textSecondary }}
          >
            Upcoming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 py-3 rounded-xl items-center"
          style={{
            backgroundColor: activeTab === 'past' ? colors.surface : 'transparent',
            ...(activeTab === 'past' ? shadows.small : {}),
          }}
          onPress={() => setActiveTab('past')}
        >
          <Text
            className="text-sm font-semibold"
            style={{ color: activeTab === 'past' ? colors.primary : colors.textSecondary }}
          >
            Past
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Summary Header */}
        <View className="items-center gap-1 pt-6 pb-4">
          <Text className="text-3xl font-bold" style={{ color: colors.text }}>
            {displayedSessions.length} Sessions
          </Text>
          <Text className="text-sm" style={{ color: colors.textSecondary }}>
            {activeTab === 'upcoming' ? 'Scheduled' : 'Last 6 months'}
          </Text>
        </View>

        {/* Stats Grid */}
        <View className="px-4 pb-6">
          <View className="flex-row gap-4">
            {/* Total Sessions */}
            <View
              className="flex-1 items-center justify-center gap-1 rounded-lg p-4"
              style={{
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                ...shadows.small,
              }}
            >
              <View
                className="w-8 h-8 rounded-full items-center justify-center mb-1"
                style={{ backgroundColor: `${colors.primary}20` }}
              >
                <Ionicons name="fitness" size={20} color={colors.primary} />
              </View>
              <Text className="text-2xl font-bold" style={{ color: colors.text }}>
                {totalSessions}
              </Text>
              <Text
                className="text-xs font-medium uppercase tracking-wide"
                style={{ color: colors.textSecondary }}
              >
                Total
              </Text>
            </View>

            {/* Completed Sessions */}
            <View
              className="flex-1 items-center justify-center gap-1 rounded-lg p-4"
              style={{
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                ...shadows.small,
              }}
            >
              <View
                className="w-8 h-8 rounded-full items-center justify-center mb-1"
                style={{ backgroundColor: `${colors.success}20` }}
              >
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              </View>
              <Text className="text-2xl font-bold" style={{ color: colors.text }}>
                {completedSessions}
              </Text>
              <Text
                className="text-xs font-medium uppercase tracking-wide"
                style={{ color: colors.textSecondary }}
              >
                Completed
              </Text>
            </View>
          </View>
        </View>

        {/* Session List by Month */}
        {displayedSessions.length === 0 ? (
          <View className="px-4">
            <View
              className="py-16 items-center rounded-2xl"
              style={{
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                ...shadows.small,
              }}
            >
              <Ionicons name={activeTab === 'upcoming' ? "calendar-outline" : "time-outline"} size={48} color={colors.textTertiary} />
              <Text className="text-lg font-semibold mt-3" style={{ color: colors.textSecondary }}>
                No {activeTab} sessions
              </Text>
              <Text className="text-sm mt-2 text-center px-8" style={{ color: colors.textTertiary }}>
                {activeTab === 'upcoming' ? 'Your upcoming sessions will appear here' : 'Your completed sessions will appear here'}
              </Text>
            </View>
          </View>
        ) : (
          Object.keys(groupedSessions).map((monthYear) => (
            <View key={monthYear} className="px-4 mb-6">
              <Text
                className="text-sm font-bold uppercase tracking-wider mb-3 pl-1"
                style={{ color: colors.textSecondary }}
              >
                {monthYear}
              </Text>

              <View className="gap-3">
                {groupedSessions[monthYear].map((session: any) => {
                  const statusColor =
                    session.status === 'confirmed'
                      ? colors.success
                      : session.status === 'cancelled'
                      ? colors.textTertiary
                      : colors.error;

                  const isCancelled = session.status === 'cancelled';

                  return (
                    <View
                      key={session._id}
                      className="relative flex-row items-start gap-4 rounded-lg p-4 overflow-hidden"
                      style={{
                        backgroundColor: colors.surface,
                        borderWidth: 1,
                        borderColor: colors.border,
                        ...shadows.small,
                        opacity: isCancelled ? 0.75 : 1,
                      }}
                    >
                      {/* Colored Accent Bar */}
                      <View
                        className="absolute left-0 top-0 bottom-0 w-1.5"
                        style={{ backgroundColor: statusColor }}
                      />

                      {/* Avatar */}
                      <View className="shrink-0">
                        <View
                          className="w-12 h-12 rounded-full items-center justify-center"
                          style={{
                            backgroundColor: isCancelled ? colors.surfaceSecondary : colors.primary,
                          }}
                        >
                          <Text
                            className="text-lg font-bold"
                            style={{ color: isCancelled ? colors.textSecondary : '#FFF' }}
                          >
                            {session.trainerName?.[0] || 'T'}
                          </Text>
                        </View>
                      </View>

                      {/* Content */}
                      <View className="flex-1 min-w-0">
                        <View className="flex-row justify-between items-start">
                          <Text
                            className="text-base font-bold truncate pr-2"
                            style={{ color: colors.text }}
                          >
                            {session.trainerName}
                          </Text>
                          <View
                            className="px-2 py-0.5 rounded"
                            style={{
                              backgroundColor: `${statusColor}${isCancelled ? '20' : '20'}`,
                            }}
                          >
                            <Text
                              className="text-[10px] font-bold uppercase tracking-wide whitespace-nowrap"
                              style={{ color: statusColor }}
                            >
                              {session.status === 'confirmed'
                                ? 'Completed'
                                : session.status === 'cancelled'
                                ? 'Canceled'
                                : 'Missed'}
                            </Text>
                          </View>
                        </View>

                        <Text
                          className="text-sm font-semibold mt-1"
                          style={{
                            color: isCancelled ? colors.textSecondary : colors.primary,
                          }}
                        >
                          {session.scheduleName || 'Training Session'}
                        </Text>

                        <View className="flex-row items-center gap-1 mt-1">
                          <Ionicons
                            name="calendar-outline"
                            size={14}
                            color={colors.textSecondary}
                          />
                          <Text className="text-xs" style={{ color: colors.textSecondary }}>
                            {new Date(session.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                            ,{' '}
                            {new Date(`2000-01-01T${session.startTime}`).toLocaleTimeString(
                              'en-US',
                              {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true,
                              }
                            )}
                          </Text>
                          <Text className="mx-1" style={{ color: colors.textTertiary }}>
                            •
                          </Text>
                          <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                          <Text className="text-xs" style={{ color: colors.textSecondary }}>
                            {session.duration} min
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          ))
        )}

        <View className="h-20" />
      </ScrollView>

      {/* Floating Action Button */}
      <View className="absolute bottom-6 right-6 z-30">
        <TouchableOpacity
          className="w-14 h-14 rounded-full items-center justify-center"
          style={{
            backgroundColor: colors.primary,
            ...shadows.large,
            shadowColor: colors.primary,
            shadowOpacity: 0.3,
          }}
          onPress={() => router.push('/(client)/bookings' as any)}
        >
          <Ionicons name="add" size={28} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}