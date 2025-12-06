import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useUser } from '@clerk/clerk-expo';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getColors, Shadows } from '@/constants/colors';
import { StatusBar } from 'expo-status-bar';

export default function CreatePaymentRequestScreen() {
  const { clientId } = useLocalSearchParams();
  const { user } = useUser();
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = getColors(scheme === 'dark');
  const shadows = scheme === 'dark' ? Shadows.dark : Shadows.light;

  const createPaymentRequest = useMutation(api.paymentRequests.createPaymentRequest);
  const createNotification = useMutation(api.notifications.createNotification);

  // Fetch client data
  const client = useQuery(
    api.users.getUserByClerkId,
    clientId ? { clerkId: clientId as string } : 'skip'
  );

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [sessionDate, setSessionDate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!amount || !description || !user?.id || !clientId) {
      alert('Please fill in all required fields');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      await createPaymentRequest({
        trainerId: user.id,
        clientId: clientId as string,
        amount: amountNum,
        currency: 'USD',
        description: description,
        sessionDate: sessionDate || undefined,
      });

      // Send notification to client
      await createNotification({
        userId: clientId as string,
        type: 'trainer_added',
        title: 'Payment Request',
        message: `${user.firstName || 'Your trainer'} has sent you a payment request for $${amountNum} - ${description}`,
        read: false,
      });

      router.back();
    } catch (error) {
      console.error('Error creating payment request:', error);
      alert('Failed to create payment request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!client) {
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
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      
      {/* Header */}
      <View 
        className="px-5 pt-14 pb-5 flex-row items-center justify-between"
        style={{
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center rounded-full"
          style={{ backgroundColor: colors.surface }}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text className="text-xl font-bold" style={{ color: colors.text }}>
          Payment Request
        </Text>
        <View className="w-10" />
      </View>

      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 30, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Client Info */}
        <View
          className="rounded-2xl p-5 mb-6 items-center"
          style={{ backgroundColor: colors.surface, ...shadows.medium }}
        >
          <Text className="text-sm mb-2" style={{ color: colors.textSecondary }}>
            Sending request to
          </Text>
          <Text className="text-xl font-bold" style={{ color: colors.text }}>
            {client.fullName}
          </Text>
          <Text className="text-sm mt-1" style={{ color: colors.textSecondary }}>
            {client.email}
          </Text>
        </View>

        {/* Amount */}
        <View className="mb-6">
          <Text className="text-sm font-semibold mb-2" style={{ color: colors.text }}>
            Amount *
          </Text>
          <View className="relative">
            <View 
              className="absolute left-4 top-4 z-10"
            >
              <Text className="text-2xl font-bold" style={{ color: colors.textSecondary }}>
                $
              </Text>
            </View>
            <TextInput
              className="rounded-2xl py-4 pl-12 pr-4 text-2xl font-bold"
              style={{
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                color: colors.text,
                ...shadows.small,
              }}
              placeholder="0.00"
              placeholderTextColor={colors.textTertiary}
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
            />
          </View>
        </View>

        {/* Description */}
        <View className="mb-6">
          <Text className="text-sm font-semibold mb-2" style={{ color: colors.text }}>
            Description *
          </Text>
          <TextInput
            className="rounded-2xl px-4 py-4 text-base"
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              color: colors.text,
              minHeight: 100,
              textAlignVertical: 'top',
              ...shadows.small,
            }}
            placeholder="e.g., Personal Training Session, Monthly Package, etc."
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
          />
        </View>

        {/* Session Date (Optional) */}
        <View className="mb-6">
          <Text className="text-sm font-semibold mb-2" style={{ color: colors.text }}>
            Session Date (Optional)
          </Text>
          <View className="relative">
            <View 
              className="absolute left-4 top-4 z-10"
            >
              <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
            </View>
            <TextInput
              className="rounded-2xl py-4 pl-12 pr-4 text-base"
              style={{
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                color: colors.text,
                ...shadows.small,
              }}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textSecondary}
              value={sessionDate}
              onChangeText={setSessionDate}
            />
          </View>
        </View>

        {/* Info Card */}
        <View
          className="rounded-2xl p-4 flex-row items-start gap-3"
          style={{ backgroundColor: `${colors.primary}10` }}
        >
          <Ionicons name="information-circle" size={24} color={colors.primary} />
          <View className="flex-1">
            <Text className="text-sm font-semibold mb-1" style={{ color: colors.text }}>
              Offline Payment
            </Text>
            <Text className="text-xs leading-relaxed" style={{ color: colors.textSecondary }}>
              This is a payment request for offline payment. The client will be notified and can mark it as paid once they complete the payment.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View
        className="absolute bottom-0 left-0 right-0 px-5 py-4"
        style={{
          backgroundColor: colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          ...shadows.large,
        }}
      >
        <TouchableOpacity
          className="rounded-2xl py-4 items-center"
          style={{ 
            backgroundColor: colors.primary,
            opacity: (!amount || !description || loading) ? 0.5 : 1,
          }}
          onPress={handleSubmit}
          disabled={loading || !amount || !description}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text className="text-base font-bold text-white">Send Payment Request</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
