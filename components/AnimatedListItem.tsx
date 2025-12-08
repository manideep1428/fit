import React from 'react';
import { Pressable, ViewStyle, StyleSheet } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    FadeInRight,
    FadeInLeft,
    FadeInUp,
} from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors, Shadows, BorderRadius } from '@/constants/colors';

interface AnimatedListItemProps {
    children: React.ReactNode;
    style?: ViewStyle;
    onPress?: () => void;
    index?: number;
    entering?: 'left' | 'right' | 'up';
    showBorder?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Animated list item with staggered entrance and press feedback
 */
export function AnimatedListItem({
    children,
    style,
    onPress,
    index = 0,
    entering = 'right',
    showBorder = true,
}: AnimatedListItemProps) {
    const { isDark } = useTheme();
    const colors = getColors(isDark);
    const shadows = isDark ? Shadows.dark : Shadows.light;

    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
        if (onPress) {
            scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
        }
    };

    const handlePressOut = () => {
        scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    };

    const getEnteringAnimation = () => {
        const delay = index * 50; // 50ms stagger per item
        switch (entering) {
            case 'left':
                return FadeInLeft.delay(delay).duration(350).springify();
            case 'up':
                return FadeInUp.delay(delay).duration(350).springify();
            default:
                return FadeInRight.delay(delay).duration(350).springify();
        }
    };

    return (
        <AnimatedPressable
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            entering={getEnteringAnimation()}
            style={[
                styles.container,
                {
                    backgroundColor: colors.cardBackground,
                    borderColor: showBorder ? colors.cardBorder : 'transparent',
                },
                shadows.small,
                animatedStyle,
                style,
            ]}
        >
            {children}
        </AnimatedPressable>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
        borderRadius: BorderRadius.medium,
        borderWidth: 1,
        marginBottom: 12,
    },
});

export default AnimatedListItem;
