import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Modal, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useUser } from '@clerk/clerk-expo';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getColors, Shadows } from '@/constants/colors';
import { StatusBar } from 'expo-status-bar';
import DateTimePicker from '@react-native-community/datetimepicker';

const BODY_PARTS = [
  'Stomach',
  'Chest',
  'Arms',
  'Thighs',
  'Hips',
  'Shoulders',
  'Calves',
  'Waist',
];

const UNITS = ['in', 'cm'];

interface Measurement {
  bodyPart: string;
  current: string;
  target: string;
  unit: string;
}

export default function SetGoalScreen() {
  const { clientId } = useLocalSearchParams();
  const { user } = useUser();
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = getColors(scheme === 'dark');
  const shadows = scheme === 'dark' ? Shadows.dark : Shadows.light;
  const insets = useSafeAreaInsets();

  const createGoal = useMutation(api.goals.createGoal);

  const [goalDescription, setGoalDescription] = useState('');

  const checkGoalNameUnique = useQuery(
    api.goals.checkGoalNameUnique,
    clientId && goalDescription ? { clientId: clientId as string, description: goalDescription } : 'skip'
  );
  const [currentWeight, setCurrentWeight] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  const [measurements, setMeasurements] = useState<Measurement[]>([
    { bodyPart: 'Stomach', current: '', target: '', unit: 'in' }
  ]);
  const [deadline, setDeadline] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [showBodyPartPicker, setShowBodyPartPicker] = useState(false);
  const [selectedMeasurementIndex, setSelectedMeasurementIndex] = useState(0);

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }

    if (date) {
      setSelectedDate(date);
      const formattedDate = date.toISOString().split('T')[0];
      setDeadline(formattedDate);
    }
  };

  const addMeasurement = () => {
    setMeasurements([...measurements, { bodyPart: 'Chest', current: '', target: '', unit: 'in' }]);
  };

  const removeMeasurement = (index: number) => {
    setMeasurements(measurements.filter((_, i) => i !== index));
  };

  const updateMeasurement = (index: number, field: keyof Measurement, value: string) => {
    const updated = [...measurements];
    updated[index] = { ...updated[index], [field]: value };
    setMeasurements(updated);
  };

  const handleSubmit = async () => {
    if (!goalDescription.trim() || !user?.id || !clientId) {
      return;
    }

    // Check if goal name is unique
    if (checkGoalNameUnique === false) {
      alert('A goal with this name already exists. Please choose a different name.');
      return;
    }

    setLoading(true);
    try {
      const validMeasurements = measurements
        .filter(m => m.current && m.target)
        .map(m => ({
          bodyPart: m.bodyPart,
          current: parseFloat(m.current),
          target: parseFloat(m.target),
          unit: m.unit,
        }));

      await createGoal({
        clientId: clientId as string,
        trainerId: user.id,
        description: goalDescription,
        deadline: deadline || undefined,
        currentWeight: currentWeight ? parseFloat(currentWeight) : undefined,
        targetWeight: targetWeight ? parseFloat(targetWeight) : undefined,
        weightUnit: currentWeight && targetWeight ? 'kg' : undefined,
        measurements: validMeasurements.length > 0 ? validMeasurements : undefined,
      });

      router.push(`/(trainer)/client-detail?clientId=${clientId}` as any);
    } catch (error) {
      console.error('Error creating goal:', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

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
          onPress={() => router.push(`/(trainer)/client-detail?clientId=${clientId}` as any)}
          className="w-10 h-10 items-center justify-center rounded-full"
          style={{ backgroundColor: colors.surface }}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text className="text-xl font-bold" style={{ color: colors.text }}>
          Set a New Goal
        </Text>
        <View className="w-10" />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Goal Description */}
        <View className="mb-6">
          <Text className="text-sm font-semibold mb-2" style={{ color: colors.text }}>
            Goal Description *
          </Text>
          <TextInput
            className="rounded-2xl px-4 py-4 text-base"
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: checkGoalNameUnique === false ? '#EF4444' : colors.border,
              color: colors.text,
              ...shadows.small,
            }}
            placeholder="e.g., Lose weight and build muscle"
            placeholderTextColor={colors.textSecondary}
            value={goalDescription}
            onChangeText={setGoalDescription}
            multiline
          />
          {checkGoalNameUnique === false && (
            <Text className="text-xs mt-1" style={{ color: '#EF4444' }}>
              A goal with this name already exists
            </Text>
          )}
        </View>

        {/* Track Body Weight */}
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
            <Text className="text-base font-bold flex-1" style={{ color: colors.text }}>
              Track Body Weight
            </Text>
          </View>

          <View className="flex-row items-center gap-3">
            <View className="flex-1">
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
                  placeholder="75"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  value={currentWeight}
                  onChangeText={setCurrentWeight}
                />
                <View
                  className="absolute right-3 top-3 px-2 py-1 rounded"
                  style={{ backgroundColor: colors.surface }}
                >
                  <Text className="text-xs font-bold" style={{ color: colors.textSecondary }}>
                    kg
                  </Text>
                </View>
              </View>
            </View>

            <View className="pt-6">
              <Ionicons name="arrow-forward" size={22} color={colors.primary} />
            </View>

            <View className="flex-1">
              <Text className="text-xs font-medium mb-2" style={{ color: colors.textSecondary }}>
                TARGET WEIGHT
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
                  placeholder="70"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  value={targetWeight}
                  onChangeText={setTargetWeight}
                />
                <View
                  className="absolute right-3 top-3 px-2 py-1 rounded"
                  style={{ backgroundColor: colors.surface }}
                >
                  <Text className="text-xs font-bold" style={{ color: colors.textSecondary }}>
                    kg
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Track Body Measurements */}
        <View
          className="rounded-2xl p-5 mb-6"
          style={{
            backgroundColor: colors.surface,
            ...shadows.medium,
          }}
        >
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center flex-1">
              <View
                className="w-10 h-10 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: `${colors.primary}15` }}
              >
                <Ionicons name="body-outline" size={20} color={colors.primary} />
              </View>
              <Text className="text-base font-bold" style={{ color: colors.text }}>
                Body Measurements
              </Text>
            </View>
            <TouchableOpacity
              onPress={addMeasurement}
              className="flex-row items-center gap-1.5 px-3 py-2 rounded-full"
              style={{ backgroundColor: `${colors.primary}15` }}
            >
              <Ionicons name="add" size={18} color={colors.primary} />
              <Text className="text-sm font-bold" style={{ color: colors.primary }}>
                Add
              </Text>
            </TouchableOpacity>
          </View>

          {measurements.map((measurement, index) => (
            <View
              key={index}
              className="mb-4 pb-4"
              style={{
                borderBottomWidth: index < measurements.length - 1 ? 1 : 0,
                borderBottomColor: colors.border
              }}
            >
              {/* Body Part Selector */}
              <View className="mb-3">
                <Text className="text-xs font-medium mb-2" style={{ color: colors.textSecondary }}>
                  BODY PART
                </Text>
                <TouchableOpacity
                  className="rounded-xl px-4 py-3.5 flex-row items-center justify-between"
                  style={{
                    backgroundColor: colors.background,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                  onPress={() => {
                    setSelectedMeasurementIndex(index);
                    setShowBodyPartPicker(true);
                  }}
                >
                  <Text className="font-medium" style={{ color: colors.text }}>
                    {measurement.bodyPart}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Measurements */}
              <View className="flex-row items-end gap-2">
                <View className="flex-1">
                  <Text className="text-xs font-medium mb-2" style={{ color: colors.textSecondary }}>
                    CURRENT
                  </Text>
                  <TextInput
                    className="rounded-xl px-4 py-3.5 text-base font-medium"
                    style={{
                      backgroundColor: colors.background,
                      borderWidth: 1,
                      borderColor: colors.border,
                      color: colors.text,
                    }}
                    placeholder="34"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                    value={measurement.current}
                    onChangeText={(value) => updateMeasurement(index, 'current', value)}
                  />
                </View>

                <View className="pb-3">
                  <Ionicons name="arrow-forward" size={18} color={colors.primary} />
                </View>

                <View className="flex-1">
                  <Text className="text-xs font-medium mb-2" style={{ color: colors.textSecondary }}>
                    TARGET
                  </Text>
                  <TextInput
                    className="rounded-xl px-4 py-3.5 text-base font-medium"
                    style={{
                      backgroundColor: colors.background,
                      borderWidth: 1,
                      borderColor: colors.border,
                      color: colors.text,
                    }}
                    placeholder="32"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                    value={measurement.target}
                    onChangeText={(value) => updateMeasurement(index, 'target', value)}
                  />
                </View>

                <View className="w-24">
                  <Text className="text-xs font-medium mb-2" style={{ color: colors.textSecondary }}>
                    UNIT
                  </Text>
                  <TouchableOpacity
                    className="rounded-xl px-3 py-3.5 flex-row items-center justify-center"
                    style={{
                      backgroundColor: colors.background,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                    onPress={() => {
                      const newUnit = measurement.unit === 'in' ? 'cm' : 'in';
                      updateMeasurement(index, 'unit', newUnit);
                    }}
                  >
                    <Text className="font-bold" style={{ color: colors.text }}>
                      {measurement.unit}
                    </Text>
                    <Ionicons name="swap-horizontal" size={16} color={colors.textSecondary} style={{ marginLeft: 4 }} />
                  </TouchableOpacity>
                </View>

                {measurements.length > 1 && (
                  <TouchableOpacity
                    onPress={() => removeMeasurement(index)}
                    className="pb-3 w-10 h-10 items-center justify-center rounded-full"
                    style={{ backgroundColor: '#FEE2E2' }}
                  >
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Deadline */}
        <View className="mb-6">
          <Text className="text-sm font-semibold mb-2" style={{ color: colors.text }}>
            Target Deadline (Optional)
          </Text>
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            className="relative"
          >
            <View
              className="absolute left-4 top-4 z-10 w-8 h-8 rounded-full items-center justify-center"
              style={{ backgroundColor: `${colors.primary}15` }}
            >
              <Ionicons
                name="calendar-outline"
                size={18}
                color={colors.primary}
              />
            </View>
            <View
              className="rounded-2xl py-4 pl-14 pr-4"
              style={{
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                ...shadows.small,
              }}
            >
              <Text
                className="text-base"
                style={{
                  color: deadline ? colors.text : colors.textSecondary,
                }}
              >
                {deadline || 'Select target date'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Date Picker */}
        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
            minimumDate={new Date()}
            textColor={colors.text}
          />
        )}

        {Platform.OS === 'ios' && showDatePicker && (
          <View
            className="rounded-2xl p-4 mb-6"
            style={{
              backgroundColor: colors.surface,
              ...shadows.medium,
            }}
          >
            <View className="flex-row justify-end gap-2 mb-2">
              <TouchableOpacity
                onPress={() => setShowDatePicker(false)}
                className="px-4 py-2 rounded-lg"
              >
                <Text style={{ color: colors.textSecondary }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowDatePicker(false)}
                className="px-4 py-2 rounded-lg"
                style={{ backgroundColor: colors.primary }}
              >
                <Text className="font-semibold text-white">Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

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
            opacity: (!goalDescription.trim() || loading || checkGoalNameUnique === false) ? 0.5 : 1,
          }}
          onPress={handleSubmit}
          disabled={loading || !goalDescription.trim() || checkGoalNameUnique === false}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text className="text-base font-bold text-white">Create Goal</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Body Part Picker Modal */}
      <Modal
        visible={showBodyPartPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBodyPartPicker(false)}
      >
        <TouchableOpacity
          className="flex-1 justify-end"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          activeOpacity={1}
          onPress={() => setShowBodyPartPicker(false)}
        >
          <View
            className="rounded-t-3xl"
            style={{ backgroundColor: colors.background }}
          >
            <View className="px-6 pt-6 pb-4 flex-row items-center justify-between border-b" style={{ borderBottomColor: colors.border }}>
              <Text className="text-lg font-bold" style={{ color: colors.text }}>
                Select Body Part
              </Text>
              <TouchableOpacity
                onPress={() => setShowBodyPartPicker(false)}
                className="w-9 h-9 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.surface }}
              >
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView className="max-h-96">
              {BODY_PARTS.map((part, idx) => (
                <TouchableOpacity
                  key={part}
                  className="px-6 py-4 flex-row items-center justify-between"
                  style={{
                    borderBottomWidth: idx < BODY_PARTS.length - 1 ? 1 : 0,
                    borderBottomColor: colors.border,
                    backgroundColor: measurements[selectedMeasurementIndex]?.bodyPart === part
                      ? `${colors.primary}10`
                      : 'transparent',
                  }}
                  onPress={() => {
                    updateMeasurement(selectedMeasurementIndex, 'bodyPart', part);
                    setShowBodyPartPicker(false);
                  }}
                >
                  <Text
                    className="text-base"
                    style={{
                      color: measurements[selectedMeasurementIndex]?.bodyPart === part
                        ? colors.primary
                        : colors.text,
                      fontWeight: measurements[selectedMeasurementIndex]?.bodyPart === part
                        ? '600'
                        : '400',
                    }}
                  >
                    {part}
                  </Text>
                  {measurements[selectedMeasurementIndex]?.bodyPart === part && (
                    <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}