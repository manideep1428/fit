import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-expo";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getColors, Shadows } from "@/constants/colors";
import { StatusBar } from "expo-status-bar";

export default function NotificationSettingsScreen() {
  const { user } = useUser();
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = getColors(scheme === "dark");
  const shadows = scheme === "dark" ? Shadows.dark : Shadows.light;
  const insets = useSafeAreaInsets();

  const updateNotificationSettings = useMutation(
    api.users.updateNotificationSettings
  );

  const userData = useQuery(
    api.users.getUserByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  const [settings, setSettings] = useState({
    sessionReminders: true,
    reminderMinutes: [10, 5],
    paymentRequests: true,
    goalUpdates: true,
    newClients: true,
    newBookings: true,
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userData?.notificationSettings) {
      setSettings(userData.notificationSettings);
    }
  }, [userData]);

  const handleSave = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      await updateNotificationSettings({
        clerkId: user.id,
        settings,
      });
      router.push('/(trainer)/profile' as any);
    } catch (error) {
      alert("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  const toggleReminder = (minutes: number) => {
    const current = settings.reminderMinutes;
    setSettings({
      ...settings,
      reminderMinutes: current.includes(minutes)
        ? current.filter((m) => m !== minutes)
        : [...current, minutes].sort((a, b) => b - a),
    });
  };

  const ToggleRow = ({
    title,
    subtitle,
    value,
    onValueChange,
    isLast = false,
  }: {
    title: string;
    subtitle: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
    isLast?: boolean;
  }) => (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 16,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: colors.border,
      }}
    >
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={{ color: colors.text, fontSize: 16, fontWeight: "500" }}>
          {title}
        </Text>
        <Text
          style={{
            color: colors.textSecondary,
            fontSize: 13,
            marginTop: 2,
          }}
        >
          {subtitle}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor="#FFF"
      />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />

      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 24,
          paddingBottom: 12,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <TouchableOpacity
          onPress={() => router.push('/(trainer)/profile' as any)}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
            backgroundColor: colors.surface,
          }}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>

        <Text style={{ fontSize: 24, fontWeight: "700", color: colors.text }}>
          Notifications
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: 48,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Reminders */}
        <Text
          style={{
            fontSize: 12,
            fontWeight: "600",
            color: colors.textTertiary,
            marginTop: 16,
            marginBottom: 8,
          }}
        >
          REMINDERS
        </Text>

        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 16,
            paddingHorizontal: 16,
            ...shadows.small,
          }}
        >
          <ToggleRow
            title="Session Reminders"
            subtitle="Get notified before sessions"
            value={settings.sessionReminders}
            onValueChange={(v) =>
              setSettings({ ...settings, sessionReminders: v })
            }
            isLast={!settings.sessionReminders}
          />

          {settings.sessionReminders && (
            <View style={{ paddingBottom: 16 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "500",
                  color: colors.textSecondary,
                  marginBottom: 8,
                }}
              >
                Remind me
              </Text>

              <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                {[10, 5, 1].map((minutes) => {
                  const active = settings.reminderMinutes.includes(minutes);
                  return (
                    <TouchableOpacity
                      key={minutes}
                      onPress={() => toggleReminder(minutes)}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        borderRadius: 999,
                        marginRight: 8,
                        marginBottom: 8,
                        borderWidth: 1,
                        borderColor: active ? colors.primary : colors.border,
                        backgroundColor: active
                          ? colors.primary
                          : colors.background,
                      }}
                    >
                      <Text
                        style={{
                          color: active ? "#FFF" : colors.textSecondary,
                          fontWeight: "500",
                        }}
                      >
                        {minutes}m
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </View>

        {/* Activity */}
        <Text
          style={{
            fontSize: 12,
            fontWeight: "600",
            color: colors.textTertiary,
            marginTop: 24,
            marginBottom: 8,
          }}
        >
          ACTIVITY
        </Text>

        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 16,
            paddingHorizontal: 16,
            ...shadows.small,
          }}
        >
          <ToggleRow
            title="New Bookings"
            subtitle="When sessions are booked"
            value={settings.newBookings}
            onValueChange={(v) => setSettings({ ...settings, newBookings: v })}
          />
          <ToggleRow
            title="Payment Requests"
            subtitle="When you receive payment requests"
            value={settings.paymentRequests}
            onValueChange={(v) =>
              setSettings({ ...settings, paymentRequests: v })
            }
          />
          <ToggleRow
            title="Goal Updates"
            subtitle="When your progress is updated"
            value={settings.goalUpdates}
            onValueChange={(v) => setSettings({ ...settings, goalUpdates: v })}
          />
          <ToggleRow
            title="New Clients"
            subtitle="When trainers add you as a client"
            value={settings.newClients}
            onValueChange={(v) => setSettings({ ...settings, newClients: v })}
            isLast
          />
        </View>

        {/* Save */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={loading}
          style={{
            marginTop: 32,
            height: 52,
            borderRadius: 16,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.primary,
          }}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={{ color: "#FFF", fontSize: 16, fontWeight: "600" }}>
              Save
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
