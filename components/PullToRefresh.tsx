import React, { useState, useCallback, ReactNode } from 'react';
import {
  ScrollView,
  RefreshControl,
  View,
  StyleProp,
  ViewStyle,
  ScrollViewProps,
} from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getColors } from '@/constants/colors';

interface PullToRefreshProps extends Omit<ScrollViewProps, 'refreshControl'> {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  refreshingColor?: string;
  backgroundColor?: string;
}

export function PullToRefresh({
  children,
  onRefresh,
  style,
  contentContainerStyle,
  refreshingColor,
  backgroundColor,
  ...scrollViewProps
}: PullToRefreshProps) {
  const [refreshing, setRefreshing] = useState(false);
  const scheme = useColorScheme();
  const colors = getColors(scheme === 'dark');

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh]);

  return (
    <ScrollView
      style={[{ flex: 1, backgroundColor: backgroundColor || colors.background }, style]}
      contentContainerStyle={contentContainerStyle}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={refreshingColor || colors.primary}
          colors={[refreshingColor || colors.primary]}
          progressBackgroundColor={colors.surface}
        />
      }
      {...scrollViewProps}
    >
      {children}
    </ScrollView>
  );
}
