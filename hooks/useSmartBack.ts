import { useRouter, useSegments } from 'expo-router';
import { useCallback } from 'react';

/**
 * Custom hook that provides smart back navigation
 * Falls back to appropriate home screen if router.back() would go to wrong place
 */
export function useSmartBack() {
  const router = useRouter();
  const segments = useSegments();

  const goBack = useCallback((fallbackRoute?: string) => {
    // Try native back first
    if (router.canGoBack()) {
      router.back();
    } else {
      // Determine fallback based on current route
      if (fallbackRoute) {
        router.push(fallbackRoute as any);
      } else {
        // Auto-detect based on current segment
        const firstSegment = segments[0];
        
        if (firstSegment === '(trainer)') {
          router.push('/(trainer)/index' as any);
        } else if (firstSegment === '(client)') {
          router.push('/(client)/index' as any);
        } else if (firstSegment === '(auth)') {
          router.push('/(auth)/welcome' as any);
        } else {
          router.push('/index' as any);
        }
      }
    }
  }, [router, segments]);

  return { goBack };
}
