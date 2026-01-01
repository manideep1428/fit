import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    Pressable,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors, BorderRadius, Shadows, Gradients } from '@/constants/colors';
import { GlassCard } from '@/components/GlassCard';
import { AnimatedButton } from '@/components/AnimatedButton';

type PlanType = 'monthly' | 'yearly';

interface SubscriptionPlan {
    id: string;
    name: string;
    monthlyPrice: number;
    yearlyPrice: number;
    description: string;
    features: string[];
    popular?: boolean;
    hidden?: boolean;
    icon: keyof typeof Ionicons.glyphMap;
}

const subscriptionPlans: SubscriptionPlan[] = [
    {
        id: 'basic',
        name: 'Basic',
        monthlyPrice: 0,
        yearlyPrice: 0,
        description: 'Perfect for getting started',
        icon: 'fitness-outline',
        features: [
            'Basic workout tracking',
            'Limited exercise library',
            '3 saved workouts',
            'Basic progress stats',
        ],
    },
    {
        id: 'pro',
        name: 'Pro',
        monthlyPrice: 9.99,
        yearlyPrice: 79.99,
        description: 'For serious fitness enthusiasts',
        icon: 'flame-outline',
        popular: true,
        features: [
            'Unlimited workout tracking',
            'Full exercise library',
            'Unlimited saved workouts',
            'Advanced analytics',
            'Custom workout plans',
            'Priority support',
        ],
    },
    {
        id: 'elite',
        name: 'Elite',
        monthlyPrice: 19.99,
        yearlyPrice: 149.99,
        description: 'Ultimate fitness experience',
        icon: 'trophy-outline',
        hidden: true, // Example: this plan is hidden
        features: [
            'Everything in Pro',
            'Personal trainer access',
            'AI-powered recommendations',
            'Nutrition tracking',
            'Video consultations',
            '1-on-1 coaching sessions',
            'Exclusive content',
        ],
    },
];

