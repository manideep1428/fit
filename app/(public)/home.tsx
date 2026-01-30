import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getColors, BorderRadius, Gradients } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

export default function HomePage() {
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = getColors(scheme === "dark");
  const insets = useSafeAreaInsets();
  const gradients = scheme === "dark" ? Gradients.dark : Gradients.light;

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />

      {/* Hero Section */}
      <View className="relative h-[600px] w-full">
        <Image
          source={require("@/assets/images/home_hero.png")}
          className="absolute inset-0 w-full h-full"
          resizeMode="cover"
        />
        <LinearGradient
          colors={["transparent", colors.background]}
          className="absolute inset-0"
          start={{ x: 0.5, y: 0.3 }}
          end={{ x: 0.5, y: 1 }}
        />

        <View
          className="absolute inset-0 px-6 justify-between pb-12"
          style={{ paddingTop: insets.top + 20 }}
        >
          <View className="flex-row justify-between items-center">
            <Text className="text-2xl font-bold text-white">FitApp</Text>
            <TouchableOpacity
              onPress={() => router.push("/(auth)/sign-in" as any)}
              className="px-4 py-2 rounded-full border border-white/30 bg-white/10"
            >
              <Text className="text-white font-medium">Sign In</Text>
            </TouchableOpacity>
          </View>

          <View>
            <Text
              className="text-5xl font-bold mb-4"
              style={{ color: "#FFFFFF" }}
            >
              Elevate Your{" "}
              <Text style={{ color: colors.primary }}>Fitness</Text>
            </Text>
            <Text
              className="text-lg mb-8 leading-7"
              style={{ color: "rgba(255, 255, 255, 0.8)" }}
            >
              The all-in-one platform for trainers and clients to achieve
              extraordinary results together.
            </Text>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push("/(auth)/welcome" as any)}
              className="w-full h-16 rounded-2xl overflow-hidden"
            >
              <LinearGradient
                colors={gradients.primary as [string, string, ...string[]]}
                className="w-full h-full items-center justify-center"
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text className="text-white font-bold text-lg">
                  Get Started Now
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Features Section */}
      <View className="px-6 py-12">
        <Text
          className="text-3xl font-bold mb-8 text-center"
          style={{ color: colors.text }}
        >
          Everything you need
        </Text>

        <View className="gap-6">
          <FeatureCard
            icon="calendar-outline"
            title="Calendar Sync"
            description="Seamlessly integrate with Google Calendar to manage your training sessions effortlessly."
            colors={colors}
          />
          <FeatureCard
            icon="stats-chart-outline"
            title="Progress Tracking"
            description="Monitor your gains with advanced analytics and visual progress reports."
            colors={colors}
          />
          <FeatureCard
            icon="chatbubbles-outline"
            title="Direct Messaging"
            description="Stay connected with your trainer or clients with real-time communication."
            colors={colors}
          />
        </View>
      </View>

      {/* Footer */}
      <View
        className="px-6 py-12 border-t"
        style={{
          backgroundColor: colors.surfaceSecondary,
          borderColor: colors.border,
        }}
      >
        <Text
          className="text-2xl font-bold mb-6"
          style={{ color: colors.text }}
        >
          FitApp
        </Text>

        <View className="flex-row flex-wrap gap-y-4 mb-8">
          <TouchableOpacity
            className="w-1/2"
            onPress={() => router.push("/(public)/privacy" as any)}
          >
            <Text style={{ color: colors.textSecondary }}>Privacy Policy</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="w-1/2"
            onPress={() => router.push("/(public)/terms" as any)}
          >
            <Text style={{ color: colors.textSecondary }}>
              Terms of Service
            </Text>
          </TouchableOpacity>
          <TouchableOpacity className="w-1/2">
            <Text style={{ color: colors.textSecondary }}>Contact Us</Text>
          </TouchableOpacity>
          <TouchableOpacity className="w-1/2">
            <Text style={{ color: colors.textSecondary }}>Support</Text>
          </TouchableOpacity>
        </View>

        <Text className="text-sm" style={{ color: colors.textTertiary }}>
          © 2026 FitApp Inc. All rights reserved.
        </Text>
      </View>
    </ScrollView>
  );
}

function FeatureCard({ icon, title, description, colors }: any) {
  return (
    <View
      className="p-6 rounded-3xl border"
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.border,
      }}
    >
      <View
        className="w-12 h-12 rounded-xl items-center justify-center mb-4"
        style={{ backgroundColor: colors.primary + "20" }}
      >
        <Ionicons name={icon} size={24} color={colors.primary} />
      </View>
      <Text className="text-xl font-bold mb-2" style={{ color: colors.text }}>
        {title}
      </Text>
      <Text
        className="text-sm leading-5"
        style={{ color: colors.textSecondary }}
      >
        {description}
      </Text>
    </View>
  );
}
