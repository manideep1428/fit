import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getColors, Shadows } from '@/constants/colors';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmColor,
  icon = 'checkmark-circle-outline',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const scheme = useColorScheme();
  const colors = getColors(scheme === 'dark');
  const shadows = scheme === 'dark' ? Shadows.dark : Shadows.light;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View className="flex-1 justify-center items-center px-6" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <View
          className="w-full rounded-3xl p-6"
          style={{ backgroundColor: colors.surface, ...shadows.large }}
        >
          {/* Icon */}
          <View
            className="w-16 h-16 rounded-full items-center justify-center mb-4 self-center"
            style={{ backgroundColor: `${confirmColor || colors.primary}15` }}
          >
            <Ionicons name={icon} size={32} color={confirmColor || colors.primary} />
          </View>

          {/* Title */}
          <Text className="text-xl font-bold text-center mb-2" style={{ color: colors.text }}>
            {title}
          </Text>

          {/* Message */}
          <Text className="text-sm text-center mb-6" style={{ color: colors.textSecondary }}>
            {message}
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
              onPress={onCancel}
            >
              <Text className="text-base font-semibold" style={{ color: colors.text }}>
                {cancelText}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 py-3.5 rounded-xl items-center"
              style={{
                backgroundColor: confirmColor || colors.primary,
                ...shadows.medium,
              }}
              onPress={onConfirm}
            >
              <Text className="text-base font-semibold text-white">
                {confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
