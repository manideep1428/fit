/**
 * Global Color Schema for the Fitness App
 * Supports both light and dark modes with premium aesthetics
 */

export const AppColors = {
  light: {
    // Primary Colors - Warm copper/bronze for premium feel
    primary: '#B8621B',
    primaryLight: '#D4844A',
    primaryDark: '#8B4513',

    // Background Colors - Warm creamy tones
    background: '#FDFBF7',
    surface: '#FFFFFF',
    surfaceSecondary: '#F8F6F2',
    surfaceElevated: '#FFFFFF',

    // Text Colors
    text: '#1A1A2E',
    textSecondary: '#4A4A5C',
    textTertiary: '#8E8E9A',

    // Status Colors
    success: '#059669',
    successLight: '#D1FAE5',
    warning: '#D97706',
    warningLight: '#FEF3C7',
    error: '#DC2626',
    errorLight: '#FEE2E2',
    info: '#2563EB',
    infoLight: '#DBEAFE',

    // UI Elements
    border: '#E8E5DF',
    borderLight: '#F0EDE8',
    divider: '#E8E5DF',

    // Card Colors
    cardBackground: '#FFFFFF',
    cardBorder: '#E8E5DF',
    cardShadow: 'rgba(0, 0, 0, 0.06)',

    // Tab Bar
    tabBarBackground: 'rgba(255, 255, 255, 0.95)',
    tabBarBorder: '#E8E5DF',
    tabBarActive: '#B8621B',
    tabBarInactive: '#8E8E9A',

    // Glass Effect
    glass: 'rgba(255, 255, 255, 0.8)',
    glassBorder: 'rgba(255, 255, 255, 0.3)',

    // Overlay
    overlay: 'rgba(0, 0, 0, 0.5)',
    overlayLight: 'rgba(0, 0, 0, 0.3)',
  },

  dark: {
    // Primary Colors - Lighter copper for dark mode contrast
    primary: '#E69F5C',
    primaryLight: '#F0B87A',
    primaryDark: '#C7843D',

    // Background Colors - Deep blue-gray for premium dark
    background: '#0D0D12',
    surface: '#18181F',
    surfaceSecondary: '#1F1F28',
    surfaceElevated: '#252530',

    // Text Colors
    text: '#F5F5F7',
    textSecondary: '#B0B0BC',
    textTertiary: '#6B6B7A',

    // Status Colors
    success: '#10B981',
    successLight: '#064E3B',
    warning: '#FBBF24',
    warningLight: '#78350F',
    error: '#EF4444',
    errorLight: '#7F1D1D',
    info: '#60A5FA',
    infoLight: '#1E3A8A',

    // UI Elements
    border: '#2A2A35',
    borderLight: '#353540',
    divider: '#2A2A35',

    // Card Colors
    cardBackground: '#18181F',
    cardBorder: '#2A2A35',
    cardShadow: 'rgba(0, 0, 0, 0.4)',

    // Tab Bar
    tabBarBackground: 'rgba(24, 24, 31, 0.95)',
    tabBarBorder: '#2A2A35',
    tabBarActive: '#E69F5C',
    tabBarInactive: '#6B6B7A',

    // Glass Effect
    glass: 'rgba(24, 24, 31, 0.85)',
    glassBorder: 'rgba(255, 255, 255, 0.08)',

    // Overlay
    overlay: 'rgba(0, 0, 0, 0.7)',
    overlayLight: 'rgba(0, 0, 0, 0.5)',
  },
};

// Helper function to get colors based on color scheme
export const getColors = (isDark: boolean) => {
  return isDark ? AppColors.dark : AppColors.light;
};

// Gradient definitions - more vibrant
export const Gradients = {
  light: {
    primary: ['#B8621B', '#D4844A'],
    card: ['#B8621B', '#8B4513'],
    success: ['#059669', '#047857'],
    info: ['#2563EB', '#1D4ED8'],
    premium: ['#B8621B', '#D97706', '#F59E0B'],
  },
  dark: {
    primary: ['#E69F5C', '#C7843D'],
    card: ['#E69F5C', '#B8621B'],
    success: ['#10B981', '#059669'],
    info: ['#60A5FA', '#3B82F6'],
    premium: ['#E69F5C', '#F59E0B', '#FBBF24'],
  },
};

// Enhanced Shadow definitions - softer, more realistic
export const Shadows = {
  light: {
    none: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 3,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 4,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
      elevation: 8,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
      elevation: 12,
    },
  },
  dark: {
    none: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 8,
      elevation: 4,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.45,
      shadowRadius: 16,
      elevation: 8,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.55,
      shadowRadius: 24,
      elevation: 12,
    },
  },
};

// Modern Border radius - larger for softer look
export const BorderRadius = {
  none: 0,
  small: 8,
  medium: 14,
  large: 20,
  xlarge: 28,
  xxlarge: 36,
  round: 9999,
};

// Spacing
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

// Animation durations
export const AnimationDurations = {
  fast: 150,
  normal: 250,
  slow: 400,
};
