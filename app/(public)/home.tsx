import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
  useWindowDimensions,
} from "react-native";
import { useRouter, Redirect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  getColors,
  BorderRadius,
  Gradients,
  Shadows,
} from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "@clerk/clerk-expo";

export default function HomePage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = getColors(scheme === "dark");
  const insets = useSafeAreaInsets();
  const gradients = scheme === "dark" ? Gradients.dark : Gradients.light;
  const { width, height } = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const isDesktop = width > 1024;

  if (isLoaded && user) {
    return <Redirect href="/" />;
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />

      {/* Navigation Header */}
      <View
        className={`z-50 w-full flex-row items-center justify-between px-6 py-4 ${isWeb ? "fixed top-0" : ""}`}
        style={
          {
            backgroundColor: isWeb
              ? colors.background + "B3"
              : colors.background,
            borderBottomWidth: isWeb ? 0 : 1,
            borderBottomColor: colors.border,
            backdropFilter: isWeb ? "blur(20px)" : "none",
          } as any
        }
      >
        <View className="max-w-[1400px] w-full mx-auto flex-row justify-between items-center">
          <View className="flex-row items-center">
            <View
              className="w-10 h-10 rounded-xl items-center justify-center mr-3 shadow-2xl"
              style={{ backgroundColor: colors.primary }}
            >
              <Ionicons name="barbell" size={24} color="#FFF" />
            </View>
            <Text
              className="text-xl font-black italic tracking-tighter"
              style={{ color: colors.text }}
            >
              FIT<Text style={{ color: colors.primary }}>APP</Text>
            </Text>
          </View>

          {isDesktop && (
            <View className="flex-row items-center gap-10">
              <TouchableOpacity>
                <Text
                  className="font-bold text-sm uppercase tracking-widest"
                  style={{ color: colors.textSecondary }}
                >
                  Features
                </Text>
              </TouchableOpacity>
              <TouchableOpacity>
                <Text
                  className="font-bold text-sm uppercase tracking-widest"
                  style={{ color: colors.textSecondary }}
                >
                  Workflows
                </Text>
              </TouchableOpacity>
              <TouchableOpacity>
                <Text
                  className="font-bold text-sm uppercase tracking-widest"
                  style={{ color: colors.textSecondary }}
                >
                  Pricing
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <View className="flex-row items-center gap-6">
            <TouchableOpacity
              onPress={() => router.push("/(auth)/sign-in" as any)}
              className="px-4 py-2"
            >
              <Text className="font-bold" style={{ color: colors.text }}>
                Login
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/(auth)/welcome" as any)}
              className="px-8 py-3.5 rounded-2xl shadow-xl shadow-orange-500/20"
              style={{ backgroundColor: colors.primary }}
            >
              <Text className="text-white font-black">GET STARTED</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        style={{ marginTop: 0 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Full-Width Web Hero */}
        <View
          className="relative w-full overflow-hidden"
          style={{ height: isWeb ? height : 600 }}
        >
          <Image
            source={require("@/assets/images/home_hero.png")}
            className="absolute inset-0 bg-inherit flex justify-center items-center w-full h-full"
            resizeMode="cover"
          />
          <LinearGradient
            colors={["rgba(0,0,0,0.85)", "rgba(0,0,0,0.1)", colors.background]}
            className="absolute inset-0"
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />

          <View className="max-w-[1400px] w-full mx-auto px-6 h-full flex-row items-center">
            <View className={isDesktop ? "max-w-[850px]" : "w-full pt-20"}>
              <View className="px-5 py-2 rounded-full border mb-8 self-start bg-white/5 border-white/10">
                <Text className="text-xs font-black uppercase tracking-[0.3em] text-white/60">
                  The Premium Coaching Ecosystem
                </Text>
              </View>
              <Text
                className={`${isDesktop ? "text-4xl" : "text-2xl"} font-black mb-4 leading-[1.2] text-white`}
              >
                Dominate Your{"\n"}
                <Text style={{ color: colors.primary }}>Potential.</Text>
              </Text>
              <Text
                className="text-base mb-8 leading-6 font-medium max-w-[450px]"
                style={{ color: "rgba(255, 255, 255, 0.7)" }}
              >
                Experience the next generation of boutique personal training.
                Seamlessly bridging elite trainers with dedicated performers
                through intelligent workflows.
              </Text>

              <View
                className={`flex-row gap-3 ${!isDesktop ? "flex-col" : ""}`}
              >
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => router.push("/(auth)/welcome" as any)}
                  className={`${isDesktop ? "w-48" : "w-full"} h-12 rounded-lg overflow-hidden shadow-2xl shadow-orange-500/40`}
                >
                  <LinearGradient
                    colors={gradients.primary as [string, string, ...string[]]}
                    className="w-full h-full items-center justify-center px-4"
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <View className="flex-row items-center gap-2">
                      <Text className="text-white font-bold text-sm tracking-tighter">
                        START TRAINING
                      </Text>
                      <Ionicons name="arrow-forward" size={16} color="#FFF" />
                    </View>
                  </LinearGradient>
                </TouchableOpacity>

                {isDesktop && (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    className="px-6 h-12 rounded-lg border-2 border-white/20 items-center justify-center bg-white/5"
                  >
                    <Text className="text-white font-bold text-sm tracking-tighter">
                      EXPLORE PLATFORM
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Dynamic Features Section */}
        <View className="py-32 bg-white dark:bg-black/20">
          <View className="max-w-[1400px] w-full mx-auto px-6">
            <View
              className={`flex-row ${isDesktop ? "items-end justify-between" : "flex-col items-start"} mb-24 gap-10`}
            >
              <View className="flex-1">
                <Text
                  className="text-sm font-black uppercase tracking-[0.4em] mb-6"
                  style={{ color: colors.primary }}
                >
                  Capabilities
                </Text>
                <Text
                  className={`${isDesktop ? "text-3xl" : "text-xl"} font-black tracking-tight`}
                  style={{ color: colors.text }}
                >
                  Engineered for{"\n"}
                  <Text style={{ color: colors.primary }}>Peak Results.</Text>
                </Text>
              </View>
              <Text
                className="text-sm max-w-[350px] leading-6 font-medium"
                style={{ color: colors.textSecondary }}
              >
                We built our platform using high-performance architecture to
                ensure you spend less time managing and more time growing your
                craft.
              </Text>
            </View>

            <View className={`flex-row flex-wrap gap-12 justify-between`}>
              <FeatureCard
                icon="calendar"
                title="Google Sync"
                description="Zero latency calendar synchronization. Manage your sessions across devices with enterprise-grade reliability."
                colors={colors}
                width={isDesktop ? "30%" : "100%"}
              />
              <FeatureCard
                icon="analytics"
                title="Performance Logs"
                description="Granular tracking for every set, rep, and macro. Visualize progress with interactive real-time charting."
                colors={colors}
                width={isDesktop ? "30%" : "100%"}
              />
              <FeatureCard
                icon="flash"
                title="Instant Chat"
                description="Encrypted direct communication channel between trainers and their roster. Send instructions in a flash."
                colors={colors}
                width={isDesktop ? "30%" : "100%"}
              />
            </View>
          </View>
        </View>

        {/* Footer */}
        <View
          className="py-40 border-t"
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.border,
          }}
        >
          <View className="max-w-[1400px] w-full mx-auto px-6">
            <View className={`flex-row flex-wrap justify-between gap-24 mb-32`}>
              <View className="max-w-[550px]">
                <View className="flex-row items-center mb-12">
                  <View
                    className="w-16 h-16 rounded-2xl items-center justify-center mr-5 shadow-2xl"
                    style={{ backgroundColor: colors.primary }}
                  >
                    <Ionicons name="barbell" size={36} color="#FFF" />
                  </View>
                  <Text
                    className="text-5xl font-black italic tracking-tighter"
                    style={{ color: colors.text }}
                  >
                    FIT<Text style={{ color: colors.primary }}>APP</Text>
                  </Text>
                </View>
                <Text
                  className="text-lg mb-6 leading-relaxed font-black tracking-tight"
                  style={{ color: colors.textSecondary }}
                >
                  Pushing boundaries. Redefining limits. Empowering the next
                  generation.
                </Text>
                <View className="flex-row gap-8">
                  {[
                    "logo-instagram",
                    "logo-twitter",
                    "logo-linkedin",
                    "logo-youtube",
                  ].map((icon) => (
                    <TouchableOpacity
                      key={icon}
                      className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 items-center justify-center"
                    >
                      <Ionicons
                        name={icon as any}
                        size={26}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View className="flex-row gap-32 flex-wrap">
                <FooterColumn
                  title="Product"
                  links={["Features", "Updates", "Status", "Security"]}
                  colors={colors}
                />
                <FooterColumn
                  title="Company"
                  links={["About", "Careers", "Blog", "Contact"]}
                  colors={colors}
                />
                <FooterColumn
                  title="Legal"
                  links={["Privacy", "Terms", "Cookies"]}
                  colors={colors}
                  router={router}
                />
              </View>
            </View>

            <View className="pt-16 border-t border-white/5 flex-row flex-wrap justify-between items-center gap-10">
              <Text
                className="text-lg font-bold"
                style={{ color: colors.textTertiary }}
              >
                © 2026 FitApp Global. Beyond Potential.
              </Text>
              <View className="flex-row gap-12">
                <Text
                  className="text-sm font-black tracking-widest uppercase opacity-40"
                  style={{ color: colors.textTertiary }}
                >
                  INSTAGRAM
                </Text>
                <Text
                  className="text-sm font-black tracking-widest uppercase opacity-40"
                  style={{ color: colors.textTertiary }}
                >
                  TWITTER
                </Text>
                <Text
                  className="text-sm font-black tracking-widest uppercase opacity-40"
                  style={{ color: colors.textTertiary }}
                >
                  LINKEDIN
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function StatItem({ label, value, colors }: any) {
  return (
    <View className="items-center">
      <Text
        className="text-7xl font-black mb-4 tracking-tighter"
        style={{ color: colors.text }}
      >
        {value}
      </Text>
      <Text
        className="text-base font-black uppercase tracking-[0.3em] opacity-40"
        style={{ color: colors.text }}
      >
        {label}
      </Text>
    </View>
  );
}

function FooterColumn({ title, links, colors, router }: any) {
  return (
    <View>
      <Text
        className="font-black text-xs uppercase tracking-[0.4em] mb-12"
        style={{ color: colors.primary }}
      >
        {title}
      </Text>
      {links.map((link: string) => (
        <TouchableOpacity
          key={link}
          className="mb-8"
          onPress={() => {
            if (link === "Privacy" && router) router.push("/(public)/privacy");
            if (link === "Terms" && router) router.push("/(public)/terms");
          }}
        >
          <Text
            className="text-xl font-bold"
            style={{ color: colors.textSecondary }}
          >
            {link}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function PricingCard({
  name,
  price,
  description,
  features,
  featured,
  colors,
  isDesktop,
}: any) {
  return (
    <View
      className={`p-10 rounded-[48px] border relative overflow-hidden ${featured ? "scale-110 z-10" : "opacity-80"}`}
      style={{
        backgroundColor: colors.surface,
        borderColor: featured ? colors.primary : colors.border,
        width: isDesktop ? 380 : "100%",
        ...Shadows.light.large,
      }}
    >
      {featured && (
        <View className="absolute top-8 right-8 px-4 py-1.5 rounded-full bg-orange-500">
          <Text className="text-[10px] font-black uppercase tracking-widest text-white">
            Most Popular
          </Text>
        </View>
      )}

      <Text
        className="text-sm font-black uppercase tracking-[0.4em] mb-6"
        style={{ color: colors.primary }}
      >
        {name}
      </Text>
      <View className="flex-row items-end mb-8 gap-1">
        <Text
          className="text-7xl font-black tracking-tighter"
          style={{ color: colors.text }}
        >
          ${price}
        </Text>
        <Text
          className="text-xl font-bold mb-3 opacity-40"
          style={{ color: colors.text }}
        >
          /mo
        </Text>
      </View>

      <Text
        className="text-lg mb-10 leading-7 font-medium"
        style={{ color: colors.textSecondary }}
      >
        {description}
      </Text>

      <View className="mb-12 gap-5">
        {features.map((f: string) => (
          <View key={f} className="flex-row items-center gap-4">
            <View className="w-6 h-6 rounded-full bg-green-500/20 items-center justify-center">
              <Ionicons name="checkmark" size={14} color="#22c55e" />
            </View>
            <Text
              className="text-lg font-bold"
              style={{ color: colors.textSecondary }}
            >
              {f}
            </Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        className="w-full h-20 rounded-3xl items-center justify-center"
        style={{
          backgroundColor: featured ? colors.primary : colors.background,
          borderWidth: featured ? 0 : 2,
          borderColor: colors.border,
        }}
      >
        <Text
          className={`font-black text-xl tracking-tight ${featured ? "text-white" : ""}`}
          style={!featured ? { color: colors.text } : {}}
        >
          {price === "0" ? "Get Started Free" : "Choose Plan"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function StepCard({ number, title, description, colors, isDesktop }: any) {
  return (
    <View
      className={`gap-4 ${isDesktop ? "flex-1 min-w-[240px]" : "flex-row"}`}
      style={
        isDesktop
          ? {
              padding: 24,
              backgroundColor: colors.surface,
              borderRadius: 24,
              borderWidth: 1,
              borderColor: colors.border,
            }
          : {}
      }
    >
      <Text
        className={`${isDesktop ? "text-4xl mb-2" : "text-3xl"} font-black italic opacity-10`}
        style={{ color: colors.primary }}
      >
        {number}
      </Text>
      <View className="flex-1">
        <Text
          className="text-lg font-black mb-3 tracking-tighter italic"
          style={{ color: colors.text }}
        >
          {title}
        </Text>
        <Text
          className="text-sm leading-6 font-medium"
          style={{ color: colors.textSecondary }}
        >
          {description}
        </Text>
      </View>
    </View>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  colors,
  width: cardWidth,
}: any) {
  return (
    <View
      className="p-8 rounded-[32px] border relative overflow-hidden group shadow-lg"
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.border,
        width: cardWidth,
        ...Shadows.light.small,
      }}
    >
      <View
        className="w-12 h-12 rounded-lg items-center justify-center mb-5 shadow-inner"
        style={{ backgroundColor: colors.primary + "15" }}
      >
        <Ionicons name={icon as any} size={24} color={colors.primary} />
      </View>
      <Text
        className="text-lg font-black mb-2 tracking-tighter leading-tight"
        style={{ color: colors.text }}
      >
        {title}
      </Text>
      <Text
        className="text-sm leading-6 font-medium opacity-80"
        style={{ color: colors.textSecondary }}
      >
        {description}
      </Text>

      <View
        className="absolute -bottom-20 -right-20 w-64 h-64 opacity-5 rounded-full"
        style={{
          backgroundColor: colors.primary,
        }}
      />
    </View>
  );
}
