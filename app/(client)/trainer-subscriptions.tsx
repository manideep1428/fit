import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
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
import { showToast } from "@/utils/toast";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

export default function TrainerSubscriptionsScreen() {
  const router = useRouter();
  const { trainerId } = useLocalSearchParams();
  const { user } = useUser();
  const scheme = useColorScheme();
  const colors = getColors(scheme === "dark");
  const shadows = scheme === "dark" ? Shadows.dark : Shadows.light;
  const insets = useSafeAreaInsets();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  // Fetch trainer info
  const trainer = useQuery(
    api.users.getUserByClerkId,
    trainerId ? { clerkId: trainerId as string } : "skip"
  );

  // Fetch trainer's plans
  const plans = useQuery(
    api.trainerPlans.getTrainerPlans,
    trainerId ? { trainerId: trainerId as string } : "skip"
  );

  const createSubscription = useMutation(api.subscriptions.createSubscription);

  const handleSubscribe = async (paymentMethod: "online" | "offline") => {
    if (!selectedPlan || !user?.id || !trainerId) {
      showToast.error("Select a plan");
      return;
    }

    const plan = plans?.find((p: any) => p._id === selectedPlan);
    if (!plan) return;

    try {
      await createSubscription({
        clientId: user.id,
        trainerId: trainerId as string,
        planId: selectedPlan as any,
        billingType: "monthly",
        billingMonths: 1,
        monthlyAmount: plan.monthlyPrice,
        totalAmount: plan.monthlyPrice * (1 - (plan.discount || 0) / 100),
        discount: plan.discount || 0,
        paymentMethod,
        autoRenew: true,
      });

      showToast.success(
        paymentMethod === "offline"
          ? "Request sent!"
          : "Subscribed!"
      );
      router.back();
    } catch (error) {
      console.error("Subscription error:", error);
      showToast.error("Subscribe failed");
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    const symbols: { [key: string]: string } = {
      INR: "₹",
      USD: "$",
      EUR: "€",
      GBP: "£",
      NOK: "kr",
    };
    return `${symbols[currency] || currency}${amount.toFixed(0)}`;
  };

  if (!trainer || !plans) {
    return (
      <View className="flex-1" style={{ backgroundColor: colors.background }}>
        <StatusBar style={scheme === "dark" ? "light" : "dark"} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  const visiblePlans = plans.filter((p: any) => p.isVisible && p.isActive);

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />

      {/* Gradient Background */}
      <LinearGradient
        colors={[`${colors.primary}20`, `${colors.primary}05`, "transparent"]}
        className="absolute top-0 left-0 right-0 h-80"
        pointerEvents="none"
      />

      {/* Header */}
      <View
        className="px-4 pb-4 border-b"
        style={{
          paddingTop: insets.top + 12,
          borderBottomColor: colors.border,
          backgroundColor: `${colors.background}E6`,
        }}
      >
        <View className="flex-row items-center mb-4">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text
            className="text-xl font-bold flex-1 text-center pr-10"
            style={{ color: colors.text }}
          >
            Subscriptions
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 180 }}
      >
        {/* Trainer Context */}
        <View className="mt-2 px-4">
          <Text
            className="pt-4 pb-2 text-sm font-medium"
            style={{ color: colors.textSecondary }}
          >
            Purchasing from
          </Text>
          <View
            className="flex-row items-center gap-4 p-4 rounded-xl"
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              ...shadows.small,
            }}
          >
            <View className="relative w-16 h-16 shrink-0">
              <View
                className="w-full h-full rounded-full items-center justify-center"
                style={{ backgroundColor: colors.primary }}
              >
                {trainer.profileImageId ? (
                  <Image
                    source={{ uri: trainer.profileImageId }}
                    className="w-full h-full rounded-full"
                  />
                ) : (
                  <Text className="text-white text-2xl font-bold">
                    {trainer.fullName?.[0] || "T"}
                  </Text>
                )}
              </View>
              <View
                className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full"
                style={{ borderWidth: 2, borderColor: colors.surface }}
              />
            </View>
            <View className="flex-1">
              <Text
                className="text-lg font-bold leading-tight"
                style={{ color: colors.text }}
              >
                {trainer.fullName}
              </Text>
              <Text
                className="text-sm font-normal"
                style={{ color: colors.textSecondary }}
              >
                {trainer.specialty || "Fitness Coach"}
              </Text>
            </View>
          </View>
        </View>

        {/* Packages Section */}
        <View className="mt-8 px-4">
          <Text
            className="mb-4 text-2xl font-bold leading-tight tracking-tight"
            style={{ color: colors.text }}
          >
            Monthly Packages
          </Text>

          {visiblePlans.length === 0 ? (
            <View
              className="rounded-2xl p-8 items-center"
              style={{ backgroundColor: colors.surface, ...shadows.small }}
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
            </View>
          ) : (
            <View className="gap-4">
              {visiblePlans.map((plan: any) => {
                const isSelected = selectedPlan === plan._id;
                const hasDiscount = plan.discount && plan.discount > 0;
                const originalPrice = plan.monthlyPrice;
                const discountedPrice = hasDiscount
                  ? originalPrice * (1 - plan.discount / 100)
                  : originalPrice;

                return (
                  <TouchableOpacity
                    key={plan._id}
                    onPress={() => setSelectedPlan(plan._id)}
                    className="relative flex flex-col gap-4 p-5 rounded-xl transition-all"
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
                    {/* Selected Indicator */}
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
                    <View className="flex-col gap-1 pr-8">
                      <View className="flex-row items-center gap-2 flex-wrap">
                        <Text
                          className="text-lg font-bold"
                          style={{ color: colors.text }}
                        >
                          {plan.name}
                        </Text>
                        {hasDiscount && (
                          <View
                            className="px-2.5 py-1 rounded-lg"
                            style={{ backgroundColor: colors.success }}
                          >
                            <Text className="text-xs font-bold tracking-wide text-white uppercase">
                              Save {plan.discount}%
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text
                        className="text-sm"
                        style={{ color: colors.textSecondary }}
                      >
                        {plan.description}
                      </Text>
                    </View>

                    {/* Price */}
                    <View className="flex-row items-baseline gap-2 mt-1">
                      {hasDiscount && (
                        <Text
                          className="text-xl font-medium line-through"
                          style={{ color: colors.textTertiary }}
                        >
                          {formatCurrency(originalPrice, plan.currency)}
                        </Text>
                      )}
                      <Text
                        className="text-4xl font-black tracking-tight"
                        style={{ color: colors.text }}
                      >
                        {formatCurrency(discountedPrice, plan.currency)}
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
                      className="w-full h-px"
                      style={{ backgroundColor: colors.border }}
                    />

                    {/* Features */}
                    <View className="flex-col gap-3">
                      <View className="flex-row items-start gap-3">
                        <Ionicons
                          name="fitness"
                          size={20}
                          color={
                            isSelected ? colors.primary : colors.textSecondary
                          }
                        />
                        <Text
                          className="text-sm"
                          style={{ color: colors.text }}
                        >
                          {plan.sessionsPerMonth} Sessions/mo
                        </Text>
                      </View>
                      <View className="flex-row items-start gap-3">
                        <Ionicons
                          name="refresh"
                          size={20}
                          color={
                            isSelected ? colors.primary : colors.textSecondary
                          }
                        />
                        <Text
                          className="text-sm"
                          style={{ color: colors.text }}
                        >
                          Renews Monthly
                        </Text>
                      </View>
                      {plan.features &&
                        plan.features.map((feature: string, idx: number) => (
                          <View
                            key={idx}
                            className="flex-row items-start gap-3"
                          >
                            <Ionicons
                              name="checkmark-circle"
                              size={20}
                              color={colors.success}
                            />
                            <Text
                              className="text-sm flex-1"
                              style={{ color: colors.text }}
                            >
                              {feature}
                            </Text>
                          </View>
                        ))}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Fixed Bottom Action Bar */}
      {selectedPlan && (
        <View
          className="absolute bottom-0 left-0 right-0 p-4 border-t"
          style={{
            backgroundColor: `${colors.background}F5`,
            borderTopColor: colors.border,
            paddingBottom: insets.bottom + 16,
          }}
        >
          <View className="max-w-md mx-auto flex-col gap-3 w-full">
            <TouchableOpacity
              onPress={() => handleSubscribe("online")}
              className="h-12 rounded-xl items-center justify-center flex-row gap-2"
              style={{
                backgroundColor: colors.primary,
                ...shadows.medium,
              }}
            >
              <Ionicons name="card" size={20} color="#FFF" />
              <Text className="text-white font-bold text-base">
                Subscribe - Pay Online
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleSubscribe("offline")}
              className="h-12 rounded-xl items-center justify-center flex-row gap-2"
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
