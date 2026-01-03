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
import { useRouter, useFocusEffect } from "expo-router";
import { useState, useCallback } from "react";
import { useUser } from "@clerk/clerk-expo";
import { useQuery, useMutation } from "convex/react";
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

export default function AddClientScreen() {
  const { user } = useUser();
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = getColors(scheme === "dark");
  const shadows = scheme === "dark" ? Shadows.dark : Shadows.light;

  const [clientEmail, setClientEmail] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [questionsCount, setQuestionsCount] = useState(0);

  const inviteClient = useMutation(api.users.inviteClientByEmail);
  const createClientQuestionsFromFaqs = useMutation(api.faqQuestions.createClientQuestionsFromFaqs);

  // Get existing clients for this trainer
  const existingClients = useQuery(
    api.users.getTrainerClients,
    user?.id ? { trainerId: user.id } : "skip"
  );

  // Load questions count when screen focuses
  useFocusEffect(
    useCallback(() => {
      loadQuestionsCount();
    }, [clientEmail])
  );

  const loadQuestionsCount = async () => {
    try {
      const key = `${STORAGE_KEY}_${clientEmail || "new"}`;
      const saved = await AsyncStorage.getItem(key);
      if (saved) {
        const questions = JSON.parse(saved);
        setQuestionsCount(questions.length);
      } else {
        setQuestionsCount(0);
      }
    } catch (error) {
      console.error("Error loading questions count:", error);
    }
  };

  const getStoredQuestions = async (): Promise<QuestionAnswer[]> => {
    try {
      const key = `${STORAGE_KEY}_${clientEmail || "new"}`;
      const saved = await AsyncStorage.getItem(key);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error("Error getting questions:", error);
      return [];
    }
  };

  const clearStoredQuestions = async () => {
    try {
      const key = `${STORAGE_KEY}_${clientEmail || "new"}`;
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error("Error clearing questions:", error);
    }
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleInviteClient = async () => {
    if (!user?.id) return;

    if (!clientEmail.trim()) {
      showToast.error("Enter email");
      return;
    }

    if (!validateEmail(clientEmail.trim())) {
      showToast.error("Invalid email");
      return;
    }

    if (!clientName.trim()) {
      showToast.error("Enter name");
      return;
    }

    if (!clientPhone.trim()) {
      showToast.error("Enter phone");
      return;
    }

    // Check if client already exists in trainer's list
    const alreadyAdded = existingClients?.some(
      (client: any) =>
        client?.email?.toLowerCase() === clientEmail.trim().toLowerCase()
    );

    if (alreadyAdded) {
      showToast.error("Client already added");
      return;
    }

    setIsAdding(true);
    try {
      const result = await inviteClient({
        trainerId: user.id,
        email: clientEmail.trim().toLowerCase(),
        fullName: clientName.trim(),
        phoneNumber: clientPhone.trim(),
      });

      // Save questions if any
      const clientId = result.clientId;
      const questions = await getStoredQuestions();
      if (questions.length > 0 && clientId) {
        await createClientQuestionsFromFaqs({
          trainerId: user.id,
          clientId: clientId,
          questionsWithAnswers: questions.map(q => ({
            question: q.question,
            answer: q.answer,
          })),
        });
      }

      // Clear stored questions after successful save
      await clearStoredQuestions();

      if (result.status === "existing") {
        showToast.success("Client added to your list!");
      } else {
        showToast.success(
          "Client invited! They can now sign in with this email."
        );
      }

      router.back();
    } catch (error: any) {
      console.error("Error inviting client:", error instanceof Error ? error.message : 'Unknown error');
      showToast.error(error.message || "Failed to invite client");
    } finally {
      setIsAdding(false);
    }
  };

  const handleOpenQuestions = () => {
    router.push(`/(trainer)/client-questions?clientEmail=${clientEmail || "new"}` as any);
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />

      {/* Header */}
      <View className="px-4 pt-16 pb-4 flex-row items-center justify-between">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-12 h-12 items-center justify-center"
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text
          className="text-xl font-semibold flex-1 text-center"
          style={{ color: colors.text }}
        >
          Add Client
        </Text>
        <View className="w-12" />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
          {/* Info Card */}
          <View
            className="p-4 rounded-xl mb-6"
            style={{ backgroundColor: `${colors.primary}15` }}
          >
            <View className="flex-row items-center mb-2">
              <Ionicons
                name="information-circle"
                size={20}
                color={colors.primary}
              />
              <Text
                className="text-sm font-semibold ml-2"
                style={{ color: colors.text }}
              >
                How it works
              </Text>
            </View>
            <Text className="text-sm" style={{ color: colors.textSecondary }}>
              Enter your client's details and optionally add questions to gather information during onboarding.
            </Text>
          </View>

          {/* Client Email Input */}
          <View className="mb-4">
            <Text
              className="text-sm font-semibold mb-2"
              style={{ color: colors.text }}
            >
              Client Email *
            </Text>
            <View
              className="flex-row items-center px-4 py-3.5 rounded-xl"
              style={{
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Ionicons
                name="mail-outline"
                size={20}
                color={colors.textSecondary}
              />
              <TextInput
                className="flex-1 ml-3 text-base"
                style={{ color: colors.text }}
                placeholder="client@example.com"
                placeholderTextColor={colors.textSecondary}
                value={clientEmail}
                onChangeText={setClientEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Client Name Input */}
          <View className="mb-4">
            <Text
              className="text-sm font-semibold mb-2"
              style={{ color: colors.text }}
            >
              Client Name *
            </Text>
            <View
              className="flex-row items-center px-4 py-3.5 rounded-xl"
              style={{
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Ionicons
                name="person-outline"
                size={20}
                color={colors.textSecondary}
              />
              <TextInput
                className="flex-1 ml-3 text-base"
                style={{ color: colors.text }}
                placeholder="John Doe"
                placeholderTextColor={colors.textSecondary}
                value={clientName}
                onChangeText={setClientName}
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* Client Phone Input */}
          <View className="mb-6">
            <Text
              className="text-sm font-semibold mb-2"
              style={{ color: colors.text }}
            >
              Phone Number *
            </Text>
            <View
              className="flex-row items-center px-4 py-3.5 rounded-xl"
              style={{
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Ionicons
                name="call-outline"
                size={20}
                color={colors.textSecondary}
              />
              <TextInput
                className="flex-1 ml-3 text-base"
                style={{ color: colors.text }}
                placeholder="+1 234 567 8900"
                placeholderTextColor={colors.textSecondary}
                value={clientPhone}
                onChangeText={setClientPhone}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Questions Button */}
          <TouchableOpacity
            onPress={handleOpenQuestions}
            className="flex-row items-center justify-between p-4 rounded-xl mb-6"
            style={{ backgroundColor: colors.surface, ...shadows.small }}
          >
            <View className="flex-row items-center">
              <View
                className="w-12 h-12 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: `${colors.primary}15` }}
              >
                <Ionicons name="chatbubbles-outline" size={24} color={colors.primary} />
              </View>
              <View>
                <Text className="font-semibold text-base" style={{ color: colors.text }}>
                  Questions
                </Text>
                <Text className="text-sm" style={{ color: colors.textSecondary }}>
                  {questionsCount > 0
                    ? `${questionsCount} question${questionsCount !== 1 ? "s" : ""} added`
                    : "Add onboarding questions"}
                </Text>
              </View>
            </View>
            <View className="flex-row items-center">
              {questionsCount > 0 && (
                <View
                  className="w-6 h-6 rounded-full items-center justify-center mr-2"
                  style={{ backgroundColor: colors.primary }}
                >
                  <Text className="text-xs font-bold text-white">{questionsCount}</Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </View>
          </TouchableOpacity>

          {/* Add Button */}
          <TouchableOpacity
            className="rounded-xl py-4 items-center mb-6"
            style={{
              backgroundColor:
                clientEmail && clientName && clientPhone
                  ? colors.primary
                  : colors.border,
            }}
            onPress={handleInviteClient}
            disabled={isAdding || !clientEmail || !clientName || !clientPhone}
          >
            {isAdding ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <View className="flex-row items-center">
                <Ionicons name="person-add-outline" size={20} color="#FFF" />
                <Text className="text-base font-semibold text-white ml-2">
                  Add Client
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Existing Clients Section */}
          {existingClients && existingClients.length > 0 && (
            <View className="mt-4 mb-8">
              <Text
                className="text-sm font-semibold mb-3"
                style={{ color: colors.textSecondary }}
              >
                Your Clients ({existingClients.length})
              </Text>
              {existingClients.slice(0, 5).map((client: any) => (
                <View
                  key={client?._id}
                  className="flex-row items-center p-3 rounded-xl mb-2"
                  style={{ backgroundColor: colors.surface }}
                >
                  <View
                    className="w-10 h-10 rounded-full items-center justify-center mr-3"
                    style={{ backgroundColor: colors.primary }}
                  >
                    <Text className="text-white font-bold">
                      {client?.fullName?.[0] || "C"}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="font-medium" style={{ color: colors.text }}>
                      {client?.fullName || "Client"}
                    </Text>
                    <Text
                      className="text-xs"
                      style={{ color: colors.textSecondary }}
                    >
                      {client?.email}
                    </Text>
                    {client?.phoneNumber && (
                      <Text
                        className="text-xs mt-0.5"
                        style={{ color: colors.textSecondary }}
                      >
                        {client.phoneNumber}
                      </Text>
                    )}
                  </View>
                  {client?.clerkId?.startsWith("pending_") && (
                    <View
                      className="px-2 py-1 rounded-full"
                      style={{ backgroundColor: `${colors.warning}20` }}
                    >
                      <Text
                        className="text-xs font-medium"
                        style={{ color: colors.warning }}
                      >
                        Pending
                      </Text>
                    </View>
                  )}
                </View>
              ))}
              {existingClients.length > 5 && (
                <TouchableOpacity
                  className="py-3 items-center"
                  onPress={() => router.push("/(trainer)/clients" as any)}
                >
                  <Text
                    className="text-sm font-medium"
                    style={{ color: colors.primary }}
                  >
                    View all {existingClients.length} clients
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
