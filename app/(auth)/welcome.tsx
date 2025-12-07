import { View, Text, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import GoogleOAuthButton from '@/components/GoogleOAuthButton';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getColors } from '@/constants/colors';

export default function WelcomeScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = getColors(scheme === 'dark');

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <StatusBar style="auto" />

      {/* Top Image */}
      <View className="w-full h-[60%]">
        <Image
          source={require('@/assets/images/intro.jpg')}
          className="w-full h-full"
          resizeMode="cover"
        />
      </View>

      {/* Rounded Container Overlay */}
      <View
        className="flex-1 px-6 pt-7 pb-8 rounded-t-[40px] -mt-10"
        style={{ backgroundColor: colors.surface, elevation: 8 }}
      >
        <View className="items-center mb-6">
          <Text className="text-3xl font-bold mb-2" style={{ color: colors.text }}>
            Welcome Back
          </Text>
          <Text className="text-sm text-center leading-5" style={{ color: colors.textSecondary }}>
            We're glad to see you. Pick up where you left off and enjoy a seamless experience designed just for you.
          </Text>
        </View>

        {/* Buttons */}
        <View className="gap-4">
          <TouchableOpacity
            onPress={() => router.push('/(auth)/sign-up' as any)}
            className="py-4 rounded-xl"
            style={{ backgroundColor: colors.primary }}
          >
            <Text className="text-white text-center text-lg font-semibold">
              Get Started
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/(auth)/sign-in' as any)}
            className="py-4 rounded-xl"
            style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}
          >
            <Text className="text-center text-lg font-semibold" style={{ color: colors.text }}>
              Sign In
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
