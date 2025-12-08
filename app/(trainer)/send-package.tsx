import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getColors, Shadows } from '@/constants/colors';
import { Id } from '@/convex/_generated/dataModel';

export default function SendPackageScreen() {
    const { packageId } = useLocalSearchParams();
    const { user } = useUser();
    const router = useRouter();
    const scheme = useColorScheme();
    const colors = getColors(scheme === 'dark');
    const shadows = scheme === 'dark' ? Shadows.dark : Shadows.light;
    const insets = useSafeAreaInsets();

    const pkg = useQuery(
        api.packages.getPackageById,
        packageId ? { packageId: packageId as Id<"packages"> } : 'skip'
    );

    const clients = useQuery(
        api.users.getTrainerClients,
        user?.id ? { trainerId: user.id } : 'skip'
    );

    const createBulkPaymentRequests = useMutation(api.paymentRequests.createBulkPaymentRequests);
    const createNotification = useMutation(api.notifications.createNotification);

    const [selectedClients, setSelectedClients] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const allSelected = clients && selectedClients.length === clients.length;

    const toggleAll = () => {
        if (allSelected) {
            setSelectedClients([]);
        } else if (clients) {
            setSelectedClients(clients.map((c: any) => c.clerkId));
        }
    };

    const toggleClient = (clientId: string) => {
        setSelectedClients(prev =>
            prev.includes(clientId) ? prev.filter(id => id !== clientId) : [...prev, clientId]
        );
    };

    const formatCurrency = (amount: number, currency: string) => {
        const symbols: { [key: string]: string } = { NOK: 'kr', USD: '$', EUR: '€' };
        return `${symbols[currency] || currency}${amount.toLocaleString()}`;
    };

    const handleSend = async () => {
        if (!pkg || !user?.id || selectedClients.length === 0) return;

        setLoading(true);
        try {
            await createBulkPaymentRequests({
                trainerId: user.id,
                clientIds: selectedClients,
                amount: pkg.amount,
                currency: pkg.currency,
                description: `${pkg.name} - ${pkg.description}`,
                packageId: packageId as Id<"packages">,
            });

            for (const clientId of selectedClients) {
                await createNotification({
                    userId: clientId,
                    type: 'booking_created',
                    title: 'Payment Request',
                    message: `Payment request: ${formatCurrency(pkg.amount, pkg.currency)} - ${pkg.name}`,
                });
            }

            alert(`Sent to ${selectedClients.length} client${selectedClients.length > 1 ? 's' : ''}`);
            router.replace('/(trainer)/payments' as any);
        } catch (error) {
            alert('Failed to send');
        } finally {
            setLoading(false);
        }
    };

    if (!pkg || !clients) {
        return (
            <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.background }}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View className="flex-1" style={{ backgroundColor: colors.background }}>
            {/* Header */}
            <View className="px-6 pb-4 flex-row items-center" style={{ paddingTop: insets.top + 12 }}>
                <TouchableOpacity
                    className="w-10 h-10 rounded-full items-center justify-center mr-3"
                    style={{ backgroundColor: colors.surface }}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={20} color={colors.text} />
                </TouchableOpacity>
                <Text className="text-xl font-bold" style={{ color: colors.text }}>Send Package</Text>
            </View>

            <ScrollView
                className="flex-1 px-6"
                contentContainerStyle={{ paddingBottom: 180 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Package Info */}
                <View className="rounded-xl p-4 mb-5" style={{ backgroundColor: colors.primary }}>
                    <Text className="text-white font-bold text-lg">{pkg.name}</Text>
                    <Text className="text-white font-bold text-2xl mt-1">{formatCurrency(pkg.amount, pkg.currency)}</Text>
                </View>

                {/* Select All */}
                <TouchableOpacity
                    className="flex-row items-center justify-between rounded-xl p-4 mb-4"
                    style={{ backgroundColor: colors.surface }}
                    onPress={toggleAll}
                >
                    <Text className="font-semibold" style={{ color: colors.text }}>Select All</Text>
                    <View
                        className="w-6 h-6 rounded-md items-center justify-center"
                        style={{ backgroundColor: allSelected ? colors.primary : 'transparent', borderWidth: allSelected ? 0 : 2, borderColor: colors.border }}
                    >
                        {allSelected && <Ionicons name="checkmark" size={16} color="#FFF" />}
                    </View>
                </TouchableOpacity>

                {/* Clients */}
                <Text className="text-sm font-medium mb-3" style={{ color: colors.textSecondary }}>
                    Clients ({selectedClients.length}/{clients.length})
                </Text>

                {clients.length === 0 ? (
                    <View className="py-10 items-center">
                        <Ionicons name="people-outline" size={40} color={colors.textTertiary} />
                        <Text className="mt-3" style={{ color: colors.textSecondary }}>No clients</Text>
                    </View>
                ) : (
                    clients.map((client: any) => {
                        const selected = selectedClients.includes(client.clerkId);
                        return (
                            <TouchableOpacity
                                key={client._id}
                                className="flex-row items-center rounded-xl p-4 mb-2"
                                style={{ backgroundColor: selected ? `${colors.primary}10` : colors.surface, borderWidth: selected ? 1 : 0, borderColor: colors.primary }}
                                onPress={() => toggleClient(client.clerkId)}
                            >
                                <View
                                    className="w-10 h-10 rounded-full items-center justify-center mr-3"
                                    style={{ backgroundColor: colors.primary }}
                                >
                                    {client.profileImageId ? (
                                        <Image source={{ uri: client.profileImageId }} className="w-full h-full rounded-full" />
                                    ) : (
                                        <Text className="text-white font-bold">{client.fullName?.[0] || 'C'}</Text>
                                    )}
                                </View>
                                <Text className="flex-1 font-medium" style={{ color: colors.text }}>{client.fullName}</Text>
                                <View
                                    className="w-6 h-6 rounded-md items-center justify-center"
                                    style={{ backgroundColor: selected ? colors.primary : 'transparent', borderWidth: selected ? 0 : 2, borderColor: colors.border }}
                                >
                                    {selected && <Ionicons name="checkmark" size={16} color="#FFF" />}
                                </View>
                            </TouchableOpacity>
                        );
                    })
                )}
            </ScrollView>

            {/* Bottom */}
            <View
                className="absolute bottom-0 left-0 right-0 px-6"
                style={{ backgroundColor: colors.background, paddingBottom: insets.bottom + 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border }}
            >
                {selectedClients.length > 0 && (
                    <View className="flex-row justify-between mb-3">
                        <Text style={{ color: colors.textSecondary }}>Total</Text>
                        <Text className="font-bold" style={{ color: colors.text }}>
                            {formatCurrency(pkg.amount * selectedClients.length, pkg.currency)}
                        </Text>
                    </View>
                )}
                <TouchableOpacity
                    className="py-4 rounded-xl items-center"
                    style={{ backgroundColor: colors.primary, opacity: selectedClients.length === 0 || loading ? 0.5 : 1 }}
                    onPress={handleSend}
                    disabled={selectedClients.length === 0 || loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFF" size="small" />
                    ) : (
                        <Text className="text-white font-semibold">
                            {selectedClients.length === 0 ? 'Select clients' : `Send to ${selectedClients.length} client${selectedClients.length !== 1 ? 's' : ''}`}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}
