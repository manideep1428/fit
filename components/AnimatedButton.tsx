import React, { useState } from 'react';
import { Text, Pressable, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors, BorderRadius, Shadows } from '@/constants/colors';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'small' | 'medium' | 'large';



interface AnimatedButtonProps {
    children: React.ReactNode;
    onPress?: () => void;
    variant?: ButtonVariant;
    size?: ButtonSize;
    disabled?: boolean;
    loading?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
    haptic?: boolean;
    fullWidth?: boolean;
}

/**
 * Button component (animations removed)
 */
export function AnimatedButton({
    children,
    onPress,
    variant = 'primary',
    size = 'medium',
    disabled = false,
    loading = false,
    style,
    textStyle,
    haptic = true,
    fullWidth = false,
}: AnimatedButtonProps) {
    const { isDark } = useTheme();
    const colors = getColors(isDark);
    const [isloading , setIsLoading ]  = useState<Boolean>(false)
    const handlePress = () => {
        if (disabled || loading) return;
        if (haptic) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onPress?.();
    };

    const getSizeStyles = (): ViewStyle => {
        switch (size) {
            case 'small':
                return { paddingVertical: 10, paddingHorizontal: 16 };
            case 'large':
                return { paddingVertical: 18, paddingHorizontal: 28 };
            default:
                return { paddingVertical: 14, paddingHorizontal: 22 };
        }
    };

    const getTextSize = (): TextStyle => {
        switch (size) {
            case 'small':
                return { fontSize: 14 };
            case 'large':
                return { fontSize: 18 };
            default:
                return { fontSize: 16 };
        }
    };

    const getVariantStyles = (): { container: ViewStyle; text: TextStyle } => {
        const baseContainer: ViewStyle = {
            borderRadius: BorderRadius.xxlarge,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
        };

        switch (variant) {
            case 'secondary':
                return {
                    container: {
                        ...baseContainer,
                        backgroundColor: colors.surfaceSecondary,
                        ...Shadows[isDark ? 'dark' : 'light'].small,
                    },
                    text: { color: colors.text, fontWeight: '600' },
                };
            case 'outline':
                return {
                    container: {
                        ...baseContainer,
                        backgroundColor: 'transparent',
                        borderWidth: 1.5,
                        borderColor: colors.primary,
                    },
                    text: { color: colors.primary, fontWeight: '600' },
                };
            case 'ghost':
                return {
                    container: {
                        ...baseContainer,
                        backgroundColor: 'transparent',
                    },
                    text: { color: colors.primary, fontWeight: '600' },
                };
            default: // primary
                return {
                    container: {
                        ...baseContainer,
                        backgroundColor: colors.primary,
                        ...Shadows[isDark ? 'dark' : 'light'].medium,
                    },
                    text: { color: '#FFFFFF', fontWeight: '700' },
                };
        }
    };

    const variantStyles = getVariantStyles();
    const sizeStyles = getSizeStyles();
    const textSizeStyle = getTextSize();

    return (
        <Pressable
        className='rounded-2xl'
            onPress={handlePress}
            disabled={disabled || loading}
            style={[
                variantStyles.container,
                sizeStyles,
                fullWidth && { width: '100%' },
                disabled && { opacity: 0.5 },
                style,
            ]}
        >
            {loading ? (
                <ActivityIndicator
                    size="small"
                    color={variant === 'primary' ? '#FFFFFF' : colors.primary}
                />
            ) : typeof children === 'string' ? (
                <Text style={[variantStyles.text, textSizeStyle, textStyle]}>
                    {children}
                </Text>
            ) : (
                children
            )}
        </Pressable>
    );
}

export default AnimatedButton;
