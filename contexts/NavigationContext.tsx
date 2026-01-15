import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'expo-router';

interface NavigationContextType {
  goBack: () => void;
  trackNavigation: (path: string) => void;
  getHistory: () => string[];
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [history, setHistory] = useState<string[]>([]);
  const lastPathRef = useRef<string>('');

  const trackNavigation = useCallback((path: string) => {
    if (path && path !== lastPathRef.current) {
      setHistory(prev => {
        // Don't add duplicates if it's the same as the last entry
        if (prev.length > 0 && prev[prev.length - 1] === path) {
          return prev;
        }
        // Keep only last 10 entries to prevent memory issues
        const newHistory = [...prev, path];
        return newHistory.slice(-10);
      });
      lastPathRef.current = path;
    }
  }, []);

  const goBack = useCallback(() => {
    if (history.length > 1) {
      // Remove current page and get previous
      const newHistory = [...history];
      newHistory.pop(); // Remove current
      const previousPath = newHistory[newHistory.length - 1];
      
      setHistory(newHistory);
      
      if (previousPath) {
        router.push(previousPath as any);
      } else if (router.canGoBack()) {
        router.back();
      } else {
        // Default fallback based on current path
        if (pathname.includes('/(trainer)')) {
          router.push('/(trainer)/index' as any);
        } else if (pathname.includes('/(client)')) {
          router.push('/(client)/index' as any);
        }
      }
    } else if (router.canGoBack()) {
      router.back();
    } else {
      // Default fallback based on current path
      if (pathname.includes('/(trainer)')) {
        router.push('/(trainer)/index' as any);
      } else if (pathname.includes('/(client)')) {
        router.push('/(client)/index' as any);
      }
    }
  }, [history, router, pathname]);

  const getHistory = useCallback(() => history, [history]);

  return (
    <NavigationContext.Provider value={{ goBack, trackNavigation, getHistory }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  return context;
}