export default function SubscriptionsScreen() {
    const { isDark } = useTheme();
    const colors = getColors(isDark);
    const gradients = Gradients[isDark ? 'dark' : 'light'];
    const router = useRouter();
    const [selectedPlan, setSelectedPlan] = useState<PlanType>('yearly');

    const getPrice = (plan: SubscriptionPlan) => {
        return selectedPlan === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
    };

    const getSavings = (plan: SubscriptionPlan) => {
        if (plan.monthlyPrice === 0) return 0;
        const yearlyMonthly = plan.monthlyPrice * 12;
        return Math.round(((yearlyMonthly - plan.yearlyPrice) / yearlyMonthly) * 100);
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Pressable
                        onPress={() => router.back()}
                        style={[styles.backButton, { backgroundColor: colors.surfaceSecondary }]}
                    >
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </Pressable>
                    <Text style={[styles.title, { color: colors.text }]}>
                        Choose Your Plan
                    </Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                        Unlock your full fitness potential
                    </Text>
                </View>

                {/* Plan Toggle */}
                <View style={[styles.toggleContainer, { backgroundColor: colors.surfaceSecondary }]}>
                    <Pressable
                        onPress={() => setSelectedPlan('monthly')}
                        style={[
                            styles.toggleButton,
                            selectedPlan === 'monthly' && {
                                backgroundColor: colors.primary,
                            },
                        ]}
                    >
                        <Text
                            style={[
                                styles.toggleText,
                                { color: selectedPlan === 'monthly' ? '#FFFFFF' : colors.textSecondary },
                            ]}
                        >
                            Monthly
                        </Text>
                    </Pressable>
                    <Pressable
                        onPress={() => setSelectedPlan('yearly')}
                        style={[
                            styles.toggleButton,
                            selectedPlan === 'yearly' && {
                                backgroundColor: colors.primary,
                            },
                        ]}
                    >
                        <Text
                            style={[
                                styles.toggleText,
                                { color: selectedPlan === 'yearly' ? '#FFFFFF' : colors.textSecondary },
                            ]}
                        >
                            Yearly
                        </Text>
                        <View style={[styles.saveBadge, { backgroundColor: colors.success }]}>
                            <Text style={styles.saveBadgeText}>Save 33%</Text>
                        </View>
                    </Pressable>
                </View>

                {/* Subscription Cards */}
                <View style={styles.cardsContainer}>
                    {subscriptionPlans.map((plan) => (
                        <SubscriptionCard
                            key={plan.id}
                            plan={plan}
                            price={getPrice(plan)}
                            savings={getSavings(plan)}
                            isYearly={selectedPlan === 'yearly'}
                            colors={colors}
                            gradients={gradients}
                            isDark={isDark}
                        />
                    ))}
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={[styles.footerText, { color: colors.textTertiary }]}>
                        Cancel anytime • No hidden fees
                    </Text>
                    <View style={styles.guaranteeContainer}>
                        <Ionicons name="shield-checkmark" size={20} color={colors.success} />
                        <Text style={[styles.guaranteeText, { color: colors.textSecondary }]}>
                            30-day money-back guarantee
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

interface SubscriptionCardProps {
    plan: SubscriptionPlan;
    price: number;
    savings: number;
    isYearly: boolean;
    colors: ReturnType<typeof getColors>;
    gradients: typeof Gradients.light;
    isDark: boolean;
}

function SubscriptionCard({ plan, price, savings, isYearly, colors, gradients, isDark }: SubscriptionCardProps) {
    const shadows = Shadows[isDark ? 'dark' : 'light'];

    return (
        <View style={[styles.cardWrapper, plan.popular && styles.popularCardWrapper]}>
            {plan.popular && (
                <LinearGradient
                    colors={gradients.premium as [string, string, ...string[]]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.popularBadge}
                >
                    <Text style={styles.popularBadgeText}>Most Popular</Text>
                </LinearGradient>
            )}
            <GlassCard
                intensity={plan.popular ? 'heavy' : 'medium'}
                style={{
                    ...styles.card,
                    ...(plan.popular && {
                        borderColor: colors.primary,
                        borderWidth: 2,
                    }),
                    ...(plan.hidden && {
                        opacity: 0.7,
                    }),
                    ...shadows.large,
                }}
            >
                {/* Hidden Plan Banner */}
                {plan.hidden && (
                    <View style={[styles.hiddenBanner, { backgroundColor: colors.error }]}>
                        <Ionicons name="eye-off" size={16} color="#FFFFFF" />
                        <Text style={styles.hiddenBannerText}>This plan is not visible now</Text>
                    </View>
                )}

                {/* Plan Header */}
                <View style={styles.cardHeader}>
                    <View
                        style={[
                            styles.iconContainer,
                            { backgroundColor: plan.popular ? colors.primary : colors.surfaceSecondary },
                        ]}
                    >
                        <Ionicons
                            name={plan.icon}
                            size={28}
                            color={plan.popular ? '#FFFFFF' : colors.primary}
                        />
                    </View>
                    <Text style={[styles.planName, { color: colors.text }]}>{plan.name}</Text>
                    <Text style={[styles.planDescription, { color: colors.textSecondary }]}>
                        {plan.description}
                    </Text>
                </View>

                {/* Price */}
                <View style={styles.priceContainer}>
                    <Text style={[styles.currency, { color: colors.primary }]}>$</Text>
                    <Text style={[styles.price, { color: colors.text }]}>
                        {price === 0 ? 'Free' : price.toFixed(2)}
                    </Text>
                    {price > 0 && (
                        <Text style={[styles.period, { color: colors.textTertiary }]}>
                            /{isYearly ? 'year' : 'month'}
                        </Text>
                    )}
                </View>

                {isYearly && savings > 0 && (
                    <View style={[styles.savingsContainer, { backgroundColor: colors.successLight }]}>
                        <Text style={[styles.savingsText, { color: colors.success }]}>
                            Save {savings}% with yearly billing
                        </Text>
                    </View>
                )}

                {/* Features */}
                <View style={styles.featuresContainer}>
                    {plan.features.map((feature, index) => (
                        <View key={index} style={styles.featureRow}>
                            <Ionicons
                                name="checkmark-circle"
                                size={20}
                                color={colors.success}
                            />
                            <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                                {feature}
                            </Text>
                        </View>
                    ))}
                </View>

                {/* CTA Button */}
                <AnimatedButton
                    variant={plan.popular ? 'primary' : 'outline'}
                    size="large"
                    fullWidth
                    onPress={() => console.log(`Selected ${plan.name}`)}
                >
                    {price === 0 ? 'Get Started Free' : 'Subscribe Now'}
                </AnimatedButton>
            </GlassCard>
        </View>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 24,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: BorderRadius.medium,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        lineHeight: 24,
    },
    toggleContainer: {
        flexDirection: 'row',
        marginHorizontal: 20,
        padding: 4,
        borderRadius: BorderRadius.medium,
        marginBottom: 24,
    },
    toggleButton: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: BorderRadius.small,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
    },
    toggleText: {
        fontSize: 15,
        fontWeight: '600',
    },
    saveBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: BorderRadius.small,
    },
    saveBadgeText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '700',
    },
    cardsContainer: {
        paddingHorizontal: 20,
        gap: 20,
    },
    cardWrapper: {
        position: 'relative',
    },
    popularCardWrapper: {
        marginTop: 12,
    },
    popularBadge: {
        position: 'absolute',
        top: -12,
        left: '50%',
        transform: [{ translateX: -60 }],
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: BorderRadius.round,
        zIndex: 1,
    },
    popularBadgeText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    card: {
        padding: 24,
    },
    cardHeader: {
        alignItems: 'center',
        marginBottom: 20,
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: BorderRadius.large,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    planName: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 4,
    },
    planDescription: {
        fontSize: 14,
        textAlign: 'center',
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'center',
        marginBottom: 8,
    },
    currency: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 8,
    },
    price: {
        fontSize: 48,
        fontWeight: '800',
        lineHeight: 56,
    },
    period: {
        fontSize: 16,
        marginBottom: 12,
        marginLeft: 4,
    },
    savingsContainer: {
        alignSelf: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: BorderRadius.small,
        marginBottom: 20,
    },
    savingsText: {
        fontSize: 13,
        fontWeight: '600',
    },
    featuresContainer: {
        marginBottom: 24,
        gap: 12,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    featureText: {
        fontSize: 15,
        flex: 1,
    },
    footer: {
        paddingHorizontal: 20,
        paddingTop: 32,
        alignItems: 'center',
        gap: 12,
    },
    footerText: {
        fontSize: 14,
    },
    guaranteeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    guaranteeText: {
        fontSize: 14,
        fontWeight: '500',
    },
    hiddenBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: BorderRadius.small,
        marginBottom: 16,
    },
    hiddenBannerText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
});
