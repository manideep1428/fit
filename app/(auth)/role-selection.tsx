import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

export default function RoleSelectionScreen() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [selectedRole, setSelectedRole] = useState<'trainer' | 'client' | null>(null);
  const [loading, setLoading] = useState(false);
  const createUser = useMutation(api.users.createUser);

  // Check if user already has a role and redirect accordingly
  useEffect(() => {
    if (!isLoaded || !user) return;

    const existingRole = user.unsafeMetadata?.role as string | undefined;
    
    if (existingRole === 'trainer') {
      router.replace('/(trainer)');
    } else if (existingRole === 'client') {
      router.replace('/(client)');
    }
  }, [isLoaded, user, router]);

  const handleRoleSelection = async (role: 'trainer' | 'client') => {
    if (!user) return;

    setLoading(true);
    try {
      // Update user's metadata with selected role
      await user.update({
        unsafeMetadata: {
          role: role,
        },
      });

      // Sync user data to Convex
      await createUser({
        clerkId: user.id,
        email: user.primaryEmailAddress?.emailAddress || '',
        fullName: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        phoneNumber: user.primaryPhoneNumber?.phoneNumber,
        role: role,
      });

      // Navigate to appropriate screen based on role
      if (role === 'trainer') {
        router.replace('/(trainer)');
      } else {
        router.replace('/(client)');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save role');
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-[#FFF5E6] px-6 justify-center">
      <StatusBar style="dark" />
      
      <View className="items-center mb-12">
        <Text className="text-3xl font-bold text-gray-900 mb-3">
          Choose Your Role
        </Text>
        <Text className="text-base text-gray-600 text-center px-4">
          Select how you want to use the app
        </Text>
      </View>

      <View className="gap-4 mb-8">
        {/* Trainer Option */}
        <TouchableOpacity
          onPress={() => setSelectedRole('trainer')}
          disabled={loading}
          className={`p-6 rounded-2xl border-2 ${
            selectedRole === 'trainer' 
              ? 'bg-[#C17A4A] border-[#C17A4A]' 
              : 'bg-white border-gray-300'
          }`}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <View className={`w-16 h-16 rounded-full items-center justify-center mr-4 ${
                selectedRole === 'trainer' ? 'bg-white/20' : 'bg-[#C17A4A]/10'
              }`}>
                <Ionicons 
                  name="barbell-outline" 
                  size={32} 
                  color={selectedRole === 'trainer' ? '#FFF' : '#C17A4A'} 
                />
              </View>
              <View className="flex-1">
                <Text className={`text-xl font-bold mb-1 ${
                  selectedRole === 'trainer' ? 'text-white' : 'text-gray-900'
                }`}>
                  I'm a Trainer
                </Text>
                <Text className={`text-sm ${
                  selectedRole === 'trainer' ? 'text-white/80' : 'text-gray-600'
                }`}>
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
          className={`p-6 rounded-2xl border-2 ${
            selectedRole === 'client' 
              ? 'bg-[#C17A4A] border-[#C17A4A]' 
              : 'bg-white border-gray-300'
          }`}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <View className={`w-16 h-16 rounded-full items-center justify-center mr-4 ${
                selectedRole === 'client' ? 'bg-white/20' : 'bg-[#C17A4A]/10'
              }`}>
                <Ionicons 
                  name="person-outline" 
                  size={32} 
                  color={selectedRole === 'client' ? '#FFF' : '#C17A4A'} 
                />
              </View>
              <View className="flex-1">
                <Text className={`text-xl font-bold mb-1 ${
                  selectedRole === 'client' ? 'text-white' : 'text-gray-900'
                }`}>
                  I'm a Client
                </Text>
                <Text className={`text-sm ${
                  selectedRole === 'client' ? 'text-white/80' : 'text-gray-600'
                }`}>
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
        className={`py-4 rounded-xl ${
          selectedRole && !loading ? 'bg-[#C17A4A]' : 'bg-gray-300'
        }`}
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
