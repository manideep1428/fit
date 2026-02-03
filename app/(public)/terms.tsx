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

export default function TermsOfService() {
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
            Terms of <Text style={{ color: colors.primary }}>Service</Text>
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
            Please read these Terms of Service carefully before using the FitApp
            mobile application. Your access to and use of the service is
            conditioned on your acceptance of and compliance with these Terms.
          </Text>

          <Section
            title="1. Acceptance of Terms"
            content="By accessing or using FitApp, you agree to be bound by these Terms. If you disagree with any part of the terms, then you may not access the service."
            colors={colors}
          />

          <Section
            title="2. User Eligibility"
            content="You must be at least 18 years of age to use this service. By using FitApp, you represent and warrant that you have the right, authority, and capacity to enter into this agreement."
            colors={colors}
          />

          <Section
            title="3. User Accounts"
            content="When you create an account with us, you must provide accurate, complete, and current information. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our service."
            colors={colors}
          />

          <Section
            title="4. Trainer-Client Interactions"
            content="FitApp facilitates connections between fitness trainers and clients. 
  • Trainers are independent service providers and not employees of FitApp.
  • FitApp is not responsible for the quality, safety, or legality of the training services provided.
  • Any disputes arising from training sessions must be resolved directly between the trainer and the client."
            colors={colors}
          />

          <Section
            title="5. Fees and Payments"
            content="Certain aspects of the service may be provided for a fee:
  • All payments are processed through third-party payment processors.
  • You agree to provide current, complete, and accurate purchase and account information for all purchases.
  • Refund policies are determined by the individual trainer unless otherwise specified."
            colors={colors}
          />

          <Section
            title="6. Prohibited Conduct"
            content="You agree not to:
  • Use the service for any illegal purpose.
  • Post or transmit any content that is offensive, harmful, or violates the rights of others.
  • Attempt to interfere with the proper functioning of the service.
  • Use any automated means to access the service."
            colors={colors}
          />

          <Section
            title="7. Intellectual Property"
            content="The service and its original content, features, and functionality are and will remain the exclusive property of FitApp and its licensors."
            colors={colors}
          />

          <Section
            title="8. Limitation of Liability"
            content="In no event shall FitApp, nor its directors, employees, or partners, be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the service."
            colors={colors}
          />

          <Section
            title="9. Changes"
            content="We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will provide notice of any significant changes."
            colors={colors}
          />

          <Section
            title="10. Contact Us"
            content="If you have any questions about these Terms, please contact us at:
  Email: legal@fitapp.com"
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
      className="mb-10 p-8 rounded-3xl border"
      style={{ backgroundColor: colors.surface, borderColor: colors.border }}
    >
      <Text
        className="text-2xl font-black mb-4 italic"
        style={{ color: colors.text }}
      >
        {title}
      </Text>
      <Text
        className="text-lg leading-7"
        style={{ color: colors.textSecondary }}
      >
        {content}
      </Text>
    </View>
  );
}
