import { View, Text, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GoogleOAuthButton from '@/components/GoogleOAuthButton';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getColors, BorderRadius } from '@/constants/colors';
import { AnimatedButton } from '@/components/AnimatedButton';

export default function WelcomeScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = getColors(scheme === 'dark');
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />

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
        className="flex-1 px-6 pt-8 pb-8 -mt-10"
        style={{
          backgroundColor: colors.surface,
          borderTopLeftRadius: BorderRadius.xxlarge,
          borderTopRightRadius: BorderRadius.xxlarge,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
        }}
      >
        <View className="items-center mb-8">
          <Text className="text-3xl font-bold mb-3" style={{ color: colors.text }}>
            Welcome Back
          </Text>
          <Text className="text-sm text-center leading-6 px-4" style={{ color: colors.textSecondary }}>
            We're glad to see you. Pick up where you left off and enjoy a seamless experience designed just for you.
          </Text>
        </View>

        {/* Buttons */}
        <View className="gap-4">
          <AnimatedButton
            onPress={() => router.push('/(auth)/sign-up' as any)}
            variant="primary"
            size="large"
            fullWidth
          >
            Get Started
          </AnimatedButton>

          <AnimatedButton
            onPress={() => router.push('/(auth)/sign-in' as any)}
            variant="outline"
            size="large"
            fullWidth
          >
            Sign In
          </AnimatedButton>
        </View>
      </View>
    </View>
  );
}
