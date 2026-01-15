import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getColors, Shadows } from "@/constants/colors";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { useUser } from "@clerk/clerk-expo";
import { showToast } from "@/utils/toast";
import { Id } from "@/convex/_generated/dataModel";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function FaqQuestionsScreen() {
  const router = useRouter();
  const { user } = useUser();
  const scheme = useColorScheme();
  const colors = getColors(scheme === "dark");
  const shadows = scheme === "dark" ? Shadows.dark : Shadows.light;
  const insets = useSafeAreaInsets();

  const [newQuestion, setNewQuestion] = useState("");
  const [editingId, setEditingId] = useState<Id<"faqQuestions"> | null>(null);
  const [editingText, setEditingText] = useState("");
  const [saving, setSaving] = useState(false);

  const faqs = useQuery(
    api.faqQuestions.getTrainerFaqs,
    user?.id ? { trainerId: user.id } : "skip"
  );

  const createFaq = useMutation(api.faqQuestions.createFaq);
  const updateFaq = useMutation(api.faqQuestions.updateFaq);
  const deleteFaq = useMutation(api.faqQuestions.deleteFaq);
  const toggleFaqActive = useMutation(api.faqQuestions.toggleFaqActive);

  const handleAddFaq = async () => {
    if (!newQuestion.trim() || !user?.id) return;
    setSaving(true);
    try {
      await createFaq({ trainerId: user.id, question: newQuestion.trim() });
      setNewQuestion("");
      showToast.success("FAQ added");
    } catch (error) {
      showToast.error("Failed to add FAQ");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateFaq = async () => {
    if (!editingId || !editingText.trim()) return;
    setSaving(true);
    try {
      await updateFaq({ faqId: editingId, question: editingText.trim() });
      setEditingId(null);
      setEditingText("");
      showToast.success("FAQ updated");
    } catch (error) {
      showToast.error("Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFaq = (faqId: Id<"faqQuestions">) => {
    Alert.alert("Delete FAQ", "Are you sure you want to delete this FAQ?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteFaq({ faqId });
            showToast.success("Deleted");
          } catch (error) {
            showToast.error("Failed to delete");
          }
        },
      },
    ]);
  };

  const startEditing = (faq: any) => {
    setEditingId(faq._id);
    setEditingText(faq.question);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />

      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 24,
          paddingBottom: 12,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <TouchableOpacity
          onPress={() => router.push('/(trainer)/profile' as any)}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
            backgroundColor: colors.surface,
          }}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>

        <Text style={{ fontSize: 24, fontWeight: "700", color: colors.text }}>
          FAQ Questions
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Card */}
        <View
          style={{
            backgroundColor: `${colors.primary}15`,
            borderRadius: 16,
            padding: 16,
            marginTop: 16,
            marginBottom: 16,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
            <Ionicons name="information-circle" size={20} color={colors.primary} />
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                marginLeft: 8,
                color: colors.text,
              }}
            >
              About FAQ Questions
            </Text>
          </View>
          <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 20 }}>
            Create template questions that you frequently ask new clients. When adding a client, you can quickly select these FAQs and record their answers.
          </Text>
        </View>

        {/* Add New FAQ */}
        <Text
          style={{
            fontSize: 12,
            fontWeight: "600",
            color: colors.textTertiary,
            marginBottom: 8,
          }}
        >
          ADD NEW FAQ
        </Text>

        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 16,
            marginBottom: 24,
            ...shadows.small,
          }}
        >
          <View style={{ flexDirection: "row", gap: 8, alignItems: "flex-start" }}>
            <TextInput
              value={newQuestion}
              onChangeText={setNewQuestion}
              placeholder="Enter a question template..."
              placeholderTextColor={colors.textTertiary}
              style={{
                flex: 1,
                backgroundColor: colors.background,
                color: colors.text,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 12,
                fontSize: 14,
              }}
              multiline
            />
            <TouchableOpacity
              onPress={handleAddFaq}
              disabled={saving || !newQuestion.trim()}
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: newQuestion.trim() ? colors.primary : colors.border,
              }}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Ionicons name="add" size={24} color="#FFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* FAQ List */}
        {faqs === undefined ? (
          <ActivityIndicator color={colors.primary} />
        ) : faqs.length === 0 ? (
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 16,
              padding: 32,
              alignItems: "center",
              ...shadows.small,
            }}
          >
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: `${colors.primary}15`,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <Ionicons name="help-circle-outline" size={32} color={colors.primary} />
            </View>
            <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text, marginBottom: 8 }}>
              No FAQs Yet
            </Text>
            <Text style={{ fontSize: 13, color: colors.textSecondary, textAlign: "center" }}>
              Add your first FAQ question above
            </Text>
          </View>
        ) : (
          <View>
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: colors.textTertiary,
                marginBottom: 8,
              }}
            >
              YOUR FAQS ({faqs.length})
            </Text>
            {faqs.map((faq: any, index: number) => (
              <View
                key={faq._id}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 12,
                  ...shadows.small,
                  opacity: faq.isActive ? 1 : 0.6,
                }}
              >
                {editingId === faq._id ? (
                  <View>
                    <TextInput
                      value={editingText}
                      onChangeText={setEditingText}
                      style={{
                        backgroundColor: colors.background,
                        color: colors.text,
                        borderWidth: 1,
                        borderColor: colors.primary,
                        borderRadius: 12,
                        paddingHorizontal: 12,
                        paddingVertical: 12,
                        marginBottom: 12,
                        fontSize: 14,
                      }}
                      multiline
                      autoFocus
                    />
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      <TouchableOpacity
                        onPress={() => {
                          setEditingId(null);
                          setEditingText("");
                        }}
                        style={{
                          flex: 1,
                          paddingVertical: 10,
                          borderRadius: 10,
                          alignItems: "center",
                          backgroundColor: colors.surfaceSecondary,
                        }}
                      >
                        <Text style={{ color: colors.text, fontWeight: "500" }}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={handleUpdateFaq}
                        disabled={saving}
                        style={{
                          flex: 1,
                          paddingVertical: 10,
                          borderRadius: 10,
                          alignItems: "center",
                          backgroundColor: colors.primary,
                        }}
                      >
                        <Text style={{ color: "#FFF", fontWeight: "600" }}>Save</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: `${colors.primary}15`,
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 12,
                      }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: "700", color: colors.primary }}>
                        {index + 1}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, color: colors.text, lineHeight: 20 }}>
                        {faq.question}
                      </Text>
                      {!faq.isActive && (
                        <Text style={{ fontSize: 12, color: colors.warning, marginTop: 4 }}>
                          Inactive
                        </Text>
                      )}
                    </View>
                    <View style={{ flexDirection: "row", gap: 6 }}>
                      <TouchableOpacity
                        onPress={() => toggleFaqActive({ faqId: faq._id })}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: colors.surfaceSecondary,
                        }}
                      >
                        <Ionicons
                          name={faq.isActive ? "eye" : "eye-off"}
                          size={18}
                          color={faq.isActive ? colors.success : colors.textTertiary}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => startEditing(faq)}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: colors.surfaceSecondary,
                        }}
                      >
                        <Ionicons name="create-outline" size={18} color={colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeleteFaq(faq._id)}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: `${colors.error}15`,
                        }}
                      >
                        <Ionicons name="trash-outline" size={18} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
