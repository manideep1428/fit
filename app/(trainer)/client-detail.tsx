import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image, TextInput, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getColors, Shadows } from '@/constants/colors';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { useUser } from '@clerk/clerk-expo';

export default function ClientDetailScreen() {
  const { clientId } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useUser();
  const scheme = useColorScheme();
  const colors = getColors(scheme === 'dark');
  const shadows = scheme === 'dark' ? Shadows.dark : Shadows.light;

  const [newQuestion, setNewQuestion] = useState('');
  const [addingQuestion, setAddingQuestion] = useState(false);
  const [showAddQuestion, setShowAddQuestion] = useState(false);

  // Fetch client data
  const client = useQuery(
    api.users.getUserByClerkId,
    clientId ? { clerkId: clientId as string } : 'skip'
  );

  // Fetch client goals
  const goals = useQuery(
    api.goals.getActiveClientGoals,
    clientId ? { clientId: clientId as string } : 'skip'
  );

  // Fetch client bookings for stats
  const bookings = useQuery(
    api.bookings.getClientBookings,
    clientId ? { clientId: clientId as string } : 'skip'
  );

  // Fetch questions for this client
  const questions = useQuery(
    api.questions.getClientQuestions,
    user?.id && clientId ? { trainerId: user.id, clientId: clientId as string } : 'skip'
  );

  const createQuestion = useMutation(api.questions.createQuestion);
  const deleteQuestion = useMutation(api.questions.deleteQuestion);

  const daysConnected = client ? Math.floor((Date.now() - (client._creationTime || Date.now())) / (1000 * 60 * 60 * 24)) : 0;
  const sessionsCount = bookings?.filter((b: any) => b.status === 'completed' || b.status === 'confirmed').length || 0;

  const handleAddQuestion = async () => {
    if (!newQuestion.trim() || !user?.id || !clientId) return;

    setAddingQuestion(true);
    try {
      await createQuestion({
        trainerId: user.id,
        clientId: clientId as string,
        question: newQuestion.trim(),
      });
      setNewQuestion('');
      setShowAddQuestion(false);
    } catch (error) {
      console.error('Error adding question:', error);
      Alert.alert('Error', 'Failed to add question');
    } finally {
      setAddingQuestion(false);
    }
  };

  const handleDeleteQuestion = (questionId: any) => {
    Alert.alert(
      'Delete Question',
      'Are you sure you want to delete this question?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteQuestion({ questionId });
            } catch (error) {
              console.error('Error deleting question:', error);
            }
          },
        },
      ]
    );
  };

  if (!client) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="px-4 pt-16 pb-4 flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-12 h-12 items-center justify-center"
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text className="text-lg font-semibold flex-1 text-center" style={{ color: colors.text }}>
            Client Profile
          </Text>
          <TouchableOpacity className="w-12 h-12 items-center justify-center">
            <Ionicons name="share-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Profile Section */}
        <View className="items-center px-4 pt-0 pb-6">
          <View
            className="w-32 h-32 rounded-full items-center justify-center mb-4"
            style={{ backgroundColor: colors.primary, ...shadows.large }}
          >
            {client.profileImageId ? (
              <Image
                source={{ uri: client.profileImageId }}
                className="w-full h-full rounded-full"
              />
            ) : (
              <Text className="text-white text-5xl font-bold">
                {client.fullName?.[0] || 'C'}
              </Text>
            )}
          </View>

          <Text className="text-2xl font-bold mb-1" style={{ color: colors.text }}>
            {client.fullName}
          </Text>
          <Text className="text-base mb-4" style={{ color: colors.textSecondary }}>
            {client.email}
          </Text>

          {/* Action Buttons */}
          <View className="gap-3 w-full max-w-md">
            <TouchableOpacity
              className="rounded-full py-3 px-6"
              style={{ backgroundColor: colors.primary }}
              onPress={() => router.push(`/(trainer)/set-goal?clientId=${clientId}` as any)}
            >
              <Text className="text-center font-semibold text-white">
                Set Goal
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            className="rounded-full py-3 px-6 flex-row items-center justify-center gap-2"
            style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}
            onPress={() => router.push(`/(trainer)/create-payment-request?clientId=${clientId}` as any)}
          >
            <Ionicons name="card-outline" size={20} color={colors.primary} />
            <Text className="text-center font-semibold" style={{ color: colors.primary }}>
              Request Payment
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View className="flex-row gap-3 px-4 py-3">
          <View
            className="flex-1 rounded-xl p-3 items-center"
            style={{ backgroundColor: colors.surface, ...shadows.small }}
          >
            <Text className="text-2xl font-bold mb-1" style={{ color: colors.text }}>
              {daysConnected}
            </Text>
            <View className="flex-row items-center gap-1">
              <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
              <Text className="text-sm" style={{ color: colors.textSecondary }}>
                Days Connected
              </Text>
            </View>
          </View>

          <View
            className="flex-1 rounded-xl p-3 items-center"
            style={{ backgroundColor: colors.surface, ...shadows.small }}
          >
            <Text className="text-2xl font-bold mb-1" style={{ color: colors.text }}>
              {sessionsCount}
            </Text>
            <View className="flex-row items-center gap-1">
              <Ionicons name="fitness" size={16} color={colors.textSecondary} />
              <Text className="text-sm" style={{ color: colors.textSecondary }}>
                Sessions
              </Text>
            </View>
          </View>
        </View>

        {/* About Section */}
        <View className="px-4 pt-5 pb-3">
          <Text className="text-xl font-semibold mb-2" style={{ color: colors.text }}>
            About
          </Text>
          <Text className="text-base leading-relaxed" style={{ color: colors.textSecondary }}>
            {client.bio || "No bio information provided by the client."}
          </Text>
        </View>

        {/* Questions Section */}
        <View className="px-4 pt-5 pb-3">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-xl font-semibold" style={{ color: colors.text }}>
              Questions for Client
            </Text>
            <TouchableOpacity onPress={() => setShowAddQuestion(!showAddQuestion)}>
              <View className="flex-row items-center">
                <Ionicons name={showAddQuestion ? "close" : "add-circle"} size={20} color={colors.primary} />
                <Text className="text-sm font-semibold ml-1" style={{ color: colors.primary }}>
                  {showAddQuestion ? 'Cancel' : 'Add'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Add Question Form */}
          {showAddQuestion && (
            <View
              className="rounded-xl p-4 mb-3"
              style={{ backgroundColor: colors.surface, ...shadows.medium }}
            >
              <Text className="text-sm font-semibold mb-2" style={{ color: colors.text }}>
                Ask a question
              </Text>
              <TextInput
                value={newQuestion}
                onChangeText={setNewQuestion}
                placeholder="e.g., What are your fitness goals?"
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={3}
                className="px-4 py-3 mb-3"
                style={{
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                  textAlignVertical: 'top',
                  minHeight: 80,
                }}
              />
              <TouchableOpacity
                onPress={handleAddQuestion}
                disabled={addingQuestion || !newQuestion.trim()}
                className="rounded-xl py-3 items-center"
                style={{
                  backgroundColor: newQuestion.trim() && !addingQuestion ? colors.primary : colors.border,
                }}
              >
                {addingQuestion ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text className="text-white font-semibold">Send Question</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Questions List */}
          {!questions ? (
            <ActivityIndicator color={colors.primary} />
          ) : questions.length === 0 ? (
            <View
              className="rounded-xl p-4"
              style={{ backgroundColor: colors.surface, ...shadows.medium }}
            >
              <View className="items-center py-6">
                <Ionicons name="help-circle-outline" size={48} color={colors.textTertiary} />
                <Text className="mt-3 font-semibold" style={{ color: colors.textSecondary }}>
                  No questions yet
                </Text>
                <Text className="mt-1 text-sm text-center" style={{ color: colors.textTertiary }}>
                  Ask questions to learn more about your client
                </Text>
              </View>
            </View>
          ) : (
            questions.map((q: any) => (
              <View
                key={q._id}
                className="rounded-xl p-4 mb-3"
                style={{ backgroundColor: colors.surface, ...shadows.small }}
              >
                <View className="flex-row items-start justify-between mb-2">
                  <View className="flex-1 mr-2">
                    <Text className="text-base font-semibold" style={{ color: colors.text }}>
                      {q.question}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => handleDeleteQuestion(q._id)}>
                    <Ionicons name="trash-outline" size={18} color={colors.textTertiary} />
                  </TouchableOpacity>
                </View>

                {q.answer ? (
                  <View
                    className="rounded-lg p-3 mt-2"
                    style={{ backgroundColor: `${colors.success}10` }}
                  >
                    <View className="flex-row items-center mb-1">
                      <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                      <Text className="text-xs font-semibold ml-1" style={{ color: colors.success }}>
                        Answered
                      </Text>
                    </View>
                    <Text className="text-sm" style={{ color: colors.text }}>
                      {q.answer}
                    </Text>
                    {q.answeredAt && (
                      <Text className="text-xs mt-2" style={{ color: colors.textTertiary }}>
                        {new Date(q.answeredAt).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                ) : (
                  <View
                    className="rounded-lg p-3 mt-2"
                    style={{ backgroundColor: `${colors.warning}10` }}
                  >
                    <View className="flex-row items-center">
                      <Ionicons name="time-outline" size={14} color={colors.warning} />
                      <Text className="text-xs font-semibold ml-1" style={{ color: colors.warning }}>
                        Waiting for answer
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            ))
          )}
        </View>

        {/* Goals Section */}
        <View className="px-4 pt-5 pb-3">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-xl font-semibold" style={{ color: colors.text }}>
              Current Goals
            </Text>
            <TouchableOpacity onPress={() => router.push(`/(trainer)/set-goal?clientId=${clientId}` as any)}>
              <Text className="text-sm font-semibold" style={{ color: colors.primary }}>
                Add Goal
              </Text>
            </TouchableOpacity>
          </View>

          {!goals ? (
            <ActivityIndicator color={colors.primary} />
          ) : goals.length === 0 ? (
            <View
              className="rounded-xl p-4"
              style={{ backgroundColor: colors.surface, ...shadows.medium }}
            >
              <View className="items-center py-6">
                <Ionicons name="flag-outline" size={48} color={colors.textTertiary} />
                <Text className="mt-3 font-semibold" style={{ color: colors.textSecondary }}>
                  No goals set yet
                </Text>
                <Text className="mt-1 text-sm text-center" style={{ color: colors.textTertiary }}>
                  Set a goal to help track progress
                </Text>
              </View>
            </View>
          ) : (
            goals.map((goal: any) => (
              <View
                key={goal._id}
                className="rounded-xl p-4 mb-3"
                style={{ backgroundColor: colors.surface, ...shadows.medium }}
              >
                {/* Goal Description */}
                <View className="flex-row items-start justify-between mb-3">
                  <View className="flex-1">
                    <Text className="text-base font-bold mb-1" style={{ color: colors.text }}>
                      {goal.description}
                    </Text>
                    {goal.deadline && (
                      <View className="flex-row items-center mb-2">
                        <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                        <Text className="ml-1 text-xs" style={{ color: colors.textSecondary }}>
                          Deadline: {new Date(goal.deadline).toLocaleDateString()}
                        </Text>
                      </View>
                    )}
                    <View className="flex-row items-center gap-3 mt-2">
                      <TouchableOpacity
                        className="flex-row items-center gap-1"
                        onPress={() => router.push(`/(trainer)/progress-tracking?goalId=${goal._id}&clientId=${clientId}` as any)}
                      >
                        <Ionicons name="analytics" size={14} color={colors.primary} />
                        <Text className="text-xs font-semibold" style={{ color: colors.primary }}>
                          View Progress
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        className="flex-row items-center gap-1"
                        onPress={() => router.push(`/(trainer)/edit-goal?goalId=${goal._id}&clientId=${clientId}` as any)}
                      >
                        <Ionicons name="create-outline" size={14} color={colors.textSecondary} />
                        <Text className="text-xs font-semibold" style={{ color: colors.textSecondary }}>
                          Edit Goal
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View
                    className="px-3 py-1 rounded-full"
                    style={{ backgroundColor: `${colors.primary}20` }}
                  >
                    <Text className="text-xs font-semibold" style={{ color: colors.primary }}>
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
                    <Text className="text-sm font-semibold mb-2" style={{ color: colors.text }}>
                      Weight Goal
                    </Text>
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1">
                        <Text className="text-xs mb-1" style={{ color: colors.textSecondary }}>
                          Current
                        </Text>
                        <Text className="text-lg font-bold" style={{ color: colors.text }}>
                          {goal.currentWeight} {goal.weightUnit}
                        </Text>
                      </View>
                      <Ionicons name="arrow-forward" size={20} color={colors.textSecondary} />
                      <View className="flex-1 items-end">
                        <Text className="text-xs mb-1" style={{ color: colors.textSecondary }}>
                          Target
                        </Text>
                        <Text className="text-lg font-bold" style={{ color: colors.primary }}>
                          {goal.targetWeight} {goal.weightUnit}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Body Measurements */}
                {goal.measurements && goal.measurements.length > 0 && (
                  <View
                    className="rounded-lg p-3"
                    style={{ backgroundColor: colors.background }}
                  >
                    <Text className="text-sm font-semibold mb-2" style={{ color: colors.text }}>
                      Body Measurements
                    </Text>
                    {goal.measurements.map((measurement: any, index: number) => (
                      <View key={index} className="mb-2">
                        <Text className="text-xs mb-1" style={{ color: colors.textSecondary }}>
                          {measurement.bodyPart}
                        </Text>
                        <View className="flex-row items-center justify-between">
                          <Text className="text-sm" style={{ color: colors.text }}>
                            {measurement.current} {measurement.unit}
                          </Text>
                          <Ionicons name="arrow-forward" size={16} color={colors.textSecondary} />
                          <Text className="text-sm font-semibold" style={{ color: colors.primary }}>
                            {measurement.target} {measurement.unit}
                          </Text>
                        </View>
                        {index < goal.measurements.length - 1 && (
                          <View className="h-px mt-2" style={{ backgroundColor: colors.border }} />
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))
          )}
        </View>

        {/* Session History */}
        <View className="px-4 pt-5 pb-24">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-xl font-semibold" style={{ color: colors.text }}>
              Recent Sessions
            </Text>
            <TouchableOpacity>
              <Text className="text-sm font-semibold" style={{ color: colors.primary }}>
                View All
              </Text>
            </TouchableOpacity>
          </View>

          <View
            className="rounded-xl p-4"
            style={{ backgroundColor: colors.surface, ...shadows.medium }}
          >
            <View className="items-center py-6">
              <Ionicons name="calendar-outline" size={48} color={colors.textTertiary} />
              <Text className="mt-3 font-semibold" style={{ color: colors.textSecondary }}>
                No sessions yet
              </Text>
              <Text className="mt-1 text-sm text-center" style={{ color: colors.textTertiary }}>
                Session history will appear here
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
