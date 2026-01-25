import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors, Shadows, BorderRadius } from '@/constants/colors';

interface ThemedCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

/**
 * Example themed card component using the color system
 * Shows how to properly implement dark/light mode support
 */
export function ThemedCard({ children, style }: ThemedCardProps) {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const shadows = isDark ? Shadows.dark.medium : Shadows.light.medium;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.cardBackground,
          borderColor: colors.border,
        },
        shadows,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
  },
});

// Example usage with NativeWind classes
export function ThemedCardNativeWind({ children }: { children: React.ReactNode }) {
  return (
    <View className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700">
      {children}
    </View>
  );
}
