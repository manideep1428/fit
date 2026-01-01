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
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getColors, Shadows } from "@/constants/colors";
import { StatusBar } from "expo-status-bar";
import { useUser } from "@clerk/clerk-expo";
import { useState } from "react";
import { showToast } from "@/utils/toast";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 48;

const CURRENCIES = [
  { code: "GBP", symbol: "£" },
  { code: "NOK", symbol: "kr" },
  { code: "USD", symbol: "$" },
  { code: "EUR", symbol: "€" },
];


const PLAN_COLORS = [
  { gradient: ["#667eea", "#764ba2"], accent: "#667eea" },
  { gradient: ["#f093fb", "#f5576c"], accent: "#f5576c" },
  { gradient: ["#4facfe", "#00f2fe"], accent: "#4facfe" },
  { gradient: ["#43e97b", "#38f9d7"], accent: "#43e97b" },
  { gradient: ["#fa709a", "#fee140"], accent: "#fa709a" },
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
  const [currency, setCurrency] = useState("GBP");
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
  const createPricingRule = useAction(api.pricingRules.createPricingRule);

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
      showToast.error("Fill all fields");
      return;
    }

    setSaving(true);
    try {
      if (editingPlan) {
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
        showToast.success("Plan updated");
      } else {
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
        showToast.success("Plan created");
      }
      setShowPlanModal(false);
      resetForm();
    } catch (error) {
      showToast.error("Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleSendDiscount = async () => {
    if (!discountPercentage) {
      showToast.error("Enter discount %");
      return;
    }

    const discountNum = parseFloat(discountPercentage);
    if (discountNum < 0 || discountNum > 100) {
      showToast.error("Must be 0-100");
      return;
    }

    if (discountType === "specific" && selectedClients.length === 0) {
      showToast.error("Select a client");
      return;
    }

    setSendingDiscount(true);
    try {
      if (discountType === "all") {
        await createPricingRule({
          trainerId: user!.id,
          clientId: undefined,
          discountPercentage: discountNum,
          description:
            discountDescription || `${discountPlan?.name || "Plan"} discount`,
        });
        showToast.success("Discount applied");
      } else {
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
          `Sent to ${selectedClients.length} client(s)`
        );
      }
      setShowDiscountModal(false);
      resetDiscountForm();
    } catch (error) {
      showToast.error("Discount failed");
    } finally {
      setSendingDiscount(false);
    }
  };

  const handleDeletePlan = (plan: any) => {
    Alert.alert(
      "Delete Plan",
      `Delete "${plan.name}"? This cannot be undone.`,
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
              showToast.error(error.message || "Delete failed");
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
    setCurrency("GBP");
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

  const getDiscountedPrice = (price: number, discountPercent: number) => {
    return (price * (1 - discountPercent / 100)).toFixed(0);
  };

  const getPlanColor = (index: number) =>
    PLAN_COLORS[index % PLAN_COLORS.length];

  const renderSubscriptionCard = (plan: any, index: number) => {
    const planColor = getPlanColor(index);
    const finalPrice =
      plan.discount > 0
        ? getDiscountedPrice(plan.monthlyPrice, plan.discount)
        : plan.monthlyPrice;

    return (
      <View
        key={plan._id}
        className="mb-6 rounded-3xl overflow-hidden"
        style={{
          width: CARD_WIDTH,
          ...shadows.large,
          opacity: plan.isActive ? 1 : 0.6,
        }}
      >
        {/* Card Header with Gradient */}
        <LinearGradient
          colors={planColor.gradient as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="p-6 pb-8"
        >
          {/* Status & Actions Row */}
          <View className="flex-row justify-between items-start mb-4">
            <View className="flex-row gap-2">
              {!plan.isActive && (
                <View className="px-3 py-1 rounded-full bg-white/20">
                  <Text className="text-white text-xs font-semibold">
                    Paused
                  </Text>
                </View>
              )}
              {!plan.isVisible && (
                <View className="px-3 py-1 rounded-full bg-white/20">
                  <Text className="text-white text-xs font-semibold">
                    Hidden
                  </Text>
                </View>
              )}
            </View>
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => handleEditPlan(plan)}
                className="w-9 h-9 rounded-full bg-white/20 items-center justify-center"
              >
                <Ionicons name="pencil" size={16} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDeletePlan(plan)}
                className="w-9 h-9 rounded-full bg-white/20 items-center justify-center"
              >
                <Ionicons name="trash-outline" size={16} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Plan Name & Discount Badge */}
          <View className="flex-row items-center gap-3 mb-2">
            <Text className="text-white text-2xl font-bold">{plan.name}</Text>
            {plan.discount > 0 && (
              <View className="px-3 py-1 rounded-full bg-white">
                <Text
                  style={{ color: planColor.accent }}
                  className="text-xs font-bold"
                >
                  {plan.discount}% OFF
                </Text>
              </View>
            )}
          </View>

          <Text className="text-white/80 text-sm mb-6">{plan.description}</Text>

          {/* Price Display */}
          <View className="flex-row items-end">
            <Text className="text-white text-5xl font-bold">
              {getCurrencySymbol(plan.currency)}
              {finalPrice}
            </Text>
            <Text className="text-white/70 text-lg mb-2 ml-1">/month</Text>
          </View>
          {plan.discount > 0 && (
            <Text className="text-white/60 text-sm line-through mt-1">
              {getCurrencySymbol(plan.currency)}
              {plan.monthlyPrice}/month
            </Text>
          )}
        </LinearGradient>

        {/* Card Body */}
        <View className="p-6" style={{ backgroundColor: colors.surface }}>
          {/* Sessions Info */}
          <View
            className="flex-row items-center p-4 rounded-2xl mb-5"
            style={{ backgroundColor: `${planColor.accent}15` }}
          >
            <View
              className="w-12 h-12 rounded-xl items-center justify-center"
              style={{ backgroundColor: `${planColor.accent}25` }}
            >
              <Ionicons name="calendar" size={24} color={planColor.accent} />
            </View>
            <View className="ml-4">
              <Text
                className="text-2xl font-bold"
                style={{ color: colors.text }}
              >
                {plan.sessionsPerMonth}
              </Text>
              <Text className="text-sm" style={{ color: colors.textSecondary }}>
                sessions per month
              </Text>
            </View>
          </View>

          {/* Features List */}
          {plan.features && plan.features.length > 0 && (
            <View className="mb-5">
              <Text
                className="text-sm font-semibold mb-3"
                style={{ color: colors.textSecondary }}
              >
                WHAT'S INCLUDED
              </Text>
              {plan.features.map((feature: string, idx: number) => (
                <View key={idx} className="flex-row items-center mb-3">
                  <View
                    className="w-6 h-6 rounded-full items-center justify-center"
                    style={{ backgroundColor: `${planColor.accent}20` }}
                  >
                    <Ionicons
                      name="checkmark"
                      size={14}
                      color={planColor.accent}
                    />
                  </View>
                  <Text
                    className="ml-3 text-base"
                    style={{ color: colors.text }}
                  >
                    {feature}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Action Buttons */}
          <View className="gap-3">
            <TouchableOpacity
              onPress={() => handleOpenDiscountModal(plan)}
              className="py-4 rounded-2xl flex-row items-center justify-center"
              style={{ backgroundColor: planColor.accent }}
            >
              <Ionicons name="gift" size={20} color="#FFF" />
              <Text className="text-white font-semibold text-base ml-2">
                Send Discount
              </Text>
            </TouchableOpacity>

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => toggleVisibility({ planId: plan._id })}
                className="flex-1 py-3 rounded-xl flex-row items-center justify-center"
                style={{ backgroundColor: colors.background }}
              >
                <Ionicons
                  name={plan.isVisible ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color={colors.text}
                />
                <Text
                  className="ml-2 font-medium"
                  style={{ color: colors.text }}
                >
                  {plan.isVisible ? "Hide" : "Show"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => toggleActive({ planId: plan._id })}
                className="flex-1 py-3 rounded-xl flex-row items-center justify-center"
                style={{ backgroundColor: colors.background }}
              >
                <Ionicons
                  name={plan.isActive ? "pause" : "play"}
                  size={18}
                  color={colors.text}
                />
                <Text
                  className="ml-2 font-medium"
                  style={{ color: colors.text }}
                >
                  {plan.isActive ? "Pause" : "Enable"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />

      {/* Header */}
      <View
        className="px-6 pb-4 flex-row items-center justify-between"
        style={{ paddingTop: insets.top + 12 }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-11 h-11 rounded-full items-center justify-center"
          style={{ backgroundColor: colors.surface }}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text className="text-xl font-bold" style={{ color: colors.text }}>
          Subscription Plans
        </Text>
        <TouchableOpacity
          onPress={() => {
            resetForm();
            setShowPlanModal(true);
          }}
          className="w-11 h-11 rounded-full items-center justify-center"
          style={{ backgroundColor: colors.primary }}
        >
          <Ionicons name="add" size={26} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Summary */}
        {plans && plans.length > 0 && (
          <View className="flex-row gap-3 mb-6">
            <View
              className="flex-1 p-4 rounded-2xl"
              style={{ backgroundColor: colors.surface }}
            >
              <Text
                className="text-3xl font-bold"
                style={{ color: colors.primary }}
              >
                {plans.length}
              </Text>
              <Text className="text-sm" style={{ color: colors.textSecondary }}>
                Total Plans
              </Text>
            </View>
            <View
              className="flex-1 p-4 rounded-2xl"
              style={{ backgroundColor: colors.surface }}
            >
              <Text
                className="text-3xl font-bold"
                style={{ color: colors.success }}
              >
                {plans.filter((p: any) => p.isActive).length}
              </Text>
              <Text className="text-sm" style={{ color: colors.textSecondary }}>
                Active
              </Text>
            </View>
            <View
              className="flex-1 p-4 rounded-2xl"
              style={{ backgroundColor: colors.surface }}
            >
              <Text
                className="text-3xl font-bold"
                style={{ color: colors.warning }}
              >
                {plans.filter((p: any) => p.discount > 0).length}
              </Text>
              <Text className="text-sm" style={{ color: colors.textSecondary }}>
                With Discount
              </Text>
            </View>
          </View>
        )}

        {/* Plans List */}
        {!plans ? (
          <View className="items-center py-20">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : plans.length === 0 ? (
          <View
            className="rounded-3xl p-10 items-center"
            style={{ backgroundColor: colors.surface, ...shadows.medium }}
          >
            <View
              className="w-24 h-24 rounded-full items-center justify-center mb-6"
              style={{ backgroundColor: `${colors.primary}15` }}
            >
              <Ionicons name="pricetags" size={48} color={colors.primary} />
            </View>
            <Text
              className="text-xl font-bold mb-2"
              style={{ color: colors.text }}
            >
              No Plans Yet
            </Text>
            <Text
              className="text-center mb-6"
              style={{ color: colors.textSecondary }}
            >
              Create your first subscription plan to start accepting clients
            </Text>
            <TouchableOpacity
              onPress={() => {
                resetForm();
                setShowPlanModal(true);
              }}
              className="rounded-2xl py-4 px-8 flex-row items-center"
              style={{ backgroundColor: colors.primary }}
            >
              <Ionicons name="add" size={22} color="#FFF" />
              <Text className="text-white font-semibold text-base ml-2">
                Create Plan
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          plans.map((plan: any, index: number) =>
            renderSubscriptionCard(plan, index)
          )
        )}
      </ScrollView>

      {/* Create/Edit Plan Modal */}
      <Modal visible={showPlanModal} transparent animationType="slide">
        <View
          className="flex-1 justify-end"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <View
            className="rounded-t-3xl"
            style={{
              backgroundColor: colors.surface,
              maxHeight: "90%",
              paddingBottom: insets.bottom + 16,
            }}
          >
            {/* Modal Header */}
            <View className="flex-row justify-between items-center p-6 pb-4">
              <Text
                className="text-xl font-bold"
                style={{ color: colors.text }}
              >
                {editingPlan ? "Edit Plan" : "New Plan"}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowPlanModal(false);
                  resetForm();
                }}
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.background }}
              >
                <Ionicons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView className="px-6" showsVerticalScrollIndicator={false}>
              {/* Plan Name */}
              <Text
                className="text-sm font-semibold mb-2"
                style={{ color: colors.text }}
              >
                Plan Name
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g., Premium Fitness"
                placeholderTextColor={colors.textTertiary}
                className="px-4 py-4 rounded-xl mb-4"
                style={{
                  backgroundColor: colors.background,
                  color: colors.text,
                  fontSize: 16,
                }}
              />

              {/* Description */}
              <Text
                className="text-sm font-semibold mb-2"
                style={{ color: colors.text }}
              >
                Description
              </Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Describe what's included..."
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={2}
                className="px-4 py-4 rounded-xl mb-4"
                style={{
                  backgroundColor: colors.background,
                  color: colors.text,
                  fontSize: 16,
                  textAlignVertical: "top",
                  minHeight: 80,
                }}
              />

              {/* Price Row */}
              <View className="flex-row gap-3 mb-4">
                <View className="flex-1">
                  <Text
                    className="text-sm font-semibold mb-2"
                    style={{ color: colors.text }}
                  >
                    Price
                  </Text>
                  <TextInput
                    value={monthlyPrice}
                    onChangeText={setMonthlyPrice}
                    placeholder="0"
                    keyboardType="numeric"
                    placeholderTextColor={colors.textTertiary}
                    className="px-4 py-4 rounded-xl"
                    style={{
                      backgroundColor: colors.background,
                      color: colors.text,
                      fontSize: 16,
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
                    className="px-4 py-4 rounded-xl flex-row items-center justify-between"
                    style={{ backgroundColor: colors.background }}
                  >
                    <Text style={{ color: colors.text, fontSize: 16 }}>
                      {currency}
                    </Text>
                    <Ionicons
                      name="chevron-down"
                      size={18}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Currency Picker */}
              {showCurrencyPicker && (
                <View
                  className="rounded-xl mb-4 overflow-hidden"
                  style={{ backgroundColor: colors.background }}
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

              {/* Sessions & Discount Row */}
              <View className="flex-row gap-3 mb-4">
                <View className="flex-1">
                  <Text
                    className="text-sm font-semibold mb-2"
                    style={{ color: colors.text }}
                  >
                    Sessions/Month
                  </Text>
                  <TextInput
                    value={sessionsPerMonth}
                    onChangeText={setSessionsPerMonth}
                    placeholder="4"
                    keyboardType="numeric"
                    placeholderTextColor={colors.textTertiary}
                    className="px-4 py-4 rounded-xl"
                    style={{
                      backgroundColor: colors.background,
                      color: colors.text,
                      fontSize: 16,
                    }}
                  />
                </View>
                <View className="flex-1">
                  <Text
                    className="text-sm font-semibold mb-2"
                    style={{ color: colors.text }}
                  >
                    Discount %
                  </Text>
                  <TextInput
                    value={discount}
                    onChangeText={setDiscount}
                    placeholder="0"
                    keyboardType="numeric"
                    placeholderTextColor={colors.textTertiary}
                    className="px-4 py-4 rounded-xl"
                    style={{
                      backgroundColor: colors.background,
                      color: colors.text,
                      fontSize: 16,
                    }}
                  />
                </View>
              </View>

              {/* Visibility Toggle */}
              <View
                className="flex-row items-center justify-between p-4 rounded-xl mb-4"
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
                    Show on your subscriptions page
                  </Text>
                </View>
                <Switch
                  value={isVisible}
                  onValueChange={setIsVisible}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#FFF"
                />
              </View>
              {/* Preview Card */}
              {name && monthlyPrice && (
                <View className="rounded-2xl overflow-hidden mb-6">
                  <LinearGradient
                    colors={["#667eea", "#764ba2"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="p-5"
                  >
                    <Text className="text-white/70 text-xs mb-1">PREVIEW</Text>
                    <View className="flex-row items-center gap-2 mb-1">
                      <Text className="text-white font-bold text-lg">
                        {name}
                      </Text>
                      {discount && parseFloat(discount) > 0 && (
                        <View className="px-2 py-0.5 rounded-full bg-white">
                          <Text
                            className="text-xs font-bold"
                            style={{ color: "#667eea" }}
                          >
                            {discount}% OFF
                          </Text>
                        </View>
                      )}
                    </View>
                    <View className="flex-row items-end">
                      {discount && parseFloat(discount) > 0 && (
                        <Text className="text-white/50 line-through mr-2 text-lg">
                          {getCurrencySymbol(currency)}
                          {monthlyPrice}
                        </Text>
                      )}
                      <Text className="text-white font-bold text-3xl">
                        {getCurrencySymbol(currency)}
                        {discount && parseFloat(discount) > 0
                          ? (
                              parseFloat(monthlyPrice) *
                              (1 - parseFloat(discount) / 100)
                            ).toFixed(0)
                          : monthlyPrice}
                      </Text>
                      <Text className="text-white/70 ml-1 mb-1">/month</Text>
                    </View>
                  </LinearGradient>
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
                className="rounded-xl py-4 items-center mb-4"
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
            className="rounded-t-3xl"
            style={{
              backgroundColor: colors.surface,
              maxHeight: "85%",
              paddingBottom: insets.bottom + 16,
            }}
          >
            {/* Modal Header */}
            <View className="p-6 pb-4">
              <View className="flex-row justify-between items-start">
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
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{ backgroundColor: colors.background }}
                >
                  <Ionicons name="close" size={22} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView className="px-6" showsVerticalScrollIndicator={false}>
              {/* Discount Percentage */}
              <Text
                className="text-sm font-semibold mb-2"
                style={{ color: colors.text }}
              >
                Discount Percentage
              </Text>
              <TextInput
                value={discountPercentage}
                onChangeText={setDiscountPercentage}
                placeholder="e.g., 20"
                keyboardType="numeric"
                placeholderTextColor={colors.textTertiary}
                className="px-4 py-4 rounded-xl mb-4"
                style={{
                  backgroundColor: colors.background,
                  color: colors.text,
                  fontSize: 16,
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
                placeholder="e.g., Holiday special"
                placeholderTextColor={colors.textTertiary}
                className="px-4 py-4 rounded-xl mb-4"
                style={{
                  backgroundColor: colors.background,
                  color: colors.text,
                  fontSize: 16,
                }}
              />

              {/* Discount Type */}
              <Text
                className="text-sm font-semibold mb-3"
                style={{ color: colors.text }}
              >
                Send to
              </Text>
              <View className="flex-row gap-3 mb-4">
                <TouchableOpacity
                  onPress={() => setDiscountType("all")}
                  className="flex-1 rounded-xl p-4 flex-row items-center justify-center"
                  style={{
                    backgroundColor:
                      discountType === "all"
                        ? colors.primary
                        : colors.background,
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
                  className="flex-1 rounded-xl p-4 flex-row items-center justify-center"
                  style={{
                    backgroundColor:
                      discountType === "specific"
                        ? colors.primary
                        : colors.background,
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
                    Select
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Client Selection */}
              {discountType === "specific" && (
                <View className="mb-4">
                  <Text
                    className="text-sm font-semibold mb-3"
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
                          className="flex-row items-center p-4 rounded-xl"
                          style={{
                            backgroundColor: selectedClients.includes(
                              client.clerkId
                            )
                              ? `${colors.primary}15`
                              : colors.background,
                          }}
                        >
                          <View
                            className="w-11 h-11 rounded-full items-center justify-center"
                            style={{ backgroundColor: colors.primary }}
                          >
                            <Text className="text-white font-bold text-lg">
                              {client.fullName?.charAt(0) || "C"}
                            </Text>
                          </View>
                          <View className="flex-1 ml-3">
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
                      className="p-6 rounded-xl items-center"
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
                  className="rounded-2xl p-5 mb-6 flex-row items-center"
                  style={{ backgroundColor: `${colors.success}15` }}
                >
                  <View
                    className="w-14 h-14 rounded-full items-center justify-center"
                    style={{ backgroundColor: `${colors.success}25` }}
                  >
                    <Ionicons name="gift" size={28} color={colors.success} />
                  </View>
                  <View className="ml-4 flex-1">
                    <Text
                      className="font-bold text-2xl"
                      style={{ color: colors.success }}
                    >
                      {discountPercentage}% OFF
                    </Text>
                    <Text
                      className="text-sm"
                      style={{ color: colors.textSecondary }}
                    >
                      {discountType === "all"
                        ? "For all clients"
                        : `For ${selectedClients.length} selected client(s)`}
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
                className="rounded-xl py-4 flex-row items-center justify-center mb-4"
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
