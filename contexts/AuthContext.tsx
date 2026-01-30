import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

interface User {
  _id: Id<"users">;
  email: string;
  fullName: string;
  phoneNumber?: string;
  role: "trainer" | "client";
  profileImageId?: Id<"_storage">;
  bio?: string;
  specialty?: string;
  emailVerified?: boolean;
  profileCompleted?: boolean;
  createdAt: number;
  updatedAt: number;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_USER_ID_KEY = '@auth_user_id';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Query user data from Convex
  const user = useQuery(
    api.auth.getUserById,
    userId ? { userId } : 'skip'
  ) as User | null | undefined;

  // Load user ID from storage on mount
  useEffect(() => {
    loadUserId();
  }, []);

  const loadUserId = async () => {
    try {
      const storedUserId = await AsyncStorage.getItem(AUTH_USER_ID_KEY);
      if (storedUserId) {
        setUserId(storedUserId as Id<"users">);
      }
    } catch (error) {
      console.error('Failed to load user ID:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await AsyncStorage.removeItem(AUTH_USER_ID_KEY);
      setUserId(null);
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  // Update loading state based on query
  const finalIsLoading = isLoading || (userId !== null && user === undefined);

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading: finalIsLoading,
        isAuthenticated: !!user,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Helper to save user ID after successful login
export async function saveUserId(userId: Id<"users">) {
  await AsyncStorage.setItem(AUTH_USER_ID_KEY, userId);
}
