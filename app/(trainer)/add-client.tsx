import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useMemo } from 'react';
import { useUser } from '@clerk/clerk-expo';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getColors, Shadows } from '@/constants/colors';
import { StatusBar } from 'expo-status-bar';

export default function AddClientScreen() {
  const { user } = useUser();
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = getColors(scheme === 'dark');
  const shadows = scheme === 'dark' ? Shadows.dark : Shadows.light;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [isAdding, setIsAdding] = useState(false);

  const addClientToTrainer = useMutation(api.users.addClientToTrainer);
  const createNotification = useMutation(api.notifications.createNotification);

  // Fetch all clients upfront (limited to first 20)
  const allClients = useQuery(api.users.getAllClients);

  // Filter clients based on search query (client-side filtering)
  const displayedClients = useMemo(() => {
    if (!allClients) return [];

    // Limit to 20 clients
    const limitedClients = allClients.slice(0, 20);

    if (searchQuery.length < 2) {
      return limitedClients;
    }

    const query = searchQuery.toLowerCase();
    return limitedClients.filter((client: any) =>
      client.fullName?.toLowerCase().includes(query) ||
      client.email?.toLowerCase().includes(query)
    );
  }, [allClients, searchQuery]);

  const handleAddClient = async () => {
    if (!selectedClient || !user?.id) return;

    setIsAdding(true);
    try {
      // Add client to trainer's list
      await addClientToTrainer({
        trainerId: user.id,
        clientId: selectedClient.clerkId,
      });

      // Send notification to client
      await createNotification({
        userId: selectedClient.clerkId,
        type: 'trainer_added',
        title: 'New Trainer Added',
        message: `${user.firstName || 'A trainer'} has added you as their client. You can now book sessions with them!`,
        read: false,
      });

      // Navigate back
      router.back();
    } catch (error) {
      console.error('Error adding client:', error);
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

      <View className="flex-1 px-4">
        {/* Search Input */}
        <View className="mb-4">
          <View className="relative">
            <Ionicons
              name="search"
              size={20}
              color={colors.textSecondary}
              style={{ position: 'absolute', left: 16, top: 14, zIndex: 1 }}
            />
            <TextInput
              className="rounded-xl py-3.5 pl-12 pr-4 text-base"
              style={{
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                color: colors.text,
              }}
              placeholder="Search by name or email"
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Client List */}
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {!allClients ? (
            <View className="items-center py-12">
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : displayedClients.length === 0 ? (
            <View className="items-center py-12">
              <Ionicons name="person-outline" size={48} color={colors.textTertiary} />
              <Text className="mt-4 text-base" style={{ color: colors.textSecondary }}>
                No clients found
              </Text>
            </View>
          ) : (
            displayedClients.map((client: any) => (
              <TouchableOpacity
                key={client._id}
                className="rounded-xl p-4 mb-3"
                style={{
                  backgroundColor: colors.surface,
                  borderWidth: 2,
                  borderColor: selectedClient?._id === client._id ? colors.primary : colors.border,
                  ...shadows.small,
                }}
                onPress={() => setSelectedClient(client)}
              >
                <View className="flex-row items-center">
                  <View
                    className="w-12 h-12 rounded-full items-center justify-center mr-3"
                    style={{ backgroundColor: colors.primary }}
                  >
                    <Text className="text-white text-lg font-bold">
                      {client.fullName?.[0] || 'C'}
                    </Text>
                  </View>

                  <View className="flex-1">
                    <Text className="font-semibold text-base" style={{ color: colors.text }}>
                      {client.fullName || 'Client'}
                    </Text>
                    <Text className="text-sm" style={{ color: colors.textSecondary }}>
                      {client.email}
                    </Text>
                  </View>

                  {selectedClient?._id === client._id && (
                    <View
                      className="w-7 h-7 rounded-full items-center justify-center"
                      style={{ backgroundColor: colors.primary }}
                    >
                      <Ionicons name="checkmark" size={18} color="#FFF" />
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>

      {/* Add Button */}
      {selectedClient && (
        <View
          className="px-4 py-4"
          style={{
            backgroundColor: colors.background,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}
        >
          <TouchableOpacity
            className="rounded-xl py-4 items-center"
            style={{ backgroundColor: colors.primary }}
            onPress={handleAddClient}
            disabled={isAdding}
          >
            {isAdding ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text className="text-base font-semibold text-white">
                Add {selectedClient.fullName}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
