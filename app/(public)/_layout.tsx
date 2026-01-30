import { Stack } from "expo-router";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getColors } from "@/constants/colors";

export default function PublicLayout() {
  const scheme = useColorScheme();
  const colors = getColors(scheme === "dark");

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: "bold",
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="home"
        options={{
          title: "FitApp",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="privacy"
        options={{
          title: "Privacy Policy",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="terms"
        options={{
          title: "Terms of Service",
          headerShown: true,
        }}
      />
    </Stack>
  );
}
