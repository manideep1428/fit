import { useEffect } from 'react';
import { useRouter, Redirect } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { View, ActivityIndicator } from 'react-native';
import { getColors } from '@/constants/colors';
import { useColorScheme } from '@/hooks/use-color-scheme';

/**
 * Root index - handles automatic routing based on user authentication and role
 * This is the entry point of the app
 */
export default function Index() {
    const { user, isLoaded } = useUser();
    const router = useRouter();
    const scheme = useColorScheme();
    const colors = getColors(scheme === 'dark');

    useEffect(() => {
        if (!isLoaded) return;

        // If no user is logged in, redirect to welcome screen
        if (!user) {
            router.replace('/(auth)/welcome');
            return;
        }

        // Get user role from metadata
        const role = user.unsafeMetadata?.role as string | undefined;

        // If user doesn't have a role yet, redirect to role selection
        if (!role) {
            router.replace('/(auth)/role-selection');
            return;
        }

        // Redirect based on role
        if (role === 'trainer') {
            // Check if trainer has completed profile setup
            const hasUsername = user.unsafeMetadata?.username;
            const hasSpecialty = user.unsafeMetadata?.specialty;
            
            if (!hasUsername || !hasSpecialty) {
                router.replace('/(auth)/trainer-setup');
            } else {
                router.replace('/(trainer)');
            }
        } else if (role === 'client') {
            router.replace('/(client)');
        } else {
            // If role is invalid, redirect to role selection
            router.replace('/(auth)/role-selection');
        }
    }, [isLoaded, user]);

    // Show loading screen while checking authentication
    return (
        <View
            className="flex-1 items-center justify-center"
            style={{ backgroundColor: colors.background }}
        >
            <ActivityIndicator size="large" color={colors.primary} />
        </View>
    );
}
