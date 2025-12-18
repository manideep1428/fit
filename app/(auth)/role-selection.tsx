import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from 'convex/react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '@/convex/_generated/api';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getColors, Shadows } from '@/constants/colors';
import { showToast } from '@/utils/toast';

export default function RoleSelectionScreen() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const scheme = useColorScheme();
  const colors = getColors(scheme === 'dark');
  const shadows = scheme === 'dark' ? Shadows.dark : Shadows.light;
  const insets = useSafeAreaInsets();
  const [selectedRole, setSelectedRole] = useState<'trainer' | 'client' | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);

  const createUser = useMutation(api.users.createUser);

  // Check if user already exists in Convex with a role
  const convexUser = useQuery(
    api.users.getUserByClerkId,
    user?.id ? { clerkId: user.id } : 'skip'
  );

  // Check if user already has a role and redirect accordingly
  useEffect(() => {
    if (!isLoaded || !user) return;

    // Wait for Convex query
    if (convexUser === undefined) return;

    setCheckingRole(false);

    // Check Convex first, then Clerk metadata
    const existingRole =
      convexUser?.role || (user.unsafeMetadata?.role as string | undefined);

    if (existingRole === 'trainer') {
      const hasUsername = convexUser?.username || user.unsafeMetadata?.username;
      const hasSpecialty =
        convexUser?.specialty || user.unsafeMetadata?.specialty;

      if (!hasUsername || !hasSpecialty) {
        router.replace('/(auth)/trainer-setup');
      } else {
        router.replace('/(trainer)');
      }
    } else if (existingRole === 'client') {
      router.replace('/(client)');
    }
  }, [isLoaded, user, convexUser, router]);

  const handleRoleSelection = async (role: 'trainer' | 'client') => {
    if (!user) return;

    setLoading(true);
    try {
      // Sync user data to Convex
      const phoneNumber =
        (user.unsafeMetadata?.phoneNumber as string | undefined) ||
        user.primaryPhoneNumber?.phoneNumber;

      await createUser({
        clerkId: user.id,
        email: user.primaryEmailAddress?.emailAddress || '',
        fullName:
          user.fullName ||
          `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        phoneNumber: phoneNumber,
        role: role,
      });

      // Update user's metadata with selected role
      await user.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          role: role,
        },
      });

      showToast.success('Role saved successfully!');

      // Navigate to appropriate screen based on role
      if (role === 'trainer') {
        router.replace('/(auth)/trainer-setup');
      } else {
        router.replace('/(client)');
      }
    } catch (err: any) {
      console.error('Error saving role:', err);
      showToast.error(err.message || 'Failed to save role');
      setLoading(false);
    }
  };

  // Show loading while checking existing role
  if (checkingRole) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: colors.background }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View
      className="flex-1 px-6 justify-center"
      style={{ backgroundColor: colors.background, paddingTop: insets.top }}
    >
      <StatusBar style="auto" />

      <View className="items-center mb-12">
        <Text
          className="text-3xl font-bold mb-3"
          style={{ color: colors.text }}
        >
          Choose Your Role
        </Text>
        <Text
          className="text-base text-center px-4"
          style={{ color: colors.textSecondary }}
        >
          Select how you want to use the app
        </Text>
      </View>

      <View className="gap-4 mb-8">
        {/* Trainer Option */}
        <TouchableOpacity
          onPress={() => setSelectedRole('trainer')}
          disabled={loading}
          className="p-6 rounded-2xl border-2"
          style={{
            backgroundColor:
              selectedRole === 'trainer' ? colors.primary : colors.surface,
            borderColor:
              selectedRole === 'trainer' ? colors.primary : colors.border,
            ...shadows.medium,
          }}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <View
                className="w-16 h-16 rounded-full items-center justify-center mr-4"
                style={{
                  backgroundColor:
                    selectedRole === 'trainer'
                      ? 'rgba(255,255,255,0.2)'
                      : `${colors.primary}15`,
                }}
              >
                <Ionicons
                  name="barbell-outline"
                  size={32}
                  color={selectedRole === 'trainer' ? '#FFF' : colors.primary}
                />
              </View>
              <View className="flex-1">
                <Text
                  className="text-xl font-bold mb-1"
                  style={{
                    color: selectedRole === 'trainer' ? '#FFF' : colors.text,
                  }}
                >
                  I'm a Trainer
                </Text>
                <Text
                  className="text-sm"
                  style={{
                    color:
                      selectedRole === 'trainer'
                        ? 'rgba(255,255,255,0.8)'
                        : colors.textSecondary,
                  }}
                >
                  Manage clients and create workout plans
                </Text>
              </View>
            </View>
            {selectedRole === 'trainer' && (
              <Ionicons name="checkmark-circle" size={28} color="white" />
            )}
          </View>
        </TouchableOpacity>

        {/* Client Option */}
        <TouchableOpacity
          onPress={() => setSelectedRole('client')}
          disabled={loading}
          className="p-6 rounded-2xl border-2"
          style={{
            backgroundColor:
              selectedRole === 'client' ? colors.primary : colors.surface,
            borderColor:
              selectedRole === 'client' ? colors.primary : colors.border,
            ...shadows.medium,
          }}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <View
                className="w-16 h-16 rounded-full items-center justify-center mr-4"
                style={{
                  backgroundColor:
                    selectedRole === 'client'
                      ? 'rgba(255,255,255,0.2)'
                      : `${colors.primary}15`,
                }}
              >
                <Ionicons
                  name="person-outline"
                  size={32}
                  color={selectedRole === 'client' ? '#FFF' : colors.primary}
                />
              </View>
              <View className="flex-1">
                <Text
                  className="text-xl font-bold mb-1"
                  style={{
                    color: selectedRole === 'client' ? '#FFF' : colors.text,
                  }}
                >
                  I'm a Client
                </Text>
                <Text
                  className="text-sm"
                  style={{
                    color:
                      selectedRole === 'client'
                        ? 'rgba(255,255,255,0.8)'
                        : colors.textSecondary,
                  }}
                >
                  Track workouts and follow training plans
                </Text>
              </View>
            </View>
            {selectedRole === 'client' && (
              <Ionicons name="checkmark-circle" size={28} color="white" />
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* Continue Button */}
      <TouchableOpacity
        onPress={() => selectedRole && handleRoleSelection(selectedRole)}
        disabled={!selectedRole || loading}
        className="py-4 rounded-xl"
        style={{
          backgroundColor:
            selectedRole && !loading ? colors.primary : colors.border,
          ...shadows.medium,
        }}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white text-center text-lg font-semibold">
            Continue
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
