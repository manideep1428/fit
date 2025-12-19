import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getColors } from '@/constants/colors';

interface GoogleTokenStatusProps {
  onConnect?: () => void;
}

export default function GoogleTokenStatus({ onConnect }: GoogleTokenStatusProps) {
  const { user } = useUser();
  const scheme = useColorScheme();
  const colors = getColors(scheme === 'dark');

  const tokenStatus = useQuery(
    api.users.getGoogleTokenStatus,
    user?.id ? { clerkId: user.id } : 'skip'
  );

  if (!tokenStatus) {
    return (
      <View className="flex-row items-center">
        <Ionicons name="time-outline" size={16} color={colors.textTertiary} />
        <Text className="text-sm ml-2" style={{ color: colors.textTertiary }}>
          Checking status...
        </Text>
      </View>
    );
  }

  if (!tokenStatus.connected) {
    return (
      <TouchableOpacity
        onPress={onConnect}
        className="flex-row items-center px-3 py-2 rounded-lg"
        style={{ backgroundColor: `${colors.warning}15` }}
      >
        <Ionicons name="warning-outline" size={16} color={colors.warning} />
        <Text className="text-sm ml-2 font-medium" style={{ color: colors.warning }}>
          Calendar not connected
        </Text>
      </TouchableOpacity>
    );
  }

  if (tokenStatus.expired) {
    return (
      <TouchableOpacity
        onPress={onConnect}
        className="flex-row items-center px-3 py-2 rounded-lg"
        style={{ backgroundColor: `${colors.error}15` }}
      >
        <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
        <Text className="text-sm ml-2 font-medium" style={{ color: colors.error }}>
          Token expired
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View className="flex-row items-center px-3 py-2 rounded-lg" style={{ backgroundColor: `${colors.success}15` }}>
      <Ionicons name="checkmark-circle" size={16} color={colors.success} />
      <Text className="text-sm ml-2 font-medium" style={{ color: colors.success }}>
        Calendar connected
      </Text>
      {tokenStatus.expiresAt && (
        <Text className="text-xs ml-2" style={{ color: colors.textTertiary }}>
          (expires {new Date(tokenStatus.expiresAt).toLocaleDateString()})
        </Text>
      )}
    </View>
  );
}

// Compact version for inline use
export function GoogleTokenStatusBadge({ onConnect }: GoogleTokenStatusProps) {
  const { user } = useUser();
  const scheme = useColorScheme();
  const colors = getColors(scheme === 'dark');

  const tokenStatus = useQuery(
    api.users.getGoogleTokenStatus,
    user?.id ? { clerkId: user.id } : 'skip'
  );

  if (!tokenStatus) {
    return (
      <View
        className="w-3 h-3 rounded-full"
        style={{ backgroundColor: colors.textTertiary }}
      />
    );
  }

  const statusColor = tokenStatus.connected && !tokenStatus.expired 
    ? colors.success 
    : tokenStatus.connected && tokenStatus.expired 
    ? colors.warning 
    : colors.error;

  return (
    <TouchableOpacity onPress={onConnect}>
      <View
        className="w-3 h-3 rounded-full"
        style={{ backgroundColor: statusColor }}
      />
    </TouchableOpacity>
  );
}