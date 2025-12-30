// hooks/useSignOut.ts
import { useAuth } from "@clerk/clerk-expo";
import { useCallback } from "react";

export function useSignOut() {
  const { signOut, isSignedIn } = useAuth();

  const logout = useCallback(async () => {
    if (!isSignedIn) return;
    try {
      await signOut();
    } catch (err) {
      // Sign-out error handled silently
    }
  }, [signOut, isSignedIn]);

  return { logout, isSignedIn };
}
