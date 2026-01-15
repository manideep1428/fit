import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect, useRef } from "react";
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
  const [isSaving, setIsSaving] = useState(false);

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
      setIsSaving(true);
      const key = `${STORAGE_KEY}_${clientEmail || "new"}`;
      await AsyncStorage.setItem(key, JSON.stringify(updatedQuestions));
      // Small delay to show saving indicator
      setTimeout(() => setIsSaving(false), 300);
    } catch (error) {
      console.error("Error saving questions:", error);
      setIsSaving(false);
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
    // Navigate back to add-client screen
    router.push("/(trainer)/add-client" as any);
  };

  const availableFaqs = faqs?.filter(
    (faq: any) => !questions.some((q) => q.question === faq.question)
  );

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />

      {/* Header */}
      <View
        className="px-5 pt-14 pb-5"
        style={{
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          ...shadows.medium,
        }}
      >
        <View className="flex-row items-center justify-between mb-3">
          <TouchableOpacity
            onPress={() => router.push("/(trainer)/add-client" as any)}
            className="w-11 h-11 items-center justify-center rounded-full"
            style={{ backgroundColor: colors.surfaceSecondary }}
          >
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>

          <View className="flex-1 mx-4">
            <Text
              className="text-xl font-bold text-center"
              style={{ color: colors.text }}
            >
              Onboarding Questions
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleDone}
            className="px-5 py-2.5 rounded-full flex-row items-center"
            style={{ backgroundColor: colors.primary }}
          >
            <Ionicons name="checkmark" size={18} color="#FFF" />
            <Text className="text-white font-semibold ml-1">Done</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Row */}
        <View className="flex-row items-center justify-center mt-2">
          <View className="flex-row items-center px-4 py-2 rounded-full" style={{ backgroundColor: colors.surfaceSecondary }}>
            <Ionicons name="chatbubbles" size={16} color={colors.primary} />
            <Text className="text-sm font-semibold ml-2" style={{ color: colors.text }}>
              {questions.length} {questions.length === 1 ? "Question" : "Questions"}
            </Text>
          </View>
          {isSaving && (
            <View className="flex-row items-center ml-3 px-3 py-2 rounded-full" style={{ backgroundColor: `${colors.success}15` }}>
              <Ionicons name="checkmark-circle" size={14} color={colors.success} />
              <Text className="text-xs font-medium ml-1.5" style={{ color: colors.success }}>
                Saved
              </Text>
            </View>
          )}
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-5 py-5" showsVerticalScrollIndicator={false}>
          {/* Info Card */}
          <View
            className="p-4 rounded-2xl mb-5"
            style={{ 
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: `${colors.primary}30`,
              ...shadows.small 
            }}
          >
            <View className="flex-row items-start">
              <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: `${colors.primary}15` }}>
                <Ionicons name="bulb" size={20} color={colors.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold mb-1" style={{ color: colors.text }}>
                  Gather Client Information
                </Text>
                <Text className="text-xs leading-5" style={{ color: colors.textSecondary }}>
                  Add questions to collect important details from your client. All changes are auto-saved and will be included when you add the client.
                </Text>
              </View>
            </View>
          </View>

          {/* Add Question Form */}
          {showAddForm ? (
            <View
              className="rounded-2xl p-5 mb-5"
              style={{ backgroundColor: colors.surface, ...shadows.medium }}
            >
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-base font-bold" style={{ color: colors.text }}>
                  Create New Question
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowAddForm(false);
                    setNewQuestion("");
                    setNewAnswer("");
                  }}
                  className="w-8 h-8 rounded-full items-center justify-center"
                  style={{ backgroundColor: colors.surfaceSecondary }}
                >
                  <Ionicons name="close" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <Text className="text-xs font-semibold mb-2 uppercase" style={{ color: colors.textSecondary }}>
                Question *
              </Text>
              <TextInput
                value={newQuestion}
                onChangeText={setNewQuestion}
                placeholder="e.g., What are your fitness goals?"
                placeholderTextColor={colors.textTertiary}
                className="px-4 py-3.5 rounded-xl mb-4"
                style={{
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderWidth: 1,
                  borderColor: newQuestion.trim() ? colors.primary : colors.border,
                  fontSize: 15,
                }}
                multiline
                autoFocus
              />

              <Text className="text-xs font-semibold mb-2 uppercase" style={{ color: colors.textSecondary }}>
                Pre-fill Answer (Optional)
              </Text>
              <TextInput
                value={newAnswer}
                onChangeText={setNewAnswer}
                placeholder="Leave blank for client to answer..."
                placeholderTextColor={colors.textTertiary}
                className="px-4 py-3.5 rounded-xl mb-5"
                style={{
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderWidth: 1,
                  borderColor: colors.border,
                  minHeight: 90,
                  textAlignVertical: "top",
                  fontSize: 15,
                }}
                multiline
              />

              <View className="flex-row gap-2.5">
                <TouchableOpacity
                  onPress={handleSaveAndAddAnother}
                  disabled={!newQuestion.trim()}
                  className="flex-1 py-3.5 rounded-xl items-center flex-row justify-center"
                  style={{
                    backgroundColor: colors.surfaceSecondary,
                    borderWidth: 1.5,
                    borderColor: newQuestion.trim() ? colors.primary : colors.border,
                    opacity: newQuestion.trim() ? 1 : 0.5,
                  }}
                >
                  <Ionicons name="add" size={18} color={newQuestion.trim() ? colors.primary : colors.textTertiary} />
                  <Text style={{ color: newQuestion.trim() ? colors.primary : colors.textTertiary, fontWeight: "600", marginLeft: 6 }}>
                    Add Another
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSaveQuestion}
                  disabled={!newQuestion.trim()}
                  className="flex-1 py-3.5 rounded-xl items-center flex-row justify-center"
                  style={{
                    backgroundColor: newQuestion.trim() ? colors.primary : colors.border,
                    opacity: newQuestion.trim() ? 1 : 0.5,
                  }}
                >
                  <Ionicons name="checkmark" size={18} color="#FFF" />
                  <Text style={{ color: "#FFF", fontWeight: "600", marginLeft: 6 }}>
                    Save
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View className="mb-5">
              {/* Add Custom Question Button */}
              <TouchableOpacity
                onPress={() => setShowAddForm(true)}
                className="flex-row items-center justify-center py-4 rounded-xl mb-3"
                style={{ backgroundColor: colors.primary, ...shadows.small }}
              >
                <Ionicons name="add-circle" size={22} color="#FFF" />
                <Text className="text-white font-bold ml-2 text-base">Create Custom Question</Text>
              </TouchableOpacity>

              {/* FAQ Picker Button */}
              {faqs && faqs.length > 0 && availableFaqs && availableFaqs.length > 0 && (
                <TouchableOpacity
                  onPress={() => setShowFaqPicker(!showFaqPicker)}
                  className="flex-row items-center justify-center py-4 rounded-xl"
                  style={{
                    backgroundColor: colors.surface,
                    borderWidth: 1.5,
                    borderColor: colors.primary,
                    ...shadows.small,
                  }}
                >
                  <Ionicons name={showFaqPicker ? "chevron-up" : "list"} size={20} color={colors.primary} />
                  <Text className="font-bold ml-2 text-base" style={{ color: colors.primary }}>
                    {showFaqPicker ? "Hide" : "Choose from"} FAQ Templates
                  </Text>
                  {!showFaqPicker && availableFaqs.length > 0 && (
                    <View className="ml-2 px-2 py-0.5 rounded-full" style={{ backgroundColor: `${colors.primary}20` }}>
                      <Text className="text-xs font-bold" style={{ color: colors.primary }}>
                        {availableFaqs.length}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* FAQ Picker List */}
          {showFaqPicker && availableFaqs && availableFaqs.length > 0 && (
            <View
              className="rounded-2xl p-4 mb-5"
              style={{ backgroundColor: colors.surface, ...shadows.medium }}
            >
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center">
                  <Ionicons name="bookmark" size={18} color={colors.primary} />
                  <Text className="text-sm font-bold ml-2" style={{ color: colors.text }}>
                    Your FAQ Templates
                  </Text>
                </View>
                <View className="px-2.5 py-1 rounded-full" style={{ backgroundColor: `${colors.primary}15` }}>
                  <Text className="text-xs font-bold" style={{ color: colors.primary }}>
                    {availableFaqs.length}
                  </Text>
                </View>
              </View>
              <View className="space-y-2">
                {availableFaqs.map((faq: any, index: number) => (
                  <TouchableOpacity
                    key={faq._id}
                    onPress={() => addFaqQuestion(faq.question)}
                    className="flex-row items-center py-3.5 px-4 rounded-xl"
                    style={{ 
                      backgroundColor: colors.background,
                      borderWidth: 1,
                      borderColor: colors.border,
                      marginBottom: index < availableFaqs.length - 1 ? 8 : 0,
                    }}
                  >
                    <View className="w-8 h-8 rounded-full items-center justify-center mr-3" style={{ backgroundColor: `${colors.primary}15` }}>
                      <Ionicons name="add" size={18} color={colors.primary} />
                    </View>
                    <Text className="flex-1 text-sm leading-5" style={{ color: colors.text }}>
                      {faq.question}
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Questions List */}
          {questions.length > 0 ? (
            <View>
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-xs font-bold uppercase tracking-wide" style={{ color: colors.textSecondary }}>
                  Your Questions
                </Text>
                <View className="px-2.5 py-1 rounded-full" style={{ backgroundColor: `${colors.primary}15` }}>
                  <Text className="text-xs font-bold" style={{ color: colors.primary }}>
                    {questions.length}
                  </Text>
                </View>
              </View>
              {questions.map((q, index) => (
                <View
                  key={index}
                  className="rounded-2xl p-5 mb-4"
                  style={{ backgroundColor: colors.surface, ...shadows.medium }}
                >
                  <View className="flex-row items-start justify-between mb-4">
                    <View className="flex-row items-start flex-1">
                      <View
                        className="w-9 h-9 rounded-full items-center justify-center mr-3"
                        style={{ backgroundColor: `${colors.primary}20` }}
                      >
                        <Text className="text-sm font-bold" style={{ color: colors.primary }}>
                          {index + 1}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-base font-semibold leading-6" style={{ color: colors.text }}>
                          {q.question}
                        </Text>
                        {q.fromFaq && (
                          <View className="flex-row items-center mt-2 px-2.5 py-1 rounded-full self-start" style={{ backgroundColor: `${colors.primary}10` }}>
                            <Ionicons name="bookmark" size={12} color={colors.primary} />
                            <Text className="text-xs font-medium ml-1" style={{ color: colors.primary }}>
                              FAQ Template
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => removeQuestion(index)}
                      className="w-9 h-9 rounded-full items-center justify-center ml-2"
                      style={{ backgroundColor: `${colors.error}15` }}
                    >
                      <Ionicons name="trash-outline" size={16} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                  
                  <View className="pt-3 border-t" style={{ borderTopColor: colors.border }}>
                    <Text className="text-xs font-semibold mb-2 uppercase" style={{ color: colors.textSecondary }}>
                      Client's Answer
                    </Text>
                    <TextInput
                      value={q.answer}
                      onChangeText={(text) => updateAnswer(index, text)}
                      placeholder="Client will answer this during onboarding..."
                      placeholderTextColor={colors.textTertiary}
                      multiline
                      className="px-4 py-3.5 rounded-xl"
                      style={{
                        backgroundColor: colors.background,
                        color: colors.text,
                        borderWidth: 1,
                        borderColor: q.answer ? colors.primary : colors.border,
                        minHeight: 85,
                        textAlignVertical: "top",
                        fontSize: 14,
                      }}
                    />
                  </View>
                </View>
              ))}
            </View>
          ) : !showAddForm && (
            <View
              className="rounded-2xl p-8 items-center"
              style={{ backgroundColor: colors.surface, ...shadows.medium }}
            >
              <View
                className="w-20 h-20 rounded-full items-center justify-center mb-4"
                style={{ backgroundColor: `${colors.primary}10` }}
              >
                <Ionicons name="chatbubbles-outline" size={36} color={colors.primary} />
              </View>
              <Text className="text-lg font-bold mb-2" style={{ color: colors.text }}>
                No Questions Yet
              </Text>
              <Text
                className="text-sm text-center leading-5"
                style={{ color: colors.textSecondary }}
              >
                Create custom questions or choose from your FAQ templates to gather client information.
              </Text>
            </View>
          )}

          <View className="h-10" />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
