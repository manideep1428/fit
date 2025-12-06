import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getColors, Shadows } from '@/constants/colors';
import { StatusBar } from 'expo-status-bar';
import { LineChart } from 'react-native-chart-kit';
import { useState } from 'react';

export default function ProgressTrackingScreen() {
  const { goalId, clientId } = useLocalSearchParams();
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = getColors(scheme === 'dark');
  const shadows = scheme === 'dark' ? Shadows.dark : Shadows.light;
  
  const [showMenu, setShowMenu] = useState(false);
  const deleteGoal = useMutation(api.goals.deleteGoal);

  // Fetch goal data
  const goals = useQuery(
    api.goals.getClientGoals,
    clientId ? { clientId: clientId as string } : 'skip'
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
        <View className="px-4 pt-16 pb-4 flex-row items-center justify-between border-b" style={{ borderBottomColor: colors.border }}>
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center"
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text className="text-xl font-semibold flex-1 text-center" style={{ color: colors.text }}>
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
              No Goal Set
            </Text>
            <Text className="text-base text-center mb-6" style={{ color: colors.textSecondary }}>
              Set a goal for this client to start tracking their progress
            </Text>
            <TouchableOpacity
              className="px-6 py-3 rounded-full"
              style={{ backgroundColor: colors.primary }}
              onPress={() => router.push(`/(trainer)/set-goal?clientId=${clientId}` as any)}
            >
              <Text className="text-white font-semibold">Set Goal Now</Text>
            </TouchableOpacity>
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

  // Prepare chart data
  const chartData = {
    labels: progressLogs.slice(0, 6).reverse().map((log: any, index: number) => {
      const date = new Date(log.createdAt);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }),
    datasets: [{
      data: progressLogs.slice(0, 6).reverse().map((log: any) => log.weight || goal.currentWeight || 0),
      color: (opacity = 1) => colors.primary,
      strokeWidth: 3,
    }],
  };

  const screenWidth = Dimensions.get('window').width;

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      
      {/* Header */}
      <View className="px-4 pt-16 pb-4 flex-row items-center justify-between border-b" style={{ borderBottomColor: colors.border }}>
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center"
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text className="text-xl font-semibold flex-1 text-center" style={{ color: colors.text }}>
          Progress Tracking
        </Text>
        <View className="relative">
          <TouchableOpacity
            onPress={() => setShowMenu(!showMenu)}
            className="w-10 h-10 items-center justify-center"
          >
            <Ionicons name="ellipsis-vertical" size={24} color={colors.text} />
          </TouchableOpacity>
          
          {showMenu && (
            <View
              className="absolute top-12 right-0 rounded-xl p-2 w-48"
              style={{ backgroundColor: colors.surface, ...shadows.large, borderWidth: 1, borderColor: colors.border }}
            >
              <TouchableOpacity
                className="flex-row items-center gap-3 p-3 rounded-lg"
                onPress={() => {
                  setShowMenu(false);
                  router.push(`/(trainer)/edit-goal?goalId=${goalId}&clientId=${clientId}` as any);
                }}
              >
                <Ionicons name="create-outline" size={20} color={colors.text} />
                <Text style={{ color: colors.text }}>Edit Goal</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                className="flex-row items-center gap-3 p-3 rounded-lg"
                onPress={() => {
                  setShowMenu(false);
                  Alert.alert(
                    'Delete Goal',
                    'Are you sure you want to delete this goal? This action cannot be undone.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: async () => {
                          try {
                            await deleteGoal({ goalId: goalId as any });
                            router.back();
                          } catch (error) {
                            Alert.alert('Error', 'Failed to delete goal');
                          }
                        },
                      },
                    ]
                  );
                }}
              >
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
                <Text style={{ color: '#EF4444' }}>Delete Goal</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      <ScrollView className="flex-1">
        <View className="p-4 gap-6">
          {/* Goal Progress Card */}
          <View
            className="rounded-2xl p-6"
            style={{ backgroundColor: colors.surface, ...shadows.medium, borderWidth: 1, borderColor: colors.border }}
          >
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold" style={{ color: colors.text }}>
                {goal.description}
              </Text>
              <Text className="text-xs font-medium" style={{ color: colors.textSecondary }}>
                {progress}% Complete
              </Text>
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
                <View className="relative h-2 w-full rounded-full mb-2" style={{ backgroundColor: `${colors.primary}20` }}>
                  <View
                    className="absolute left-0 top-0 h-full rounded-full"
                    style={{ backgroundColor: colors.primary, width: `${progress}%` }}
                  />
                </View>

                <View className="flex-row justify-between">
                  <Text className="text-xs font-medium" style={{ color: colors.textSecondary }}>
                    Start: {goal.currentWeight}{goal.weightUnit}
                  </Text>
                  <Text className="text-xs font-medium" style={{ color: colors.textSecondary }}>
                    Goal: {goal.targetWeight}{goal.weightUnit}
                  </Text>
                </View>
              </>
            )}
          </View>

          {/* Weight History Chart */}
          {progressLogs.length > 0 && goal.currentWeight && (
            <View
              className="rounded-2xl p-4"
              style={{ backgroundColor: colors.surface, ...shadows.medium, borderWidth: 1, borderColor: colors.border }}
            >
              <View className="flex-row justify-between items-center mb-4 px-2">
                <Text className="font-semibold" style={{ color: colors.text }}>
                  Weight History
                </Text>
              </View>

              <LineChart
                data={chartData}
                width={screenWidth - 64}
                height={220}
                chartConfig={{
                  backgroundColor: colors.surface,
                  backgroundGradientFrom: colors.surface,
                  backgroundGradientTo: colors.surface,
                  decimalPlaces: 1,
                  color: (opacity = 1) => colors.primary,
                  labelColor: (opacity = 1) => colors.textSecondary,
                  style: {
                    borderRadius: 16,
                  },
                  propsForDots: {
                    r: '6',
                    strokeWidth: '2',
                    stroke: colors.surface,
                  },
                }}
                bezier
                style={{
                  marginVertical: 8,
                  borderRadius: 16,
                }}
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
              <TouchableOpacity>
                <Text className="text-sm font-semibold" style={{ color: colors.primary }}>
                  View All
                </Text>
              </TouchableOpacity>
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
                  Add progress updates to track changes
                </Text>
              </View>
            ) : (
              <View className="gap-3">
                {progressLogs.slice(0, 5).map((log: any) => (
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
                          Note: {log.note}
                        </Text>
                      )}
                      <View className="flex-row items-center gap-1 mt-1">
                        <Ionicons 
                          name={log.loggedBy === 'trainer' ? 'person' : 'person-outline'} 
                          size={12} 
                          color={colors.textTertiary} 
                        />
                        <Text className="text-xs" style={{ color: colors.textTertiary }}>
                          Logged by {log.loggedBy}
                        </Text>
                      </View>
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

      {/* Add Progress Button */}
      <View className="absolute bottom-6 right-6">
        <TouchableOpacity
          className="w-16 h-16 rounded-2xl items-center justify-center"
          style={{ backgroundColor: colors.primary, ...shadows.large }}
          onPress={() => router.push(`/(trainer)/add-progress?goalId=${goalId}&clientId=${clientId}` as any)}
        >
          <Ionicons name="add" size={32} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
