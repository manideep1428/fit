import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getColors, Shadows } from '@/constants/colors';

export default function SessionHistoryScreen() {
    const { user } = useUser();
    const router = useRouter();
    const { from } = useLocalSearchParams();
    const scheme = useColorScheme();
    const colors = getColors(scheme === 'dark');
    const shadows = scheme === 'dark' ? Shadows.dark : Shadows.light;
    const insets = useSafeAreaInsets();
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

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

    // Enrich bookings with client names
    const enrichedBookings = bookings.map((booking: any) => {
        const client = clients.find((c: any) => c.clerkId === booking.clientId);
        return {
            ...booking,
            clientName: client?.fullName || 'Client',
            scheduleName: booking.notes || 'Training Session',
        };
    });

    // Get all sessions sorted by date
    const now = new Date();
    const upcomingSessions = enrichedBookings
        .filter((b: any) => {
            const sessionDateTime = new Date(`${b.date}T${b.startTime}:00`);
            return sessionDateTime >= now && b.status !== 'cancelled' && b.status !== 'completed';
        })
        .sort((a: any, b: any) => {
            const dateA = new Date(`${a.date}T${a.startTime}:00`);
            const dateB = new Date(`${b.date}T${b.startTime}:00`);
            return dateA.getTime() - dateB.getTime();
        });

    const pastSessions = enrichedBookings
        .filter((b: any) => {
            const sessionDateTime = new Date(`${b.date}T${b.startTime}:00`);
            return sessionDateTime < now || b.status === 'completed';
        })
        .sort((a: any, b: any) => {
            const dateA = new Date(`${a.date}T${a.startTime}:00`);
            const dateB = new Date(`${b.date}T${b.startTime}:00`);
            return dateB.getTime() - dateA.getTime();
        });

    const displayedSessions = activeTab === 'upcoming' ? upcomingSessions : pastSessions;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
            case 'confirmed':
                return colors.success;
            case 'pending':
                return colors.warning;
            case 'cancelled':
                return colors.error;
            default:
                return colors.primary;
        }
    };

    return (
        <View className="flex-1" style={{ backgroundColor: colors.background }}>
            {/* Header */}
            <View
                className="px-6 pb-5 flex-row items-center"
                style={{ backgroundColor: colors.surface, paddingTop: insets.top + 12 }}
            >
                <TouchableOpacity
                    className="w-10 h-10 rounded-full items-center justify-center mr-4"
                    style={{ backgroundColor: colors.surfaceSecondary }}
                    onPress={() => {
                        // Navigate back based on where we came from
                        if (from === 'bookings') {
                            router.push('/(trainer)/bookings' as any);
                        } else if (from === 'clients') {
                            router.push('/(trainer)/clients' as any);
                        } else if (router.canGoBack()) {
                            router.back();
                        } else {
                            // Default to bookings page
                            router.push('/(trainer)/bookings' as any);
                        }
                    }}
                >
                    <Ionicons name="arrow-back" size={20} color={colors.text} />
                </TouchableOpacity>
                <View className="flex-1">
                    <Text className="text-2xl font-bold" style={{ color: colors.text }}>
                        Sessions
                    </Text>
                    <Text className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                        {activeTab === 'upcoming' ? upcomingSessions.length : pastSessions.length} {activeTab} {(activeTab === 'upcoming' ? upcomingSessions.length : pastSessions.length) === 1 ? 'session' : 'sessions'}
                    </Text>
                </View>
            </View>

            {/* Tab Switcher */}
            <View
                className="mx-6 my-4 p-1.5 rounded-2xl flex-row"
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

            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
                showsVerticalScrollIndicator={false}
            >
                <View className="px-6 pt-4">
                    {displayedSessions.length === 0 ? (
                        <View
                            className="py-16 items-center rounded-2xl"
                            style={{ backgroundColor: colors.surface, ...shadows.medium }}
                        >
                            <View
                                className="w-20 h-20 rounded-2xl items-center justify-center mb-4"
                                style={{ backgroundColor: colors.surfaceSecondary }}
                            >
                                <Ionicons name={activeTab === 'upcoming' ? "calendar-outline" : "time-outline"} size={36} color={colors.textTertiary} />
                            </View>
                            <Text className="text-lg font-semibold" style={{ color: colors.textSecondary }}>
                                No {activeTab} sessions
                            </Text>
                            <Text className="text-sm mt-2 text-center px-8" style={{ color: colors.textTertiary }}>
                                {activeTab === 'upcoming' ? 'Your upcoming sessions will appear here' : 'Your completed sessions will appear here'}
                            </Text>
                        </View>
                    ) : (
                        displayedSessions.map((session: any) => (
                            <View
                                key={session._id}
                                className="rounded-2xl p-4 mb-3 overflow-hidden"
                                style={{
                                    backgroundColor: colors.surface,
                                    ...shadows.small,
                                }}
                            >
                                {/* Status accent */}
                                <View
                                    className="absolute left-0 top-0 bottom-0 w-1"
                                    style={{ backgroundColor: getStatusColor(session.status) }}
                                />

                                <View className="flex-row items-start pl-2">
                                    <View
                                        className="w-12 h-12 rounded-full items-center justify-center mr-3"
                                        style={{ backgroundColor: colors.primary }}
                                    >
                                        <Text className="text-white text-lg font-bold">
                                            {session.clientName?.[0] || 'C'}
                                        </Text>
                                    </View>

                                    <View className="flex-1">
                                        <View className="flex-row items-center justify-between">
                                            <Text className="text-base font-bold" style={{ color: colors.text }}>
                                                {session.clientName}
                                            </Text>
                                            <View
                                                className="px-2.5 py-1 rounded-lg"
                                                style={{ backgroundColor: `${getStatusColor(session.status)}15` }}
                                            >
                                                <Text
                                                    className="text-xs font-bold uppercase"
                                                    style={{ color: getStatusColor(session.status) }}
                                                >
                                                    {session.status === 'completed' ? 'Completed' : 
                                                     session.status === 'confirmed' ? 'Completed' : 
                                                     session.status}
                                                </Text>
                                            </View>
                                        </View>

                                        <View className="flex-row items-center mt-2">
                                            <Ionicons name="fitness-outline" size={14} color={colors.textSecondary} />
                                            <Text className="text-sm ml-1.5" style={{ color: colors.textSecondary }}>
                                                {session.scheduleName}
                                            </Text>
                                        </View>

                                        <View className="flex-row items-center mt-1.5">
                                            <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                                            <Text className="text-sm ml-1.5" style={{ color: colors.textSecondary }}>
                                                {new Date(`${session.date}T${session.startTime}:00`).toLocaleDateString('en-US', {
                                                    weekday: 'short',
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric',
                                                })}
                                            </Text>
                                        </View>

                                        <View className="flex-row items-center mt-1">
                                            <Ionicons name="time-outline" size={14} color={colors.textTertiary} />
                                            <Text className="text-sm ml-1.5" style={{ color: colors.textTertiary }}>
                                                {new Date(`${session.date}T${session.startTime}:00`).toLocaleTimeString('en-US', {
                                                    hour: 'numeric',
                                                    minute: '2-digit',
                                                    hour12: true,
                                                })}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>
        </View>
    );
}
