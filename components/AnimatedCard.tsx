import React, { useEffect } from 'react';
import { Pressable, ViewStyle, StyleSheet } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
    interpolate,
    FadeIn,
    FadeInDown,
    FadeInUp,
} from 'react-native-reanimated';
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

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Professional animated card component with scale and fade animations
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

    const scale = useSharedValue(1);
    const opacity = useSharedValue(animated ? 0 : 1);

    useEffect(() => {
        if (animated) {
            opacity.value = withTiming(1, { duration: 400 });
        }
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }],
            opacity: opacity.value,
        };
    });

    const handlePressIn = () => {
        if (onPress) {
            scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
        }
    };

    const handlePressOut = () => {
        scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    };

    const getEnteringAnimation = () => {
        const delayMs = delay;
        switch (entering) {
            case 'fade':
                return FadeIn.delay(delayMs).duration(400);
            case 'fadeDown':
                return FadeInDown.delay(delayMs).duration(400).springify();
            case 'fadeUp':
            default:
                return FadeInUp.delay(delayMs).duration(400).springify();
        }
    };

    return (
        <AnimatedPressable
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            entering={animated ? getEnteringAnimation() : undefined}
            style={[
                styles.card,
                {
                    backgroundColor: colors.cardBackground,
                    borderColor: colors.cardBorder,
                    borderRadius: BorderRadius[borderRadius],
                },
                shadows[elevation],
                animatedStyle,
                style,
            ]}
        >
            {children}
        </AnimatedPressable>
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
