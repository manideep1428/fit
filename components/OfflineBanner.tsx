import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetwork } from '@/contexts/NetworkContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getColors } from '@/constants/colors';

interface OfflineBannerProps {
  showRetry?: boolean;
}

export function OfflineBanner({ showRetry = true }: OfflineBannerProps) {
  const { isOffline, checkConnection, isConnected, isInternetReachable } = useNetwork();
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const colors = getColors(scheme === 'dark');
  
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isOffline) {
      // Slide in
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();

      // Pulse animation for the icon
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      // Slide out
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isOffline, slideAnim, pulseAnim]);

  if (!isOffline) return null;

  const getMessage = () => {
    if (!isConnected) return "No internet connection";
    if (isInternetReachable === false) return "Internet not reachable";
    return "You're offline";
  };

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <View
        style={{
          backgroundColor: colors.error,
          paddingTop: insets.top + 8,
          paddingBottom: 12,
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <Ionicons name="cloud-offline-outline" size={20} color="white" />
        </Animated.View>
        
        <Text style={{ color: 'white', fontWeight: '600', marginLeft: 8, fontSize: 14 }}>
          {getMessage()}
        </Text>

        {showRetry && (
          <TouchableOpacity
            onPress={checkConnection}
            style={{
              marginLeft: 12,
              backgroundColor: 'rgba(255,255,255,0.2)',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 16,
            }}
          >
            <Text style={{ color: 'white', fontWeight: '600', fontSize: 12 }}>
              Retry
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}
