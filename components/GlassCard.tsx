import React from 'react';
import { View, ViewStyle, StyleSheet, Platform } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors, BorderRadius } from '@/constants/colors';

interface GlassCardProps {
    children: React.ReactNode;
    style?: ViewStyle;
    intensity?: 'light' | 'medium' | 'heavy';
    borderRadius?: keyof typeof BorderRadius;
}

/**
 * Modern glass morphism card component
 * Creates a frosted glass effect with subtle transparency
 */
export function GlassCard({
    children,
    style,
    intensity = 'medium',
    borderRadius = 'large',
}: GlassCardProps) {
    const { isDark } = useTheme();
    const colors = getColors(isDark);

    const getIntensityStyles = (): ViewStyle => {
        switch (intensity) {
            case 'light':
                return {
                    backgroundColor: isDark
                        ? 'rgba(24, 24, 31, 0.6)'
                        : 'rgba(255, 255, 255, 0.6)',
                };
            case 'heavy':
                return {
                    backgroundColor: isDark
                        ? 'rgba(24, 24, 31, 0.95)'
                        : 'rgba(255, 255, 255, 0.95)',
                };
            default: // medium
                return {
                    backgroundColor: isDark
                        ? 'rgba(24, 24, 31, 0.8)'
                        : 'rgba(255, 255, 255, 0.8)',
                };
        }
    };

    return (
        <View
            style={[
                styles.container,
                {
                    borderColor: colors.glassBorder,
                    borderRadius: BorderRadius[borderRadius],
                },
                getIntensityStyles(),
                style,
            ]}
        >
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        borderWidth: 1,
        overflow: 'hidden',
        // Add subtle shadow for depth
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
            },
            android: {
                elevation: 4,
            },
        }),
    },
});

export default GlassCard;
