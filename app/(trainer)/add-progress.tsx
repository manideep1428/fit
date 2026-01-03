import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-expo';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getColors, Shadows } from '@/constants/colors';
import { StatusBar } from 'expo-status-bar';

interface MeasurementInput {
  bodyPart: string;
  value: string;
  unit: string;
}

export default function AddProgressScreen() {
  const { goalId, clientId } = useLocalSearchParams();
  const { user } = useUser();
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = getColors(scheme === 'dark');
  const shadows = scheme === 'dark' ? Shadows.dark : Shadows.light;

  const createProgressLog = useMutation(api.goals.createProgressLog);
  const createNotification = useMutation(api.notifications.createNotification);

  // Fetch goal data
  const goals = useQuery(
    api.goals.getClientGoals,
    clientId ? { clientId: clientId as string } : 'skip'
  );
  const goal = goals?.find((g: any) => g._id === goalId);

  const [weight, setWeight] = useState('');
  const [measurements, setMeasurements] = useState<MeasurementInput[]>([]);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  // Initialize measurements from goal
  useEffect(() => {
    if (goal?.measurements) {
      setMeasurements(
        goal.measurements.map((m: any) => ({
          bodyPart: m.bodyPart,
          value: '',
          unit: m.unit,
        }))
      );
    }
  }, [goal]);

  const updateMeasurement = (index: number, value: string) => {
    const updated = [...measurements];
    updated[index] = { ...updated[index], value };
    setMeasurements(updated);
  };

  const handleSubmit = async () => {
    if ((!weight && measurements.every(m => !m.value)) || !user?.id || !clientId || !goalId) {
      return;
    }

    setLoading(true);
    try {
      // Filter valid measurements
      const validMeasurements = measurements
        .filter(m => m.value)
        .map(m => ({
          bodyPart: m.bodyPart,
          value: parseFloat(m.value),
          unit: m.unit,
        }));

      await createProgressLog({
        goalId: goalId as any,
        clientId: clientId as string,
        trainerId: user.id,
        weight: weight ? parseFloat(weight) : undefined,
        measurements: validMeasurements.length > 0 ? validMeasurements : undefined,
        note: note || undefined,
        loggedBy: 'trainer',
      });

      // Send notification to client
      const progressDetails = [];
      if (weight) progressDetails.push(`Weight: ${weight} ${goal?.weightUnit || 'kg'}`);
      if (validMeasurements.length > 0) {
        progressDetails.push(`${validMeasurements.length} measurement(s) updated`);
      }

      await createNotification({
        userId: clientId as string,
        type: 'trainer_added',
        title: 'Progress Updated',
        message: `Your trainer has updated your progress: ${progressDetails.join(', ')}${note ? ` - ${note}` : ''}`,
        read: false,
      });

      router.back();
    } catch (error) {
      console.error('Error adding progress:', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (!goal) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      
      {/* Header */}
      <View 
        className="px-5 pt-14 pb-5 flex-row items-center justify-between"
        style={{
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
          Update Progress
        </Text>
        <View className="w-10" />
      </View>

      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Goal Info Card */}
        <View
          className="rounded-2xl p-5 mb-6"
          style={{ backgroundColor: colors.surface, ...shadows.medium }}
        >
          <View className="flex-row items-center mb-3">
            <View 
              className="w-10 h-10 rounded-full items-center justify-center mr-3"
              style={{ backgroundColor: `${colors.primary}15` }}
            >
              <Ionicons name="flag" size={20} color={colors.primary} />
            </View>
            <Text className="text-base font-bold flex-1" style={{ color: colors.text }}>
              Current Goal
            </Text>
          </View>
          <Text className="text-base mb-2" style={{ color: colors.text }}>
            {goal.description}
          </Text>
          {goal.currentWeight && goal.targetWeight && (
            <View className="flex-row items-center gap-2 mt-2">
              <Text className="text-sm" style={{ color: colors.textSecondary }}>
                Target: {goal.currentWeight}{goal.weightUnit}
              </Text>
              <Ionicons name="arrow-forward" size={14} color={colors.textSecondary} />
              <Text className="text-sm font-semibold" style={{ color: colors.primary }}>
                {goal.targetWeight}{goal.weightUnit}
              </Text>
            </View>
          )}
        </View>

        {/* Weight Update */}
        {goal.currentWeight && goal.targetWeight && (
          <View
            className="rounded-2xl p-5 mb-6"
            style={{
              backgroundColor: colors.surface,
              ...shadows.medium,
            }}
          >
            <View className="flex-row items-center mb-4">
              <View 
                className="w-10 h-10 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: `${colors.primary}15` }}
              >
                <Ionicons name="scale-outline" size={20} color={colors.primary} />
              </View>
              <Text className="text-base font-bold" style={{ color: colors.text }}>
                Update Weight
              </Text>
            </View>

            <Text className="text-xs font-medium mb-2" style={{ color: colors.textSecondary }}>
              CURRENT WEIGHT
            </Text>
            <View className="relative">
              <TextInput
                className="rounded-xl px-4 py-3.5 pr-14 text-base font-medium"
                style={{
                  backgroundColor: colors.background,
                  borderWidth: 1,
                  borderColor: colors.border,
                  color: colors.text,
                }}
                placeholder={`e.g., ${goal.currentWeight}`}
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
                value={weight}
                onChangeText={setWeight}
              />
              <View
                className="absolute right-3 top-3 px-2 py-1 rounded"
                style={{ backgroundColor: colors.surface }}
              >
                <Text className="text-xs font-bold" style={{ color: colors.textSecondary }}>
                  {goal.weightUnit}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Body Measurements Update */}
        {measurements.length > 0 && (
          <View
            className="rounded-2xl p-5 mb-6"
            style={{
              backgroundColor: colors.surface,
              ...shadows.medium,
            }}
          >
            <View className="flex-row items-center mb-4">
              <View 
                className="w-10 h-10 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: `${colors.primary}15` }}
              >
                <Ionicons name="body-outline" size={20} color={colors.primary} />
              </View>
              <Text className="text-base font-bold" style={{ color: colors.text }}>
                Update Measurements
              </Text>
            </View>

            {measurements.map((measurement, index) => (
              <View 
                key={index} 
                className="mb-4"
                style={{ 
                  paddingBottom: index < measurements.length - 1 ? 16 : 0,
                  borderBottomWidth: index < measurements.length - 1 ? 1 : 0,
                  borderBottomColor: colors.border 
                }}
              >
                <Text className="text-xs font-medium mb-2" style={{ color: colors.textSecondary }}>
                  {measurement.bodyPart.toUpperCase()}
                </Text>
                <View className="relative">
                  <TextInput
                    className="rounded-xl px-4 py-3.5 pr-14 text-base font-medium"
                    style={{
                      backgroundColor: colors.background,
                      borderWidth: 1,
                      borderColor: colors.border,
                      color: colors.text,
                    }}
                    placeholder="Enter value"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                    value={measurement.value}
                    onChangeText={(value) => updateMeasurement(index, value)}
                  />
                  <View
                    className="absolute right-3 top-3 px-2 py-1 rounded"
                    style={{ backgroundColor: colors.surface }}
                  >
                    <Text className="text-xs font-bold" style={{ color: colors.textSecondary }}>
                      {measurement.unit}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Note Input */}
        <View className="mb-6">
          <Text className="text-sm font-semibold mb-2" style={{ color: colors.text }}>
            Progress Notes (Optional)
          </Text>
          <TextInput
            className="rounded-2xl px-4 py-4 text-base"
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              color: colors.text,
              minHeight: 120,
              textAlignVertical: 'top',
              ...shadows.small,
            }}
            placeholder="Add notes about today's progress, achievements, or observations..."
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={5}
            value={note}
            onChangeText={setNote}
          />
        </View>

        <View className="h-24" />
      </ScrollView>

      {/* Submit Button */}
      <View
        className="px-5 py-4"
        style={{
          backgroundColor: colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          ...shadows.large,
        }}
      >
        <TouchableOpacity
          className="rounded-2xl py-4 items-center"
          style={{ 
            backgroundColor: colors.primary,
            opacity: ((!weight && measurements.every(m => !m.value)) || loading) ? 0.5 : 1,
          }}
          onPress={handleSubmit}
          disabled={loading || (!weight && measurements.every(m => !m.value))}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text className="text-base font-bold text-white">Save Progress Update</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
