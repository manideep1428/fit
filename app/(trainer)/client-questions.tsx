import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-expo";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getColors, Shadows } from "@/constants/colors";
import { StatusBar } from "expo-status-bar";
import { showToast } from "@/utils/toast";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface QuestionAnswer {
  question: string;
  answer: string;
  fromFaq?: boolean;
}

const STORAGE_KEY = "pending_client_questions";

export default function ClientQuestionsScreen() {
  const { user } = useUser();
  const router = useRouter();
  const { clientEmail } = useLocalSearchParams();
  const scheme = useColorScheme();
  const colors = getColors(scheme === "dark");
  const shadows = scheme === "dark" ? Shadows.dark : Shadows.light;

  const [questions, setQuestions] = useState<QuestionAnswer[]>([]);
  const [showFaqPicker, setShowFaqPicker] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  // Get FAQ questions
  const faqs = useQuery(
    api.faqQuestions.getActiveFaqs,
    user?.id ? { trainerId: user.id } : "skip"
  );

  // Load saved questions on mount
  useEffect(() => {
    loadSavedQuestions();
  }, [clientEmail]);

  const loadSavedQuestions = async () => {
    try {
      const key = `${STORAGE_KEY}_${clientEmail || "new"}`;
      const saved = await AsyncStorage.getItem(key);
      if (saved) {
        setQuestions(JSON.parse(saved));
      }
    } catch (error) {
      console.error("Error loading questions:", error);
    }
  };

  const saveQuestions = async (updatedQuestions: QuestionAnswer[]) => {
    try {
      const key = `${STORAGE_KEY}_${clientEmail || "new"}`;
      await AsyncStorage.setItem(key, JSON.stringify(updatedQuestions));
    } catch (error) {
      console.error("Error saving questions:", error);
    }
  };

  const addFaqQuestion = (faqQuestion: string) => {
    if (questions.some((q) => q.question === faqQuestion)) {
      showToast.error("Question already added");
      return;
    }
    const updated = [...questions, { question: faqQuestion, answer: "", fromFaq: true }];
    setQuestions(updated);
    saveQuestions(updated);
    setShowFaqPicker(false);
    showToast.success("Question added");
  };

  const handleSaveQuestion = () => {
    if (!newQuestion.trim()) {
      showToast.error("Enter a question");
      return;
    }
    const updated = [...questions, { question: newQuestion.trim(), answer: newAnswer.trim() }];
    setQuestions(updated);
    saveQuestions(updated);
    setNewQuestion("");
    setNewAnswer("");
    setShowAddForm(false);
    showToast.success("Question saved");
  };

  const handleSaveAndAddAnother = () => {
    if (!newQuestion.trim()) {
      showToast.error("Enter a question");
      return;
    }
    const updated = [...questions, { question: newQuestion.trim(), answer: newAnswer.trim() }];
    setQuestions(updated);
    saveQuestions(updated);
    setNewQuestion("");
    setNewAnswer("");
    showToast.success("Question saved");
  };

  const updateAnswer = (index: number, answer: string) => {
    const updated = [...questions];
    updated[index].answer = answer;
    setQuestions(updated);
    saveQuestions(updated);
  };

  const removeQuestion = (index: number) => {
    const updated = questions.filter((_, i) => i !== index);
    setQuestions(updated);
    saveQuestions(updated);
    showToast.success("Question removed");
  };

  const handleDone = () => {
    router.back();
  };

  const availableFaqs = faqs?.filter(
    (faq: any) => !questions.some((q) => q.question === faq.question)
  );

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
              {questions.length} question{questions.length !== 1 ? "s" : ""} added
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleDone}
            className="px-4 py-2 rounded-full"
            style={{ backgroundColor: colors.primary }}
          >
            <Text className="text-white font-semibold">Done</Text>
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-4 py-4" showsVerticalScrollIndicator={false}>
          {/* Info Card */}
          <View
            className="p-4 rounded-xl mb-4"
            style={{ backgroundColor: `${colors.primary}15` }}
          >
            <View className="flex-row items-center mb-2">
              <Ionicons name="information-circle" size={20} color={colors.primary} />
              <Text className="text-sm font-semibold ml-2" style={{ color: colors.text }}>
                Onboarding Questions
              </Text>
            </View>
            <Text className="text-sm" style={{ color: colors.textSecondary }}>
              Add questions to gather information from your client. Questions are auto-saved and will be stored with the client profile when you add them.
            </Text>
          </View>

          {/* Add Question Form */}
          {showAddForm ? (
            <View
              className="rounded-xl p-4 mb-4"
              style={{ backgroundColor: colors.surface, ...shadows.medium }}
            >
              <Text className="text-sm font-semibold mb-3" style={{ color: colors.text }}>
                New Question
              </Text>
              <TextInput
                value={newQuestion}
                onChangeText={setNewQuestion}
                placeholder="Enter your question..."
                placeholderTextColor={colors.textTertiary}
                className="px-4 py-3 rounded-xl mb-3"
                style={{
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
                multiline
              />
              <Text className="text-sm font-semibold mb-2" style={{ color: colors.text }}>
                Answer (optional)
              </Text>
              <TextInput
                value={newAnswer}
                onChangeText={setNewAnswer}
                placeholder="Enter client's answer..."
                placeholderTextColor={colors.textTertiary}
                className="px-4 py-3 rounded-xl mb-4"
                style={{
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderWidth: 1,
                  borderColor: colors.border,
                  minHeight: 80,
                  textAlignVertical: "top",
                }}
                multiline
              />
              <View className="flex-row gap-2">
                <TouchableOpacity
                  onPress={() => {
                    setShowAddForm(false);
                    setNewQuestion("");
                    setNewAnswer("");
                  }}
                  className="flex-1 py-3 rounded-xl items-center"
                  style={{ backgroundColor: colors.surfaceSecondary }}
                >
                  <Text style={{ color: colors.text, fontWeight: "500" }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSaveAndAddAnother}
                  disabled={!newQuestion.trim()}
                  className="flex-1 py-3 rounded-xl items-center"
                  style={{
                    backgroundColor: newQuestion.trim() ? colors.surfaceSecondary : colors.border,
                    borderWidth: 1,
                    borderColor: newQuestion.trim() ? colors.primary : colors.border,
                  }}
                >
                  <Text style={{ color: newQuestion.trim() ? colors.primary : colors.textTertiary, fontWeight: "600" }}>
                    Save & Add More
                  </Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                onPress={handleSaveQuestion}
                disabled={!newQuestion.trim()}
                className="py-3 rounded-xl items-center mt-2"
                style={{
                  backgroundColor: newQuestion.trim() ? colors.primary : colors.border,
                }}
              >
                <Text style={{ color: "#FFF", fontWeight: "600" }}>Save Question</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="flex-row gap-2 mb-4">
              {/* Add Custom Question Button */}
              <TouchableOpacity
                onPress={() => setShowAddForm(true)}
                className="flex-1 flex-row items-center justify-center py-3 rounded-xl"
                style={{ backgroundColor: colors.primary }}
              >
                <Ionicons name="add-circle-outline" size={20} color="#FFF" />
                <Text className="text-white font-semibold ml-2">Add Question</Text>
              </TouchableOpacity>

              {/* FAQ Picker Button */}
              {faqs && faqs.length > 0 && availableFaqs && availableFaqs.length > 0 && (
                <TouchableOpacity
                  onPress={() => setShowFaqPicker(!showFaqPicker)}
                  className="flex-row items-center justify-center py-3 px-4 rounded-xl"
                  style={{
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.primary,
                  }}
                >
                  <Ionicons name="list" size={20} color={colors.primary} />
                  <Text className="font-semibold ml-2" style={{ color: colors.primary }}>
                    FAQs
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* FAQ Picker List */}
          {showFaqPicker && availableFaqs && availableFaqs.length > 0 && (
            <View
              className="rounded-xl p-3 mb-4"
              style={{ backgroundColor: colors.surface, ...shadows.small }}
            >
              <Text className="text-xs font-semibold mb-2 px-1" style={{ color: colors.textSecondary }}>
                SELECT FROM YOUR FAQS
              </Text>
              {availableFaqs.map((faq: any) => (
                <TouchableOpacity
                  key={faq._id}
                  onPress={() => addFaqQuestion(faq.question)}
                  className="flex-row items-center py-3 px-3 rounded-lg mb-1"
                  style={{ backgroundColor: colors.background }}
                >
                  <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                  <Text className="flex-1 ml-3 text-sm" style={{ color: colors.text }}>
                    {faq.question}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Questions List */}
          {questions.length > 0 ? (
            <View>
              <Text className="text-xs font-semibold mb-2" style={{ color: colors.textSecondary }}>
                ADDED QUESTIONS ({questions.length})
              </Text>
              {questions.map((q, index) => (
                <View
                  key={index}
                  className="rounded-xl p-4 mb-3"
                  style={{ backgroundColor: colors.surface, ...shadows.small }}
                >
                  <View className="flex-row items-start justify-between mb-3">
                    <View className="flex-row items-center flex-1">
                      <View
                        className="w-8 h-8 rounded-full items-center justify-center mr-3"
                        style={{ backgroundColor: `${colors.primary}15` }}
                      >
                        <Text className="text-sm font-bold" style={{ color: colors.primary }}>
                          {index + 1}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                          {q.question}
                        </Text>
                        {q.fromFaq && (
                          <View className="flex-row items-center mt-1">
                            <Ionicons name="bookmark" size={12} color={colors.textTertiary} />
                            <Text className="text-xs ml-1" style={{ color: colors.textTertiary }}>
                              From FAQ
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => removeQuestion(index)}
                      className="w-8 h-8 rounded-full items-center justify-center ml-2"
                      style={{ backgroundColor: `${colors.error}15` }}
                    >
                      <Ionicons name="close" size={16} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    value={q.answer}
                    onChangeText={(text) => updateAnswer(index, text)}
                    placeholder="Enter client's answer..."
                    placeholderTextColor={colors.textTertiary}
                    multiline
                    className="px-3 py-3 rounded-lg"
                    style={{
                      backgroundColor: colors.background,
                      color: colors.text,
                      borderWidth: 1,
                      borderColor: colors.border,
                      minHeight: 70,
                      textAlignVertical: "top",
                    }}
                  />
                </View>
              ))}
            </View>
          ) : !showAddForm && (
            <View
              className="rounded-xl p-6 items-center"
              style={{ backgroundColor: colors.surface, ...shadows.small }}
            >
              <View
                className="w-16 h-16 rounded-full items-center justify-center mb-3"
                style={{ backgroundColor: `${colors.primary}10` }}
              >
                <Ionicons name="chatbubbles-outline" size={32} color={colors.primary} />
              </View>
              <Text className="text-base font-semibold mb-1" style={{ color: colors.text }}>
                No Questions Yet
              </Text>
              <Text
                className="text-sm text-center"
                style={{ color: colors.textSecondary }}
              >
                Add questions from your FAQs or create custom ones to gather client information.
              </Text>
            </View>
          )}

          <View className="h-8" />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
