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
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useQuery, useMutation } from "convex/react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "@/convex/_generated/api";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getColors, Shadows } from "@/constants/colors";
import { AnimatedCard } from "@/components/AnimatedCard";
import NotificationHistory from "@/components/NotificationHistory";
import { showToast } from "@/utils/toast";

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

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />

      <View className="px-5 pb-6" style={{ paddingTop: insets.top + 12 }}>
        {/* Header */}
        <View className="flex-row justify-between items-center mb-6">
          <View>
            <Text
              className="text-xs font-medium"
              style={{ color: colors.textSecondary }}
            >
              Welcome back,
            </Text>
            <Text
              className="text-2xl mt-1 font-bold tracking-tight"
              style={{ color: colors.text }}
            >
              {user?.firstName || "Client"}
            </Text>
          </View>

          <View className="flex-row gap-3">
            <TouchableOpacity
              className="w-12 h-12 rounded-full items-center justify-center relative"
              style={{
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                ...shadows.small,
              }}
              onPress={() => setShowNotifications(true)}
            >
              <Ionicons
                name="notifications-outline"
                size={22}
                color={colors.text}
              />
              {unreadCount &&
                typeof unreadCount === "number" &&
                unreadCount > 0 && (
                  <View
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full items-center justify-center"
                    style={{ backgroundColor: colors.error }}
                  >
                    <Text className="text-white text-xs font-bold">
                      {unreadCount > 9 ? "9+" : unreadCount.toString()}
                    </Text>
                  </View>
                )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/(client)/profile" as any)}
              className="w-12 h-12 rounded-full overflow-hidden items-center justify-center"
              style={{ backgroundColor: colors.primary, ...shadows.medium }}
            >
              {user?.imageUrl ? (
                <Image
                  source={{ uri: user.imageUrl }}
                  className="w-full h-full"
                />
              ) : (
                <Text className="text-white font-bold text-lg">
                  {user?.firstName?.[0] || "C"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Fitness Stats Card */}
        {bookings && bookings.length > 0 && (
          <AnimatedCard
            delay={150}
            style={{ marginBottom: 24 }}
            elevation="large"
            borderRadius="xlarge"
            onPress={() => router.push("/(client)/session-history" as any)}
          >
            <View className="flex-row justify-between items-start">
              <View className="flex-1">
                <Text
                  className="text-sm font-semibold mb-1"
                  style={{ color: colors.textSecondary }}
                >
                  Your Progress
                </Text>
                <Text
                  className="text-xs mb-4"
                  style={{ color: colors.textTertiary }}
                >
                  Completed Sessions • Tap to view history
                </Text>
                <Text
                  className="font-bold"
                  style={{
                    fontSize: 36,
                    color: colors.text,
                    letterSpacing: -1,
                  }}
                >
                  {
                    bookings.filter(
                      (b: any) =>
                        b.status === "confirmed" &&
                        new Date(`${b.date}T${b.startTime}:00`) < new Date()
                    ).length
                  }
                </Text>
              </View>

              <View className="items-center">
                <View
                  className="rounded-2xl p-3 mb-4"
                  style={{ backgroundColor: `${colors.primary}15` }}
                >
                  <Ionicons
                    name="trending-up"
                    size={28}
                    color={colors.primary}
                  />
                </View>

                <View
                  className="px-5 py-2.5 rounded-full"
                  style={{ backgroundColor: colors.primary }}
                >
                  <Text className="text-white text-lg font-bold">
                    {bookings.length}
                  </Text>
                </View>

                <Text
                  className="mt-2 text-xs font-medium"
                  style={{ color: colors.textTertiary }}
                >
                  Total
                </Text>
              </View>
            </View>
          </AnimatedCard>
        )}

        {/* Manage Schedule Section */}
        <View className="mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-bold" style={{ color: colors.text }}>
              Schedule
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/(client)/bookings" as any)}
            >
              <Text
                className="text-sm font-semibold"
                style={{ color: colors.primary }}
              >
                Manage
              </Text>
            </TouchableOpacity>
          </View>

          {/* Upcoming Sessions */}
          {bookings &&
            (() => {
              const now = new Date();
              now.setMinutes(0, 0, 0);
              const upcomingSessions = bookings
                .filter((b: any) => {
                  const sessionDateTime = new Date(
                    `${b.date}T${b.startTime}:00`
                  );
                  return sessionDateTime >= now;
                })
                .sort((a: any, b: any) => {
                  const dateA = new Date(`${a.date}T${a.startTime}:00`);
                  const dateB = new Date(`${b.date}T${b.startTime}:00`);
                  return dateA.getTime() - dateB.getTime();
                })
                .slice(0, 2);

              const enrichedUpcoming = upcomingSessions.map((booking: any) => {
                const trainer = clientTrainers?.find(
                  (t: any) => t.clerkId === booking.trainerId
                );
                return {
                  ...booking,
                  trainerName: trainer?.fullName || "Trainer",
                };
              });

              return upcomingSessions.length === 0 ? (
                <AnimatedCard
                  delay={200}
                  style={{ alignItems: "center", paddingVertical: 32 }}
                  elevation="medium"
                  borderRadius="xlarge"
                  onPress={() => router.push("/(client)/bookings" as any)}
                >
                  <View
                    className="w-16 h-16 rounded-full items-center justify-center mb-3"
                    style={{ backgroundColor: `${colors.primary}10` }}
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={28}
                      color={colors.primary}
                    />
                  </View>
                  <Text
                    className="font-semibold text-base mb-1"
                    style={{ color: colors.text }}
                  >
                    No upcoming sessions
                  </Text>
                  <Text
                    className="text-sm text-center mb-4 px-6"
                    style={{ color: colors.textSecondary }}
                  >
                    Book a session with your trainer
                  </Text>
                  {clientTrainers && clientTrainers.length > 0 && (
                    <View
                      className="px-4 py-2 rounded-full"
                      style={{ backgroundColor: colors.primary }}
                    >
                      <Text className="text-white text-xs font-semibold">
                        Book Session
                      </Text>
                    </View>
                  )}
                </AnimatedCard>
              ) : (
                <View>
                  {enrichedUpcoming.map((session: any, index: number) => (
                    <AnimatedCard
                      key={session._id}
                      delay={200 + index * 100}
                      style={{ marginBottom: 12 }}
                      elevation="medium"
                      borderRadius="xlarge"
                      onPress={() => router.push("/(client)/bookings" as any)}
                    >
                      <View className="flex-row items-center">
                        <View
                          className="w-12 h-12 rounded-full items-center justify-center mr-3"
                          style={{ backgroundColor: colors.primary }}
                        >
                          <Text className="text-white text-lg font-bold">
                            {session.trainerName?.[0] || "T"}
                          </Text>
                        </View>

                        <View className="flex-1">
                          <Text
                            className="font-bold text-base"
                            style={{ color: colors.text }}
                          >
                            {session.trainerName}
                          </Text>
                          <View className="flex-row items-center mt-1">
                            <Ionicons
                              name="calendar-outline"
                              size={14}
                              color={colors.textSecondary}
                            />
                            <Text
                              className="text-sm ml-1.5"
                              style={{ color: colors.textSecondary }}
                            >
                              {new Date(session.date).toLocaleDateString(
                                "en-US",
                                {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric",
                                }
                              )}
                            </Text>
                            <Ionicons
                              name="time-outline"
                              size={14}
                              color={colors.textSecondary}
                              style={{ marginLeft: 12 }}
                            />
                            <Text
                              className="text-sm ml-1.5"
                              style={{ color: colors.textSecondary }}
                            >
                              {new Date(
                                `2000-01-01T${session.startTime}`
                              ).toLocaleTimeString("en-US", {
                                hour: "numeric",
                                minute: "2-digit",
                                hour12: true,
                              })}
                            </Text>
                          </View>
                        </View>

                        <View
                          className="px-3 py-1.5 rounded-lg"
                          style={{ backgroundColor: `${colors.success}15` }}
                        >
                          <Text
                            className="text-xs font-bold uppercase"
                            style={{ color: colors.success }}
                          >
                            {session.status}
                          </Text>
                        </View>
                      </View>
                    </AnimatedCard>
                  ))}

                  {upcomingSessions.length > 0 && (
                    <TouchableOpacity
                      className="items-center py-3"
                      onPress={() => router.push("/(client)/bookings" as any)}
                    >
                      <Text
                        className="text-sm font-semibold"
                        style={{ color: colors.primary }}
                      >
                        View all sessions (
                        {
                          bookings.filter((b: any) => {
                            const sessionDateTime = new Date(
                              `${b.date}T${b.startTime}:00`
                            );
                            return sessionDateTime >= now;
                          }).length
                        }
                        )
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })()}
        </View>

        {/* Trainer Questions Section */}
        {unansweredQuestions.length > 0 && (
          <View className="mb-6">
            <View className="flex-row justify-between items-center mb-4">
              <View className="flex-row items-center">
                <Text
                  className="text-lg font-bold"
                  style={{ color: colors.text }}
                >
                  Questions from Trainer
                </Text>
                <View
                  className="ml-2 px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: colors.error }}
                >
                  <Text className="text-white text-xs font-bold">
                    {unansweredQuestions.length}
                  </Text>
                </View>
              </View>
            </View>

            {unansweredQuestions
              .slice(0, 3)
              .map((question: any, index: number) => {
                const trainer = clientTrainers?.find(
                  (t: any) => t.clerkId === question.trainerId
                );

                return (
                  <AnimatedCard
                    key={question._id}
                    delay={250 + index * 80}
                    style={{ marginBottom: 12 }}
                    elevation="medium"
                    borderRadius="xlarge"
                    onPress={() => {
                      setAnsweringQuestion(question._id);
                      setAnswerText("");
                    }}
                  >
                    <View className="flex-row items-start">
                      <View
                        className="w-10 h-10 rounded-full items-center justify-center mr-3"
                        style={{ backgroundColor: `${colors.primary}15` }}
                      >
                        <Ionicons
                          name="help-circle"
                          size={20}
                          color={colors.primary}
                        />
                      </View>
                      <View className="flex-1">
                        <Text
                          className="text-xs font-medium mb-1"
                          style={{ color: colors.textSecondary }}
                        >
                          From {trainer?.fullName || "Your Trainer"}
                        </Text>
                        <Text
                          className="text-base font-semibold"
                          style={{ color: colors.text }}
                        >
                          {question.question}
                        </Text>
                        <View className="flex-row items-center mt-2">
                          <Ionicons
                            name="create-outline"
                            size={14}
                            color={colors.primary}
                          />
                          <Text
                            className="text-xs font-semibold ml-1"
                            style={{ color: colors.primary }}
                          >
                            Tap to answer
                          </Text>
                        </View>
                      </View>
                    </View>
                  </AnimatedCard>
                );
              })}
          </View>
        )}

        {/* My Goals */}
        {goals && goals.length > 0 && (
          <View className="mb-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text
                className="text-lg font-bold"
                style={{ color: colors.text }}
              >
                My Goals
              </Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-4">
                {goals.map((goal: any, index: number) => (
                  <AnimatedCard
                    key={goal._id}
                    delay={300 + index * 80}
                    style={{ width: 240 }}
                    elevation="medium"
                    borderRadius="xlarge"
                    onPress={() =>
                      router.push(
                        `/(client)/progress-tracking?goalId=${goal._id}` as any
                      )
                    }
                  >
                    <View className="flex-row items-start justify-between mb-3">
                      <View className="flex-1 mr-3">
                        <Text
                          className="font-bold text-base mb-1"
                          style={{ color: colors.text }}
                          numberOfLines={2}
                        >
                          {goal.description}
                        </Text>
                        {goal.deadline && (
                          <Text
                            className="text-xs"
                            style={{ color: colors.textSecondary }}
                          >
                            Due: {new Date(goal.deadline).toLocaleDateString()}
                          </Text>
                        )}
                      </View>
                      <View
                        className="p-2 rounded-xl"
                        style={{ backgroundColor: `${colors.primary}15` }}
                      >
                        <Ionicons
                          name="analytics"
                          size={18}
                          color={colors.primary}
                        />
                      </View>
                    </View>

                    {goal.currentWeight && goal.targetWeight && (
                      <View>
                        <View className="flex-row items-center justify-between mb-2">
                          <Text
                            className="text-sm"
                            style={{ color: colors.textSecondary }}
                          >
                            {goal.currentWeight} {goal.weightUnit}
                          </Text>
                          <Ionicons
                            name="arrow-forward"
                            size={12}
                            color={colors.textTertiary}
                          />
                          <Text
                            className="text-sm font-semibold"
                            style={{ color: colors.primary }}
                          >
                            {goal.targetWeight} {goal.weightUnit}
                          </Text>
                        </View>
                        <View
                          className="h-1.5 rounded-full overflow-hidden"
                          style={{ backgroundColor: `${colors.primary}20` }}
                        >
                          <View
                            className="h-full rounded-full"
                            style={{
                              backgroundColor: colors.primary,
                              width: "60%",
                            }}
                          />
                        </View>
                      </View>
                    )}
                  </AnimatedCard>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* My Trainers */}
        <View>
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-bold" style={{ color: colors.text }}>
              My Trainers
            </Text>
            {clientTrainers && clientTrainers.length > 0 && (
              <TouchableOpacity
                onPress={() => router.push("/(client)/bookings" as any)}
              >
                <Text
                  className="text-sm font-semibold"
                  style={{ color: colors.primary }}
                >
                  See all
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {!clientTrainers ? (
            <View className="items-center py-8">
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : clientTrainers.length === 0 ? (
            <AnimatedCard
              delay={400}
              style={{ alignItems: "center", paddingVertical: 40 }}
              elevation="medium"
              borderRadius="xlarge"
            >
              <View
                className="w-20 h-20 rounded-full items-center justify-center mb-4"
                style={{ backgroundColor: `${colors.primary}10` }}
              >
                <Ionicons
                  name="person-outline"
                  size={36}
                  color={colors.primary}
                />
              </View>
              <Text
                className="font-semibold text-base mb-2"
                style={{ color: colors.text }}
              >
                No trainers yet
              </Text>
              <Text
                className="text-sm text-center px-6"
                style={{ color: colors.textSecondary }}
              >
                Your trainer will add you to their client list. Contact your
                trainer to get started.
              </Text>
            </AnimatedCard>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-4 mb-6">
                {clientTrainers.map((trainer: any, index: number) => (
                  <AnimatedCard
                    key={trainer._id}
                    delay={450 + index * 80}
                    style={{
                      width: 150,
                      alignItems: "center",
                      paddingVertical: 24,
                    }}
                    elevation="medium"
                    borderRadius="xlarge"
                    onPress={() =>
                      router.push({
                        pathname: "/(client)/book-trainer",
                        params: {
                          trainerId: trainer.clerkId,
                          trainerName: trainer.fullName,
                          trainerSpecialty:
                            trainer.specialty || "Personal Trainer",
                        },
                      } as any)
                    }
                  >
                    <View
                      className="w-20 h-20 rounded-full mb-3 overflow-hidden items-center justify-center"
                      style={{ backgroundColor: colors.primary }}
                    >
                      {trainer.profileImageId ? (
                        <Image
                          source={{ uri: trainer.profileImageId }}
                          className="w-full h-full"
                        />
                      ) : (
                        <Text className="text-white text-3xl font-bold">
                          {trainer.fullName?.[0] || "T"}
                        </Text>
                      )}
                    </View>
                    <Text
                      className="font-bold text-sm mb-0.5 text-center"
                      style={{ color: colors.text }}
                    >
                      {trainer.fullName || "Trainer"}
                    </Text>
                    <Text
                      className="text-xs mb-3 text-center"
                      style={{ color: colors.textSecondary }}
                    >
                      {trainer.specialty || "Personal Trainer"}
                    </Text>
                    <View className="flex-row gap-2">
                      <View
                        className="px-4 py-2 rounded-full"
                        style={{ backgroundColor: colors.primary }}
                      >
                        <Text className="text-white text-xs font-semibold">
                          Book
                        </Text>
                      </View>
                    </View>
                  </AnimatedCard>
                ))}
              </View>
            </ScrollView>
          )}
        </View>
      </View>

      {/* Notification History Modal */}
      {showNotifications && (
        <NotificationHistory
          visible={showNotifications}
          onClose={() => setShowNotifications(false)}
        />
      )}

      {/* Answer Question Modal */}
      <Modal
        visible={!!answeringQuestion}
        transparent
        animationType="slide"
        onRequestClose={() => setAnsweringQuestion(null)}
      >
        <View
          className="flex-1 justify-end"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <View
            className="rounded-t-3xl p-6"
            style={{ backgroundColor: colors.surface }}
          >
            <View className="flex-row justify-between items-center mb-4">
              <Text
                className="text-xl font-bold"
                style={{ color: colors.text }}
              >
                Answer Question
              </Text>
              <TouchableOpacity onPress={() => setAnsweringQuestion(null)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {answeringQuestion &&
              (() => {
                const question = questions?.find(
                  (q: any) => q._id === answeringQuestion
                );
                const trainer = clientTrainers?.find(
                  (t: any) => t.clerkId === question?.trainerId
                );

                return (
                  <>
                    <View
                      className="rounded-xl p-4 mb-4"
                      style={{ backgroundColor: `${colors.primary}10` }}
                    >
                      <Text
                        className="text-xs font-medium mb-1"
                        style={{ color: colors.textSecondary }}
                      >
                        {trainer?.fullName || "Your Trainer"} asks:
                      </Text>
                      <Text
                        className="text-base font-semibold"
                        style={{ color: colors.text }}
                      >
                        {question?.question}
                      </Text>
                    </View>

                    <Text
                      className="text-sm font-semibold mb-2"
                      style={{ color: colors.text }}
                    >
                      Your Answer
                    </Text>
                    <TextInput
                      value={answerText}
                      onChangeText={setAnswerText}
                      placeholder="Type your answer here..."
                      placeholderTextColor={colors.textTertiary}
                      multiline
                      numberOfLines={4}
                      className="px-4 py-3 mb-4"
                      style={{
                        backgroundColor: colors.background,
                        color: colors.text,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: colors.border,
                        textAlignVertical: "top",
                        minHeight: 120,
                      }}
                    />

                    <TouchableOpacity
                      onPress={() => handleAnswerQuestion(answeringQuestion)}
                      disabled={submittingAnswer || !answerText.trim()}
                      className="rounded-xl py-4 items-center"
                      style={{
                        backgroundColor:
                          answerText.trim() && !submittingAnswer
                            ? colors.primary
                            : colors.border,
                      }}
                    >
                      {submittingAnswer ? (
                        <ActivityIndicator color="#FFF" />
                      ) : (
                        <Text className="text-white font-semibold text-base">
                          Submit Answer
                        </Text>
                      )}
                    </TouchableOpacity>
                  </>
                );
              })()}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
