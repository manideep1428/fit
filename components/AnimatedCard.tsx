import React from 'react';
import { Pressable, ViewStyle, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors, Shadows, BorderRadius } from '@/constants/colors';

interface AnimatedCardProps {
    children: React.ReactNode;
    style?: ViewStyle;
    onPress?: () => void;
    delay?: number;
    animated?: boolean;
    elevation?: 'none' | 'small' | 'medium' | 'large' | 'xl';
    borderRadius?: keyof typeof BorderRadius;
    entering?: 'fade' | 'fadeUp' | 'fadeDown';
}

/**
 * Card component (animations removed)
 */
export function AnimatedCard({
    children,
    style,
    onPress,
    delay = 0,
    animated = true,
    elevation = 'medium',
    borderRadius = 'large',
    entering = 'fadeUp',
}: AnimatedCardProps) {
    const { isDark } = useTheme();
    const colors = getColors(isDark);
    const shadows = isDark ? Shadows.dark : Shadows.light;

    return (
        <Pressable
            onPress={onPress}
            style={[
                styles.card,
                {
                    backgroundColor: colors.cardBackground,
                    borderColor: colors.cardBorder,
                    borderRadius: BorderRadius[borderRadius],
                },
                shadows[elevation],
                style,
            ]}
        >
            {children}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    card: {
        padding: 20,
        borderWidth: 1,
        overflow: 'hidden',
    },
});

export default AnimatedCard;
