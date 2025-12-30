import { useNetwork } from '@/contexts/NetworkContext';

/**
 * Hook to easily check offline status and connection info
 * Usage: const { isOffline, connectionType, retry } = useOffline();
 */
export function useOffline() {
  const { isOffline, isConnected, isInternetReachable, connectionType, checkConnection } = useNetwork();

  return {
    isOffline,
    isConnected,
    isInternetReachable,
    connectionType,
    retry: checkConnection,
  };
}
