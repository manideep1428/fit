import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ProgressInsightsProps {
  goal: any;
  progressLogs: any[];
  colors: any;
  shadows: any;
}

export function ProgressInsights({ goal, progressLogs, colors, shadows }: ProgressInsightsProps) {
  if (progressLogs.length < 2) {
    return null;
  }

  // Calculate insights
  const latestLog = progressLogs[0];
  const previousLog = progressLogs[1];
  const currentWeight = latestLog.weight || goal.currentWeight || 0;
  const previousWeight = previousLog.weight || goal.currentWeight || 0;
  const weightChange = currentWeight - previousWeight;
  const isImproving = goal.targetWeight
    ? Math.abs(currentWeight - goal.targetWeight) < Math.abs(previousWeight - goal.targetWeight)
    : false;

  // Calculate weekly average
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weeklyLogs = progressLogs.filter(log => log.createdAt >= oneWeekAgo);
  const weeklyAverage = weeklyLogs.length > 0
    ? weeklyLogs.reduce((sum, log) => sum + (log.weight || 0), 0) / weeklyLogs.length
    : 0;

  // Calculate consistency
  const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
  const recentLogs = progressLogs.filter(log => log.createdAt >= twoWeeksAgo);
  const consistency = Math.min((recentLogs.length / 14) * 100, 100);

  // Estimate completion
  let estimatedDays = null;
  if (goal.targetWeight && weeklyLogs.length > 1) {
    const weeklyChange = Math.abs(weeklyLogs[0].weight - weeklyLogs[weeklyLogs.length - 1].weight);
    const remainingChange = Math.abs(currentWeight - goal.targetWeight);
    if (weeklyChange > 0) {
      const weeksToComplete = remainingChange / weeklyChange;
      estimatedDays = Math.round(weeksToComplete * 7);
    }
  }

  return (
    <View
      className="rounded-2xl p-5"
      style={{ backgroundColor: colors.surface, ...shadows.medium, borderWidth: 1, borderColor: colors.border }}
    >
      <View className="flex-row items-center mb-4">
        <View
          className="w-10 h-10 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: `${colors.info}15` }}
        >
          <Ionicons name="bulb" size={20} color={colors.info} />
        </View>
        <Text className="text-base font-bold" style={{ color: colors.text }}>
          Progress Insights
        </Text>
      </View>

      {/* Trend */}
      <View className="flex-row items-start mb-4 pb-4" style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <View
          className="w-8 h-8 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: isImproving ? `${colors.success}15` : `${colors.warning}15` }}
        >
          <Ionicons
            name={isImproving ? 'trending-up' : 'trending-down'}
            size={16}
            color={isImproving ? colors.success : colors.warning}
          />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-semibold mb-1" style={{ color: colors.text }}>
            {isImproving ? 'Great Progress!' : 'Keep Going!'}
          </Text>
          <Text className="text-xs" style={{ color: colors.textSecondary }}>
            {weightChange !== 0
              ? `${Math.abs(weightChange).toFixed(1)} ${goal.weightUnit} ${weightChange > 0 ? 'gained' : 'lost'} since last update`
              : 'Weight maintained since last update'}
          </Text>
        </View>
      </View>

      {/* Weekly Average */}
      <View className="flex-row items-start mb-4 pb-4" style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <View
          className="w-8 h-8 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: `${colors.primary}15` }}
        >
          <Ionicons name="calendar" size={16} color={colors.primary} />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-semibold mb-1" style={{ color: colors.text }}>
            Weekly Average
          </Text>
          <Text className="text-xs" style={{ color: colors.textSecondary }}>
            {weeklyAverage > 0 ? `${weeklyAverage.toFixed(1)} ${goal.weightUnit}` : 'Not enough data'}
          </Text>
        </View>
      </View>

      {/* Consistency */}
      <View className="flex-row items-start mb-4 pb-4" style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <View
          className="w-8 h-8 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: `${colors.info}15` }}
        >
          <Ionicons name="checkmark-circle" size={16} color={colors.info} />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-semibold mb-1" style={{ color: colors.text }}>
            Tracking Consistency
          </Text>
          <View className="flex-row items-center gap-2">
            <View className="flex-1 h-2 rounded-full" style={{ backgroundColor: `${colors.primary}20` }}>
              <View
                className="h-full rounded-full"
                style={{ backgroundColor: colors.primary, width: `${consistency}%` }}
              />
            </View>
            <Text className="text-xs font-semibold" style={{ color: colors.primary }}>
              {Math.round(consistency)}%
            </Text>
          </View>
        </View>
      </View>

      {/* Estimated Completion */}
      {estimatedDays && (
        <View className="flex-row items-start">
          <View
            className="w-8 h-8 rounded-full items-center justify-center mr-3"
            style={{ backgroundColor: `${colors.success}15` }}
          >
            <Ionicons name="flag" size={16} color={colors.success} />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-semibold mb-1" style={{ color: colors.text }}>
              Estimated Goal Completion
            </Text>
            <Text className="text-xs" style={{ color: colors.textSecondary }}>
              {estimatedDays < 30
                ? `Approximately ${estimatedDays} days at current pace`
                : `Approximately ${Math.round(estimatedDays / 30)} months at current pace`}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
