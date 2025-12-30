import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  TextInput,
  Modal,
} from "react-native";
import { useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useQuery, useMutation } from "convex/react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "@/convex/_generated/api";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getColors, Shadows } from "@/constants/colors";
import NotificationHistory from "@/components/NotificationHistory";
import { PullToRefresh } from "@/components/PullToRefresh";
import { showToast } from "@/utils/toast";
import { LinearGradient } from "expo-linear-gradient";

export default function ClientHomeScreen() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [answeringQuestion, setAnsweringQuestion] = useState<string | null>(
    null
  );
  const [answerText, setAnswerText] = useState("");
  const [submittingAnswer, setSubmittingAnswer] = useState(false);

  const scheme = useColorScheme();
  const colors = getColors(scheme === "dark");
  const shadows = scheme === "dark" ? Shadows.dark : Shadows.light;
  const insets = useSafeAreaInsets();

  // Fetch client's trainers
  const clientTrainers = useQuery(
    api.users.getClientTrainers,
    user?.id ? { clientId: user.id } : "skip"
  );

  // Fetch bookings for stats
  const bookings = useQuery(
    api.bookings.getClientBookings,
    user?.id ? { clientId: user.id } : "skip"
  );

  // Fetch client goals
  const goals = useQuery(
    api.goals.getActiveClientGoals,
    user?.id ? { clientId: user.id } : "skip"
  );

  // Fetch unread notification count
  const unreadCount = useQuery(
    api.notifications.getUnreadCount,
    user?.id ? { userId: user.id } : "skip"
  );

  // Fetch questions for this client
  const questions = useQuery(
    api.questions.getQuestionsForClient,
    user?.id ? { clientId: user.id } : "skip"
  );

  const answerQuestion = useMutation(api.questions.answerQuestion);

  // Get unanswered questions
  const unansweredQuestions = questions?.filter((q: any) => !q.answer) || [];

  // Pull to refresh handler
  const handleRefresh = useCallback(async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, []);

  const handleAnswerQuestion = async (questionId: string) => {
    if (!answerText.trim()) return;

    setSubmittingAnswer(true);
    try {
      await answerQuestion({
        questionId: questionId as any,
        answer: answerText.trim(),
      });
      setAnsweringQuestion(null);
      setAnswerText("");
      showToast.success("Answer submitted!");
    } catch (error) {
      console.error("Error answering question:", error);
      showToast.error("Failed to submit answer");
    } finally {
      setSubmittingAnswer(false);
    }
  };

  useEffect(() => {
    if (isLoaded) {
      setLoading(false);
    }
  }, [isLoaded]);

  if (loading || !isLoaded) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: colors.background }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Calculate session stats
  const now = new Date();
  const completedSessions =
    bookings?.filter(
      (b: any) =>
        b.status === "completed" ||
        (b.status === "confirmed" &&
          new Date(`${b.date}T${b.startTime}:00`) < now)
    ).length || 0;

  const totalSessions = bookings?.length || 0;
  const progressPercentage =
    totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

  // Get next upcoming session
  const upcomingSessions =
    bookings
      ?.filter((b: any) => {
        const sessionDateTime = new Date(`${b.date}T${b.startTime}:00`);
        return sessionDateTime >= now;
      })
      .sort((a: any, b: any) => {
        const dateA = new Date(`${a.date}T${a.startTime}:00`);
        const dateB = new Date(`${b.date}T${b.startTime}:00`);
        return dateA.getTime() - dateB.getTime();
      }) || [];

  const nextSession = upcomingSessions[0];
  const nextSessionTrainer = nextSession
    ? clientTrainers?.find((t: any) => t.clerkId === nextSession.trainerId)
    : null;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />

      {/* Header */}
      <View
        className="px-4 py-3 flex-row items-center justify-between"
        style={{
          paddingTop: insets.top + 12,
          backgroundColor: `${colors.background}E6`,
        }}
      >
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            onPress={() => router.push("/(client)/profile" as any)}
            className="relative"
          >
            <View
              className="w-10 h-10 rounded-full overflow-hidden items-center justify-center"
              style={{
                backgroundColor: colors.primary,
                borderWidth: 2,
                borderColor: `${colors.primary}33`,
              }}
            >
              {user?.imageUrl ? (
                <Image
                  source={{ uri: user.imageUrl }}
                  className="w-full h-full"
                />
              ) : (
                <Text className="text-white font-bold text-base">
                  {user?.firstName?.[0] || "C"}
                </Text>
              )}
            </View>
          </TouchableOpacity>
          <View>
            <Text
              className="text-xs font-medium"
              style={{ color: colors.textSecondary }}
            >
              {getGreeting()},
            </Text>
            <Text
              className="text-base font-bold"
              style={{ color: colors.text }}
            >
              {user?.firstName || "Client"}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          className="relative w-10 h-10 rounded-full items-center justify-center"
          style={{ backgroundColor: colors.surface }}
          onPress={() => setShowNotifications(true)}
        >
          <Ionicons name="notifications" size={20} color={colors.text} />
          {unreadCount &&
            typeof unreadCount === "number" &&
            unreadCount > 0 && (
              <View
                className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full"
                style={{
                  backgroundColor: colors.error,
                  borderWidth: 2,
                  borderColor: colors.surface,
                }}
              />
            )}
        </TouchableOpacity>
      </View>

      <PullToRefresh
        onRefresh={handleRefresh}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View className="flex-col gap-6 p-4">
          {/* Progress Hero Card */}
          {totalSessions > 0 && (
            <TouchableOpacity
              onPress={() => router.push("/(client)/session-history" as any)}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={[colors.primary, `${colors.primary}CC`]}
                className="relative overflow-hidden rounded-2xl p-6"
                style={{ ...shadows.large }}
              >
                {/* Decorative Background */}
                <View
                  className="absolute -right-10 -top-10 w-40 h-40 rounded-full opacity-20"
                  style={{ backgroundColor: "#FFF" }}
                />

                <View className="relative z-10 flex-col gap-6">
                  <View className="flex-row items-start justify-between">
                    <View>
                      <Text className="text-lg font-bold text-white">
                        Your Progress
                      </Text>
                      <Text className="text-sm font-medium text-white opacity-80">
                        Keep up the momentum!
                      </Text>
                    </View>
                    <View
                      className="rounded-lg px-3 py-1"
                      style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
                    >
                      <Text className="text-xs font-bold text-white">
                        This Month
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-end gap-2">
                    <Text className="text-4xl font-extrabold text-white">
                      {completedSessions}
                    </Text>
                    <Text className="mb-1 text-lg font-medium text-white opacity-80">
                      / {totalSessions} Sessions
                    </Text>
                  </View>

                  <View className="w-full">
                    <View className="mb-2 flex-row justify-between">
                      <Text className="text-xs font-semibold text-white opacity-80">
                        {Math.round(progressPercentage)}% Completed
                      </Text>
                      <Text className="text-xs font-semibold text-white opacity-80">
                        {totalSessions - completedSessions} left
                      </Text>
                    </View>
                    <View
                      className="h-3 w-full overflow-hidden rounded-full"
                      style={{ backgroundColor: "rgba(0,0,0,0.2)" }}
                    >
                      <View
                        className="h-full rounded-full"
                        style={{
                          width: `${progressPercentage}%`,
                          backgroundColor: "#FFF",
                          shadowColor: "#FFF",
                          shadowOpacity: 0.5,
                          shadowRadius: 10,
                        }}
                      />
                    </View>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Schedule Section */}
          <View className="flex-col gap-3">
            <View className="flex-row items-center justify-between px-1">
              <Text
                className="text-xl font-bold"
                style={{ color: colors.text }}
              >
                Schedule
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/(client)/bookings" as any)}
              >
                <Text
                  className="text-sm font-medium"
                  style={{ color: colors.primary }}
                >
                  View All
                </Text>
              </TouchableOpacity>
            </View>

            {nextSession ? (
              <TouchableOpacity
                onPress={() => router.push("/(client)/bookings" as any)}
                className="relative flex-row items-center justify-between gap-4 overflow-hidden rounded-xl p-4"
                style={{
                  backgroundColor: colors.surface,
                  ...shadows.small,
                }}
                activeOpacity={0.7}
              >
                <View
                  className="absolute left-0 top-0 h-full w-1"
                  style={{ backgroundColor: colors.primary }}
                />
                <View className="flex-row items-center gap-4 flex-1">
                  <View
                    className="w-12 h-12 shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${colors.primary}15` }}
                  >
                    <Ionicons name="fitness" size={24} color={colors.primary} />
                  </View>
                  <View className="flex-1">
                    <Text
                      className="text-base font-bold"
                      style={{ color: colors.text }}
                    >
                      {nextSessionTrainer?.fullName || "Training Session"}
                    </Text>
                    <View className="flex-row items-center gap-1 mt-1">
                      <Ionicons
                        name="time"
                        size={14}
                        color={colors.textSecondary}
                      />
                      <Text
                        className="text-sm"
                        style={{ color: colors.textSecondary }}
                      >
                        {new Date(nextSession.date).toLocaleDateString(
                          "en-US",
                          {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          }
                        )}
                        ,{" "}
                        {new Date(
                          `2000-01-01T${nextSession.startTime}`
                        ).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </Text>
                    </View>
                  </View>
                </View>
                <View
                  className="w-8 h-8 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${colors.primary}10` }}
                >
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={colors.text}
                  />
                </View>
              </TouchableOpacity>
            ) : (
              <View
                className="rounded-xl p-6 items-center"
                style={{ backgroundColor: colors.surface, ...shadows.small }}
              >
                <View
                  className="w-12 h-12 rounded-full items-center justify-center mb-3"
                  style={{ backgroundColor: `${colors.primary}15` }}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={24}
                    color={colors.primary}
                  />
                </View>
                <Text
                  className="text-base font-semibold mb-1"
                  style={{ color: colors.text }}
                >
                  No upcoming sessions
                </Text>
                <Text
                  className="text-sm text-center mb-3"
                  style={{ color: colors.textSecondary }}
                >
                  Book a session with your trainer
                </Text>
                {clientTrainers && clientTrainers.length > 0 && (
                  <TouchableOpacity
                    onPress={() => router.push("/(client)/bookings" as any)}
                    className="px-4 py-2 rounded-lg"
                    style={{ backgroundColor: colors.primary }}
                  >
                    <Text className="text-white text-sm font-bold">
                      Book Session
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* Questions from Trainer */}
          {unansweredQuestions.length > 0 && (
            <View className="flex-col gap-3">
              <Text
                className="text-xl font-bold px-1"
                style={{ color: colors.text }}
              >
                Questions from Trainer
              </Text>
              {unansweredQuestions.slice(0, 1).map((question: any) => {
                const trainer = clientTrainers?.find(
                  (t: any) => t.clerkId === question.trainerId
                );

                return (
                  <View
                    key={question._id}
                    className="rounded-xl p-5"
                    style={{
                      backgroundColor: colors.surface,
                      borderWidth: 1,
                      borderColor: `${colors.primary}33`,
                    }}
                  >
                    <View className="flex-row gap-3">
                      <View
                        className="w-10 h-10 rounded-full shrink-0 items-center justify-center"
                        style={{ backgroundColor: colors.primary }}
                      >
                        <Text className="text-white text-base font-bold">
                          {trainer?.fullName?.[0] || "T"}
                        </Text>
                      </View>
                      <View className="flex-1 gap-2">
                        <View className="flex-row justify-between items-start">
                          <View>
                            <Text
                              className="text-sm font-bold"
                              style={{ color: colors.text }}
                            >
                              {trainer?.fullName || "Your Trainer"}
                            </Text>
                            <Text
                              className="text-xs"
                              style={{ color: colors.textSecondary }}
                            >
                              Weekly Check-in
                            </Text>
                          </View>
                          <View
                            className="px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: `${colors.primary}20` }}
                          >
                            <Text
                              className="text-[10px] font-bold"
                              style={{ color: colors.primary }}
                            >
                              New
                            </Text>
                          </View>
                        </View>
                        <Text
                          className="text-sm leading-relaxed"
                          style={{ color: colors.text }}
                        >
                          {question.question}
                        </Text>
                        <TouchableOpacity
                          onPress={() => {
                            setAnsweringQuestion(question._id);
                            setAnswerText("");
                          }}
                          className="mt-2 flex-row items-center justify-center gap-2 rounded-lg py-2.5"
                          style={{ backgroundColor: `${colors.primary}15` }}
                        >
                          <Ionicons
                            name="chatbox"
                            size={16}
                            color={colors.primary}
                          />
                          <Text
                            className="text-sm font-bold"
                            style={{ color: colors.primary }}
                          >
                            Reply
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* My Goals Carousel */}
          {goals && goals.length > 0 && (
            <View className="flex-col gap-3">
              <Text
                className="text-xl font-bold px-1"
                style={{ color: colors.text }}
              >
                My Goals
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="flex-row gap-3"
                contentContainerStyle={{ paddingRight: 16 }}
              >
                {goals.map((goal: any, index: number) => {
                  const progress =
                    goal.currentWeight && goal.targetWeight
                      ? Math.min(
                          ((goal.currentWeight - goal.targetWeight) /
                            (goal.currentWeight - goal.targetWeight)) *
                            100,
                          100
                        )
                      : 0;

                  const iconColors = [
                    colors.warning,
                    colors.primary,
                    colors.success,
                  ];
                  const iconColor = iconColors[index % iconColors.length];

                  return (
                    <TouchableOpacity
                      key={goal._id}
                      onPress={() =>
                        router.push(
                          `/(client)/progress-tracking?goalId=${goal._id}` as any
                        )
                      }
                      className="min-w-[160px] rounded-xl p-4 flex-col gap-3"
                      style={{
                        backgroundColor: colors.surface,
                        ...shadows.small,
                      }}
                    >
                      <View className="flex-row justify-between items-start">
                        <View
                          className="rounded-lg p-2"
                          style={{ backgroundColor: `${iconColor}20` }}
                        >
                          <Ionicons
                            name={
                              index === 0
                                ? "scale"
                                : index === 1
                                  ? "water"
                                  : "walk"
                            }
                            size={20}
                            color={iconColor}
                          />
                        </View>
                        <Text
                          className="text-xs font-bold"
                          style={{ color: colors.textSecondary }}
                        >
                          {Math.round(progress)}%
                        </Text>
                      </View>
                      <View>
                        <Text
                          className="text-sm font-bold"
                          style={{ color: colors.text }}
                          numberOfLines={1}
                        >
                          {goal.description}
                        </Text>
                        {goal.targetWeight && (
                          <Text
                            className="text-xs"
                            style={{ color: colors.textSecondary }}
                          >
                            Target: {goal.targetWeight}
                            {goal.weightUnit}
                          </Text>
                        )}
                      </View>
                      <View
                        className="h-1.5 w-full rounded-full"
                        style={{ backgroundColor: `${iconColor}20` }}
                      >
                        <View
                          className="h-full rounded-full"
                          style={{
                            width: `${progress}%`,
                            backgroundColor: iconColor,
                          }}
                        />
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* My Trainers Carousel */}
          <View className="flex-col gap-3">
            <Text
              className="text-xl font-bold px-1"
              style={{ color: colors.text }}
            >
              My Trainers
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="flex-row gap-3"
              contentContainerStyle={{ paddingRight: 16 }}
            >
              {clientTrainers && clientTrainers.length > 0 ? (
                clientTrainers.map((trainer: any) => (
                  <TouchableOpacity
                    key={trainer._id}
                    onPress={() =>
                      router.push({
                        pathname: "/(client)/trainer-details",
                        params: {
                          trainerId: trainer.clerkId,
                          trainerName: trainer.fullName,
                          trainerSpecialty:
                            trainer.specialty || "Personal Trainer",
                        },
                      } as any)
                    }
                    className="min-w-[140px] rounded-xl p-3 flex-col items-center gap-2"
                    style={{
                      backgroundColor: colors.surface,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <View
                      className="w-16 h-16 rounded-full overflow-hidden items-center justify-center"
                      style={{
                        backgroundColor: colors.primary,
                        borderWidth: 2,
                        borderColor: `${colors.primary}33`,
                      }}
                    >
                      {trainer.profileImageId ? (
                        <Image
                          source={{ uri: trainer.profileImageId }}
                          className="w-full h-full"
                        />
                      ) : (
                        <Text className="text-white text-2xl font-bold">
                          {trainer.fullName?.[0] || "T"}
                        </Text>
                      )}
                    </View>
                    <View className="items-center">
                      <Text
                        className="text-sm font-bold"
                        style={{ color: colors.text }}
                        numberOfLines={1}
                      >
                        {trainer.fullName}
                      </Text>
                      <Text
                        className="text-xs"
                        style={{ color: colors.textSecondary }}
                        numberOfLines={1}
                      >
                        {trainer.specialty || "Personal Trainer"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View
                  className="min-w-[140px] rounded-xl p-3 flex-col items-center justify-center gap-2 h-[132px]"
                  style={{
                    backgroundColor: `${colors.surface}80`,
                    borderWidth: 1,
                    borderStyle: "dashed",
                    borderColor: colors.border,
                  }}
                >
                  <View
                    className="w-10 h-10 items-center justify-center rounded-full"
                    style={{ backgroundColor: colors.surface }}
                  >
                    <Ionicons name="add" size={20} color={colors.text} />
                  </View>
                  <Text
                    className="text-xs font-medium"
                    style={{ color: colors.textSecondary }}
                  >
                    Find Trainer
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </PullToRefresh>

      {/* Notification History Modal */}
      <NotificationHistory
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
      />

      {/* Answer Question Modal */}
      <Modal
        visible={!!answeringQuestion}
        transparent
        animationType="slide"
        onRequestClose={() => setAnsweringQuestion(null)}
      >
        <View
          className="flex-1 justify-end"
          style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
        >
          <View
            className="rounded-t-3xl p-6"
            style={{
              backgroundColor: colors.surface,
              paddingBottom: insets.bottom + 24,
            }}
          >
            <View
              className="w-12 h-1 rounded-full self-center mb-6"
              style={{ backgroundColor: `${colors.text}20` }}
            />
            <View className="flex-row justify-between items-center mb-6">
              <Text
                className="text-lg font-bold"
                style={{ color: colors.text }}
              >
                Answer Question
              </Text>
              <TouchableOpacity
                onPress={() => setAnsweringQuestion(null)}
                className="w-8 h-8 rounded-full items-center justify-center"
                style={{ backgroundColor: `${colors.text}10` }}
              >
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            {answeringQuestion && (
              <View>
                <Text
                  className="text-sm mb-4"
                  style={{ color: colors.textSecondary }}
                >
                  {
                    unansweredQuestions.find(
                      (q: any) => q._id === answeringQuestion
                    )?.question
                  }
                </Text>

                <TextInput
                  value={answerText}
                  onChangeText={setAnswerText}
                  placeholder="Type your answer..."
                  placeholderTextColor={colors.textTertiary}
                  multiline
                  numberOfLines={4}
                  className="rounded-xl p-4 mb-4"
                  style={{
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderWidth: 1,
                    borderColor: colors.border,
                    minHeight: 100,
                    textAlignVertical: "top",
                  }}
                />

                <TouchableOpacity
                  onPress={() => handleAnswerQuestion(answeringQuestion)}
                  disabled={!answerText.trim() || submittingAnswer}
                  className="rounded-xl py-3 items-center justify-center"
                  style={{
                    backgroundColor: answerText.trim()
                      ? colors.primary
                      : colors.border,
                  }}
                >
                  {submittingAnswer ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text className="text-white font-bold">Submit Answer</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
