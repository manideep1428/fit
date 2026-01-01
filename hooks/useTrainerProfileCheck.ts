import { useEffect } from "react";
import { useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function useTrainerProfileCheck() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  // Query profile setup progress from Convex
  const profileProgress = useQuery(
    api.users.getProfileSetupProgress,
    user?.id ? { clerkId: user.id } : "skip"
  );

  useEffect(() => {
    if (!isLoaded || !user) return;

    const role = user.unsafeMetadata?.role;

    // Only check for trainers
    if (role !== "trainer") return;

    // Check Convex database for profile completion
    if (profileProgress !== undefined) {
      // If profile is not completed, redirect to setup
      if (!profileProgress?.profileCompleted) {
        router.replace("/(auth)/trainer-setup");
      }
    } else {
      // Fallback to Clerk metadata if Convex query hasn't loaded yet
      const hasUsername = user.unsafeMetadata?.username;
      const hasSpecialty = user.unsafeMetadata?.specialty;
      const profileCompleted = user.unsafeMetadata?.profileCompleted;

      if (!hasUsername || !hasSpecialty || !profileCompleted) {
        router.replace("/(auth)/trainer-setup");
      }
    }
  }, [isLoaded, user, router, profileProgress]);

  return { user, isLoaded };
}
