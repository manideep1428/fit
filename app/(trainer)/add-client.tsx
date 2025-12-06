import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
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

  // Search clients by email or name
  const searchResults = useQuery(
    api.users.searchClients,
    searchQuery.length >= 2 ? { query: searchQuery } : 'skip'
  );

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
        <View className="mb-6">
          <Text className="text-base font-medium mb-2" style={{ color: colors.text }}>
            Search for a client
          </Text>
          <View className="relative">
            <Ionicons
              name="search"
              size={20}
              color={colors.textSecondary}
              style={{ position: 'absolute', left: 16, top: 16, zIndex: 1 }}
            />
            <TextInput
              className="rounded-xl py-4 pl-12 pr-4 text-base"
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

        {/* Search Results */}
        <ScrollView className="flex-1">
          {searchQuery.length < 2 ? (
            <View className="items-center py-12">
              <Ionicons name="search-outline" size={64} color={colors.textTertiary} />
              <Text className="mt-4 text-base" style={{ color: colors.textSecondary }}>
                Start typing to search for clients
              </Text>
            </View>
          ) : !searchResults ? (
            <View className="items-center py-12">
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : searchResults.length === 0 ? (
            <View className="items-center py-12">
              <Ionicons name="person-outline" size={64} color={colors.textTertiary} />
              <Text className="mt-4 text-base" style={{ color: colors.textSecondary }}>
                No clients found
              </Text>
              <Text className="mt-2 text-sm text-center px-8" style={{ color: colors.textTertiary }}>
                Try searching with a different name or email
              </Text>
            </View>
          ) : (
            searchResults.map((client: any) => (
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
                    className="w-14 h-14 rounded-full items-center justify-center mr-3"
                    style={{ backgroundColor: colors.primary }}
                  >
                    {client.profileImageId ? (
                      <Image
                        source={{ uri: client.profileImageId }}
                        className="w-full h-full rounded-full"
                      />
                    ) : (
                      <Text className="text-white text-xl font-bold">
                        {client.fullName?.[0] || 'C'}
                      </Text>
                    )}
                  </View>

                  <View className="flex-1">
                    <Text className="font-bold text-base mb-1" style={{ color: colors.text }}>
                      {client.fullName}
                    </Text>
                    <Text className="text-sm" style={{ color: colors.textSecondary }}>
                      {client.email}
                    </Text>
                  </View>

                  {selectedClient?._id === client._id && (
                    <View
                      className="w-8 h-8 rounded-full items-center justify-center"
                      style={{ backgroundColor: colors.primary }}
                    >
                      <Ionicons name="checkmark" size={20} color="#FFF" />
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
            style={{ backgroundColor: colors.primary, ...shadows.medium }}
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
