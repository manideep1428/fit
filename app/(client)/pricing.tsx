import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getColors, Shadows } from "@/constants/colors";
import { StatusBar } from "expo-status-bar";
import { useUser } from "@clerk/clerk-expo";
import { useState, useMemo } from "react";
import { showToast } from "@/utils/toast";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Id } from "@/convex/_generated/dataModel";

const BILLING_OPTIONS = [
  { label: "Monthly", months: 1 },
  { label: "3 Months", months: 3 },
  { label: "6 Months", months: 6 },
  { label: "12 Months", months: 12 },
];

export default function ClientPricingScreen() {
  const router = useRouter();
  const { trainerId } = useLocalSearchParams();
  const { user } = useUser();
  const scheme = useColorScheme();
  const colors = getColors(scheme === "dark");
  const shadows = scheme === "dark" ? Shadows.dark : Shadows.light;
  const insets = useSafeAreaInsets();

  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [selectedBilling, setSelectedBilling] = useState(1); // months
  const [purchasing, setPurchasing] = useState(false);

  // Fetch trainer info
  const trainer = useQuery(
    api.users.getUserByClerkId,
    trainerId ? { clerkId: trainerId as string } : "skip"
  );

  // Fetch visible plans
  const plans = useQuery(
    api.trainerPlans.getVisibleTrainerPlans,
    trainerId ? { trainerId: trainerId as string } : "skip"
  );

  // Get client discount
  const discount = useQuery(
    api.pricingRules.getClientDiscount,
    user?.id && trainerId
      ? {
          trainerId: trainerId as string,
          clientId: user.id,
        }
      : "skip"
  );

  // Calculate price for selected plan
  const priceInfo = useQuery(
    api.trainerPlans.calculatePrice,
    selectedPlan && user?.id && trainerId
      ? {
          planId: selectedPlan._id as Id<"trainerPlans">,
          trainerId: trainerId as string,
          clientId: user.id,
          billingMonths: selectedBilling,
        }
      : "skip"
  );

  const createSubscription = useMutation(api.subscriptions.createSubscription);

  // Auto-select first plan
  useMemo(() => {
    if (plans && plans.length > 0 && !selectedPlan) {
      setSelectedPlan(plans[0]);
    }
  }, [plans, selectedPlan]);

  const calculatePrice = (plan: any) => {
    const originalPrice = plan.monthlyPrice;
    // Apply client discount or plan discount
    const appliedDiscount = discount || plan.discount || 0;
    const discountedPrice =
      originalPrice - (originalPrice * appliedDiscount) / 100;
    return {
      original: originalPrice,
      discounted: discountedPrice,
      discount: appliedDiscount,
      yearly: discountedPrice * 12,
    };
  };

  const handleSubscribe = (paymentMethod: "online" | "offline") => {
    if (!selectedPlan || !priceInfo) return;

    const billingText =
      selectedBilling === 1 ? "monthly" : `${selectedBilling} months`;

    Alert.alert(
      "Confirm Subscription",
      `Subscribe to ${selectedPlan.name} (${billingText})?\n\n` +
        `Total: ${priceInfo.currency} ${priceInfo.totalPrice.toFixed(0)}\n` +
        `Sessions: ${priceInfo.totalSessions} total`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: paymentMethod === "online" ? "Subscribe" : "Send Request",
          onPress: async () => {
            setPurchasing(true);
            try {
              await createSubscription({
                clientId: user!.id,
                trainerId: trainerId as string,
                planId: selectedPlan._id,
                billingType: selectedBilling === 1 ? "monthly" : "custom",
                billingMonths: selectedBilling,
                monthlyAmount: priceInfo.discountedMonthlyPrice,
                totalAmount: priceInfo.totalPrice,
                discount: priceInfo.discount,
                paymentMethod,
                autoRenew: selectedBilling === 1,
              });

              showToast.success(
                paymentMethod === "online"
                  ? "Subscription activated!"
                  : "Request sent! Waiting for trainer approval."
              );
              router.back();
            } catch (error) {
              console.error("Error subscribing:", error instanceof Error ? error.message : 'Unknown error');
              showToast.error("Failed to subscribe");
            } finally {
              setPurchasing(false);
            }
          },
        },
      ]
    );
  };

  const getCurrencySymbol = (currency: string) => {
    const symbols: { [key: string]: string } = {
      NOK: "kr ",
      USD: "$",
      EUR: "€",
      GBP: "£",
      INR: "₹",
    };
    return symbols[currency] || currency;
  };

  if (!plans || !trainer) {
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

      {/* Gradient Background */}
      <LinearGradient
        colors={[`${colors.primary}15`, `${colors.primary}05`, "transparent"]}
        className="absolute top-0 left-0 right-0 h-64"
        pointerEvents="none"
      />

      {/* Header */}
      <View
        className="px-4 pb-4 flex-row items-center"
        style={{ paddingTop: insets.top + 12 }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{ backgroundColor: `${colors.text}10` }}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text
          className="text-lg font-bold tracking-tight flex-1 text-center pr-10"
          style={{ color: colors.text }}
        >
          Pricing
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 200 }}
      >
        {/* Trainer Info Card */}
        <View className="px-4 mt-2">
          <Text
            className="text-sm font-medium mb-2"
            style={{ color: colors.textSecondary }}
          >
            Purchasing from
          </Text>
          <View
            className="rounded-xl p-4 flex-row items-center"
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              ...shadows.small,
            }}
          >
            <View className="relative">
              <View
                className="w-16 h-16 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.primary }}
              >
                <Text className="text-white text-2xl font-bold">
                  {trainer.fullName?.charAt(0) || "T"}
                </Text>
              </View>
              <View
                className="absolute bottom-0 right-0 w-4 h-4 rounded-full border-2"
                style={{
                  backgroundColor: colors.success,
                  borderColor: colors.surface,
                }}
              />
            </View>
            <View className="ml-4 flex-1">
              <Text
                className="text-lg font-bold"
                style={{ color: colors.text }}
              >
                {trainer.fullName}
              </Text>
              {trainer.specialty && (
                <Text
                  className="text-sm"
                  style={{ color: colors.textSecondary }}
                >
                  {trainer.specialty}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Billing Options */}
        <View className="px-4 mt-6">
          <Text
            className="text-sm font-semibold mb-3"
            style={{ color: colors.text }}
          >
            Billing Period
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            {BILLING_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.months}
                onPress={() => setSelectedBilling(option.months)}
                className="px-4 py-2.5 rounded-xl"
                style={{
                  backgroundColor:
                    selectedBilling === option.months
                      ? colors.text
                      : colors.surface,
                  borderWidth: 1,
                  borderColor:
                    selectedBilling === option.months
                      ? colors.text
                      : colors.border,
                }}
              >
                <Text
                  className="font-semibold"
                  style={{
                    color:
                      selectedBilling === option.months
                        ? colors.background
                        : colors.text,
                  }}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Yearly Price Display */}
          {selectedPlan && priceInfo && (
            <View
              className="mt-3 p-3 rounded-xl"
              style={{ backgroundColor: `${colors.primary}10` }}
            >
              <Text className="text-sm" style={{ color: colors.textSecondary }}>
                Yearly equivalent:{" "}
                <Text className="font-bold" style={{ color: colors.primary }}>
                  {getCurrencySymbol(priceInfo.currency)}
                  {priceInfo.yearlyPrice.toFixed(0)}/year
                </Text>
              </Text>
            </View>
          )}
        </View>

        {/* Plans Section */}
        <View className="px-4 mt-6">
          <Text
            className="text-2xl font-bold tracking-tight mb-4"
            style={{ color: colors.text }}
          >
            Monthly Packages
          </Text>

          {plans.length === 0 ? (
            <View
              className="rounded-xl p-8 items-center"
              style={{ backgroundColor: colors.surface, ...shadows.medium }}
            >
              <Ionicons
                name="cube-outline"
                size={48}
                color={colors.textTertiary}
              />
              <Text
                className="mt-3 font-semibold"
                style={{ color: colors.textSecondary }}
              >
                No packages available
              </Text>
              <Text
                className="mt-1 text-sm text-center"
                style={{ color: colors.textTertiary }}
              >
                Contact your trainer to set up packages
              </Text>
            </View>
          ) : (
            plans.map((plan: any) => {
              const price = calculatePrice(plan);
              const isSelected = selectedPlan?._id === plan._id;

              return (
                <TouchableOpacity
                  key={plan._id}
                  onPress={() => setSelectedPlan(plan)}
                  activeOpacity={0.8}
                  className="rounded-xl p-5 mb-4"
                  style={{
                    backgroundColor: colors.surface,
                    borderWidth: 2,
                    borderColor: isSelected ? colors.primary : colors.border,
                    ...shadows.medium,
                    ...(isSelected && {
                      shadowColor: colors.primary,
                      shadowOpacity: 0.2,
                    }),
                  }}
                >
                  {/* Selection Indicator */}
                  {isSelected && (
                    <View className="absolute top-4 right-4">
                      <View
                        className="w-6 h-6 rounded-full items-center justify-center"
                        style={{ backgroundColor: colors.primary }}
                      >
                        <Ionicons name="checkmark" size={16} color="#FFF" />
                      </View>
                    </View>
                  )}

                  {/* Header */}
                  <View className="pr-8 mb-3">
                    <View className="flex-row items-center flex-wrap gap-2">
                      <Text
                        className="text-lg font-bold"
                        style={{ color: colors.text }}
                      >
                        {plan.name}
                      </Text>
                      {price.discount > 0 && (
                        <View
                          className="px-2.5 py-1 rounded-lg"
                          style={{ backgroundColor: colors.success }}
                        >
                          <Text className="text-white text-xs font-bold tracking-wide">
                            Save {price.discount}%
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

                  {/* Price */}
                  <View className="flex-row items-baseline gap-2 mb-4">
                    {price.discount > 0 && (
                      <Text
                        className="text-xl font-medium line-through"
                        style={{ color: colors.textTertiary }}
                      >
                        {getCurrencySymbol(plan.currency)}
                        {price.original}
                      </Text>
                    )}
                    <Text
                      className="text-4xl font-black tracking-tight"
                      style={{ color: colors.text }}
                    >
                      {getCurrencySymbol(plan.currency)}
                      {price.discounted.toFixed(0)}
                    </Text>
                    <Text
                      className="text-base font-medium"
                      style={{ color: colors.textSecondary }}
                    >
                      /month
                    </Text>
                  </View>

                  {/* Divider */}
                  <View
                    className="h-px w-full mb-4"
                    style={{ backgroundColor: colors.border }}
                  />

                  {/* Features */}
                  <View className="gap-3">
                    <View className="flex-row items-center gap-3">
                      <Ionicons
                        name="barbell"
                        size={20}
                        color={
                          isSelected ? colors.primary : colors.textSecondary
                        }
                      />
                      <Text style={{ color: colors.text }}>
                        {plan.sessionsPerMonth} Sessions/mo
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-3">
                      <Ionicons
                        name="refresh"
                        size={20}
                        color={
                          isSelected ? colors.primary : colors.textSecondary
                        }
                      />
                      <Text style={{ color: colors.text }}>Renews Monthly</Text>
                    </View>
                    {plan.features?.map((feature: string, index: number) => (
                      <View key={index} className="flex-row items-center gap-3">
                        <Ionicons
                          name="checkmark-circle"
                          size={20}
                          color={colors.success}
                        />
                        <Text style={{ color: colors.text }}>{feature}</Text>
                      </View>
                    ))}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Fixed Bottom Action Bar */}
      {selectedPlan && (
        <View
          className="absolute bottom-0 left-0 right-0 px-4 pt-4 border-t"
          style={{
            backgroundColor:
              scheme === "dark"
                ? `${colors.background}F5`
                : `${colors.surface}F5`,
            borderTopColor: colors.border,
            paddingBottom: insets.bottom + 16,
          }}
        >
          {/* Summary */}
          {priceInfo && (
            <View
              className="mb-4 p-3 rounded-xl"
              style={{ backgroundColor: colors.background }}
            >
              <View className="flex-row justify-between items-center mb-1">
                <Text style={{ color: colors.textSecondary }}>
                  {selectedPlan.name} × {selectedBilling}{" "}
                  {selectedBilling === 1 ? "month" : "months"}
                </Text>
                <Text className="font-bold" style={{ color: colors.text }}>
                  {getCurrencySymbol(priceInfo.currency)}
                  {priceInfo.totalPrice.toFixed(0)}
                </Text>
              </View>
              <View className="flex-row justify-between items-center">
                <Text
                  className="text-sm"
                  style={{ color: colors.textTertiary }}
                >
                  {priceInfo.totalSessions} sessions total
                </Text>
                {priceInfo.discount > 0 && (
                  <Text
                    className="text-sm font-semibold"
                    style={{ color: colors.success }}
                  >
                    {priceInfo.discount}% discount applied
                  </Text>
                )}
              </View>
            </View>
          )}

          <View className="gap-3">
            <TouchableOpacity
              onPress={() => handleSubscribe("online")}
              disabled={purchasing}
              className="h-12 rounded-xl flex-row items-center justify-center gap-2"
              style={{ backgroundColor: colors.primary }}
            >
              {purchasing ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Ionicons name="card" size={20} color="#FFF" />
                  <Text className="text-white font-bold text-base">
                    Subscribe - Pay Online
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleSubscribe("offline")}
              disabled={purchasing}
              className="h-12 rounded-xl flex-row items-center justify-center gap-2"
              style={{
                backgroundColor: "transparent",
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Ionicons name="cash" size={20} color={colors.text} />
              <Text
                className="font-bold text-base"
                style={{ color: colors.text }}
              >
                Subscribe - Pay Offline
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}
