import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  Platform,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getColors } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function PrivacyPolicy() {
  const scheme = useColorScheme();
  const colors = getColors(scheme === "dark");
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const isDesktop = width > 1024;

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />

      {/* Header */}
      <View
        className="px-6 pb-8 border-b"
        style={{
          paddingTop: isWeb ? 40 : 60,
          backgroundColor: colors.surface,
          borderColor: colors.border,
        }}
      >
        <View className="max-w-[1000px] w-full mx-auto">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mb-8 w-12 h-12 items-center justify-center rounded-2xl shadow-sm"
            style={{ backgroundColor: colors.surfaceSecondary }}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text
            className={`${isDesktop ? "text-5xl" : "text-3xl"} font-black italic tracking-tighter`}
            style={{ color: colors.text }}
          >
            Privacy <Text style={{ color: colors.primary }}>Policy</Text>
          </Text>
          <Text
            className="text-sm mt-3 font-medium uppercase tracking-widest opacity-60"
            style={{ color: colors.textTertiary }}
          >
            Last Updated: February 3, 2026
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingVertical: 48, paddingHorizontal: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="max-w-[1000px] w-full mx-auto">
          <Text
            className="text-xl leading-8 mb-12 font-medium"
            style={{ color: colors.textSecondary }}
          >
            At FitApp, we take your privacy seriously. This Privacy Policy
            explains how we collect, use, disclose, and safeguard your
            information when you use our mobile application and services.
          </Text>

          <Section
            title="1. Information We Collect"
            content="We collect information that you provide directly to us, including:
  • Personal credentials (name, email, phone number) through Clerk authentication.
  • Profile information such as fitness goals, certifications (for trainers), and profile pictures.
  • Transactional information regarding subscriptions and payments."
            colors={colors}
          />

          <Section
            title="2. Google Calendar Integration"
            content="FitApp offers integration with Google Calendar to sync your training sessions. When granted permission:
  • We access your calendar events to identify availability and manage bookings.
  • We do not store your Google account credentials.
  • You can revoke this access at any time through your Google account settings or within FitApp."
            colors={colors}
          />

          <Section
            title="3. How We Use Your Data"
            content="We use the collected data for various purposes:
  • To provide and maintain our Service.
  • To facilitate bookings and communication between trainers and clients.
  • To process payments and prevent fraudulent transactions.
  • To notify you about changes to our service or important updates."
            colors={colors}
          />

          <Section
            title="4. Data Storage and Security"
            content="Your data is stored securely using industry-standard encryption. We use Convex for our database and Clerk for authentication, both of which maintain rigorous security standards to protect your information."
            colors={colors}
          />

          <Section
            title="5. Third-Party Services"
            content="We may employ third-party companies and individuals due to the following reasons:
  • To facilitate our Service (e.g., Clerk for Auth, Convex for Database, Razorpay/Polar for Payments).
  • To perform Service-related services.
  • To assist us in analyzing how our Service is used."
            colors={colors}
          />

          <Section
            title="6. Your Rights & Choices"
            content="You have the right to:
  • Access the personal data we hold about you.
  • Request the correction of inaccurate personal data.
  • Request the deletion of your account and associated data.
  • Opt-out of marketing communications."
            colors={colors}
          />

          <Section
            title="7. Contact Us"
            content="If you have any questions about this Privacy Policy, please contact us at:
  Email: privacy@fitapp.com
  Support: help.fitapp.com"
            colors={colors}
          />

          <View
            className="mt-12 pt-8 border-t"
            style={{ borderColor: colors.border }}
          >
            <Text
              className="text-center text-sm opacity-40"
              style={{ color: colors.textTertiary }}
            >
              © 2026 FitApp Global Inc.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function Section({ title, content, colors }: any) {
  return (
    <View
      className="mb-8 p-6 rounded-2xl border"
      style={{ backgroundColor: colors.surface, borderColor: colors.border }}
    >
      <Text className="text-xl font-bold mb-3" style={{ color: colors.text }}>
        {title}
      </Text>
      <Text
        className="text-base leading-6"
        style={{ color: colors.textSecondary }}
      >
        {content}
      </Text>
    </View>
  );
}
