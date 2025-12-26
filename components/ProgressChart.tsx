import { View, Text, Dimensions, TouchableOpacity } from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';

interface ProgressChartProps {
  data: any[];
  goal: any;
  colors: any;
  type?: 'weight' | 'measurements';
}

export function ProgressChart({ data, goal, colors, type = 'weight' }: ProgressChartProps) {
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [timeRange, setTimeRange] = useState<'1M' | '3M' | '6M' | 'ALL'>('ALL');
  const screenWidth = Dimensions.get('window').width;

  // Filter data based on time range
  const filterDataByRange = () => {
    const now = Date.now();
    const ranges = {
      '1M': 30 * 24 * 60 * 60 * 1000,
      '3M': 90 * 24 * 60 * 60 * 1000,
      '6M': 180 * 24 * 60 * 60 * 1000,
      'ALL': Infinity,
    };

    const filtered = data.filter(log => now - log.createdAt <= ranges[timeRange]);
    return filtered.length > 0 ? filtered : data.slice(0, 6);
  };

  const filteredData = filterDataByRange();
  const reversedData = [...filteredData].reverse();

  // Prepare chart data
  const chartData = {
    labels: reversedData.map((log: any) => {
      const date = new Date(log.createdAt);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }),
    datasets: [{
      data: reversedData.map((log: any) => {
        if (type === 'weight') {
          return log.weight || goal.currentWeight || 0;
        }
        return 0;
      }),
      color: (opacity = 1) => colors.primary,
      strokeWidth: 3,
    }],
  };

  // Add target line
  if (type === 'weight' && goal.targetWeight) {
    chartData.datasets.push({
      data: Array(reversedData.length).fill(goal.targetWeight),
      color: (opacity = 1) => `${colors.success}80`,
      strokeWidth: 2,
    } as any);
  }

  const chartConfig = {
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
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: `${colors.border}40`,
    },
  };

  return (
    <View>
      {/* Chart Type and Time Range Selector */}
      <View className="flex-row justify-between items-center mb-4 px-2">
        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            onPress={() => setChartType('line')}
            className="px-3 py-1.5 rounded-lg"
            style={{
              backgroundColor: chartType === 'line' ? colors.primary : colors.background,
            }}
          >
            <Ionicons
              name="analytics"
              size={16}
              color={chartType === 'line' ? '#FFF' : colors.textSecondary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setChartType('bar')}
            className="px-3 py-1.5 rounded-lg"
            style={{
              backgroundColor: chartType === 'bar' ? colors.primary : colors.background,
            }}
          >
            <Ionicons
              name="bar-chart"
              size={16}
              color={chartType === 'bar' ? '#FFF' : colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center gap-1 rounded-lg p-1" style={{ backgroundColor: colors.background }}>
          {(['1M', '3M', '6M', 'ALL'] as const).map((range) => (
            <TouchableOpacity
              key={range}
              onPress={() => setTimeRange(range)}
              className="rounded-md px-3 py-1"
              style={{
                backgroundColor: timeRange === range ? colors.surface : 'transparent',
              }}
            >
              <Text
                className="text-xs font-semibold"
                style={{
                  color: timeRange === range ? colors.primary : colors.textSecondary,
                }}
              >
                {range}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Chart */}
      {chartType === 'line' ? (
        <LineChart
          data={chartData}
          width={screenWidth - 64}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={{
            marginVertical: 8,
            borderRadius: 16,
          }}
          withInnerLines
          withOuterLines
          withVerticalLines={false}
          withHorizontalLines
          withDots
          withShadow={false}
        />
      ) : (
        <BarChart
          data={chartData}
          width={screenWidth - 64}
          height={220}
          yAxisLabel=""
          yAxisSuffix=""
          chartConfig={chartConfig}
          style={{
            marginVertical: 8,
            borderRadius: 16,
          }}
          withInnerLines
          showValuesOnTopOfBars
          fromZero
        />
      )}

      {/* Statistics */}
      <View className="flex-row gap-2 mt-4">
        <View className="flex-1 rounded-xl p-3" style={{ backgroundColor: colors.background }}>
          <Text className="text-xs mb-1" style={{ color: colors.textSecondary }}>
            Average
          </Text>
          <Text className="text-lg font-bold" style={{ color: colors.text }}>
            {(reversedData.reduce((sum: number, log: any) => sum + (log.weight || 0), 0) / reversedData.length).toFixed(1)}
          </Text>
        </View>
        <View className="flex-1 rounded-xl p-3" style={{ backgroundColor: colors.background }}>
          <Text className="text-xs mb-1" style={{ color: colors.textSecondary }}>
            Change
          </Text>
          <Text className="text-lg font-bold" style={{ color: colors.success }}>
            {reversedData.length > 1
              ? `${Math.abs((reversedData[reversedData.length - 1].weight || 0) - (reversedData[0].weight || 0)).toFixed(1)} ${goal.weightUnit}`
              : '0'}
          </Text>
        </View>
        <View className="flex-1 rounded-xl p-3" style={{ backgroundColor: colors.background }}>
          <Text className="text-xs mb-1" style={{ color: colors.textSecondary }}>
            Logs
          </Text>
          <Text className="text-lg font-bold" style={{ color: colors.text }}>
            {filteredData.length}
          </Text>
        </View>
      </View>
    </View>
  );
}
