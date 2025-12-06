import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Image } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getColors, Shadows } from '@/constants/colors';

export default function ClientHomeScreen() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const scheme = useColorScheme();
  const colors = getColors(scheme === 'dark');
  const shadows = scheme === 'dark' ? Shadows.dark : Shadows.light;

  // Fetch client's trainers
  const clientTrainers = useQuery(
    api.users.getClientTrainers,
    user?.id ? { clientId: user.id } : 'skip'
  );

  // Fetch bookings for stats
  const bookings = useQuery(
    api.bookings.getClientBookings,
    user?.id ? { clientId: user.id } : 'skip'
  );

  // Fetch client goals
  const goals = useQuery(
    api.goals.getActiveClientGoals,
    user?.id ? { clientId: user.id } : 'skip'
  );

  useEffect(() => {
    if (!isLoaded) return;
    const role = user?.unsafeMetadata?.role;

    if (!user) router.replace('/(auth)/welcome');
    else if (!role) router.replace('/(auth)/role-selection');
    else if (role !== 'client') router.replace('/(trainer)' as any);
    else setLoading(false);
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
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />

      {/* Body container */}
      <View className="px-6 pt-16 pb-6">

        {/* Header */}
        <View className="flex-row justify-between items-center mb-6">
          <View>
            <Text className="text-xs" style={{ color: colors.textSecondary }}>Welcome back,</Text>
            <Text className="text-xl mt-1 font-bold" style={{ color: colors.text }}>
              {user?.firstName || 'Jessica'}
            </Text>
          </View>

          <View className="flex-row gap-3">
            <TouchableOpacity
              className="w-12 h-12 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.surface, ...shadows.small }}
            >
              <Ionicons name="notifications-outline" size={24} color={colors.text} />
            </TouchableOpacity>

            <View
              className="w-12 h-12 rounded-full overflow-hidden items-center justify-center"
              style={{ backgroundColor: colors.primary, ...shadows.small }}
            >
              {user?.imageUrl ? (
                <Image source={{ uri: user.imageUrl }} className="w-full h-full" />
              ) : (
                <Text className="text-white font-bold text-lg">
                  {user?.firstName?.[0] || 'J'}
                </Text>
              )}
            </View>
          </View>
        </View>
        {/* Fitness Card */}
        {bookings && bookings.length > 0 && (
          <View
            className="rounded-3xl p-6 mb-6"
            style={{ backgroundColor: colors.surface, ...shadows.large }}
          >
            <View className="flex-row justify-between items-start mb-5">
              <View className="flex-1">
                <Text className="text-base font-semibold mb-2" style={{ color: colors.text }}>
                  Your Progress
                </Text>
                <Text className="text-sm mb-3" style={{ color: colors.textSecondary }}>
                  Completed Sessions
                </Text>
                <Text className="font-bold" style={{ fontSize: 28, color: colors.text }}>
                  {bookings.filter((b: any) => b.status === 'confirmed' && new Date(b.date) < new Date()).length}
                </Text>
              </View>

              <View className="items-center justify-center">
                <TouchableOpacity
                  className="rounded-md p-3"
                  style={{ backgroundColor: colors.primary }}
                >
                  <Ionicons name="trending-up" size={24} color="#FFF" />
                </TouchableOpacity>

                <View
                  className="px-5 py-2 rounded-full mt-5"
                  style={{ backgroundColor: colors.primary }}
                >
                  <Text className="text-white text-lg font-bold">
                    {bookings.length}
                  </Text>
                </View>

                <Text className="mt-1 text-[11px]" style={{ color: colors.textSecondary }}>Total</Text>
              </View>
            </View>
          </View>
        )}

        {/* My Goals */}
        {goals && goals.length > 0 && (
          <View className="mb-6">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-lg font-bold" style={{ color: colors.text }}>My Goals</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-4">
                {goals.map((goal: any) => (
                  <TouchableOpacity
                    key={goal._id}
                    className="w-64 rounded-xl p-5"
                    style={{ backgroundColor: colors.surface, ...shadows.medium }}
                    onPress={() => router.push(`/(client)/progress-tracking?goalId=${goal._id}` as any)}
                  >
                    <View className="flex-row items-start justify-between mb-3">
                      <View className="flex-1">
                        <Text className="font-bold text-base mb-1" style={{ color: colors.text }}>
                          {goal.description}
                        </Text>
                        {goal.deadline && (
                          <Text className="text-xs" style={{ color: colors.textSecondary }}>
                            Due: {new Date(goal.deadline).toLocaleDateString()}
                          </Text>
                        )}
                      </View>
                      <Ionicons name="analytics" size={20} color={colors.primary} />
                    </View>

                    {goal.currentWeight && goal.targetWeight && (
                      <View>
                        <View className="flex-row items-center justify-between mb-2">
                          <Text className="text-sm" style={{ color: colors.textSecondary }}>
                            {goal.currentWeight} {goal.weightUnit}
                          </Text>
                          <Ionicons name="arrow-forward" size={14} color={colors.textSecondary} />
                          <Text className="text-sm font-semibold" style={{ color: colors.primary }}>
                            {goal.targetWeight} {goal.weightUnit}
                          </Text>
                        </View>
                        <View className="h-1 rounded-full" style={{ backgroundColor: `${colors.primary}20` }}>
                          <View className="h-full rounded-full" style={{ backgroundColor: colors.primary, width: '60%' }} />
                        </View>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* My Trainers - Book Sessions */}
        <View>
          <View className="flex-row justify-between items-center mb-5">
            <Text className="text-lg font-bold" style={{ color: colors.text }}>My Trainers</Text>
            {clientTrainers && clientTrainers.length > 0 && (
              <TouchableOpacity>
                <Text className="text-sm font-semibold" style={{ color: colors.primary }}>See all</Text>
              </TouchableOpacity>
            )}
          </View>

          {!clientTrainers ? (
            <View className="items-center py-8">
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : clientTrainers.length === 0 ? (
            <View
              className="rounded-2xl p-8 items-center mb-6"
              style={{ backgroundColor: colors.surface, ...shadows.medium }}
            >
              <Ionicons name="person-add-outline" size={64} color={colors.textTertiary} />
              <Text className="mt-4 font-semibold text-base" style={{ color: colors.textSecondary }}>
                No trainers added yet
              </Text>
              <Text className="mt-2 text-sm text-center" style={{ color: colors.textTertiary }}>
                Find and add trainers to start booking sessions
              </Text>
              <TouchableOpacity
                className="mt-4 px-6 py-3 rounded-full"
                style={{ backgroundColor: colors.primary }}
                onPress={() => router.push('/(client)/book-trainer' as any)}
              >
                <Text className="text-white font-semibold">Find Trainers</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-4 mb-6">
                {clientTrainers.map((trainer: any) => (
                  <TouchableOpacity
                    key={trainer._id}
                    className="w-36 rounded-xl p-5 items-center"
                    style={{ backgroundColor: colors.surface, ...shadows.medium }}
                    onPress={() => router.push('/(client)/book-trainer' as any)}
                  >
                    <View
                      className="w-20 h-20 rounded-full mb-3 overflow-hidden items-center justify-center"
                      style={{ backgroundColor: colors.primary }}
                    >
                      {trainer.profileImageId ? (
                        <Image
                          source={{ uri: trainer.profileImageId }}
                          className="w-full h-full"
                        />
                      ) : (
                        <Text className="text-white text-3xl font-bold">
                          {trainer.fullName?.[0] || 'T'}
                        </Text>
                      )}
                    </View>
                    <Text className="font-bold text-[15px] mb-0.5" style={{ color: colors.text }}>
                      {trainer.fullName || 'Trainer'}
                    </Text>
                    <Text className="text-xs mb-2 text-center" style={{ color: colors.textSecondary }}>
                      {trainer.username || 'Personal Trainer'}
                    </Text>
                    <View
                      className="px-3 py-1 rounded-full"
                      style={{ backgroundColor: colors.primary }}
                    >
                      <Text className="text-white text-xs font-semibold">Book Session</Text>
                    </View>
                  </TouchableOpacity>
                ))}

                {/* Add New Trainer Card */}
                <TouchableOpacity
                  className="w-36 rounded-xl p-5 items-center justify-center"
                  style={{ backgroundColor: colors.surface, ...shadows.medium, borderWidth: 2, borderColor: colors.border, borderStyle: 'dashed' }}
                  onPress={() => router.push('/(client)/book-trainer' as any)}
                >
                  <View
                    className="w-20 h-20 rounded-full mb-3 items-center justify-center"
                    style={{ backgroundColor: colors.border }}
                  >
                    <Ionicons name="add" size={40} color={colors.textTertiary} />
                  </View>
                  <Text className="font-bold text-[15px] text-center" style={{ color: colors.textSecondary }}>
                    Find Trainer
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
