import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getColors, Shadows } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function ProgressScreen() {
  const { user } = useUser();
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = getColors(scheme === 'dark');
  const shadows = scheme === 'dark' ? Shadows.dark : Shadows.light;

  const goals = useQuery(
    api.goals.getClientGoals,
    user?.id ? { clientId: user.id } : 'skip'
  );

  const progressLogs = useQuery(
    api.goals.getClientProgressLogs,
    user?.id ? { clientId: user.id } : 'skip'
  );

  if (!goals || !progressLogs) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: colors.background }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const activeGoals = goals.filter((g: any) => g.status === 'active');
  const completedGoals = goals.filter((g: any) => g.status === 'completed');

  const calculateProgress = (goal: any) => {
    if (!goal.currentWeight || !goal.targetWeight) return 0;

    const goalLogs = progressLogs.filter((log: any) => log.goalId === goal._id);
    if (goalLogs.length === 0) return 0;

    const latestLog = goalLogs[0];
    const currentWeight = latestLog.weight || goal.currentWeight;
    const totalChange = Math.abs(goal.targetWeight - goal.currentWeight);
    const currentChange = Math.abs(currentWeight - goal.currentWeight);

    return Math.min(Math.round((currentChange / totalChange) * 100), 100);
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="px-6 pt-16 pb-6">
          <Text className="text-3xl font-bold mb-2" style={{ color: colors.text }}>
            My Progress
          </Text>
          <Text className="text-base" style={{ color: colors.textSecondary }}>
            Track your fitness journey
          </Text>
        </View>

        {/* Stats Overview */}
        <View className="px-6 mb-6">
          <View className="flex-row gap-3">
            <View
              className="flex-1 rounded-2xl p-4"
              style={{ backgroundColor: colors.surface, ...shadows.medium }}
            >
              <View
                className="w-10 h-10 rounded-full items-center justify-center mb-2"
                style={{ backgroundColor: `${colors.primary}15` }}
              >
                <Ionicons name="flag" size={20} color={colors.primary} />
              </View>
              <Text className="text-2xl font-bold mb-1" style={{ color: colors.text }}>
                {activeGoals.length}
              </Text>
              <Text className="text-xs" style={{ color: colors.textSecondary }}>
                Active Goals
              </Text>
            </View>

            <View
              className="flex-1 rounded-2xl p-4"
              style={{ backgroundColor: colors.surface, ...shadows.medium }}
            >
              <View
                className="w-10 h-10 rounded-full items-center justify-center mb-2"
                style={{ backgroundColor: `${colors.success}15` }}
              >
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              </View>
              <Text className="text-2xl font-bold mb-1" style={{ color: colors.text }}>
                {completedGoals.length}
              </Text>
              <Text className="text-xs" style={{ color: colors.textSecondary }}>
                Completed
              </Text>
            </View>

            <View
              className="flex-1 rounded-2xl p-4"
              style={{ backgroundColor: colors.surface, ...shadows.medium }}
            >
              <View
                className="w-10 h-10 rounded-full items-center justify-center mb-2"
                style={{ backgroundColor: `${colors.info}15` }}
              >
                <Ionicons name="analytics" size={20} color={colors.info} />
              </View>
              <Text className="text-2xl font-bold mb-1" style={{ color: colors.text }}>
                {progressLogs.length}
              </Text>
              <Text className="text-xs" style={{ color: colors.textSecondary }}>
                Total Logs
              </Text>
            </View>
          </View>
        </View>

        {/* Active Goals */}
        <View className="px-6 mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-bold" style={{ color: colors.text }}>
              Active Goals
            </Text>
          </View>

          {activeGoals.length === 0 ? (
            <View
              className="rounded-2xl p-8 items-center"
              style={{ backgroundColor: colors.surface, ...shadows.medium }}
            >
              <View
                className="w-16 h-16 rounded-full items-center justify-center mb-4"
                style={{ backgroundColor: `${colors.primary}15` }}
              >
                <Ionicons name="flag-outline" size={32} color={colors.primary} />
              </View>
              <Text className="text-lg font-bold mb-2" style={{ color: colors.text }}>
                No Active Goals
              </Text>
              <Text className="text-center" style={{ color: colors.textSecondary }}>
                Your trainer will set goals for you to track your progress
              </Text>
            </View>
          ) : (
            <View className="gap-3">
              {activeGoals.map((goal: any) => {
                const progress = calculateProgress(goal);
                const goalLogs = progressLogs.filter((log: any) => log.goalId === goal._id);
                const latestWeight =
                  goalLogs.length > 0 && goalLogs[0].weight
                    ? goalLogs[0].weight
                    : goal.currentWeight;

                return (
                  <TouchableOpacity
                    key={goal._id}
                    onPress={() =>
                      router.push(
                        `/(client)/progress-tracking?goalId=${goal._id}` as any
                      )
                    }
                    className="rounded-2xl p-5"
                    style={{ backgroundColor: colors.surface, ...shadows.medium }}
                  >
                    <View className="flex-row items-start justify-between mb-3">
                      <View className="flex-1">
                        <Text
                          className="text-lg font-bold mb-1"
                          style={{ color: colors.text }}
                        >
                          {goal.description}
                        </Text>
                        {goal.deadline && (
                          <View className="flex-row items-center gap-1">
                            <Ionicons
                              name="calendar-outline"
                              size={14}
                              color={colors.textSecondary}
                            />
                            <Text className="text-xs" style={{ color: colors.textSecondary }}>
                              Due: {new Date(goal.deadline).toLocaleDateString()}
                            </Text>
                          </View>
                        )}
                      </View>
                      <View
                        className="px-3 py-1 rounded-full"
                        style={{ backgroundColor: `${colors.primary}15` }}
                      >
                        <Text className="text-xs font-bold" style={{ color: colors.primary }}>
                          {progress}%
                        </Text>
                      </View>
                    </View>

                    {goal.currentWeight && goal.targetWeight && (
                      <View className="mb-3">
                        <View className="flex-row items-end gap-2 mb-2">
                          <Text className="text-2xl font-bold" style={{ color: colors.text }}>
                            {latestWeight}
                          </Text>
                          <Text
                            className="text-sm font-medium pb-1"
                            style={{ color: colors.textSecondary }}
                          >
                            {goal.weightUnit}
                          </Text>
                          <Text className="text-sm pb-1" style={{ color: colors.textTertiary }}>
                            / {goal.targetWeight} {goal.weightUnit}
                          </Text>
                        </View>

                        <View
                          className="relative h-2 w-full rounded-full"
                          style={{ backgroundColor: `${colors.primary}20` }}
                        >
                          <View
                            className="absolute left-0 top-0 h-full rounded-full"
                            style={{ backgroundColor: colors.primary, width: `${progress}%` }}
                          />
                        </View>
                      </View>
                    )}

                    <View className="flex-row items-center justify-between pt-3 border-t" style={{ borderTopColor: colors.border }}>
                      <View className="flex-row items-center gap-1">
                        <Ionicons name="analytics-outline" size={16} color={colors.textSecondary} />
                        <Text className="text-xs" style={{ color: colors.textSecondary }}>
                          {goalLogs.length} updates
                        </Text>
                      </View>
                      <View className="flex-row items-center gap-1">
                        <Text className="text-xs font-medium" style={{ color: colors.primary }}>
                          View Details
                        </Text>
                        <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Recent Progress Updates */}
        {progressLogs.length > 0 && (
          <View className="px-6 mb-6">
            <Text className="text-xl font-bold mb-4" style={{ color: colors.text }}>
              Recent Updates
            </Text>
            <View className="gap-3">
              {progressLogs.slice(0, 5).map((log: any) => {
                const goal = goals.find((g: any) => g._id === log.goalId);
                return (
                  <View
                    key={log._id}
                    className="rounded-xl p-4"
                    style={{ backgroundColor: colors.surface, ...shadows.small }}
                  >
                    <View className="flex-row items-start justify-between mb-2">
                      <View className="flex-1">
                        <Text className="font-semibold mb-1" style={{ color: colors.text }}>
                          {goal?.description || 'Goal'}
                        </Text>
                        <Text className="text-xs" style={{ color: colors.textSecondary }}>
                          {new Date(log.createdAt).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </Text>
                      </View>
                      {log.weight && (
                        <Text className="text-lg font-bold" style={{ color: colors.text }}>
                          {log.weight} {goal?.weightUnit}
                        </Text>
                      )}
                    </View>
                    {log.note && (
                      <Text className="text-sm mt-2" style={{ color: colors.textSecondary }}>
                        {log.note}
                      </Text>
                    )}
                    {log.loggedBy === 'trainer' && (
                      <View className="flex-row items-center gap-1 mt-2">
                        <Ionicons name="person" size={12} color={colors.primary} />
                        <Text className="text-xs" style={{ color: colors.primary }}>
                          Updated by trainer
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        <View className="h-8" />
      </ScrollView>
    </View>
  );
}
