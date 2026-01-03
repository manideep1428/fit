import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getColors, Shadows } from "@/constants/colors";
import { StatusBar } from "expo-status-bar";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-expo";
import { showToast } from "@/utils/toast";
import { Id } from "@/convex/_generated/dataModel";

export default function QuestionFormScreen() {
  const { clientId, questionId, mode } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useUser();
  const scheme = useColorScheme();
  const colors = getColors(scheme === "dark");
  const shadows = scheme === "dark" ? Shadows.dark : Shadows.light;

  const isEditMode = mode === "edit" && questionId;
  const isViewMode = mode === "view" && questionId;

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [saving, setSaving] = useState(false);

  // Fetch existing question if editing or viewing
  const existingQuestion = useQuery(
    api.questions.getQuestionById,
    questionId ? { questionId: questionId as Id<"clientQuestions"> } : "skip"
  );

  // Fetch client data
  const client = useQuery(
    api.users.getUserByClerkId,
    clientId ? { clerkId: clientId as string } : "skip"
  );

  const createQuestionWithAnswer = useMutation(
    api.questions.createQuestionWithAnswer
  );
  const updateQuestionWithAnswer = useMutation(
    api.questions.updateQuestionWithAnswer
  );

  // Populate form when editing
  useEffect(() => {
    if (existingQuestion) {
      setQuestion(existingQuestion.question);
      setAnswer(existingQuestion.answer || "");
    }
  }, [existingQuestion]);

  const handleSave = async () => {
    if (!question.trim()) {
      showToast.error("Enter a question");
      return;
    }
    if (!user?.id || !clientId) return;

    setSaving(true);
    try {
      if (isEditMode && questionId) {
        await updateQuestionWithAnswer({
          questionId: questionId as Id<"clientQuestions">,
          question: question.trim(),
          answer: answer.trim(),
        });
        showToast.success("Updated");
      } else {
        await createQuestionWithAnswer({
          trainerId: user.id,
          clientId: clientId as string,
          question: question.trim(),
          answer: answer.trim(),
        });
        showToast.success("Saved");
      }
      router.back();
    } catch (error) {
      console.error("Error saving question:", error instanceof Error ? error.message : 'Unknown error');
      showToast.error("Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndAddAnother = async () => {
    if (!question.trim()) {
      showToast.error("Enter a question");
      return;
    }
    if (!user?.id || !clientId) return;

    setSaving(true);
    try {
      await createQuestionWithAnswer({
        trainerId: user.id,
        clientId: clientId as string,
        question: question.trim(),
        answer: answer.trim(),
      });
      showToast.success("Saved");
      setQuestion("");
      setAnswer("");
    } catch (error) {
      console.error("Error saving question:", error instanceof Error ? error.message : 'Unknown error');
      showToast.error("Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = () => {
    router.replace(
      `/(trainer)/question-form?clientId=${clientId}&questionId=${questionId}&mode=edit` as any
    );
  };

  if (questionId && existingQuestion === undefined) {
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
              {isViewMode
                ? "Question Details"
                : isEditMode
                  ? "Edit Question"
                  : "Add Question"}
            </Text>
            {client && (
              <Text
                className="text-sm text-center"
                style={{ color: colors.textSecondary }}
              >
                for {client.fullName}
              </Text>
            )}
          </View>

          {/* Save / Edit Button */}
          {isViewMode ? (
            <TouchableOpacity
              onPress={handleEdit}
              className="px-4 py-2 rounded-full flex-row items-center gap-1"
              style={{ backgroundColor: colors.primary }}
            >
              <Ionicons name="create" size={18} color="#FFF" />
              <Text className="text-white font-semibold">Edit</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleSave}
              disabled={saving || !question.trim()}
              className="px-4 py-2 rounded-full flex-row items-center gap-1"
              style={{
                backgroundColor:
                  saving || !question.trim() ? colors.border : colors.primary,
              }}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={18} color="#FFF" />
                  <Text className="text-white font-semibold">Save</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Add Another button - only visible in create mode */}
        {!isEditMode && !isViewMode && (
          <TouchableOpacity
            onPress={handleSaveAndAddAnother}
            disabled={saving || !question.trim()}
            className="mt-3 py-2 rounded-xl flex-row items-center justify-center gap-2"
            style={{
              backgroundColor: colors.surfaceSecondary,
              borderWidth: 1,
              borderColor:
                saving || !question.trim() ? colors.border : colors.primary,
            }}
          >
            <Ionicons
              name="add-circle-outline"
              size={18}
              color={
                saving || !question.trim()
                  ? colors.textTertiary
                  : colors.primary
              }
            />
            <Text
              className="font-semibold"
              style={{
                color:
                  saving || !question.trim()
                    ? colors.textTertiary
                    : colors.primary,
              }}
            >
              Save & Add Another
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        style={{ flex: 1 }}
      >
        <View className="flex-1 px-4 py-4">
          {/* Question Section - Compact */}
          <View
            className="rounded-2xl p-4 mb-4"
            style={{ backgroundColor: colors.surface, ...shadows.medium }}
          >
            <View className="flex-row items-center mb-3">
              <View
                className="w-8 h-8 rounded-full items-center justify-center mr-2"
                style={{ backgroundColor: `${colors.primary}15` }}
              >
                <Ionicons name="help-circle" size={18} color={colors.primary} />
              </View>
              <Text
                className="text-base font-bold"
                style={{ color: colors.text }}
              >
                Question
              </Text>
            </View>

            {isViewMode ? (
              <View>
                <Text
                  className="text-base leading-6"
                  style={{ color: colors.text }}
                >
                  {existingQuestion?.question}
                </Text>
                {existingQuestion?.createdAt && (
                  <View
                    className="flex-row items-center mt-3 pt-3 border-t"
                    style={{ borderTopColor: colors.border }}
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={14}
                      color={colors.textTertiary}
                    />
                    <Text
                      className="text-xs ml-1"
                      style={{ color: colors.textTertiary }}
                    >
                      Asked on{" "}
                      {new Date(existingQuestion.createdAt).toLocaleDateString(
                        undefined,
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <TextInput
                value={question}
                onChangeText={setQuestion}
                placeholder="Enter the question..."
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={2}
                className="px-3 py-2"
                style={{
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: colors.border,
                  textAlignVertical: "top",
                  minHeight: 50,
                  fontSize: 15,
                }}
              />
            )}
          </View>

          {/* Answer Section - Takes remaining space */}
          <View
            className="flex-1 rounded-2xl p-4"
            style={{ backgroundColor: colors.surface, ...shadows.medium }}
          >
            <View className="flex-row items-center mb-3">
              <View
                className="w-8 h-8 rounded-full items-center justify-center mr-2"
                style={{ backgroundColor: `${colors.success}15` }}
              >
                <Ionicons name="chatbubble" size={16} color={colors.success} />
              </View>
              <Text
                className="text-base font-bold"
                style={{ color: colors.text }}
              >
                Answer / Notes
              </Text>
            </View>

            {isViewMode ? (
              <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {existingQuestion?.answer ? (
                  <View>
                    <Text
                      className="text-base leading-7"
                      style={{ color: colors.text }}
                    >
                      {existingQuestion.answer}
                    </Text>
                    {existingQuestion?.answeredAt && (
                      <View
                        className="flex-row items-center mt-4 pt-4 border-t"
                        style={{ borderTopColor: colors.border }}
                      >
                        <Ionicons
                          name="time-outline"
                          size={14}
                          color={colors.textTertiary}
                        />
                        <Text
                          className="text-xs ml-1"
                          style={{ color: colors.textTertiary }}
                        >
                          Last updated:{" "}
                          {new Date(
                            existingQuestion.answeredAt
                          ).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Text>
                      </View>
                    )}
                  </View>
                ) : (
                  <View className="items-center py-6">
                    <View
                      className="w-16 h-16 rounded-full items-center justify-center mb-3"
                      style={{ backgroundColor: `${colors.warning}15` }}
                    >
                      <Ionicons
                        name="create-outline"
                        size={28}
                        color={colors.warning}
                      />
                    </View>
                    <Text
                      className="text-base font-semibold mb-1"
                      style={{ color: colors.text }}
                    >
                      No answer yet
                    </Text>
                    <Text
                      className="text-sm text-center"
                      style={{ color: colors.textTertiary }}
                    >
                      Tap Edit to add the answer or notes
                    </Text>
                  </View>
                )}
              </ScrollView>
            ) : (
              <TextInput
                value={answer}
                onChangeText={setAnswer}
                placeholder="Write the client's answer or discussion notes..."
                placeholderTextColor={colors.textTertiary}
                multiline
                className="flex-1 px-4 py-3"
                style={{
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                  textAlignVertical: "top",
                  fontSize: 16,
                }}
              />
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
