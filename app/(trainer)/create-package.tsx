import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getColors, Shadows } from '@/constants/colors';
import { Id } from '@/convex/_generated/dataModel';

const CURRENCIES = [
    { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' },
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
];

export default function CreatePackageScreen() {
    const { packageId } = useLocalSearchParams();
    const { user } = useUser();
    const router = useRouter();
    const scheme = useColorScheme();
    const colors = getColors(scheme === 'dark');
    const shadows = scheme === 'dark' ? Shadows.dark : Shadows.light;
    const insets = useSafeAreaInsets();

    const existingPackage = useQuery(
        api.packages.getPackageById,
        packageId ? { packageId: packageId as Id<"packages"> } : 'skip'
    );

    const createPackage = useMutation(api.packages.createPackage);
    const updatePackage = useMutation(api.packages.updatePackage);

    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [currency, setCurrency] = useState('NOK');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

    const isEditing = !!packageId;
    const isValid = name.trim() && amount && description.trim();

    useEffect(() => {
        if (existingPackage) {
            setName(existingPackage.name);
            setAmount(existingPackage.amount.toString());
            setCurrency(existingPackage.currency);
            setDescription(existingPackage.description);
        }
    }, [existingPackage]);

    const handleSave = async () => {
        if (!isValid || !user?.id) return;
        const amountNum = parseFloat(amount);
        if (isNaN(amountNum) || amountNum <= 0) return alert('Invalid amount');

        setLoading(true);
        try {
            if (isEditing && packageId) {
                await updatePackage({ packageId: packageId as Id<"packages">, name, amount: amountNum, currency, description });
            } else {
                await createPackage({ trainerId: user.id, name, amount: amountNum, currency, description });
            }
            router.back();
        } catch (error) {
            alert('Failed to save');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAndSend = async () => {
        if (!isValid || !user?.id) return;
        const amountNum = parseFloat(amount);
        if (isNaN(amountNum) || amountNum <= 0) return alert('Invalid amount');

        setLoading(true);
        try {
            let pkgId = packageId;
            if (isEditing && packageId) {
                await updatePackage({ packageId: packageId as Id<"packages">, name, amount: amountNum, currency, description });
            } else {
                pkgId = await createPackage({ trainerId: user.id, name, amount: amountNum, currency, description });
            }
            router.replace(`/(trainer)/send-package?packageId=${pkgId}` as any);
        } catch (error) {
            alert('Failed to save');
        } finally {
            setLoading(false);
        }
    };

    const selectedCurrency = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];

    if (isEditing && existingPackage === undefined) {
        return (
            <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.background }}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            className="flex-1"
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ backgroundColor: colors.background }}
        >
            {/* Header */}
            <View className="px-6 pb-4 flex-row items-center" style={{ paddingTop: insets.top + 12 }}>
                <TouchableOpacity
                    className="w-10 h-10 rounded-full items-center justify-center mr-3"
                    style={{ backgroundColor: colors.surface }}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={20} color={colors.text} />
                </TouchableOpacity>
                <Text className="text-xl font-bold" style={{ color: colors.text }}>
                    {isEditing ? 'Edit Package' : 'New Package'}
                </Text>
            </View>

            <ScrollView
                className="flex-1 px-6"
                contentContainerStyle={{ paddingBottom: 160 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Name */}
                <Text className="text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>Name</Text>
                <TextInput
                    className="rounded-xl px-4 py-3.5 mb-5"
                    style={{ backgroundColor: colors.surface, color: colors.text }}
                    placeholder="Package name"
                    placeholderTextColor={colors.textTertiary}
                    value={name}
                    onChangeText={setName}
                />

                {/* Amount */}
                <Text className="text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>Amount</Text>
                <View className="flex-row gap-2 mb-5">
                    <TouchableOpacity
                        className="rounded-xl px-4 py-3.5 flex-row items-center"
                        style={{ backgroundColor: colors.surface }}
                        onPress={() => setShowCurrencyPicker(!showCurrencyPicker)}
                    >
                        <Text className="font-semibold" style={{ color: colors.text }}>{selectedCurrency.code}</Text>
                        <Ionicons name="chevron-down" size={16} color={colors.textSecondary} style={{ marginLeft: 4 }} />
                    </TouchableOpacity>
                    <TextInput
                        className="flex-1 rounded-xl px-4 py-3.5"
                        style={{ backgroundColor: colors.surface, color: colors.text }}
                        placeholder="0.00"
                        placeholderTextColor={colors.textTertiary}
                        keyboardType="decimal-pad"
                        value={amount}
                        onChangeText={setAmount}
                    />
                </View>

                {/* Currency Picker */}
                {showCurrencyPicker && (
                    <View className="rounded-xl mb-5 overflow-hidden" style={{ backgroundColor: colors.surface }}>
                        {CURRENCIES.map((curr) => (
                            <TouchableOpacity
                                key={curr.code}
                                className="px-4 py-3 flex-row items-center justify-between"
                                style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
                                onPress={() => { setCurrency(curr.code); setShowCurrencyPicker(false); }}
                            >
                                <Text style={{ color: colors.text }}>{curr.code} - {curr.name}</Text>
                                {currency === curr.code && <Ionicons name="checkmark" size={18} color={colors.primary} />}
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* Description */}
                <Text className="text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>Description</Text>
                <TextInput
                    className="rounded-xl px-4 py-3.5 mb-5"
                    style={{ backgroundColor: colors.surface, color: colors.text, minHeight: 100, textAlignVertical: 'top' }}
                    placeholder="What's included..."
                    placeholderTextColor={colors.textTertiary}
                    multiline
                    value={description}
                    onChangeText={setDescription}
                />

                {/* Preview */}
                {isValid && (
                    <View className="rounded-xl p-4" style={{ backgroundColor: colors.primary }}>
                        <Text className="text-white/70 text-xs mb-1">Preview</Text>
                        <Text className="text-white font-bold text-lg">{name}</Text>
                        <Text className="text-white font-bold text-2xl mt-1">{selectedCurrency.symbol}{amount}</Text>
                    </View>
                )}
            </ScrollView>

            {/* Bottom Buttons */}
            <View
                className="absolute bottom-0 left-0 right-0 px-6 flex-row gap-3"
                style={{ backgroundColor: colors.background, paddingBottom: insets.bottom + 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border }}
            >
                <TouchableOpacity
                    className="flex-1 py-4 rounded-xl items-center"
                    style={{ backgroundColor: colors.surface, opacity: !isValid || loading ? 0.5 : 1 }}
                    onPress={handleSave}
                    disabled={!isValid || loading}
                >
                    <Text className="font-semibold" style={{ color: colors.text }}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    className="flex-[1.5] py-4 rounded-xl items-center flex-row justify-center"
                    style={{ backgroundColor: colors.primary, opacity: !isValid || loading ? 0.5 : 1 }}
                    onPress={handleSaveAndSend}
                    disabled={!isValid || loading}
                >
                    {loading ? <ActivityIndicator color="#FFF" size="small" /> : (
                        <>
                            <Ionicons name="send" size={18} color="#FFF" />
                            <Text className="text-white font-semibold ml-2">Save & Send</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}
