import { View, Text, ScrollView } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getColors } from "@/constants/colors";

export default function PrivacyPolicy() {
  const scheme = useColorScheme();
  const colors = getColors(scheme === "dark");

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
    >
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />

      <Text className="text-3xl font-bold mb-6" style={{ color: colors.text }}>
        Privacy Policy
      </Text>

      <Text className="text-sm mb-8" style={{ color: colors.textTertiary }}>
        Last Updated: January 30, 2026
      </Text>

      <Section
        title="1. Information We Collect"
        content="Personal Information: When you sign up, we collect your name, email address, and profile information. For trainers, we may collect professional certifications and specialties."
        colors={colors}
      />

      <Section
        title="2. Google Calendar Integration"
        content="If you choose to sync your Google Calendar, we access your calendar events to help you manage training sessions. We do not store your Google password and only access the data necessary for the app to function."
        colors={colors}
      />

      <Section
        title="3. How We Use Your Data"
        content="We use your data to provide and improve our services, facilitate communication between trainers and clients, and personalize your fitness experience."
        colors={colors}
      />

      <Section
        title="4. Data Security"
        content="We implement industry-standard security measures to protect your personal information from unauthorized access, loss, or misuse."
        colors={colors}
      />

      <Section
        title="5. Your Rights"
        content="You have the right to access, correct, or delete your personal information at any time through the app settings or by contacting our support team."
        colors={colors}
      />

      <Section
        title="6. Changes to This Policy"
        content="We may update this privacy policy from time to time. We will notify you of any significant changes by posting the new policy on this page."
        colors={colors}
      />
    </ScrollView>
  );
}

function Section({ title, content, colors }: any) {
  return (
    <View className="mb-8">
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
