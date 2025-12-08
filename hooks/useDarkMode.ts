import { useTheme } from '@/contexts/ThemeContext';

export type ColorScheme = 'light' | 'dark';

/**
 * Hook to get dark mode state and toggle function
 * Uses ThemeContext for proper state management across the app
 */
export function useDarkMode() {
  const { isDark, toggleTheme, setTheme } = useTheme();

  const setDarkMode = (value: boolean) => {
    setTheme(value ? 'dark' : 'light');
  };

  return {
    isDark,
    colorScheme: (isDark ? 'dark' : 'light') as ColorScheme,
    toggleDarkMode: toggleTheme,
    setDarkMode,
  };
}
