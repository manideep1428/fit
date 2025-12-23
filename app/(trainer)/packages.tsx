import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  Modal,
  Switch,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getColors, Shadows } from "@/constants/colors";
import { StatusBar } from "expo-status-bar";
import { useUser } from "@clerk/clerk-expo";
import { useState, useEffect } from "react";
import { showToast } from "@/utils/toast";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const CURRENCIES = [
  { code: "GBP", symbol: "£" },
  { code: "NOK", symbol: "kr" },
];

const DEFAULT_FEATURES = [
  "Cancel anytime",
  "Direct chat support",
  "Progress tracking",
  "Custom workout plans",
];

export default function ManagePlansScreen() {
  const router = useRouter();
  const { user } = useUser();
  const scheme = useColorScheme();
  const colors = getColors(scheme === "dark");
  const shadows = scheme === "dark" ? Shadows.dark : Shadows.light;
  const insets = useSafeAreaInsets();

  // Create/Edit Modal State
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sessionsPerMonth, setSessionsPerMonth] = useState("");
  const [monthlyPrice, setMonthlyPrice] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [discount, setDiscount] = useState("");
  const [isVisible, setIsVisible] = useState(true);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([
    "Cancel anytime",
  ]);
  const [saving, setSaving] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  // Send Discount Modal State
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [discountPlan, setDiscountPlan] = useState<any>(null);
  const [discountType, setDiscountType] = useState<"all" | "specific">("all");
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [discountPercentage, setDiscountPercentage] = useState("");
  const [discountDescription, setDiscountDescription] = useState("");
  const [sendingDiscount, setSendingDiscount] = useState(false);

  const plans = useQuery(
    api.trainerPlans.getTrainerPlans,
    user?.id ? { trainerId: user.id } : "skip"
  );

  const clients = useQuery(
    api.users.getTrainerClients,
    user?.id ? { trainerId: user.id } : "skip"
  );

  const createPlan = useMutation(api.trainerPlans.createPlan);
  const updatePlan = useMutation(api.trainerPlans.updatePlan);
  const toggleVisibility = useMutation(api.trainerPlans.togglePlanVisibility);
  const toggleActive = useMutation(api.trainerPlans.togglePlanActive);
  const deletePlan = useMutation(api.trainerPlans.deletePlan);
  const createPricingRule = useMutation(api.pricingRules.createPricingRule);

  // Open edit modal with plan data
  const handleEditPlan = (plan: any) => {
    setEditingPlan(plan);
    setName(plan.name);
    setDescription(plan.description);
    setSessionsPerMonth(plan.sessionsPerMonth.toString());
    setMonthlyPrice(plan.monthlyPrice.toString());
    setCurrency(plan.currency);
    setDiscount(plan.discount ? plan.discount.toString() : "");
    setIsVisible(plan.isVisible);
    setSelectedFeatures(plan.features || ["Cancel anytime"]);
    setShowPlanModal(true);
  };

  // Open send discount modal
  const handleOpenDiscountModal = (plan: any) => {
    setDiscountPlan(plan);
    setDiscountPercentage(plan.discount ? plan.discount.toString() : "");
    setDiscountDescription(`${plan.name} special discount`);
    setDiscountType("all");
    setSelectedClients([]);
    setShowDiscountModal(true);
  };

  const handleSavePlan = async () => {
    if (!name || !description || !sessionsPerMonth || !monthlyPrice) {
      showToast.error("Please fill all required fields");
      return;
    }

    setSaving(true);
    try {
      if (editingPlan) {
        // Update existing plan
        await updatePlan({
          planId: editingPlan._id,
          name,
          description,
          sessionsPerMonth: parseInt(sessionsPerMonth),
          monthlyPrice: parseFloat(monthlyPrice),
          currency,
          discount: discount ? parseFloat(discount) : 0,
          isVisible,
          features: selectedFeatures,
        });
        showToast.success("Plan updated successfully!");
      } else {
        // Create new plan
        await createPlan({
          trainerId: user!.id,
          name,
          description,
          sessionsPerMonth: parseInt(sessionsPerMonth),
          monthlyPrice: parseFloat(monthlyPrice),
          currency,
          discount: discount ? parseFloat(discount) : undefined,
          isVisible,
          features: selectedFeatures,
        });
        showToast.success("Plan created successfully!");
      }

      setShowPlanModal(false);
      resetForm();
    } catch (error) {
      console.error("Error saving plan:", error);
      showToast.error("Failed to save plan");
    } finally {
      setSaving(false);
    }
  };

  // Send discount to clients
  const handleSendDiscount = async () => {
    if (!discountPercentage) {
      showToast.error("Please enter discount percentage");
      return;
    }

    const discountNum = parseFloat(discountPercentage);
    if (discountNum < 0 || discountNum > 100) {
      showToast.error("Discount must be between 0 and 100");
      return;
    }

    if (discountType === "specific" && selectedClients.length === 0) {
      showToast.error("Please select at least one client");
      return;
    }

    setSendingDiscount(true);
    try {
      if (discountType === "all") {
        // Create global discount for all clients
        await createPricingRule({
          trainerId: user!.id,
          clientId: undefined, // undefined = applies to all clients
          discountPercentage: discountNum,
          description:
            discountDescription ||
            `${discountPlan?.name || "Plan"} discount for all clients`,
        });
        showToast.success("Discount applied to all clients!");
      } else {
        // Create individual discounts for selected clients
        for (const clientId of selectedClients) {
          await createPricingRule({
            trainerId: user!.id,
            clientId,
            discountPercentage: discountNum,
            description:
              discountDescription ||
              `${discountPlan?.name || "Plan"} special discount`,
          });
        }
        showToast.success(
          `Discount sent to ${selectedClients.length} client(s)!`
        );
      }

      setShowDiscountModal(false);
      resetDiscountForm();
    } catch (error) {
      console.error("Error sending discount:", error);
      showToast.error("Failed to send discount");
    } finally {
      setSendingDiscount(false);
    }
  };

  const handleToggleVisibility = async (planId: any) => {
    try {
      await toggleVisibility({ planId });
      showToast.success("Visibility updated");
    } catch (error) {
      showToast.error("Failed to update visibility");
    }
  };

  const handleToggleActive = async (planId: any) => {
    try {
      await toggleActive({ planId });
      showToast.success("Status updated");
    } catch (error) {
      showToast.error("Failed to update status");
    }
  };

  const handleDeletePlan = (plan: any) => {
    Alert.alert(
      "Delete Plan",
      `Are you sure you want to delete "${plan.name}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deletePlan({ planId: plan._id });
              showToast.success("Plan deleted");
            } catch (error: any) {
              showToast.error(error.message || "Failed to delete plan");
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setEditingPlan(null);
    setName("");
    setDescription("");
    setSessionsPerMonth("");
    setMonthlyPrice("");
    setDiscount("");
    setCurrency("INR");
    setIsVisible(true);
    setSelectedFeatures(["Cancel anytime"]);
  };

  const resetDiscountForm = () => {
    setDiscountPlan(null);
    setDiscountPercentage("");
    setDiscountDescription("");
    setDiscountType("all");
    setSelectedClients([]);
  };

  const toggleFeature = (feature: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(feature)
        ? prev.filter((f) => f !== feature)
        : [...prev, feature]
    );
  };

  const toggleClientSelection = (clientId: string) => {
    setSelectedClients((prev) =>
      prev.includes(clientId)
        ? prev.filter((id) => id !== clientId)
        : [...prev, clientId]
    );
  };

  const getCurrencySymbol = (code: string) => {
    return CURRENCIES.find((c) => c.code === code)?.symbol || code;
  };

  const openCreateModal = () => {
    resetForm();
    setShowPlanModal(true);
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />

      {/* Header */}
      <View
        className="px-4 pb-4 flex-row items-center justify-between"
        style={{ paddingTop: insets.top + 12 }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{ backgroundColor: colors.surface }}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text className="text-xl font-bold" style={{ color: colors.text }}>
          Subscription Plans
        </Text>
        <TouchableOpacity
          onPress={openCreateModal}
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{ backgroundColor: colors.primary }}
        >
          <Ionicons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Info Card */}
        <View
          className="rounded-xl p-4 mb-6"
          style={{ backgroundColor: `${colors.primary}15` }}
        >
          <View className="flex-row items-start">
            <Ionicons
              name="information-circle"
              size={24}
              color={colors.primary}
            />
            <View className="ml-3 flex-1">
              <Text
                className="font-semibold mb-1"
                style={{ color: colors.text }}
              >
                Manage Your Plans
              </Text>
              <Text className="text-sm" style={{ color: colors.textSecondary }}>
                Create plans, set discounts, and send special offers to your
                clients.
              </Text>
            </View>
          </View>
        </View>

        {/* Plans List */}
        {!plans ? (
          <View className="items-center py-12">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : plans.length === 0 ? (
          <View
            className="rounded-xl p-8 items-center"
            style={{ backgroundColor: colors.surface, ...shadows.medium }}
          >
            <Ionicons
              name="pricetags-outline"
              size={64}
              color={colors.textTertiary}
            />
            <Text
              className="mt-4 text-lg font-semibold"
              style={{ color: colors.text }}
            >
              No plans yet
            </Text>
            <Text
              className="mt-2 text-sm text-center"
              style={{ color: colors.textSecondary }}
            >
              Create your first subscription plan for clients
            </Text>
            <TouchableOpacity
              onPress={openCreateModal}
              className="mt-6 rounded-xl py-3 px-6 flex-row items-center"
              style={{ backgroundColor: colors.primary }}
            >
              <Ionicons name="add" size={20} color="#FFF" />
              <Text className="text-white font-semibold ml-2">Create Plan</Text>
            </TouchableOpacity>
          </View>
        ) : (
          plans.map((plan: any) => (
            <View
              key={plan._id}
              className="rounded-xl p-5 mb-4"
              style={{
                backgroundColor: colors.surface,
                ...shadows.medium,
                opacity: plan.isActive ? 1 : 0.7,
                borderWidth: 2,
                borderColor: plan.isVisible ? colors.primary : "transparent",
              }}
            >
              {/* Header */}
              <View className="flex-row justify-between items-start mb-3">
                <View className="flex-1 pr-4">
                  <View className="flex-row items-center flex-wrap gap-2">
                    <Text
                      className="text-lg font-bold"
                      style={{ color: colors.text }}
                    >
                      {plan.name}
                    </Text>
                    {plan.discount > 0 && (
                      <View
                        className="px-2.5 py-1 rounded-lg"
                        style={{ backgroundColor: colors.success }}
                      >
                        <Text className="text-white text-xs font-bold">
                          {plan.discount}% OFF
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text
                    className="text-sm mt-1"
                    style={{ color: colors.textSecondary }}
                  >
                    {plan.description}
                  </Text>
                </View>

                {/* Edit Button */}
                <TouchableOpacity
                  onPress={() => handleEditPlan(plan)}
                  className="w-9 h-9 rounded-full items-center justify-center"
                  style={{ backgroundColor: colors.background }}
                >
                  <Ionicons name="pencil" size={18} color={colors.primary} />
                </TouchableOpacity>
              </View>

              {/* Status Badges */}
              <View className="flex-row gap-2 mb-3">
                <View
                  className="px-2 py-1 rounded-full"
                  style={{
                    backgroundColor: plan.isVisible
                      ? `${colors.primary}20`
                      : `${colors.textTertiary}20`,
                  }}
                >
                  <Text
                    className="text-xs font-semibold"
                    style={{
                      color: plan.isVisible
                        ? colors.primary
                        : colors.textTertiary,
                    }}
                  >
                    {plan.isVisible ? "Visible" : "Hidden"}
                  </Text>
                </View>
                <View
                  className="px-2 py-1 rounded-full"
                  style={{
                    backgroundColor: plan.isActive
                      ? `${colors.success}20`
                      : `${colors.textTertiary}20`,
                  }}
                >
                  <Text
                    className="text-xs font-semibold"
                    style={{
                      color: plan.isActive
                        ? colors.success
                        : colors.textTertiary,
                    }}
                  >
                    {plan.isActive ? "Active" : "Inactive"}
                  </Text>
                </View>
              </View>

              {/* Price & Sessions */}
              <View className="flex-row gap-3 mb-4">
                <View
                  className="flex-1 rounded-xl p-3"
                  style={{ backgroundColor: `${colors.primary}10` }}
                >
                  <View className="flex-row items-baseline">
                    {plan.discount > 0 && (
                      <Text
                        className="text-sm mr-2 line-through"
                        style={{ color: colors.textTertiary }}
                      >
                        {getCurrencySymbol(plan.currency)}
                        {plan.monthlyPrice}
                      </Text>
                    )}
                    <Text
                      className="text-2xl font-bold"
                      style={{ color: colors.primary }}
                    >
                      {getCurrencySymbol(plan.currency)}
                      {plan.discount > 0
                        ? (
                            plan.monthlyPrice *
                            (1 - plan.discount / 100)
                          ).toFixed(0)
                        : plan.monthlyPrice}
                    </Text>
                  </View>
                  <Text
                    className="text-xs"
                    style={{ color: colors.textSecondary }}
                  >
                    per month
                  </Text>
                </View>
                <View
                  className="flex-1 rounded-xl p-3"
                  style={{ backgroundColor: `${colors.primary}10` }}
                >
                  <Text
                    className="text-2xl font-bold"
                    style={{ color: colors.primary }}
                  >
                    {plan.sessionsPerMonth}
                  </Text>
                  <Text
                    className="text-xs"
                    style={{ color: colors.textSecondary }}
                  >
                    sessions/month
                  </Text>
                </View>
              </View>

              {/* Features */}
              {plan.features && plan.features.length > 0 && (
                <View className="mb-4">
                  {plan.features
                    .slice(0, 2)
                    .map((feature: string, index: number) => (
                      <View
                        key={index}
                        className="flex-row items-center mb-1.5"
                      >
                        <Ionicons
                          name="checkmark-circle"
                          size={16}
                          color={colors.success}
                        />
                        <Text
                          className="ml-2 text-sm"
                          style={{ color: colors.text }}
                        >
                          {feature}
                        </Text>
                      </View>
                    ))}
                  {plan.features.length > 2 && (
                    <Text
                      className="text-xs ml-6"
                      style={{ color: colors.textTertiary }}
                    >
                      +{plan.features.length - 2} more features
                    </Text>
                  )}
                </View>
              )}

              {/* Send Discount Button */}
              <TouchableOpacity
                onPress={() => handleOpenDiscountModal(plan)}
                className="mb-3 rounded-xl py-2.5 flex-row items-center justify-center"
                style={{
                  backgroundColor: `${colors.success}15`,
                  borderWidth: 1,
                  borderColor: colors.success,
                }}
              >
                <Ionicons name="gift" size={18} color={colors.success} />
                <Text
                  className="ml-2 font-semibold text-sm"
                  style={{ color: colors.success }}
                >
                  Send Discount to Clients
                </Text>
              </TouchableOpacity>

              {/* Actions */}
              <View className="flex-row gap-2">
                <TouchableOpacity
                  onPress={() => handleToggleVisibility(plan._id)}
                  className="flex-1 rounded-xl py-2.5 flex-row items-center justify-center"
                  style={{ backgroundColor: colors.background }}
                >
                  <Ionicons
                    name={plan.isVisible ? "eye-off-outline" : "eye-outline"}
                    size={18}
                    color={colors.text}
                  />
                  <Text
                    className="ml-2 font-semibold text-sm"
                    style={{ color: colors.text }}
                  >
                    {plan.isVisible ? "Hide" : "Show"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleToggleActive(plan._id)}
                  className="flex-1 rounded-xl py-2.5 flex-row items-center justify-center"
                  style={{ backgroundColor: colors.background }}
                >
                  <Ionicons
                    name={
                      plan.isActive
                        ? "pause-circle-outline"
                        : "play-circle-outline"
                    }
                    size={18}
                    color={colors.text}
                  />
                  <Text
                    className="ml-2 font-semibold text-sm"
                    style={{ color: colors.text }}
                  >
                    {plan.isActive ? "Pause" : "Enable"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDeletePlan(plan)}
                  className="rounded-xl py-2.5 px-4"
                  style={{ backgroundColor: `${colors.error}15` }}
                >
                  <Ionicons
                    name="trash-outline"
                    size={18}
                    color={colors.error}
                  />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Create/Edit Plan Modal */}
      <Modal visible={showPlanModal} transparent animationType="slide">
        <View
          className="flex-1 justify-end"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <View
            className="rounded-t-3xl p-6"
            style={{
              backgroundColor: colors.surface,
              maxHeight: "90%",
              paddingBottom: insets.bottom + 16,
            }}
          >
            <View className="flex-row justify-between items-center mb-6">
              <Text
                className="text-xl font-bold"
                style={{ color: colors.text }}
              >
                {editingPlan ? "Edit Plan" : "Create Plan"}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowPlanModal(false);
                  resetForm();
                }}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Name */}
              <Text
                className="text-sm font-semibold mb-2"
                style={{ color: colors.text }}
              >
                Plan Name *
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g., Basic Fitness"
                placeholderTextColor={colors.textTertiary}
                className="px-4 py-3.5 rounded-xl mb-4"
                style={{
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              />

              {/* Description */}
              <Text
                className="text-sm font-semibold mb-2"
                style={{ color: colors.text }}
              >
                Description *
              </Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Perfect for getting started with a routine"
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={2}
                className="px-4 py-3.5 rounded-xl mb-4"
                style={{
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderWidth: 1,
                  borderColor: colors.border,
                  textAlignVertical: "top",
                }}
              />

              {/* Sessions */}
              <Text
                className="text-sm font-semibold mb-2"
                style={{ color: colors.text }}
              >
                Sessions per Month *
              </Text>
              <TextInput
                value={sessionsPerMonth}
                onChangeText={setSessionsPerMonth}
                placeholder="e.g., 4"
                keyboardType="numeric"
                placeholderTextColor={colors.textTertiary}
                className="px-4 py-3.5 rounded-xl mb-4"
                style={{
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              />

              {/* Price */}
              <View className="flex-row gap-3 mb-4">
                <View className="flex-1">
                  <Text
                    className="text-sm font-semibold mb-2"
                    style={{ color: colors.text }}
                  >
                    Monthly Price *
                  </Text>
                  <TextInput
                    value={monthlyPrice}
                    onChangeText={setMonthlyPrice}
                    placeholder="e.g., 5000"
                    keyboardType="numeric"
                    placeholderTextColor={colors.textTertiary}
                    className="px-4 py-3.5 rounded-xl"
                    style={{
                      backgroundColor: colors.background,
                      color: colors.text,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  />
                </View>
                <View style={{ width: 100 }}>
                  <Text
                    className="text-sm font-semibold mb-2"
                    style={{ color: colors.text }}
                  >
                    Currency
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowCurrencyPicker(!showCurrencyPicker)}
                    className="px-4 py-3.5 rounded-xl flex-row items-center justify-between"
                    style={{
                      backgroundColor: colors.background,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <Text style={{ color: colors.text }}>{currency}</Text>
                    <Ionicons
                      name="chevron-down"
                      size={16}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Currency Picker */}
              {showCurrencyPicker && (
                <View
                  className="rounded-xl mb-4 overflow-hidden"
                  style={{
                    backgroundColor: colors.background,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  {CURRENCIES.map((curr) => (
                    <TouchableOpacity
                      key={curr.code}
                      className="px-4 py-3 flex-row items-center justify-between"
                      style={{
                        borderBottomWidth: 1,
                        borderBottomColor: colors.border,
                      }}
                      onPress={() => {
                        setCurrency(curr.code);
                        setShowCurrencyPicker(false);
                      }}
                    >
                      <Text style={{ color: colors.text }}>
                        {curr.symbol} {curr.code}
                      </Text>
                      {currency === curr.code && (
                        <Ionicons
                          name="checkmark"
                          size={18}
                          color={colors.primary}
                        />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Discount */}
              <Text
                className="text-sm font-semibold mb-2"
                style={{ color: colors.text }}
              >
                Default Discount % (Optional)
              </Text>
              <TextInput
                value={discount}
                onChangeText={setDiscount}
                placeholder="e.g., 20"
                keyboardType="numeric"
                placeholderTextColor={colors.textTertiary}
                className="px-4 py-3.5 rounded-xl mb-4"
                style={{
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              />

              {/* Visibility Toggle */}
              <View
                className="flex-row items-center justify-between mb-4 p-4 rounded-xl"
                style={{ backgroundColor: colors.background }}
              >
                <View className="flex-1 mr-4">
                  <Text
                    className="font-semibold"
                    style={{ color: colors.text }}
                  >
                    Visible to Clients
                  </Text>
                  <Text
                    className="text-sm"
                    style={{ color: colors.textSecondary }}
                  >
                    Show this plan on your pricing page
                  </Text>
                </View>
                <Switch
                  value={isVisible}
                  onValueChange={setIsVisible}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#FFF"
                />
              </View>

              {/* Features */}
              <Text
                className="text-sm font-semibold mb-2"
                style={{ color: colors.text }}
              >
                Features (select what's included)
              </Text>
              <View className="flex-row flex-wrap gap-2 mb-6">
                {DEFAULT_FEATURES.map((feature) => (
                  <TouchableOpacity
                    key={feature}
                    onPress={() => toggleFeature(feature)}
                    className="px-3 py-2 rounded-full"
                    style={{
                      backgroundColor: selectedFeatures.includes(feature)
                        ? colors.primary
                        : colors.background,
                      borderWidth: 1,
                      borderColor: selectedFeatures.includes(feature)
                        ? colors.primary
                        : colors.border,
                    }}
                  >
                    <Text
                      className="text-sm"
                      style={{
                        color: selectedFeatures.includes(feature)
                          ? "#FFF"
                          : colors.text,
                      }}
                    >
                      {feature}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Preview */}
              {name && monthlyPrice && (
                <View
                  className="rounded-xl p-4 mb-6"
                  style={{
                    backgroundColor: colors.primary,
                    borderWidth: discount ? 2 : 0,
                    borderColor: colors.success,
                  }}
                >
                  <Text className="text-white/70 text-xs mb-1">Preview</Text>
                  <View className="flex-row items-center gap-2">
                    <Text className="text-white font-bold text-lg">{name}</Text>
                    {discount && parseFloat(discount) > 0 && (
                      <View className="px-2 py-0.5 rounded-lg bg-green-500">
                        <Text className="text-white text-xs font-bold">
                          Save {discount}%
                        </Text>
                      </View>
                    )}
                  </View>
                  <View className="flex-row items-baseline mt-2">
                    {discount && parseFloat(discount) > 0 && (
                      <Text className="text-white/60 line-through mr-2">
                        {getCurrencySymbol(currency)}
                        {monthlyPrice}
                      </Text>
                    )}
                    <Text className="text-white font-bold text-2xl">
                      {getCurrencySymbol(currency)}
                      {discount && parseFloat(discount) > 0
                        ? (
                            parseFloat(monthlyPrice) *
                            (1 - parseFloat(discount) / 100)
                          ).toFixed(0)
                        : monthlyPrice}
                    </Text>
                    <Text className="text-white/70 ml-1">/month</Text>
                  </View>
                </View>
              )}

              {/* Submit Button */}
              <TouchableOpacity
                onPress={handleSavePlan}
                disabled={
                  saving ||
                  !name ||
                  !description ||
                  !sessionsPerMonth ||
                  !monthlyPrice
                }
                className="rounded-xl py-4 items-center"
                style={{
                  backgroundColor:
                    !name || !description || !sessionsPerMonth || !monthlyPrice
                      ? colors.border
                      : colors.primary,
                }}
              >
                {saving ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text className="text-white font-semibold text-base">
                    {editingPlan ? "Update Plan" : "Create Plan"}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Send Discount Modal */}
      <Modal visible={showDiscountModal} transparent animationType="slide">
        <View
          className="flex-1 justify-end"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <View
            className="rounded-t-3xl p-6"
            style={{
              backgroundColor: colors.surface,
              maxHeight: "85%",
              paddingBottom: insets.bottom + 16,
            }}
          >
            <View className="flex-row justify-between items-center mb-4">
              <View className="flex-1">
                <Text
                  className="text-xl font-bold"
                  style={{ color: colors.text }}
                >
                  Send Discount
                </Text>
                {discountPlan && (
                  <Text
                    className="text-sm mt-1"
                    style={{ color: colors.textSecondary }}
                  >
                    For: {discountPlan.name}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                onPress={() => {
                  setShowDiscountModal(false);
                  resetDiscountForm();
                }}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Discount Percentage */}
              <Text
                className="text-sm font-semibold mb-2"
                style={{ color: colors.text }}
              >
                Discount Percentage *
              </Text>
              <TextInput
                value={discountPercentage}
                onChangeText={setDiscountPercentage}
                placeholder="e.g., 20"
                keyboardType="numeric"
                placeholderTextColor={colors.textTertiary}
                className="px-4 py-3.5 rounded-xl mb-4"
                style={{
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              />

              {/* Description */}
              <Text
                className="text-sm font-semibold mb-2"
                style={{ color: colors.text }}
              >
                Description (Optional)
              </Text>
              <TextInput
                value={discountDescription}
                onChangeText={setDiscountDescription}
                placeholder="e.g., Holiday special discount"
                placeholderTextColor={colors.textTertiary}
                className="px-4 py-3.5 rounded-xl mb-4"
                style={{
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              />

              {/* Discount Type Selection */}
              <Text
                className="text-sm font-semibold mb-3"
                style={{ color: colors.text }}
              >
                Send to
              </Text>
              <View className="flex-row gap-3 mb-4">
                <TouchableOpacity
                  onPress={() => setDiscountType("all")}
                  className="flex-1 rounded-xl p-4 flex-row items-center"
                  style={{
                    backgroundColor:
                      discountType === "all"
                        ? colors.primary
                        : colors.background,
                    borderWidth: 1,
                    borderColor:
                      discountType === "all" ? colors.primary : colors.border,
                  }}
                >
                  <Ionicons
                    name="people"
                    size={20}
                    color={discountType === "all" ? "#FFF" : colors.text}
                  />
                  <Text
                    className="ml-2 font-semibold"
                    style={{
                      color: discountType === "all" ? "#FFF" : colors.text,
                    }}
                  >
                    All Clients
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setDiscountType("specific")}
                  className="flex-1 rounded-xl p-4 flex-row items-center"
                  style={{
                    backgroundColor:
                      discountType === "specific"
                        ? colors.primary
                        : colors.background,
                    borderWidth: 1,
                    borderColor:
                      discountType === "specific"
                        ? colors.primary
                        : colors.border,
                  }}
                >
                  <Ionicons
                    name="person"
                    size={20}
                    color={discountType === "specific" ? "#FFF" : colors.text}
                  />
                  <Text
                    className="ml-2 font-semibold"
                    style={{
                      color: discountType === "specific" ? "#FFF" : colors.text,
                    }}
                  >
                    Select Clients
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Client Selection */}
              {discountType === "specific" && (
                <View className="mb-4">
                  <Text
                    className="text-sm font-semibold mb-2"
                    style={{ color: colors.text }}
                  >
                    Select Clients ({selectedClients.length} selected)
                  </Text>
                  {clients && clients.length > 0 ? (
                    <View className="gap-2">
                      {clients.map((client: any) => (
                        <TouchableOpacity
                          key={client._id}
                          onPress={() => toggleClientSelection(client.clerkId)}
                          className="flex-row items-center p-3 rounded-xl"
                          style={{
                            backgroundColor: selectedClients.includes(
                              client.clerkId
                            )
                              ? `${colors.primary}15`
                              : colors.background,
                            borderWidth: 1,
                            borderColor: selectedClients.includes(
                              client.clerkId
                            )
                              ? colors.primary
                              : colors.border,
                          }}
                        >
                          <View
                            className="w-10 h-10 rounded-full items-center justify-center mr-3"
                            style={{ backgroundColor: colors.primary }}
                          >
                            <Text className="text-white font-bold">
                              {client.fullName?.charAt(0) || "C"}
                            </Text>
                          </View>
                          <View className="flex-1">
                            <Text
                              className="font-semibold"
                              style={{ color: colors.text }}
                            >
                              {client.fullName}
                            </Text>
                            <Text
                              className="text-sm"
                              style={{ color: colors.textSecondary }}
                            >
                              {client.email}
                            </Text>
                          </View>
                          <Ionicons
                            name={
                              selectedClients.includes(client.clerkId)
                                ? "checkbox"
                                : "square-outline"
                            }
                            size={24}
                            color={
                              selectedClients.includes(client.clerkId)
                                ? colors.primary
                                : colors.textTertiary
                            }
                          />
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : (
                    <View
                      className="p-4 rounded-xl items-center"
                      style={{ backgroundColor: colors.background }}
                    >
                      <Text style={{ color: colors.textSecondary }}>
                        No clients found
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* Preview */}
              {discountPercentage && (
                <View
                  className="rounded-xl p-4 mb-6 flex-row items-center"
                  style={{ backgroundColor: `${colors.success}15` }}
                >
                  <Ionicons name="gift" size={32} color={colors.success} />
                  <View className="ml-3 flex-1">
                    <Text
                      className="font-bold text-lg"
                      style={{ color: colors.success }}
                    >
                      {discountPercentage}% Discount
                    </Text>
                    <Text
                      className="text-sm"
                      style={{ color: colors.textSecondary }}
                    >
                      Will be sent to{" "}
                      {discountType === "all"
                        ? "all clients"
                        : `${selectedClients.length} selected client(s)`}
                    </Text>
                  </View>
                </View>
              )}

              {/* Submit Button */}
              <TouchableOpacity
                onPress={handleSendDiscount}
                disabled={
                  sendingDiscount ||
                  !discountPercentage ||
                  (discountType === "specific" && selectedClients.length === 0)
                }
                className="rounded-xl py-4 flex-row items-center justify-center"
                style={{
                  backgroundColor:
                    !discountPercentage ||
                    (discountType === "specific" &&
                      selectedClients.length === 0)
                      ? colors.border
                      : colors.success,
                }}
              >
                {sendingDiscount ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="send" size={20} color="#FFF" />
                    <Text className="text-white font-semibold text-base ml-2">
                      Send Discount
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
