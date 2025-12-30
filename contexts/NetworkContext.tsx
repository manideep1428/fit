import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

interface NetworkContextType {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  connectionType: string | null;
  isOffline: boolean;
  checkConnection: () => Promise<void>;
}

const NetworkContext = createContext<NetworkContextType>({
  isConnected: true,
  isInternetReachable: true,
  connectionType: null,
  isOffline: false,
  checkConnection: async () => {},
});

export const useNetwork = () => useContext(NetworkContext);

interface NetworkProviderProps {
  children: ReactNode;
}

export function NetworkProvider({ children }: NetworkProviderProps) {
  const [isConnected, setIsConnected] = useState(true);
  const [isInternetReachable, setIsInternetReachable] = useState<boolean | null>(true);
  const [connectionType, setConnectionType] = useState<string | null>(null);

  const handleNetworkChange = useCallback((state: NetInfoState) => {
    setIsConnected(state.isConnected ?? false);
    setIsInternetReachable(state.isInternetReachable);
    setConnectionType(state.type);
  }, []);

  const checkConnection = useCallback(async () => {
    const state = await NetInfo.fetch();
    handleNetworkChange(state);
  }, [handleNetworkChange]);

  useEffect(() => {
    // Initial check
    checkConnection();

    // Subscribe to network changes
    const unsubscribe = NetInfo.addEventListener(handleNetworkChange);

    return () => unsubscribe();
  }, [checkConnection, handleNetworkChange]);

  const isOffline = !isConnected || isInternetReachable === false;

  return (
    <NetworkContext.Provider
      value={{
        isConnected,
        isInternetReachable,
        connectionType,
        isOffline,
        checkConnection,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
}
