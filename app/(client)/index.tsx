import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Image } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useQuery } from 'convex/react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { api } from '@/convex/_generated/api';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getColors, Shadows, BorderRadius } from '@/constants/colors';
import { AnimatedCard } from '@/components/AnimatedCard';
import { AnimatedButton } from '@/components/AnimatedButton';

export default function ClientHomeScreen() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const scheme = useColorScheme();
  const colors = getColors(scheme === 'dark');
  const shadows = scheme === 'dark' ? Shadows.dark : Shadows.light;
  const insets = useSafeAreaInsets();

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
    if (isLoaded) {
      setLoading(false);
    }
  }, [isLoaded]);

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

      {/* Body container */}
      <View className="px-5 pb-6" style={{ paddingTop: insets.top + 12 }}>

        {/* Header */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(100)}
          className="flex-row justify-between items-center mb-6"
        >
          <View>
            <Text className="text-xs font-medium" style={{ color: colors.textSecondary }}>Welcome back,</Text>
            <Text className="text-2xl mt-1 font-bold tracking-tight" style={{ color: colors.text }}>
              {user?.firstName || 'Jessica'}
            </Text>
          </View>

          <View className="flex-row gap-3">
            <TouchableOpacity
              className="w-12 h-12 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, ...shadows.small }}
              onPress={() => router.push('/(client)/notification-settings' as any)}
            >
              <Ionicons name="notifications-outline" size={22} color={colors.text} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/(client)/profile' as any)}
              className="w-12 h-12 rounded-full overflow-hidden items-center justify-center"
              style={{ backgroundColor: colors.primary, ...shadows.medium }}
            >
              {user?.imageUrl ? (
                <Image source={{ uri: user.imageUrl }} className="w-full h-full" />
              ) : (
                <Text className="text-white font-bold text-lg">
                  {user?.firstName?.[0] || 'J'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Fitness Stats Card */}
        {bookings && bookings.length > 0 && (
          <AnimatedCard
            delay={150}
            style={{ marginBottom: 24 }}
            elevation="large"
            borderRadius="xlarge"
          >
            <View className="flex-row justify-between items-start">
              <View className="flex-1">
                <Text className="text-sm font-semibold mb-1" style={{ color: colors.textSecondary }}>
                  Your Progress
                </Text>
                <Text className="text-xs mb-4" style={{ color: colors.textTertiary }}>
                  Completed Sessions
                </Text>
                <Text className="font-bold" style={{ fontSize: 36, color: colors.text, letterSpacing: -1 }}>
                  {bookings.filter((b: any) => b.status === 'confirmed' && new Date(b.date) < new Date()).length}
                </Text>
              </View>

              <View className="items-center">
                <View
                  className="rounded-2xl p-3 mb-4"
                  style={{ backgroundColor: `${colors.primary}15` }}
                >
                  <Ionicons name="trending-up" size={28} color={colors.primary} />
                </View>

                <View
                  className="px-5 py-2.5 rounded-full"
                  style={{ backgroundColor: colors.primary }}
                >
                  <Text className="text-white text-lg font-bold">
                    {bookings.length}
                  </Text>
                </View>

                <Text className="mt-2 text-xs font-medium" style={{ color: colors.textTertiary }}>Total</Text>
              </View>
            </View>
          </AnimatedCard>
        )}

        {/* My Goals */}
        {goals && goals.length > 0 && (
          <View className="mb-6">
            <Animated.View
              entering={FadeIn.delay(250)}
              className="flex-row justify-between items-center mb-4"
            >
              <Text className="text-lg font-bold" style={{ color: colors.text }}>My Goals</Text>
            </Animated.View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-4">
                {goals.map((goal: any, index: number) => (
                  <AnimatedCard
                    key={goal._id}
                    delay={300 + index * 80}
                    style={{ width: 240 }}
                    elevation="medium"
                    borderRadius="xlarge"
                    onPress={() => router.push(`/(client)/progress-tracking?goalId=${goal._id}` as any)}
                  >
                    <View className="flex-row items-start justify-between mb-3">
                      <View className="flex-1 mr-3">
                        <Text className="font-bold text-base mb-1" style={{ color: colors.text }} numberOfLines={2}>
                          {goal.description}
                        </Text>
                        {goal.deadline && (
                          <Text className="text-xs" style={{ color: colors.textSecondary }}>
                            Due: {new Date(goal.deadline).toLocaleDateString()}
                          </Text>
                        )}
                      </View>
                      <View
                        className="p-2 rounded-xl"
                        style={{ backgroundColor: `${colors.primary}15` }}
                      >
                        <Ionicons name="analytics" size={18} color={colors.primary} />
                      </View>
                    </View>

                    {goal.currentWeight && goal.targetWeight && (
                      <View>
                        <View className="flex-row items-center justify-between mb-2">
                          <Text className="text-sm" style={{ color: colors.textSecondary }}>
                            {goal.currentWeight} {goal.weightUnit}
                          </Text>
                          <Ionicons name="arrow-forward" size={12} color={colors.textTertiary} />
                          <Text className="text-sm font-semibold" style={{ color: colors.primary }}>
                            {goal.targetWeight} {goal.weightUnit}
                          </Text>
                        </View>
                        <View className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: `${colors.primary}20` }}>
                          <View className="h-full rounded-full" style={{ backgroundColor: colors.primary, width: '60%' }} />
                        </View>
                      </View>
                    )}
                  </AnimatedCard>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* My Trainers */}
        <View>
          <Animated.View
            entering={FadeIn.delay(350)}
            className="flex-row justify-between items-center mb-4"
          >
            <Text className="text-lg font-bold" style={{ color: colors.text }}>My Trainers</Text>
            {clientTrainers && clientTrainers.length > 0 && (
              <TouchableOpacity>
                <Text className="text-sm font-semibold" style={{ color: colors.primary }}>See all</Text>
              </TouchableOpacity>
            )}
          </Animated.View>

          {!clientTrainers ? (
            <View className="items-center py-8">
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : clientTrainers.length === 0 ? (
            <AnimatedCard
              delay={400}
              style={{ alignItems: 'center', paddingVertical: 40 }}
              elevation="medium"
              borderRadius="xlarge"
            >
              <View
                className="w-20 h-20 rounded-full items-center justify-center mb-4"
                style={{ backgroundColor: `${colors.primary}10` }}
              >
                <Ionicons name="person-add-outline" size={36} color={colors.primary} />
              </View>
              <Text className="font-semibold text-base mb-2" style={{ color: colors.text }}>
                No trainers added yet
              </Text>
              <Text className="text-sm text-center mb-5 px-6" style={{ color: colors.textSecondary }}>
                Find and add trainers to start booking sessions
              </Text>
              <AnimatedButton
                variant="primary"
                onPress={() => router.push('/(client)/find-trainers' as any)}
              >
                Find Trainers
              </AnimatedButton>
            </AnimatedCard>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-4 mb-6">
                {clientTrainers.map((trainer: any, index: number) => (
                  <AnimatedCard
                    key={trainer._id}
                    delay={450 + index * 80}
                    style={{ width: 150, alignItems: 'center', paddingVertical: 24 }}
                    elevation="medium"
                    borderRadius="xlarge"
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
                    <Text className="font-bold text-sm mb-0.5 text-center" style={{ color: colors.text }}>
                      {trainer.fullName || 'Trainer'}
                    </Text>
                    <Text className="text-xs mb-3 text-center" style={{ color: colors.textSecondary }}>
                      {trainer.username || 'Personal Trainer'}
                    </Text>
                    <View
                      className="px-4 py-2 rounded-full"
                      style={{ backgroundColor: colors.primary }}
                    >
                      <Text className="text-white text-xs font-semibold">Book</Text>
                    </View>
                  </AnimatedCard>
                ))}

                {/* Add New Trainer Card */}
                <AnimatedCard
                  delay={450 + clientTrainers.length * 80}
                  style={{
                    width: 150,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: 24,
                    borderStyle: 'dashed',
                  }}
                  elevation="none"
                  borderRadius="xlarge"
                  onPress={() => router.push('/(client)/find-trainers' as any)}
                >
                  <View
                    className="w-20 h-20 rounded-full mb-3 items-center justify-center"
                    style={{ backgroundColor: colors.surfaceSecondary }}
                  >
                    <Ionicons name="add" size={36} color={colors.textTertiary} />
                  </View>
                  <Text className="font-semibold text-sm text-center" style={{ color: colors.textSecondary }}>
                    Find Trainer
                  </Text>
                </AnimatedCard>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
