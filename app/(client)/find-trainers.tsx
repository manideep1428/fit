import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getColors, Shadows } from '@/constants/colors';

export default function FindTrainersScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = getColors(scheme === 'dark');
  const shadows = scheme === 'dark' ? Shadows.dark : Shadows.light;
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <StatusBar style="auto" />
      <ScrollView className="flex-1">
        <View className="px-6 pb-6" style={{ paddingTop: insets.top + 12 }}>
          {/* Header */}
          <View className="flex-row items-center mb-6">
            <TouchableOpacity onPress={() => router.back()} className="mr-4">
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text className="text-2xl font-bold" style={{ color: colors.text }}>
              My Trainers
            </Text>
          </View>

          {/* Info Card */}
          <View
            className="rounded-2xl p-6 items-center"
            style={{ backgroundColor: colors.surface, ...shadows.medium }}
          >
            <View
              className="w-20 h-20 rounded-full items-center justify-center mb-4"
              style={{ backgroundColor: `${colors.primary}15` }}
            >
              <Ionicons name="people-outline" size={40} color={colors.primary} />
            </View>
            
            <Text className="text-xl font-bold mb-3 text-center" style={{ color: colors.text }}>
              Trainers Add Clients
            </Text>
            
            <Text className="text-base text-center leading-6 mb-6" style={{ color: colors.textSecondary }}>
              In this app, trainers add their clients. If you want to work with a trainer, contact them directly and ask them to add you using your email address.
            </Text>

            <View
              className="w-full p-4 rounded-xl mb-4"
              style={{ backgroundColor: `${colors.primary}10` }}
            >
              <View className="flex-row items-center mb-2">
                <Ionicons name="mail-outline" size={20} color={colors.primary} />
                <Text className="text-sm font-semibold ml-2" style={{ color: colors.text }}>
                  How it works
                </Text>
              </View>
              <Text className="text-sm" style={{ color: colors.textSecondary }}>
                1. Contact your trainer{'\n'}
                2. Give them your email address{'\n'}
                3. They'll add you to their client list{'\n'}
                4. You can then book sessions with them
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => router.back()}
              className="w-full rounded-xl py-4 items-center"
              style={{ backgroundColor: colors.primary }}
            >
              <Text className="text-white font-semibold text-base">Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
