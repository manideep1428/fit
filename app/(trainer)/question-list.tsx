import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getColors, Shadows } from "@/constants/colors";
import { StatusBar } from "expo-status-bar";
import { useUser } from "@clerk/clerk-expo";
import { Alert } from "react-native";

export default function QuestionListScreen() {
  const { clientId } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useUser();
  const scheme = useColorScheme();
  const colors = getColors(scheme === "dark");
  const shadows = scheme === "dark" ? Shadows.dark : Shadows.light;

  // Fetch client data
  const client = useQuery(
    api.users.getUserByClerkId,
    clientId ? { clerkId: clientId as string } : "skip"
  );

  // Fetch questions for this client
  const questions = useQuery(
    api.questions.getClientQuestions,
    user?.id && clientId
      ? { trainerId: user.id, clientId: clientId as string }
      : "skip"
  );

  const deleteQuestion = useMutation(api.questions.deleteQuestion);

  const handleDeleteQuestion = (questionId: any) => {
    Alert.alert(
      "Delete Question",
      "Are you sure you want to delete this question and its answer?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteQuestion({ questionId });
            } catch (error) {
              console.error("Error deleting question:", error);
            }
          },
        },
      ]
    );
  };

  const truncateText = (text: string, maxLength: number) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + "...";
  };

  if (!client || questions === undefined) {
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
              Client Questions
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
              router.push(
                `/(trainer)/question-form?clientId=${clientId}` as any
              )
            }
            className="w-10 h-10 items-center justify-center rounded-full"
            style={{ backgroundColor: colors.primary }}
          >
            <Ionicons name="add" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-4 py-4"
        showsVerticalScrollIndicator={false}
      >
        {questions.length === 0 ? (
          <View
            className="rounded-2xl p-6 items-center mt-4"
            style={{ backgroundColor: colors.surface, ...shadows.medium }}
          >
            <View
              className="w-20 h-20 rounded-full items-center justify-center mb-4"
              style={{ backgroundColor: `${colors.primary}15` }}
            >
              <Ionicons
                name="chatbubbles-outline"
                size={40}
                color={colors.primary}
              />
            </View>
            <Text
              className="text-lg font-semibold mb-2"
              style={{ color: colors.text }}
            >
              No Questions Yet
            </Text>
            <Text
              className="text-sm text-center mb-4"
              style={{ color: colors.textSecondary }}
            >
              Record questions and answers from your offline meetings with{" "}
              {client.fullName}
            </Text>
            <TouchableOpacity
              onPress={() =>
                router.push(
                  `/(trainer)/question-form?clientId=${clientId}` as any
                )
              }
              className="px-6 py-3 rounded-full flex-row items-center gap-2"
              style={{ backgroundColor: colors.primary }}
            >
              <Ionicons name="add" size={20} color="#FFF" />
              <Text className="text-white font-semibold">
                Add First Question
              </Text>
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
                    {questions.length}
                  </Text>
                  <Text
                    className="text-xs"
                    style={{ color: colors.textSecondary }}
                  >
                    Total Questions
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
                    {questions.filter((q: any) => q.answer).length}
                  </Text>
                  <Text
                    className="text-xs"
                    style={{ color: colors.textSecondary }}
                  >
                    With Answers
                  </Text>
                </View>
                <View
                  className="w-px h-10"
                  style={{ backgroundColor: colors.border }}
                />
                <View className="items-center">
                  <Text
                    className="text-2xl font-bold"
                    style={{ color: colors.warning }}
                  >
                    {questions.filter((q: any) => !q.answer).length}
                  </Text>
                  <Text
                    className="text-xs"
                    style={{ color: colors.textSecondary }}
                  >
                    Pending
                  </Text>
                </View>
              </View>
            </View>

            {/* Questions List */}
            {questions.map((q: any, index: number) => (
              <TouchableOpacity
                key={q._id}
                onPress={() =>
                  router.push(
                    `/(trainer)/question-form?clientId=${clientId}&questionId=${q._id}&mode=view` as any
                  )
                }
                className="rounded-2xl p-5 mb-3"
                style={{ backgroundColor: colors.surface, ...shadows.small }}
                activeOpacity={0.7}
              >
                <View className="flex-row items-start justify-between mb-3">
                  <View className="flex-row items-start flex-1 mr-3">
                    <View
                      className="w-10 h-10 rounded-full items-center justify-center mr-3"
                      style={{
                        backgroundColor: q.answer
                          ? `${colors.success}20`
                          : `${colors.warning}20`,
                      }}
                    >
                      <Ionicons
                        name={q.answer ? "checkmark-circle" : "time-outline"}
                        size={20}
                        color={q.answer ? colors.success : colors.warning}
                      />
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center mb-2">
                        <Text
                          className="text-xs font-bold mr-2"
                          style={{
                            color: q.answer ? colors.success : colors.warning,
                          }}
                        >
                          #{index + 1}
                        </Text>
                        {q.answer && (
                          <View
                            className="px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: `${colors.success}15` }}
                          >
                            <Text
                              className="text-xs font-semibold"
                              style={{ color: colors.success }}
                            >
                              Answered
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text
                        className="text-base font-bold mb-2"
                        style={{ color: colors.text }}
                        numberOfLines={2}
                      >
                        {q.question}
                      </Text>
                      {q.answer ? (
                        <Text
                          className="text-sm leading-5"
                          style={{ color: colors.textSecondary }}
                          numberOfLines={2}
                        >
                          {truncateText(q.answer, 100)}
                        </Text>
                      ) : (
                        <View className="flex-row items-center mt-1">
                          <Ionicons
                            name="create-outline"
                            size={14}
                            color={colors.warning}
                          />
                          <Text
                            className="text-xs ml-1 font-medium"
                            style={{ color: colors.warning }}
                          >
                            Tap to add answer
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <View className="flex-row items-center gap-2 ml-2">
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDeleteQuestion(q._id);
                      }}
                      className="w-9 h-9 items-center justify-center rounded-full"
                      style={{ backgroundColor: `${colors.error}15` }}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={16}
                        color={colors.error}
                      />
                    </TouchableOpacity>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={colors.textTertiary}
                    />
                  </View>
                </View>

                {/* Date Footer */}
                <View
                  className="pt-3 border-t flex-row items-center"
                  style={{ borderTopColor: colors.border }}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={12}
                    color={colors.textTertiary}
                  />
                  <Text
                    className="text-xs ml-1"
                    style={{ color: colors.textTertiary }}
                  >
                    {new Date(q.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* Bottom padding */}
        <View className="h-24" />
      </ScrollView>

      {/* Floating Add Button */}
      {questions && questions.length > 0 && (
        <TouchableOpacity
          onPress={() =>
            router.push(`/(trainer)/question-form?clientId=${clientId}` as any)
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
