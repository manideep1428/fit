import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getColors, Shadows } from '@/constants/colors';
import { LinearGradient } from 'expo-linear-gradient';

export default function FindTrainersScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = getColors(scheme === 'dark');
  const shadows = scheme === 'dark' ? Shadows.dark : Shadows.light;

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />

      {/* Gradient */}
      <LinearGradient
        colors={[`${colors.primary}15`, `${colors.primary}05`, 'transparent']}
        className="absolute top-0 left-0 right-0 h-64"
        pointerEvents="none"
      />

      {/* Top Bar */}
      <View className="flex-row items-center px-4 pt-16 pb-2">
        <TouchableOpacity
          onPress={() => router.back()}
          className="rounded-full"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Scroll Content */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 96 }}
      >
        <View className="px-6 py-8 items-center">
          {/* Icon */}
          <View className="mb-6 items-center">
            <View
              className="w-24 h-24 rounded-full items-center justify-center"
              style={{ backgroundColor: `${colors.primary}33` }}
            >
              <Ionicons name="person-add" size={48} color={colors.primary} />
            </View>
          </View>

          {/* Title */}
          <Text
            className="text-[28px] font-bold text-center mb-4"
            style={{ color: colors.text }}
          >
            Trainers Add Clients
          </Text>

          {/* Description */}
          <Text
            className="text-base text-center mb-10"
            style={{ color: colors.textSecondary, maxWidth: 320 }}
          >
            To ensure the best match for your fitness goals, trainers on our platform initiate the connection. You
            don't need to search!
          </Text>

          {/* Card */}
          <View
            className="w-full rounded-xl p-6"
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              ...shadows.small,
            }}
          >
            <Text className="text-lg font-bold mb-6" style={{ color: colors.text }}>
              How it works
            </Text>

            <View className="relative">
              <View
                className="absolute top-2 bottom-4 w-0.5"
                style={{ backgroundColor: colors.border, left: 15 }}
              />

              {[
                ['Share your email', 'Provide your registered email to your trainer.'],
                ['Trainer sends invite', 'Look for a notification or email link.'],
                ['Accept the invite', 'Confirm the connection inside the app.'],
                ['Start training', 'Access your personalized plan.'],
              ].map(([title, desc], i) => (
                <View key={i} className="flex-row mb-6">
                  <View
                    className="w-8 h-8 rounded-full items-center justify-center mr-4"
                    style={{
                      backgroundColor: colors.primary,
                      elevation: 4,
                    }}
                  >
                    <Text className="text-sm font-bold text-white">{i + 1}</Text>
                  </View>

                  <View className="flex-1 pt-1">
                    <Text className="text-sm font-bold" style={{ color: colors.text }}>
                      {title}
                    </Text>
                    <Text className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                      {desc}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Fixed Bottom CTA */}
      <View
        className="absolute bottom-0 left-0 right-0 px-4 pt-4 pb-8"
        style={{
          backgroundColor: colors.background,
          borderTopWidth: 1,
          borderColor: colors.border,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-12 rounded-xl items-center justify-center"
          style={{ backgroundColor: colors.primary }}
        >
          <Text className="text-white font-bold">Go Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
