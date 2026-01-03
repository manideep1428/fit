import { Tabs } from "expo-router";
import { View, Text, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "@clerk/clerk-expo";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

import { HapticTab } from "@/components/haptic-tab";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getColors, Shadows } from "@/constants/colors";
import { useTrainerProfileCheck } from "@/hooks/useTrainerProfileCheck";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme === "dark");
  const shadows = colorScheme === "dark" ? Shadows.dark : Shadows.light;
  const insets = useSafeAreaInsets();
  const { user, isLoaded } = useUser();

  // Check if trainer profile is complete
  useTrainerProfileCheck();

  // Fetch unread notification count
  const unreadCount = useQuery(
    api.notifications.getUnreadCount,
    user?.id ? { userId: user.id } : "skip"
  );

  // Don't render tabs if user is signing out
  if (isLoaded && !user) {
    return null;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.tabBarActive,
          tabBarInactiveTintColor: colors.tabBarInactive,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarShowLabel: true,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "600",
            marginTop: 2,
          },
          tabBarIconStyle: {
            marginTop: 4,
          },
          tabBarStyle: {
            backgroundColor: colors.tabBarBackground,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            paddingBottom: insets.bottom,
            height: 60 + insets.bottom,
            paddingTop: 8,
            ...shadows.medium,
            ...Platform.select({
              ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: colorScheme === "dark" ? 0.3 : 0.1,
                shadowRadius: 8,
              },
            }),
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "home" : "home-outline"}
                size={24}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="bookings"
          options={{
            title: "Bookings",
            tabBarIcon: ({ color, focused }) => (
              <View>
                <Ionicons
                  name={focused ? "calendar" : "calendar-outline"}
                  size={24}
                  color={color}
                />
                {typeof unreadCount === "number" && unreadCount > 0 && (
                  <View
                    style={{
                      position: "absolute",
                      top: -4,
                      right: -8,
                      backgroundColor: colors.error,
                      borderRadius: 10,
                      minWidth: 18,
                      height: 18,
                      alignItems: "center",
                      justifyContent: "center",
                      paddingHorizontal: 4,
                    }}
                  >
                    <Text style={{ color: "#FFFFFF", fontSize: 10, fontWeight: "bold" }}>
                      {unreadCount > 9 ? "9+" : `${unreadCount}`}
                    </Text>
                  </View>
                )}
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="clients"
          options={{
            title: "Clients",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "people" : "people-outline"}
                size={24}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="payments"
          options={{
            title: "Payments",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "wallet" : "wallet-outline"}
                size={24}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="notification-settings"
          options={{
            href: null,
            title: "Notifications",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "notifications" : "notifications-outline"}
                size={24}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="availability"
          options={{
            href: null,
            title: "Availability",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "time" : "time-outline"}
                size={24}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "person" : "person-outline"}
                size={24}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="set-goal"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="add-client"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="client-detail"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="edit-goal"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="add-progress"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="progress-tracking"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="session-history"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="create-package"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="packages"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="subscriptions"
          options={{
            href: null,
          }}
        />
         <Tabs.Screen
          name="faq-questions"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="subscription-details"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="payment-details"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="question-form"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="question-list"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="client-questions"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="goal-list"
          options={{
            href: null,
          }}
        />
      </Tabs>
    </View>
  );
}
