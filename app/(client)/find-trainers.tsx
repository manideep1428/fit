import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Image, TextInput } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getColors, Shadows } from '@/constants/colors';

export default function FindTrainersScreen() {
  const { user } = useUser();
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = getColors(scheme === 'dark');
  const shadows = scheme === 'dark' ? Shadows.dark : Shadows.light;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrainer, setSelectedTrainer] = useState<any>(null);

  // Fetch all trainers
  const allTrainers = useQuery(api.users.getAllTrainers);

  // Search trainers by username
  const searchResults = useQuery(
    api.users.searchTrainersByUsername,
    searchQuery.length >= 2 ? { username: searchQuery } : 'skip'
  );

  const addTrainerToClient = useMutation(api.users.addTrainerToClient);

  const trainersToShow = searchQuery.length >= 2 ? searchResults : allTrainers;

  const handleContactTrainer = (trainer: any) => {
    setSelectedTrainer(trainer);
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <StatusBar style="auto" />
      <ScrollView className="flex-1">
        <View className="px-6 pt-16 pb-6">
          {/* Header */}
          <View className="flex-row items-center mb-6">
            <TouchableOpacity onPress={() => router.back()} className="mr-4">
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text className="text-2xl font-bold" style={{ color: colors.text }}>
              Find Trainers
            </Text>
          </View>

          {/* Info Card */}
          <View
            className="rounded-2xl p-6 mb-6"
            style={{ backgroundColor: colors.primary + '15', borderWidth: 1, borderColor: colors.primary + '30' }}
          >
            <View className="flex-row items-start">
              <View
                className="w-12 h-12 rounded-full items-center justify-center mr-4"
                style={{ backgroundColor: colors.primary + '30' }}
              >
                <Ionicons name="information-circle" size={28} color={colors.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold mb-2" style={{ color: colors.text }}>
                  How to Get Started
                </Text>
                <Text className="text-sm leading-5" style={{ color: colors.textSecondary }}>
                  Browse trainers below and contact them directly to request being added as a client. Once they add you, you'll be able to book sessions with them.
                </Text>
              </View>
            </View>
          </View>

          {/* Search Bar */}
          <View className="mb-6">
            <View
              className="flex-row items-center px-4 py-3 rounded-xl"
              style={{ backgroundColor: colors.surface, ...shadows.small }}
            >
              <Ionicons name="search" size={20} color={colors.textSecondary} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search by username..."
                placeholderTextColor={colors.textSecondary}
                className="flex-1 ml-3 text-base"
                style={{ color: colors.text }}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Trainers List */}
          <View>
            <Text className="text-base font-semibold mb-4" style={{ color: colors.text }}>
              Available Trainers
            </Text>

            {!trainersToShow ? (
              <View className="items-center py-8">
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : trainersToShow.length === 0 ? (
              <View
                className="rounded-2xl p-8 items-center"
                style={{ backgroundColor: colors.surface, ...shadows.medium }}
              >
                <Ionicons name="search-outline" size={64} color={colors.textTertiary} />
                <Text className="mt-4 font-semibold text-base" style={{ color: colors.textSecondary }}>
                  No trainers found
                </Text>
                <Text className="mt-2 text-sm text-center" style={{ color: colors.textTertiary }}>
                  Try adjusting your search
                </Text>
              </View>
            ) : (
              <View className="gap-4">
                {trainersToShow.map((trainer: any) => (
                  <View
                    key={trainer._id}
                    className="rounded-2xl p-5"
                    style={{ backgroundColor: colors.surface, ...shadows.medium }}
                  >
                    <View className="flex-row items-center mb-4">
                      <View
                        className="w-16 h-16 rounded-full mr-4 items-center justify-center overflow-hidden"
                        style={{ backgroundColor: colors.primary }}
                      >
                        {trainer.profileImageId ? (
                          <Image
                            source={{ uri: trainer.profileImageId }}
                            className="w-full h-full"
                          />
                        ) : (
                          <Text className="text-white text-2xl font-bold">
                            {trainer.fullName?.[0] || 'T'}
                          </Text>
                        )}
                      </View>
                      <View className="flex-1">
                        <Text className="text-lg font-bold mb-1" style={{ color: colors.text }}>
                          {trainer.fullName || 'Trainer'}
                        </Text>
                        {trainer.username && (
                          <Text className="text-sm mb-1" style={{ color: colors.textSecondary }}>
                            @{trainer.username}
                          </Text>
                        )}
                        {trainer.specialty && (
                          <Text className="text-sm" style={{ color: colors.textSecondary }}>
                            {trainer.specialty}
                          </Text>
                        )}
                      </View>
                    </View>

                    {trainer.bio && (
                      <Text className="text-sm mb-4" style={{ color: colors.textSecondary }}>
                        {trainer.bio}
                      </Text>
                    )}

                    <View className="flex-row gap-3">
                      <TouchableOpacity
                        onPress={() => handleContactTrainer(trainer)}
                        className="flex-1 rounded-xl py-3 items-center"
                        style={{ backgroundColor: colors.primary }}
                      >
                        <View className="flex-row items-center">
                          <Ionicons name="mail-outline" size={18} color="#FFF" />
                          <Text className="text-white font-semibold ml-2">
                            Contact
                          </Text>
                        </View>
                      </TouchableOpacity>

                      {trainer.phoneNumber && (
                        <TouchableOpacity
                          className="rounded-xl px-4 py-3 items-center justify-center"
                          style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}
                        >
                          <Ionicons name="call-outline" size={18} color={colors.primary} />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Contact Info Modal/Bottom Sheet */}
      {selectedTrainer && (
        <View
          className="absolute bottom-0 left-0 right-0 rounded-t-3xl p-6"
          style={{ backgroundColor: colors.surface, ...shadows.large }}
        >
          <View className="flex-row justify-between items-start mb-4">
            <View className="flex-1">
              <Text className="text-xl font-bold mb-1" style={{ color: colors.text }}>
                Contact {selectedTrainer.fullName}
              </Text>
              <Text className="text-sm" style={{ color: colors.textSecondary }}>
                Reach out to request being added as a client
              </Text>
            </View>
            <TouchableOpacity onPress={() => setSelectedTrainer(null)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View className="gap-3 mb-4">
            {selectedTrainer.email && (
              <View
                className="flex-row items-center p-4 rounded-xl"
                style={{ backgroundColor: colors.background }}
              >
                <Ionicons name="mail" size={20} color={colors.primary} />
                <Text className="ml-3 flex-1" style={{ color: colors.text }}>
                  {selectedTrainer.email}
                </Text>
              </View>
            )}

            {selectedTrainer.phoneNumber && (
              <View
                className="flex-row items-center p-4 rounded-xl"
                style={{ backgroundColor: colors.background }}
              >
                <Ionicons name="call" size={20} color={colors.primary} />
                <Text className="ml-3 flex-1" style={{ color: colors.text }}>
                  {selectedTrainer.phoneNumber}
                </Text>
              </View>
            )}

            {selectedTrainer.username && (
              <View
                className="flex-row items-center p-4 rounded-xl"
                style={{ backgroundColor: colors.background }}
              >
                <Ionicons name="at" size={20} color={colors.primary} />
                <Text className="ml-3 flex-1" style={{ color: colors.text }}>
                  @{selectedTrainer.username}
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            onPress={() => setSelectedTrainer(null)}
            className="rounded-xl py-4 items-center"
            style={{ backgroundColor: colors.primary }}
          >
            <Text className="text-white font-bold text-base">Got it</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
