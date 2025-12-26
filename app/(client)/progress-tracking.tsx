import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getColors, Shadows } from '@/constants/colors';
import { StatusBar } from 'expo-status-bar';
import { ProgressChart } from '@/components/ProgressChart';
import { ProgressInsights } from '@/components/ProgressInsights';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ClientProgressTrackingScreen() {
  const { goalId } = useLocalSearchParams();
  const { user } = useUser();
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = getColors(scheme === 'dark');
  const shadows = scheme === 'dark' ? Shadows.dark : Shadows.light;
  const insets = useSafeAreaInsets();

  // Fetch goal data
  const goals = useQuery(
    api.goals.getClientGoals,
    user?.id ? { clientId: user.id } : 'skip'
  );
  const goal = goals?.find((g: any) => g._id === goalId);

  // Fetch progress logs
  const progressLogs = useQuery(
    api.goals.getGoalProgressLogs,
    goalId ? { goalId: goalId as any } : 'skip'
  );

  if (!progressLogs) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!goal) {
    return (
      <View className="flex-1" style={{ backgroundColor: colors.background }}>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        
        {/* Header */}
        <View 
          className="px-5 pb-5 flex-row items-center justify-between"
          style={{
            paddingTop: insets.top + 12,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center rounded-full"
            style={{ backgroundColor: colors.surface }}
          >
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text className="text-xl font-bold" style={{ color: colors.text }}>
            Progress Tracking
          </Text>
          <View className="w-10" />
        </View>

        <View className="flex-1 items-center justify-center px-8">
          <View
            className="rounded-2xl p-8 items-center w-full"
            style={{ backgroundColor: colors.surface, ...shadows.large }}
          >
            <View
              className="w-20 h-20 rounded-full items-center justify-center mb-4"
              style={{ backgroundColor: `${colors.primary}15` }}
            >
              <Ionicons name="flag-outline" size={40} color={colors.primary} />
            </View>
            <Text className="text-xl font-bold mb-2 text-center" style={{ color: colors.text }}>
              No Goal Set Yet
            </Text>
            <Text className="text-base text-center" style={{ color: colors.textSecondary }}>
              Your trainer will set a goal for you to start tracking your progress
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // Calculate progress percentage
  const calculateProgress = () => {
    if (!goal.currentWeight || !goal.targetWeight || progressLogs.length === 0) return 0;
    
    const latestLog = progressLogs[0];
    const currentWeight = latestLog.weight || goal.currentWeight;
    const totalChange = Math.abs(goal.targetWeight - goal.currentWeight);
    const currentChange = Math.abs(currentWeight - goal.currentWeight);
    
    return Math.min(Math.round((currentChange / totalChange) * 100), 100);
  };

  const progress = calculateProgress();
  const latestWeight = progressLogs.length > 0 && progressLogs[0].weight 
    ? progressLogs[0].weight 
    : goal.currentWeight;

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      
      {/* Header */}
      <View 
        className="px-5 pb-5 flex-row items-center justify-between"
        style={{
          paddingTop: insets.top + 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center rounded-full"
          style={{ backgroundColor: colors.surface }}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text className="text-xl font-bold" style={{ color: colors.text }}>
          Progress Tracking
        </Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-5 gap-6">
          {/* Goal Progress Card */}
          <View
            className="rounded-2xl p-6"
            style={{ backgroundColor: colors.surface, ...shadows.medium, borderWidth: 1, borderColor: colors.border }}
          >
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-1">
                <Text className="text-lg font-bold mb-1" style={{ color: colors.text }}>
                  {goal.description}
                </Text>
                {goal.deadline && (
                  <View className="flex-row items-center gap-1">
                    <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                    <Text className="text-xs" style={{ color: colors.textSecondary }}>
                      Target: {new Date(goal.deadline).toLocaleDateString()}
                    </Text>
                  </View>
                )}
              </View>
              <View
                className="px-4 py-2 rounded-full"
                style={{ backgroundColor: `${colors.primary}15` }}
              >
                <Text className="text-lg font-bold" style={{ color: colors.primary }}>
                  {progress}%
                </Text>
              </View>
            </View>

            {goal.currentWeight && goal.targetWeight && (
              <>
                <View className="flex-row items-end gap-2 mb-4">
                  <Text className="text-4xl font-bold" style={{ color: colors.text }}>
                    {latestWeight}
                  </Text>
                  <Text className="text-lg font-medium pb-1" style={{ color: colors.textSecondary }}>
                    {goal.weightUnit}
                  </Text>
                </View>

                {/* Progress Bar */}
                <View className="relative h-3 w-full rounded-full mb-2" style={{ backgroundColor: `${colors.primary}20` }}>
                  <View
                    className="absolute left-0 top-0 h-full rounded-full"
                    style={{ backgroundColor: colors.primary, width: `${progress}%` }}
                  />
                </View>

                <View className="flex-row justify-between">
                  <Text className="text-xs font-medium" style={{ color: colors.textSecondary }}>
                    Start: {goal.currentWeight}{goal.weightUnit}
                  </Text>
                  <Text className="text-xs font-medium" style={{ color: colors.success }}>
                    Goal: {goal.targetWeight}{goal.weightUnit}
                  </Text>
                </View>
              </>
            )}
          </View>

          {/* Progress Insights */}
          {progressLogs.length >= 2 && (
            <ProgressInsights
              goal={goal}
              progressLogs={progressLogs}
              colors={colors}
              shadows={shadows}
            />
          )}

          {/* Weight History Chart */}
          {progressLogs.length > 0 && goal.currentWeight && (
            <View
              className="rounded-2xl p-4"
              style={{ backgroundColor: colors.surface, ...shadows.medium, borderWidth: 1, borderColor: colors.border }}
            >
              <Text className="font-bold text-lg mb-2 px-2" style={{ color: colors.text }}>
                Weight History
              </Text>
              <ProgressChart
                data={progressLogs}
                goal={goal}
                colors={colors}
                type="weight"
              />
            </View>
          )}

          {/* Body Measurements Progress */}
          {goal.measurements && goal.measurements.length > 0 && (
            <View
              className="rounded-2xl p-4"
              style={{ backgroundColor: colors.surface, ...shadows.medium, borderWidth: 1, borderColor: colors.border }}
            >
              <Text className="font-semibold mb-4" style={{ color: colors.text }}>
                Body Measurements
              </Text>
              {goal.measurements.map((measurement: any, index: number) => {
                // Get latest measurement from logs
                const latestLog = progressLogs.find((log: any) => 
                  log.measurements?.some((m: any) => m.bodyPart === measurement.bodyPart)
                );
                const latestValue = latestLog?.measurements?.find((m: any) => 
                  m.bodyPart === measurement.bodyPart
                )?.value || measurement.current;

                const measurementProgress = Math.min(
                  Math.round((Math.abs(latestValue - measurement.current) / Math.abs(measurement.target - measurement.current)) * 100),
                  100
                );

                return (
                  <View key={index} className="mb-4">
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="text-sm font-medium" style={{ color: colors.text }}>
                        {measurement.bodyPart}
                      </Text>
                      <Text className="text-xs" style={{ color: colors.textSecondary }}>
                        {measurementProgress}%
                      </Text>
                    </View>
                    <View className="relative h-2 w-full rounded-full mb-1" style={{ backgroundColor: `${colors.primary}20` }}>
                      <View
                        className="absolute left-0 top-0 h-full rounded-full"
                        style={{ backgroundColor: colors.primary, width: `${measurementProgress}%` }}
                      />
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-xs" style={{ color: colors.textSecondary }}>
                        {measurement.current} {measurement.unit}
                      </Text>
                      <Text className="text-xs font-semibold" style={{ color: colors.primary }}>
                        Current: {latestValue} {measurement.unit}
                      </Text>
                      <Text className="text-xs" style={{ color: colors.textSecondary }}>
                        {measurement.target} {measurement.unit}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Log History */}
          <View>
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-lg font-semibold" style={{ color: colors.text }}>
                Log History
              </Text>
            </View>

            {progressLogs.length === 0 ? (
              <View
                className="rounded-xl p-8 items-center"
                style={{ backgroundColor: colors.surface, ...shadows.medium }}
              >
                <Ionicons name="analytics-outline" size={48} color={colors.textTertiary} />
                <Text className="mt-3 font-semibold" style={{ color: colors.textSecondary }}>
                  No progress logs yet
                </Text>
                <Text className="mt-1 text-sm text-center" style={{ color: colors.textTertiary }}>
                  Your trainer will update your progress
                </Text>
              </View>
            ) : (
              <View className="gap-3">
                {progressLogs.slice(0, 10).map((log: any) => (
                  <View
                    key={log._id}
                    className="flex-row items-center justify-between rounded-xl p-4"
                    style={{ backgroundColor: colors.surface, ...shadows.small, borderWidth: 1, borderColor: colors.border }}
                  >
                    <View className="flex-1">
                      <Text className="font-semibold mb-1" style={{ color: colors.text }}>
                        {new Date(log.createdAt).toLocaleDateString('en-US', { 
                          month: 'long', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </Text>
                      {log.note && (
                        <Text className="text-sm" style={{ color: colors.textSecondary }}>
                          {log.note}
                        </Text>
                      )}
                      {log.loggedBy === 'trainer' && (
                        <View className="flex-row items-center gap-1 mt-1">
                          <Ionicons name="person" size={12} color={colors.primary} />
                          <Text className="text-xs" style={{ color: colors.primary }}>
                            Updated by trainer
                          </Text>
                        </View>
                      )}
                    </View>
                    {log.weight && (
                      <Text className="text-lg font-bold" style={{ color: colors.text }}>
                        {log.weight} {goal.weightUnit}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
