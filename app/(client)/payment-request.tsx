import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getColors, Shadows } from '@/constants/colors';
import { StatusBar } from 'expo-status-bar';

export default function PaymentRequestScreen() {
  const { paymentRequestId } = useLocalSearchParams();
  const { user } = useUser();
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = getColors(scheme === 'dark');
  const shadows = scheme === 'dark' ? Shadows.dark : Shadows.light;

  const markPaymentAsPaid = useMutation(api.paymentRequests.markPaymentAsPaid);
  const createNotification = useMutation(api.notifications.createNotification);

  // Fetch payment request
  const paymentRequest = useQuery(
    api.paymentRequests.getPaymentRequestById,
    paymentRequestId ? { paymentRequestId: paymentRequestId as any } : 'skip'
  );

  // Fetch trainer data
  const trainer = useQuery(
    api.users.getUserByClerkId,
    paymentRequest?.trainerId ? { clerkId: paymentRequest.trainerId } : 'skip'
  );

  const handleMarkAsPaid = async () => {
    if (!paymentRequest || !user?.id) return;

    try {
      await markPaymentAsPaid({
        paymentRequestId: paymentRequestId as any,
      });

      // Notify trainer
      await createNotification({
        userId: paymentRequest.trainerId,
        type: 'trainer_added',
        title: 'Payment Received',
        message: `${user.firstName || 'Client'} has marked the payment of $${paymentRequest.amount} as paid`,
        read: false,
      });

      router.push('/(client)/payment-request' as any);
    } catch (error) {
      console.error('Error marking payment as paid:', error instanceof Error ? error.message : 'Unknown error');
      alert('Failed to mark payment as paid. Please try again.');
    }
  };

  if (!paymentRequest || !trainer) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const isPending = paymentRequest.status === 'pending';

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
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
          onPress={() => router.push('/(client)/index' as any)}
          className="w-10 h-10 items-center justify-center rounded-full"
          style={{ backgroundColor: colors.surface }}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text className="text-lg font-semibold" style={{ color: colors.text }}>
          Payment Request
        </Text>
        <View className="w-10" />
      </View>

      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 30, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Trainer Info */}
        <View className="items-center mb-8">
          <Text className="text-base mb-3" style={{ color: colors.textSecondary }}>
            You have a payment request from
          </Text>
          <View className="flex-row items-center gap-3">
            <View
              className="w-12 h-12 rounded-full items-center justify-center overflow-hidden"
              style={{ backgroundColor: colors.primary }}
            >
              {trainer.profileImageId ? (
                <Image
                  source={{ uri: trainer.profileImageId }}
                  className="w-full h-full"
                />
              ) : (
                <Text className="text-white text-xl font-bold">
                  {trainer.fullName?.[0] || 'T'}
                </Text>
              )}
            </View>
            <Text className="text-xl font-semibold" style={{ color: colors.text }}>
              {trainer.fullName}
            </Text>
          </View>
        </View>

        {/* Amount */}
        <View className="items-center mb-8">
          <Text className="text-sm mb-1" style={{ color: colors.textSecondary }}>
            AMOUNT DUE
          </Text>
          <Text className="text-5xl font-bold" style={{ color: colors.text }}>
            ${paymentRequest.amount.toFixed(2)}
          </Text>
          <Text className="text-base mt-2" style={{ color: colors.textSecondary }}>
            {paymentRequest.description}
          </Text>
          {paymentRequest.sessionDate && (
            <View className="flex-row items-center gap-1 mt-2">
              <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
              <Text className="text-sm" style={{ color: colors.textSecondary }}>
                Session: {new Date(paymentRequest.sessionDate).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>

        {/* Status Badge */}
        {!isPending && (
          <View
            className="rounded-2xl p-4 mb-6 items-center"
            style={{ 
              backgroundColor: paymentRequest.status === 'paid' ? '#10B98120' : '#EF444420' 
            }}
          >
            <View className="flex-row items-center gap-2">
              <Ionicons 
                name={paymentRequest.status === 'paid' ? 'checkmark-circle' : 'close-circle'} 
                size={24} 
                color={paymentRequest.status === 'paid' ? '#10B981' : '#EF4444'} 
              />
              <Text 
                className="text-base font-semibold"
                style={{ 
                  color: paymentRequest.status === 'paid' ? '#10B981' : '#EF4444' 
                }}
              >
                {paymentRequest.status === 'paid' ? 'Paid' : 'Cancelled'}
              </Text>
            </View>
            {paymentRequest.paidAt && (
              <Text className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                on {new Date(paymentRequest.paidAt).toLocaleDateString()}
              </Text>
            )}
          </View>
        )}

        {/* Info Cards */}
        <View className="gap-4 mb-6">
          <TouchableOpacity
            className="rounded-xl p-4 flex-row items-center justify-between"
            style={{ backgroundColor: colors.surface, ...shadows.small }}
          >
            <View className="flex-row items-center gap-4">
              <View
                className="w-12 h-12 rounded-full items-center justify-center"
                style={{ backgroundColor: `${colors.primary}10` }}
              >
                <Ionicons name="receipt-outline" size={24} color={colors.primary} />
              </View>
              <View>
                <Text className="font-semibold" style={{ color: colors.text }}>
                  View Details
                </Text>
                <Text className="text-sm" style={{ color: colors.textSecondary }}>
                  Check the session details
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            className="rounded-xl p-4 flex-row items-center justify-between"
            style={{ backgroundColor: colors.surface, ...shadows.small }}
            onPress={() => router.push('/(client)/payment-history' as any)}
          >
            <View className="flex-row items-center gap-4">
              <View
                className="w-12 h-12 rounded-full items-center justify-center"
                style={{ backgroundColor: `${colors.primary}10` }}
              >
                <Ionicons name="time-outline" size={24} color={colors.primary} />
              </View>
              <View>
                <Text className="font-semibold" style={{ color: colors.text }}>
                  Payment History
                </Text>
                <Text className="text-sm" style={{ color: colors.textSecondary }}>
                  See all your past payments
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Security Info */}
        <View className="items-center">
          <View className="flex-row items-center gap-2">
            <Ionicons name="shield-checkmark" size={16} color="#10B981" />
            <Text className="text-sm" style={{ color: colors.textSecondary }}>
              Secure offline payment tracking
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Action Button */}
      {isPending && (
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
            style={{ backgroundColor: colors.primary }}
            onPress={handleMarkAsPaid}
          >
            <Text className="text-base font-bold text-white">Mark as Paid</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
