import { useColorScheme as useNativeColorScheme } from 'react-native';
import { useState } from 'react';

export type ColorScheme = 'light' | 'dark';

export function useDarkMode() {
  const systemColorScheme = useNativeColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === 'dark');

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const setDarkMode = (value: boolean) => {
    setIsDarkMode(value);
  };

  return {
    isDark: isDarkMode,
    colorScheme: (isDarkMode ? 'dark' : 'light') as ColorScheme,
    toggleDarkMode,
    setDarkMode,
  };
}
