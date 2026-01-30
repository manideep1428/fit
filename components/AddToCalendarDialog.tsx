import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getColors, Shadows } from '@/constants/colors';
import { useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import Toast from 'react-native-toast-message';

interface AddToCalendarDialogProps {
  visible: boolean;
  bookingId: Id<"bookings">;
  clientId: string;
  trainerId: string;
  date: string;
  startTime: string;
  endTime: string;
  trainerName: string;
  notes?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AddToCalendarDialog({
  visible,
  bookingId,
  clientId,
  trainerId,
  date,
  startTime,
  endTime,
  trainerName,
  notes,
  onClose,
  onSuccess,
}: AddToCalendarDialogProps) {
  const scheme = useColorScheme();
  const colors = getColors(scheme === 'dark');
  const shadows = scheme === 'dark' ? Shadows.dark : Shadows.light;
  const [adding, setAdding] = useState(false);

  const addToCalendar = useAction(api.calendarSync.addBookingToClientCalendar);

  const handleAddToCalendar = async () => {
    setAdding(true);
    try {
      const result = await addToCalendar({
        bookingId,
        clientId,
        trainerId,
        date,
        startTime,
        endTime,
        trainerName,
        notes,
      });

      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Added to Calendar',
          text2: 'Session added to your Google Calendar',
          position: 'top',
          visibilityTime: 3000,
        });
        onSuccess?.();
        onClose();
      } else {
        if (result.error === 'Google Calendar not connected') {
          Toast.show({
            type: 'info',
            text1: 'Connect Google Calendar',
            text2: 'Go to Settings to connect your Google Calendar',
            position: 'top',
            visibilityTime: 4000,
          });
        } else {
          Toast.show({
            type: 'error',
            text1: 'Failed to Add',
            text2: result.error || 'Could not add to calendar',
            position: 'top',
            visibilityTime: 3000,
          });
        }
        onClose();
      }
    } catch (error) {
      console.error('Error adding to calendar:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to add to calendar',
        position: 'top',
        visibilityTime: 3000,
      });
      onClose();
    } finally {
      setAdding(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center px-6" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <View
          className="w-full rounded-3xl p-6"
          style={{ backgroundColor: colors.surface, ...shadows.large }}
        >
          {/* Icon */}
          <View
            className="w-16 h-16 rounded-full items-center justify-center mb-4 self-center"
            style={{ backgroundColor: `${colors.success}15` }}
          >
            <Ionicons name="calendar" size={32} color={colors.success} />
          </View>

          {/* Title */}
          <Text className="text-xl font-bold text-center mb-2" style={{ color: colors.text }}>
            Booking Confirmed!
          </Text>

          {/* Details */}
          <View className="mb-6">
            <View className="flex-row items-center mb-2">
              <Ionicons name="person" size={16} color={colors.textSecondary} />
              <Text className="text-sm ml-2" style={{ color: colors.textSecondary }}>
                {trainerName}
              </Text>
            </View>
            <View className="flex-row items-center mb-2">
              <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
              <Text className="text-sm ml-2" style={{ color: colors.textSecondary }}>
                {formatDate(date)}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
              <Text className="text-sm ml-2" style={{ color: colors.textSecondary }}>
                {startTime} - {endTime}
              </Text>
            </View>
          </View>

          {/* Message */}
          <Text className="text-sm text-center mb-6" style={{ color: colors.textSecondary }}>
            Would you like to add this session to your Google Calendar?
          </Text>

          {/* Actions */}
          <View className="flex-row gap-3">
            <TouchableOpacity
              className="flex-1 py-3.5 rounded-xl items-center"
              style={{
                backgroundColor: colors.surfaceSecondary,
                borderWidth: 1,
                borderColor: colors.border,
              }}
              onPress={onClose}
              disabled={adding}
            >
              <Text className="text-base font-semibold" style={{ color: colors.text }}>
                Skip
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 py-3.5 rounded-xl items-center"
              style={{
                backgroundColor: colors.success,
                ...shadows.medium,
              }}
              onPress={handleAddToCalendar}
              disabled={adding}
            >
              {adding ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <View className="flex-row items-center">
                  <Ionicons name="calendar" size={18} color="#FFF" />
                  <Text className="text-base font-semibold text-white ml-2">
                    Add to Calendar
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
