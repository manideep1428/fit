import { useEffect } from 'react';
import { useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';

export function useTrainerProfileCheck() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded || !user) return;

    const role = user.unsafeMetadata?.role;
    const hasUsername = user.unsafeMetadata?.username;
    const hasSpecialty = user.unsafeMetadata?.specialty;
    const profileCompleted = user.unsafeMetadata?.profileCompleted;

    // If trainer hasn't completed profile, redirect to setup
    if (role === 'trainer' && (!hasUsername || !hasSpecialty || !profileCompleted)) {
      router.replace('/(auth)/trainer-setup');
    }
  }, [isLoaded, user, router]);

  return { user, isLoaded };
}
