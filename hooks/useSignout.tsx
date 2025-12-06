// hooks/useSignOut.ts
import { useAuth } from "@clerk/clerk-expo";
import { useCallback } from "react";

export function useSignOut() {
  const { signOut, isSignedIn } = useAuth();

  const logout = useCallback(async () => {
    console.log("DONe")
    if (!isSignedIn) return;
    try {
      await signOut();
    } catch (err) {
      console.log("Sign-out error:", err);
    }
  }, [signOut, isSignedIn]);

  return { logout, isSignedIn };
}
