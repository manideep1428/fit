import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getColors, Shadows } from '@/constants/colors';

export default function PaymentsScreen() {
    const { user } = useUser();
    const router = useRouter();
    const scheme = useColorScheme();
    const colors = getColors(scheme === 'dark');
    const shadows = scheme === 'dark' ? Shadows.dark : Shadows.light;
    const insets = useSafeAreaInsets();
    const [activeTab, setActiveTab] = useState<'packages' | 'history'>('packages');

    const packages = useQuery(
        api.packages.getTrainerPackages,
        user?.id ? { trainerId: user.id } : 'skip'
    );

    const paymentRequests = useQuery(
        api.paymentRequests.getTrainerPaymentRequests,
        user?.id ? { trainerId: user.id } : 'skip'
    );

    const clients = useQuery(api.users.getAllClients);
    const deletePackage = useMutation(api.packages.deletePackage);
    const markAsPaid = useMutation(api.paymentRequests.markPaymentAsPaid);
    const cancelPayment = useMutation(api.paymentRequests.cancelPaymentRequest);

    if (!user || !packages || !paymentRequests || !clients) {
        return (
            <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.background }}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    const enrichedPayments = paymentRequests.map((payment: any) => {
        const client = clients.find((c: any) => c.clerkId === payment.clientId);
        return { ...payment, clientName: client?.fullName || 'Client' };
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'paid': return colors.success;
            case 'pending': return colors.warning;
            case 'cancelled': return colors.error;
            default: return colors.primary;
        }
    };

    const handleDeletePackage = (packageId: any) => {
        Alert.alert('Delete Package', 'Delete this package?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => deletePackage({ packageId }) },
        ]);
    };

    const formatCurrency = (amount: number, currency: string) => {
        const symbols: { [key: string]: string } = { NOK: 'kr', USD: '$', EUR: '€' };
        return `${symbols[currency] || currency}${amount.toLocaleString()}`;
    };

    const handleMarkAsPaid = (paymentId: any) => markAsPaid({ paymentRequestId: paymentId });

    const handleCancelPayment = (paymentId: any) => {
        Alert.alert('Cancel Payment', 'Cancel this request?', [
            { text: 'No', style: 'cancel' },
            { text: 'Yes', style: 'destructive', onPress: () => cancelPayment({ paymentRequestId: paymentId }) },
        ]);
    };

    return (
        <View className="flex-1" style={{ backgroundColor: colors.background }}>
            {/* Header */}
            <View className="px-6 pb-4" style={{ paddingTop: insets.top + 12 }}>
                <View className="flex-row items-center justify-between">
                    <Text className="text-2xl font-bold" style={{ color: colors.text }}>Payments</Text>
                    <TouchableOpacity
                        className="w-10 h-10 rounded-full items-center justify-center"
                        style={{ backgroundColor: colors.primary }}
                        onPress={() => router.push('/(trainer)/create-package' as any)}
                    >
                        <Ionicons name="add" size={24} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Tabs */}
            <View className="flex-row mx-6 mb-4 gap-2">
                {(['packages', 'history'] as const).map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        className="flex-1 py-3 rounded-xl items-center"
                        style={{
                            backgroundColor: activeTab === tab ? colors.primary : colors.surface,
                        }}
                        onPress={() => setActiveTab(tab)}
                    >
                        <Text
                            className="text-sm font-semibold capitalize"
                            style={{ color: activeTab === tab ? '#FFF' : colors.textSecondary }}
                        >
                            {tab}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Content */}
            <ScrollView
                className="flex-1 px-6"
                contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
                showsVerticalScrollIndicator={false}
            >
                {activeTab === 'packages' ? (
                    packages.length === 0 ? (
                        <View className="py-20 items-center">
                            <Ionicons name="pricetag-outline" size={48} color={colors.textTertiary} />
                            <Text className="text-base font-semibold mt-4" style={{ color: colors.textSecondary }}>
                                No packages yet
                            </Text>
                            <TouchableOpacity
                                className="mt-4 px-6 py-3 rounded-full"
                                style={{ backgroundColor: colors.primary }}
                                onPress={() => router.push('/(trainer)/create-package' as any)}
                            >
                                <Text className="text-white font-semibold">Create Package</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        packages.map((pkg: any) => (
                            <View
                                key={pkg._id}
                                className="rounded-2xl p-4 mb-3"
                                style={{ backgroundColor: colors.surface, ...shadows.small }}
                            >
                                <View className="flex-row justify-between items-start mb-2">
                                    <Text className="text-lg font-bold flex-1" style={{ color: colors.text }}>
                                        {pkg.name}
                                    </Text>
                                    <Text className="text-xl font-bold" style={{ color: colors.primary }}>
                                        {formatCurrency(pkg.amount, pkg.currency)}
                                    </Text>
                                </View>
                                <Text className="text-sm mb-4" style={{ color: colors.textSecondary }}>
                                    {pkg.description}
                                </Text>
                                <View className="flex-row gap-2">
                                    <TouchableOpacity
                                        className="flex-1 py-2.5 rounded-lg items-center"
                                        style={{ backgroundColor: colors.surfaceSecondary }}
                                        onPress={() => router.push(`/(trainer)/create-package?packageId=${pkg._id}` as any)}
                                    >
                                        <Text className="text-sm font-medium" style={{ color: colors.textSecondary }}>Edit</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        className="flex-1 py-2.5 rounded-lg items-center"
                                        style={{ backgroundColor: `${colors.error}15` }}
                                        onPress={() => handleDeletePackage(pkg._id)}
                                    >
                                        <Text className="text-sm font-medium" style={{ color: colors.error }}>Delete</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        className="flex-[2] py-2.5 rounded-lg items-center"
                                        style={{ backgroundColor: colors.primary }}
                                        onPress={() => router.push(`/(trainer)/send-package?packageId=${pkg._id}` as any)}
                                    >
                                        <Text className="text-sm font-semibold text-white">Send</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))
                    )
                ) : enrichedPayments.length === 0 ? (
                    <View className="py-20 items-center">
                        <Ionicons name="receipt-outline" size={48} color={colors.textTertiary} />
                        <Text className="text-base font-semibold mt-4" style={{ color: colors.textSecondary }}>
                            No payment history
                        </Text>
                    </View>
                ) : (
                    enrichedPayments.map((payment: any) => (
                        <View
                            key={payment._id}
                            className="rounded-2xl p-4 mb-3"
                            style={{ backgroundColor: colors.surface, ...shadows.small }}
                        >
                            <View className="flex-row justify-between items-start mb-2">
                                <View>
                                    <Text className="text-base font-semibold" style={{ color: colors.text }}>
                                        {payment.clientName}
                                    </Text>
                                    <Text className="text-xs mt-0.5" style={{ color: colors.textTertiary }}>
                                        {new Date(payment.createdAt).toLocaleDateString()}
                                    </Text>
                                </View>
                                <View className="items-end">
                                    <Text className="text-lg font-bold" style={{ color: colors.text }}>
                                        {formatCurrency(payment.amount, payment.currency)}
                                    </Text>
                                    <View
                                        className="px-2 py-0.5 rounded mt-1"
                                        style={{ backgroundColor: `${getStatusColor(payment.status)}20` }}
                                    >
                                        <Text className="text-xs font-semibold uppercase" style={{ color: getStatusColor(payment.status) }}>
                                            {payment.status}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                            {payment.status === 'pending' && (
                                <View className="flex-row gap-2 mt-3">
                                    <TouchableOpacity
                                        className="flex-1 py-2.5 rounded-lg items-center"
                                        style={{ backgroundColor: `${colors.success}15` }}
                                        onPress={() => handleMarkAsPaid(payment._id)}
                                    >
                                        <Text className="text-sm font-medium" style={{ color: colors.success }}>Mark Paid</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        className="flex-1 py-2.5 rounded-lg items-center"
                                        style={{ backgroundColor: `${colors.error}15` }}
                                        onPress={() => handleCancelPayment(payment._id)}
                                    >
                                        <Text className="text-sm font-medium" style={{ color: colors.error }}>Cancel</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    ))
                )}
            </ScrollView>
        </View>
    );
}
