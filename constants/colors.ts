/**
 * Global Color Schema for the Fitness App
 * Supports both light and dark modes
 * Use these colors throughout the app for consistent theming
 */

export const AppColors = {
  light: {
    // Primary Colors
    primary: '#C17A4A',
    primaryLight: '#D89B73',
    primaryDark: '#A05F35',
    
    // Background Colors
    background: '#FFF5E6',
    surface: '#FFFFFF',
    surfaceSecondary: '#F9F9F9',
    
    // Text Colors
    text: '#1F2937',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    
    // Status Colors
    success: '#10B981',
    successLight: '#D1FAE5',
    warning: '#F59E0B',
    warningLight: '#FEF3C7',
    error: '#EF4444',
    errorLight: '#FEE2E2',
    info: '#3B82F6',
    infoLight: '#DBEAFE',
    
    // UI Elements
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
    divider: '#E5E7EB',
    
    // Card Colors
    cardBackground: '#FFFFFF',
    cardShadow: 'rgba(0, 0, 0, 0.05)',
    
    // Tab Bar
    tabBarBackground: '#FFFFFF',
    tabBarBorder: '#E5E7EB',
    tabBarActive: '#C17A4A',
    tabBarInactive: '#9CA3AF',
    
    // Overlay
    overlay: 'rgba(0, 0, 0, 0.5)',
    overlayLight: 'rgba(0, 0, 0, 0.3)',
  },
  
  dark: {
    // Primary Colors
    primary: '#D89B73',
    primaryLight: '#E5B899',
    primaryDark: '#C17A4A',
    
    // Background Colors
    background: '#0F172A',
    surface: '#1E293B',
    surfaceSecondary: '#334155',
    
    // Text Colors
    text: '#F1F5F9',
    textSecondary: '#CBD5E1',
    textTertiary: '#94A3B8',
    
    // Status Colors
    success: '#34D399',
    successLight: '#064E3B',
    warning: '#FBBF24',
    warningLight: '#78350F',
    error: '#F87171',
    errorLight: '#7F1D1D',
    info: '#60A5FA',
    infoLight: '#1E3A8A',
    
    // UI Elements
    border: '#334155',
    borderLight: '#475569',
    divider: '#334155',
    
    // Card Colors
    cardBackground: '#1E293B',
    cardShadow: 'rgba(0, 0, 0, 0.3)',
    
    // Tab Bar
    tabBarBackground: '#1E293B',
    tabBarBorder: '#334155',
    tabBarActive: '#D89B73',
    tabBarInactive: '#64748B',
    
    // Overlay
    overlay: 'rgba(0, 0, 0, 0.7)',
    overlayLight: 'rgba(0, 0, 0, 0.5)',
  },
};

// Helper function to get colors based on color scheme
export const getColors = (isDark: boolean) => {
  return isDark ? AppColors.dark : AppColors.light;
};

// Gradient definitions
export const Gradients = {
  light: {
    primary: ['#C17A4A', '#D89B73'],
    card: ['#C17A4A', '#A05F35'],
    success: ['#10B981', '#059669'],
    info: ['#3B82F6', '#2563EB'],
  },
  dark: {
    primary: ['#D89B73', '#C17A4A'],
    card: ['#D89B73', '#B8825E'],
    success: ['#34D399', '#10B981'],
    info: ['#60A5FA', '#3B82F6'],
  },
};

// Shadow definitions
export const Shadows = {
  light: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 4,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 8,
    },
  },
  dark: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 2,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.4,
      shadowRadius: 4,
      elevation: 4,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.5,
      shadowRadius: 8,
      elevation: 8,
    },
  },
};

// Border radius
export const BorderRadius = {
  small: 8,
  medium: 12,
  large: 16,
  xlarge: 20,
  xxlarge: 24,
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
