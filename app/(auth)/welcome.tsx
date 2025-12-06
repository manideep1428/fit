import { View, Text, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import GoogleOAuthButton from '@/components/GoogleOAuthButton';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-[#FFF5E6]">
      <StatusBar style="dark" />

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
        className="flex-1 bg-white px-6 pt-7 pb-8 rounded-t-[40px] -mt-10 shadow-md"
        style={{ elevation: 8 }}
      >
        <View className="items-center mb-6">
          <Text className="text-3xl font-bold text-gray-900 mb-2">
            Welcome Back
          </Text>
          <Text className="text-sm text-gray-600 text-center leading-5">
            We're glad to see you. Pick up where you left off and enjoy a seamless experience designed just for you.
          </Text>
        </View>

        {/* Buttons */}
        <View className="gap-4">
           <GoogleOAuthButton mode="signup" />
        </View>
      </View>
    </View>
  );
}
