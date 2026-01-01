import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getColors, Shadows } from "@/constants/colors";
import { StatusBar } from "expo-status-bar";

export default function GoalListScreen() {
  const { clientId } = useLocalSearchParams();
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = getColors(scheme === "dark");
  const shadows = scheme === "dark" ? Shadows.dark : Shadows.light;

  // Fetch client data
  const client = useQuery(
    api.users.getUserByClerkId,
    clientId ? { clerkId: clientId as string } : "skip"
  );

  // Fetch client goals with progress data
  const goals = useQuery(
    api.goals.getActiveClientGoalsWithProgress,
    clientId ? { clientId: clientId as string } : "skip"
  );

  if (!client || goals === undefined) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: colors.background }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />

      {/* Header */}
      <View
        className="px-4 pt-16 pb-4"
        style={{
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          ...shadows.small,
        }}
      >
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center rounded-full"
            style={{ backgroundColor: colors.surfaceSecondary }}
          >
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>

          <View className="flex-1 mx-3">
            <Text
              className="text-lg font-bold text-center"
              style={{ color: colors.text }}
            >
              Client Goals
            </Text>
            <Text
              className="text-sm text-center"
              style={{ color: colors.textSecondary }}
            >
              {client.fullName}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() =>
              router.push(`/(trainer)/set-goal?clientId=${clientId}` as any)
            }
            className="w-10 h-10 items-center justify-center rounded-full"
            style={{ backgroundColor: colors.primary }}
          >
            <Ionicons name="add" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>


      {/* Update Progress Button */}
      {goals && goals.length > 0 && (
        <TouchableOpacity
          onPress={() =>
            router.push(
              `/(trainer)/progress-tracking?goalId=${goals[0]._id}&clientId=${clientId}` as any
            )
          }
          className="mx-4 mt-4 rounded-xl py-3 flex-row items-center justify-center"
          style={{
            backgroundColor: colors.primary,
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="trending-up" size={20} color="#FFF" />
          <Text className="text-white font-semibold ml-2">
            Update Progress
          </Text>
        </TouchableOpacity>
      )}

      <ScrollView
        className="flex-1 px-4 py-4"
        showsVerticalScrollIndicator={false}
      >
        {goals.length === 0 ? (
          <View
            className="rounded-2xl p-6 items-center mt-4"
            style={{ backgroundColor: colors.surface, ...shadows.medium }}
          >
            <View
              className="w-20 h-20 rounded-full items-center justify-center mb-4"
              style={{ backgroundColor: `${colors.primary}15` }}
            >
              <Ionicons name="flag-outline" size={40} color={colors.primary} />
            </View>
            <Text
              className="text-lg font-semibold mb-2"
              style={{ color: colors.text }}
            >
              No Goals Yet
            </Text>
            <Text
              className="text-sm text-center mb-4"
              style={{ color: colors.textSecondary }}
            >
              Set goals to help track {client.fullName}'s progress
            </Text>
            <TouchableOpacity
              onPress={() =>
                router.push(`/(trainer)/set-goal?clientId=${clientId}` as any)
              }
              className="px-6 py-3 rounded-full flex-row items-center gap-2"
              style={{ backgroundColor: colors.primary }}
            >
              <Ionicons name="add" size={20} color="#FFF" />
              <Text className="text-white font-semibold">Set First Goal</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Summary Card */}
            <View
              className="rounded-2xl p-4 mb-4"
              style={{ backgroundColor: colors.surface, ...shadows.medium }}
            >
              <View className="flex-row items-center justify-around">
                <View className="items-center">
                  <Text
                    className="text-2xl font-bold"
                    style={{ color: colors.primary }}
                  >
                    {goals.length}
                  </Text>
                  <Text
                    className="text-xs"
                    style={{ color: colors.textSecondary }}
                  >
                    Total Goals
                  </Text>
                </View>
                <View
                  className="w-px h-10"
                  style={{ backgroundColor: colors.border }}
                />
                <View className="items-center">
                  <Text
                    className="text-2xl font-bold"
                    style={{ color: colors.success }}
                  >
                    {goals.filter((g: any) => g.status === "active").length}
                  </Text>
                  <Text
                    className="text-xs"
                    style={{ color: colors.textSecondary }}
                  >
                    Active
                  </Text>
                </View>
              </View>
            </View>

            {/* Goals List */}
            {goals.map((goal: any) => (
              <View
                key={goal._id}
                className="rounded-2xl p-5 mb-3"
                style={{ backgroundColor: colors.surface, ...shadows.small }}
              >
                {/* Goal Header */}
                <View className="flex-row items-start justify-between mb-3">
                  <View className="flex-1 mr-3">
                    <Text
                      className="text-base font-bold mb-1"
                      style={{ color: colors.text }}
                    >
                      {goal.description}
                    </Text>
                    {goal.deadline && (
                      <View className="flex-row items-center">
                        <Ionicons
                          name="calendar-outline"
                          size={14}
                          color={colors.textSecondary}
                        />
                        <Text
                          className="ml-1 text-xs"
                          style={{ color: colors.textSecondary }}
                        >
                          Deadline: {new Date(goal.deadline).toLocaleDateString()}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View
                    className="px-3 py-1 rounded-full"
                    style={{ backgroundColor: `${colors.primary}20` }}
                  >
                    <Text
                      className="text-xs font-semibold"
                      style={{ color: colors.primary }}
                    >
                      Active
                    </Text>
                  </View>
                </View>

                {/* Weight Goal */}
                {goal.currentWeight && goal.targetWeight && (
                  <View
                    className="rounded-lg p-3 mb-2"
                    style={{ backgroundColor: colors.background }}
                  >
                    <View className="flex-row items-center justify-between mb-2">
                      <Text
                        className="text-sm font-semibold"
                        style={{ color: colors.text }}
                      >
                        Weight Goal
                      </Text>
                      <View
                        className="px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: `${colors.success}20` }}
                      >
                        <Text
                          className="text-xs font-bold"
                          style={{ color: colors.success }}
                        >
                          {goal.latestProgress || 0}%
                        </Text>
                      </View>
                    </View>
                    <View className="flex-row items-center justify-between mb-2">
                      <View className="flex-1">
                        <Text
                          className="text-xs mb-1"
                          style={{ color: colors.textSecondary }}
                        >
                          Start
                        </Text>
                        <Text
                          className="text-base font-semibold"
                          style={{ color: colors.textSecondary }}
                        >
                          {goal.currentWeight} {goal.weightUnit}
                        </Text>
                      </View>
                      <View className="flex-1 items-center">
                        <Text
                          className="text-xs mb-1"
                          style={{ color: colors.primary }}
                        >
                          Current
                        </Text>
                        <Text
                          className="text-lg font-bold"
                          style={{ color: colors.primary }}
                        >
                          {goal.latestWeight || goal.currentWeight} {goal.weightUnit}
                        </Text>
                      </View>
                      <View className="flex-1 items-end">
                        <Text
                          className="text-xs mb-1"
                          style={{ color: colors.success }}
                        >
                          Target
                        </Text>
                        <Text
                          className="text-base font-semibold"
                          style={{ color: colors.success }}
                        >
                          {goal.targetWeight} {goal.weightUnit}
                        </Text>
                      </View>
                    </View>
                    {/* Progress Bar */}
                    <View
                      className="h-2 w-full rounded-full"
                      style={{ backgroundColor: `${colors.primary}20` }}
                    >
                      <View
                        className="h-full rounded-full"
                        style={{
                          backgroundColor: colors.primary,
                          width: `${goal.latestProgress || 0}%`,
                        }}
                      />
                    </View>
                  </View>
                )}

                {/* Body Measurements */}
                {goal.measurements && goal.measurements.length > 0 && (
                  <View
                    className="rounded-lg p-3"
                    style={{ backgroundColor: colors.background }}
                  >
                    <Text
                      className="text-sm font-semibold mb-2"
                      style={{ color: colors.text }}
                    >
                      Body Measurements
                    </Text>
                    {goal.measurements.map((measurement: any, index: number) => (
                      <View key={index} className="mb-2">
                        <Text
                          className="text-xs mb-1"
                          style={{ color: colors.textSecondary }}
                        >
                          {measurement.bodyPart}
                        </Text>
                        <View className="flex-row items-center justify-between">
                          <Text
                            className="text-sm"
                            style={{ color: colors.text }}
                          >
                            {measurement.current} {measurement.unit}
                          </Text>
                          <Ionicons
                            name="arrow-forward"
                            size={16}
                            color={colors.textSecondary}
                          />
                          <Text
                            className="text-sm font-semibold"
                            style={{ color: colors.primary }}
                          >
                            {measurement.target} {measurement.unit}
                          </Text>
                        </View>
                        {index < goal.measurements.length - 1 && (
                          <View
                            className="h-px mt-2"
                            style={{ backgroundColor: colors.border }}
                          />
                        )}
                      </View>
                    ))}
                  </View>
                )}

                {/* Action Buttons */}
                <View className="flex-row items-center gap-3 mt-3 pt-3 border-t" style={{ borderTopColor: colors.border }}>
                  <TouchableOpacity
                    className="flex-1 flex-row items-center justify-center gap-1 py-2 rounded-lg"
                    style={{ backgroundColor: `${colors.primary}15` }}
                    onPress={() =>
                      router.push(
                        `/(trainer)/progress-tracking?goalId=${goal._id}&clientId=${clientId}` as any
                      )
                    }
                  >
                    <Ionicons name="analytics" size={16} color={colors.primary} />
                    <Text
                      className="text-sm font-semibold"
                      style={{ color: colors.primary }}
                    >
                      View Progress
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-1 flex-row items-center justify-center gap-1 py-2 rounded-lg"
                    style={{ backgroundColor: colors.surfaceSecondary }}
                    onPress={() =>
                      router.push(
                        `/(trainer)/edit-goal?goalId=${goal._id}&clientId=${clientId}` as any
                      )
                    }
                  >
                    <Ionicons name="create-outline" size={16} color={colors.textSecondary} />
                    <Text
                      className="text-sm font-semibold"
                      style={{ color: colors.textSecondary }}
                    >
                      Edit Goal
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}

        {/* Bottom padding */}
        <View className="h-24" />
      </ScrollView>

      {/* Floating Add Button */}
      {goals && goals.length > 0 && (
        <TouchableOpacity
          onPress={() =>
            router.push(`/(trainer)/set-goal?clientId=${clientId}` as any)
          }
          className="absolute bottom-6 right-6 w-14 h-14 rounded-full items-center justify-center"
          style={{
            backgroundColor: colors.primary,
            ...shadows.large,
          }}
        >
          <Ionicons name="add" size={28} color="#FFF" />
        </TouchableOpacity>
      )}
    </View>
  );
}
