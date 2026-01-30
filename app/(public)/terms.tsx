import { View, Text, ScrollView } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getColors } from "@/constants/colors";

export default function TermsOfService() {
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
        Terms of Service
      </Text>

      <Text className="text-sm mb-8" style={{ color: colors.textTertiary }}>
        Last Updated: January 30, 2026
      </Text>

      <Section
        title="1. Acceptance of Terms"
        content="By accessing or using the FitApp application, you agree to be bound by these Terms of Service and all applicable laws and regulations."
        colors={colors}
      />

      <Section
        title="2. User Accounts"
        content="You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must be at least 18 years old to use this service."
        colors={colors}
      />

      <Section
        title="3. Trainer-Client Relationships"
        content="FitApp provides a platform for trainers and clients to connect. We are not responsible for the quality of training services provided or any disputes that may arise between users."
        colors={colors}
      />

      <Section
        title="4. Prohibited Conduct"
        content="Users agree not to use the service for any unlawful purpose or in any way that could damage, disable, or impair the application's functionality."
        colors={colors}
      />

      <Section
        title="5. Intellectual Property"
        content="All content and materials available on FitApp, including but not limited to text, graphics, logos, and software, are the property of FitApp or its licensors."
        colors={colors}
      />

      <Section
        title="6. Limitation of Liability"
        content="FitApp shall not be liable for any indirect, incidental, special, or consequential damages resulting from the use or inability to use the service."
        colors={colors}
      />

      <Section
        title="7. Governing Law"
        content="These terms shall be governed by and construed in accordance with the laws of the jurisdiction in which FitApp is registered."
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
