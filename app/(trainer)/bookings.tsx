import { useState } from 'react';
import { View, ActivityIndicator, TouchableOpacity, Text, ScrollView, Modal } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '@/convex/_generated/api';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getColors, Shadows } from '@/constants/colors';
import CalendarView from '@/components/CalendarView';
import { Ionicons } from '@expo/vector-icons';
import GoogleCalendarAuth from '@/components/GoogleCalendarAuth';
import GoogleTokenStatus from '@/components/GoogleTokenStatus';
import Toast from 'react-native-toast-message';
import { Id } from '@/convex/_generated/dataModel';
import ConfirmDialog from '@/components/ConfirmDialog';


export default function BookingsScreen() {
  const { user } = useUser();
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = getColors(scheme === 'dark');
  const shadows = scheme === 'dark' ? Shadows.dark : Shadows.light;
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'schedule' | 'bookings'>('bookings');
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    visible: boolean;
    title: string;
    message: string;
    confirmText: string;
    confirmColor: string;
    icon: keyof typeof Ionicons.glyphMap;
    onConfirm: () => void;
  } | null>(null);

  const approveCancellation = useMutation(api.bookings.approveCancellation);
  const rejectCancellation = useMutation(api.bookings.rejectCancellation);
  const completeSession = useMutation(api.bookings.completeSession);

  const currentUser = useQuery(
    api.users.getUserByClerkId,
    user?.id ? { clerkId: user.id } : 'skip'
  );

  const bookings = useQuery(
    api.bookings.getTrainerBookings,
    user?.id ? { trainerId: user.id } : 'skip'
  );

  const clients = useQuery(api.users.getAllClients);

  if (!user || !bookings || !clients) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const enrichedBookings = bookings.map((booking: any) => {
    const client = clients.find((c: any) => c.clerkId === booking.clientId);
    return {
      ...booking,
      clientName: client?.fullName || 'Client',
      scheduleName: booking.notes || 'Training Session',
    };
  });

  const now = new Date();
  const currentBookings = enrichedBookings
    .filter((b: any) => {
      if (b.status === 'cancelled' || b.status === 'completed') return false;
      const bookingDateTime = new Date(b.startTime);
      return bookingDateTime >= now;
    })
    .sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    
  const pastBookings = enrichedBookings
    .filter((b: any) => {
      const bookingDateTime = new Date(b.startTime);
      return bookingDateTime < now || b.status === 'completed';
    })
    .sort((a: any, b: any) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'confirmed': return colors.success;
      case 'pending': return colors.warning;
      case 'cancelled': return colors.error;
      case 'cancellation_requested': return colors.warning;
      default: return colors.primary;
    }
  };

  const handleApproveCancellation = (bookingId: Id<"bookings">, clientName: string) => {
    setConfirmDialog({
      visible: true,
      title: "Approve Cancellation",
      message: `Approve ${clientName}'s cancellation request? 1 session will be returned to their package.`,
      confirmText: "Approve",
      confirmColor: colors.success,
      icon: "checkmark-circle-outline",
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          await approveCancellation({
            bookingId,
            approvedBy: user!.id,
          });
          Toast.show({
            type: "success",
            text1: "Cancellation Approved",
            text2: "Session returned to client's package",
            position: "top",
            visibilityTime: 3000,
          });
        } catch (error: any) {
          Toast.show({
            type: "error",
            text1: "Approval Failed",
            text2: error.message || "Unable to approve cancellation",
            position: "top",
            visibilityTime: 3000,
          });
        }
      },
    });
  };

  const handleRejectCancellation = (bookingId: Id<"bookings">, clientName: string) => {
    setConfirmDialog({
      visible: true,
      title: "Decline Cancellation",
      message: `Decline ${clientName}'s cancellation request? The session will remain scheduled.`,
      confirmText: "Decline",
      confirmColor: colors.error,
      icon: "close-circle-outline",
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          await rejectCancellation({
            bookingId,
            rejectedBy: user!.id,
          });
          Toast.show({
            type: "info",
            text1: "Cancellation Declined",
            text2: "Session remains scheduled",
            position: "top",
            visibilityTime: 3000,
          });
        } catch (error: any) {
          Toast.show({
            type: "error",
            text1: "Action Failed",
            text2: error.message || "Unable to decline cancellation",
            position: "top",
            visibilityTime: 3000,
          });
        }
      },
    });
  };

  const handleCompleteSession = (bookingId: Id<"bookings">, clientName: string) => {
    setConfirmDialog({
      visible: true,
      title: "Complete Session",
      message: `Mark session with ${clientName} as completed? This will deduct 1 session from their package.`,
      confirmText: "Complete",
      confirmColor: colors.success,
      icon: "checkmark-done-outline",
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          await completeSession({ bookingId });
          Toast.show({
            type: "success",
            text1: "Session Completed",
            text2: "Session marked as complete",
            position: "top",
            visibilityTime: 3000,
          });
        } catch (error: any) {
          Toast.show({
            type: "error",
            text1: "Failed to Complete",
            text2: error.message || "Unable to complete session",
            position: "top",
            visibilityTime: 3000,
          });
        }
      },
    });
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Header */}
      <View
        className="px-6 pb-5"
        style={{ backgroundColor: colors.surface, paddingTop: insets.top + 12 }}
      >
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-3xl font-bold" style={{ color: colors.text }}>Bookings</Text>
            <Text className="text-sm mt-1" style={{ color: colors.textSecondary }}>
              Manage your training sessions
            </Text>
          </View>

          {/* Google Calendar Status */}
          <GoogleTokenStatus onConnect={() => setShowCalendarModal(true)} />
        </View>
      </View>

      {/* Tab Header */}
      <View
        className="mx-6 my-4 p-1.5 rounded-2xl flex-row"
        style={{ backgroundColor: colors.surfaceSecondary }}
      >
        <TouchableOpacity
          className="flex-1 py-3 rounded-xl items-center flex-row justify-center"
          style={{
            backgroundColor: activeTab === 'bookings' ? colors.surface : 'transparent',
            ...(activeTab === 'bookings' ? shadows.small : {}),
          }}
          onPress={() => setActiveTab('bookings')}
        >
          <Ionicons
            name="list-outline"
            size={18}
            color={activeTab === 'bookings' ? colors.primary : colors.textSecondary}
          />
          <Text
            className="text-sm font-semibold ml-2"
            style={{ color: activeTab === 'bookings' ? colors.primary : colors.textSecondary }}
          >
            Bookings
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 py-3 rounded-xl items-center flex-row justify-center"
          style={{
            backgroundColor: activeTab === 'schedule' ? colors.surface : 'transparent',
            ...(activeTab === 'schedule' ? shadows.small : {}),
          }}
          onPress={() => setActiveTab('schedule')}
        >
          <Ionicons
            name="calendar-outline"
            size={18}
            color={activeTab === 'schedule' ? colors.primary : colors.textSecondary}
          />
          <Text
            className="text-sm font-semibold ml-2"
            style={{ color: activeTab === 'schedule' ? colors.primary : colors.textSecondary }}
          >
            Schedule
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'bookings' ? (
        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          {/* Current Bookings */}
          <View className="px-6 pt-2">
            <View className="flex-row items-center mb-4">
              <View
                className="w-8 h-8 rounded-lg items-center justify-center mr-3"
                style={{ backgroundColor: `${colors.success}15` }}
              >
                <Ionicons name="calendar" size={16} color={colors.success} />
              </View>
              <Text className="text-lg font-bold" style={{ color: colors.text }}>
                Upcoming
              </Text>
              {currentBookings.length > 0 && (
                <View
                  className="ml-2 px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: `${colors.primary}15` }}
                >
                  <Text className="text-xs font-bold" style={{ color: colors.primary }}>
                    {currentBookings.length}
                  </Text>
                </View>
              )}
            </View>

            {currentBookings.length === 0 ? (
              <View
                className="py-10 items-center rounded-2xl"
                style={{ backgroundColor: colors.surface, ...shadows.small }}
              >
                <View
                  className="w-16 h-16 rounded-2xl items-center justify-center mb-4"
                  style={{ backgroundColor: colors.surfaceSecondary }}
                >
                  <Ionicons name="calendar-outline" size={28} color={colors.textTertiary} />
                </View>
                <Text className="text-base font-semibold" style={{ color: colors.textSecondary }}>
                  No upcoming bookings
                </Text>
                <Text className="text-sm mt-1" style={{ color: colors.textTertiary }}>
                  New bookings will appear here
                </Text>
              </View>
            ) : (
              currentBookings.map((booking: any) => (
                <View
                  key={booking._id}
                  className="rounded-2xl p-4 mb-3 overflow-hidden"
                  style={{ backgroundColor: colors.surface, ...shadows.medium }}
                >
                  <View
                    className="absolute left-0 top-0 bottom-0 w-1"
                    style={{ backgroundColor: getStatusColor(booking.status) }}
                  />

                  <View className="flex-row items-start pl-2">
                    <View className="flex-1">
                      <View className="flex-row items-center justify-between">
                        <Text className="text-lg font-bold" style={{ color: colors.text }}>
                          {booking.clientName}
                        </Text>
                        <View
                          className="px-2.5 py-1 rounded-lg"
                          style={{ backgroundColor: `${getStatusColor(booking.status)}15` }}
                        >
                          <Text
                            className="text-xs font-bold uppercase"
                            style={{ color: getStatusColor(booking.status) }}
                          >
                            {booking.status}
                          </Text>
                        </View>
                      </View>

                      <View className="flex-row items-center mt-2">
                        <Ionicons name="fitness-outline" size={14} color={colors.textSecondary} />
                        <Text className="text-sm ml-1.5" style={{ color: colors.textSecondary }}>
                          {booking.scheduleName}
                        </Text>
                      </View>

                      <View className="flex-row items-center mt-1.5">
                        <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                        <Text className="text-sm ml-1.5" style={{ color: colors.textSecondary }}>
                          {new Date(booking.startTime).toLocaleString()}
                        </Text>
                      </View>

                      {/* Cancellation Request Actions */}
                      {booking.status === 'cancellation_requested' && (
                        <View className="flex-row gap-2 mt-3">
                          <TouchableOpacity
                            className="flex-1 rounded-xl py-2.5 items-center"
                            style={{
                              backgroundColor: colors.success,
                              ...shadows.small,
                            }}
                            onPress={() => handleApproveCancellation(booking._id, booking.clientName)}
                          >
                            <Text className="text-sm font-semibold text-white">
                              Approve
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            className="flex-1 rounded-xl py-2.5 items-center"
                            style={{
                              backgroundColor: `${colors.error}15`,
                              borderWidth: 1,
                              borderColor: colors.error,
                            }}
                            onPress={() => handleRejectCancellation(booking._id, booking.clientName)}
                          >
                            <Text className="text-sm font-semibold" style={{ color: colors.error }}>
                              Decline
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )}

                      {/* Complete Session Button */}
                      {booking.status === 'confirmed' && (
                        <TouchableOpacity
                          className="rounded-xl py-2.5 items-center flex-row justify-center mt-3"
                          style={{
                            backgroundColor: colors.success,
                            ...shadows.small,
                          }}
                          onPress={() => handleCompleteSession(booking._id, booking.clientName)}
                        >
                          <Ionicons name="checkmark-done-outline" size={18} color="white" />
                          <Text className="text-sm font-semibold text-white ml-2">
                            Mark as Completed
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Divider with text */}
          <View className="px-6 py-6">
            <View className="flex-row items-center">
              <View className="flex-1 h-px" style={{ backgroundColor: colors.border }} />
              <Text className="px-4 text-xs font-semibold uppercase" style={{ color: colors.textTertiary }}>
                History
              </Text>
              <View className="flex-1 h-px" style={{ backgroundColor: colors.border }} />
            </View>
          </View>

          {/* Booking History */}
          <View className="px-6">
            <View className="flex-row items-center mb-4">
              <View
                className="w-8 h-8 rounded-lg items-center justify-center mr-3"
                style={{ backgroundColor: colors.surfaceSecondary }}
              >
                <Ionicons name="time" size={16} color={colors.textTertiary} />
              </View>
              <Text className="text-lg font-bold" style={{ color: colors.text }}>
                Past Sessions
              </Text>
            </View>

            {pastBookings.length === 0 ? (
              <View
                className="py-10 items-center rounded-2xl"
                style={{ backgroundColor: colors.surface, ...shadows.small }}
              >
                <Text className="text-base font-semibold" style={{ color: colors.textSecondary }}>
                  No past bookings
                </Text>
              </View>
            ) : (
              <>
                {pastBookings.slice(0, 3).map((booking: any) => (
                  <View
                    key={booking._id}
                    className="rounded-2xl p-4 mb-3"
                    style={{ backgroundColor: colors.surface, opacity: 0.7, ...shadows.small }}
                  >
                    <View className="flex-row items-start">
                      <View className="flex-1">
                        <Text className="text-base font-semibold" style={{ color: colors.text }}>
                          {booking.clientName}
                        </Text>
                        <View className="flex-row items-center mt-1.5">
                          <Ionicons name="fitness-outline" size={13} color={colors.textTertiary} />
                          <Text className="text-sm ml-1.5" style={{ color: colors.textTertiary }}>
                            {booking.scheduleName}
                          </Text>
                        </View>
                        <View className="flex-row items-center mt-1">
                          <Ionicons name="time-outline" size={13} color={colors.textTertiary} />
                          <Text className="text-sm ml-1.5" style={{ color: colors.textTertiary }}>
                            {new Date(booking.startTime).toLocaleDateString()}
                          </Text>
                        </View>
                      </View>
                      <Text className="text-xs font-medium uppercase" style={{ color: colors.textTertiary }}>
                        {booking.status === 'completed' ? 'Completed' : 'Past'}
                      </Text>
                    </View>
                  </View>
                ))}
                {pastBookings.length > 3 && (
                  <TouchableOpacity
                    className="rounded-2xl py-4 items-center flex-row justify-center"
                    style={{ backgroundColor: colors.surfaceSecondary }}
                    onPress={() => router.push('/(trainer)/session-history' as any)}
                  >
                    <Ionicons name="time-outline" size={18} color={colors.primary} />
                    <Text className="text-sm font-semibold ml-2" style={{ color: colors.primary }}>
                      Show All {pastBookings.length} Sessions
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color={colors.primary} style={{ marginLeft: 4 }} />
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </ScrollView>
      ) : (
        <CalendarView bookings={enrichedBookings} userRole="trainer" />
      )}

      {/* Google Calendar Connect Modal */}
      <Modal
        visible={showCalendarModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCalendarModal(false)}
      >
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View className="mx-4 mb-8">
            <GoogleCalendarAuth
              onConnected={() => setShowCalendarModal(false)}
              onSkip={() => setShowCalendarModal(false)}
            />
          </View>
        </View>
      </Modal>

      {/* Confirm Dialog */}
      {confirmDialog && (
        <ConfirmDialog
          visible={confirmDialog.visible}
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmText={confirmDialog.confirmText}
          confirmColor={confirmDialog.confirmColor}
          icon={confirmDialog.icon}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
    </View>
  );
}
