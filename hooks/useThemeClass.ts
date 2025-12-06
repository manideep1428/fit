import { useTheme } from '@/contexts/ThemeContext';
import { useColorScheme as useSystemColorScheme } from 'react-native';

/**
 * Hook to get the appropriate class name for NativeWind dark mode
 * Returns 'dark' when dark mode is active, empty string otherwise
 */
export function useThemeClass() {
  const { isDark } = useTheme();
  return isDark ? 'dark' : '';
}

/**
 * Hook to get colors based on current theme
 */
export function useThemeColors() {
  const { isDark } = useTheme();
  return {
    isDark,
    text: isDark ? 'text-white' : 'text-gray-900',
    background: isDark ? 'bg-slate-900' : 'bg-amber-50',
    surface: isDark ? 'bg-slate-800' : 'bg-white',
    primary: isDark ? 'bg-amber-600' : 'bg-amber-700',
    border: isDark ? 'border-slate-700' : 'border-gray-200',
  };
}
