import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useUser } from '@clerk/clerk-expo';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getColors, Shadows } from '@/constants/colors';
import { StatusBar } from 'expo-status-bar';
import { showToast } from '@/utils/toast';

export default function AddClientScreen() {
  const { user } = useUser();
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = getColors(scheme === 'dark');
  const shadows = scheme === 'dark' ? Shadows.dark : Shadows.light;

  const [clientEmail, setClientEmail] = useState('');
  const [clientName, setClientName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const inviteClient = useMutation(api.users.inviteClientByEmail);
  const createNotification = useMutation(api.notifications.createNotification);

  // Get existing clients for this trainer
  const existingClients = useQuery(
    api.users.getTrainerClients,
    user?.id ? { trainerId: user.id } : 'skip'
  );

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleInviteClient = async () => {
    if (!user?.id) return;

    if (!clientEmail.trim()) {
      showToast.error('Please enter client email');
      return;
    }

    if (!validateEmail(clientEmail.trim())) {
      showToast.error('Please enter a valid email address');
      return;
    }

    if (!clientName.trim()) {
      showToast.error('Please enter client name');
      return;
    }

    // Check if client already exists in trainer's list
    const alreadyAdded = existingClients?.some(
      (client: any) => client?.email?.toLowerCase() === clientEmail.trim().toLowerCase()
    );

    if (alreadyAdded) {
      showToast.error('This client is already in your list');
      return;
    }

    setIsAdding(true);
    try {
      const result = await inviteClient({
        trainerId: user.id,
        email: clientEmail.trim().toLowerCase(),
        fullName: clientName.trim(),
      });

      if (result.status === 'existing') {
        showToast.success('Client added to your list!');
      } else {
        showToast.success('Client invited! They can now sign in with this email.');
      }

      // Navigate back to clients screen
      router.replace('/(trainer)/clients' as any);
    } catch (error: any) {
      console.error('Error inviting client:', error);
      showToast.error(error.message || 'Failed to invite client');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />

      {/* Header */}
      <View className="px-4 pt-16 pb-4 flex-row items-center justify-between">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-12 h-12 items-center justify-center"
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text className="text-xl font-semibold flex-1 text-center" style={{ color: colors.text }}>
          Add Client
        </Text>
        <View className="w-12" />
      </View>

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {/* Info Card */}
        <View 
          className="p-4 rounded-xl mb-6"
          style={{ backgroundColor: `${colors.primary}15` }}
        >
          <View className="flex-row items-center mb-2">
            <Ionicons name="information-circle" size={20} color={colors.primary} />
            <Text className="text-sm font-semibold ml-2" style={{ color: colors.text }}>
              How it works
            </Text>
          </View>
          <Text className="text-sm" style={{ color: colors.textSecondary }}>
            Enter your client's email and name. They will be able to sign in using this email address. If they don't have an account yet, one will be created for them.
          </Text>
        </View>

        {/* Client Email Input */}
        <View className="mb-4">
          <Text className="text-sm font-semibold mb-2" style={{ color: colors.text }}>
            Client Email *
          </Text>
          <View
            className="flex-row items-center px-4 py-3.5 rounded-xl"
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
            <TextInput
              className="flex-1 ml-3 text-base"
              style={{ color: colors.text }}
              placeholder="client@example.com"
              placeholderTextColor={colors.textSecondary}
              value={clientEmail}
              onChangeText={setClientEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
            />
          </View>
        </View>

        {/* Client Name Input */}
        <View className="mb-6">
          <Text className="text-sm font-semibold mb-2" style={{ color: colors.text }}>
            Client Name *
          </Text>
          <View
            className="flex-row items-center px-4 py-3.5 rounded-xl"
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Ionicons name="person-outline" size={20} color={colors.textSecondary} />
            <TextInput
              className="flex-1 ml-3 text-base"
              style={{ color: colors.text }}
              placeholder="John Doe"
              placeholderTextColor={colors.textSecondary}
              value={clientName}
              onChangeText={setClientName}
              autoCapitalize="words"
            />
          </View>
        </View>

        {/* Add Button */}
        <TouchableOpacity
          className="rounded-xl py-4 items-center mb-6"
          style={{ 
            backgroundColor: clientEmail && clientName ? colors.primary : colors.border,
          }}
          onPress={handleInviteClient}
          disabled={isAdding || !clientEmail || !clientName}
        >
          {isAdding ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <View className="flex-row items-center">
              <Ionicons name="person-add-outline" size={20} color="#FFF" />
              <Text className="text-base font-semibold text-white ml-2">
                Add Client
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Existing Clients Section */}
        {existingClients && existingClients.length > 0 && (
          <View className="mt-4">
            <Text className="text-sm font-semibold mb-3" style={{ color: colors.textSecondary }}>
              Your Clients ({existingClients.length})
            </Text>
            {existingClients.slice(0, 5).map((client: any) => (
              <View
                key={client?._id}
                className="flex-row items-center p-3 rounded-xl mb-2"
                style={{ backgroundColor: colors.surface }}
              >
                <View
                  className="w-10 h-10 rounded-full items-center justify-center mr-3"
                  style={{ backgroundColor: colors.primary }}
                >
                  <Text className="text-white font-bold">
                    {client?.fullName?.[0] || 'C'}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="font-medium" style={{ color: colors.text }}>
                    {client?.fullName || 'Client'}
                  </Text>
                  <Text className="text-xs" style={{ color: colors.textSecondary }}>
                    {client?.email}
                  </Text>
                </View>
                {client?.clerkId?.startsWith('pending_') && (
                  <View 
                    className="px-2 py-1 rounded-full"
                    style={{ backgroundColor: `${colors.warning}20` }}
                  >
                    <Text className="text-xs font-medium" style={{ color: colors.warning }}>
                      Pending
                    </Text>
                  </View>
                )}
              </View>
            ))}
            {existingClients.length > 5 && (
              <TouchableOpacity
                className="py-3 items-center"
                onPress={() => router.push('/(trainer)/clients' as any)}
              >
                <Text className="text-sm font-medium" style={{ color: colors.primary }}>
                  View all {existingClients.length} clients
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
