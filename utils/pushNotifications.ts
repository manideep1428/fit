import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";

// Configure notification behavior for both iOS and Android
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    console.log("Handling notification:", notification);
    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
      priority: Notifications.AndroidNotificationPriority.MAX,
    };
  },
});

export async function registerForPushNotificationsAsync(): Promise<
  string | null
> {
  let token = null;

  console.log("🔔 Starting push notification registration...");
  console.log("📱 Platform:", Platform.OS);
  console.log("📱 Device.isDevice:", Device.isDevice);

  // Set up Android notification channel first
  if (Platform.OS === "android") {
    console.log("🤖 Setting up Android notification channel...");
    try {
      await Notifications.setNotificationChannelAsync("fit-notification", {
        name: "Fit Notifications",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#3B82F6",
        sound: "notification.wav",
        enableVibrate: true,
        showBadge: true,
        lockscreenVisibility:
          Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: false,
      });
      console.log("✅ Android channel created");
    } catch (error) {
      console.error("❌ Error creating Android channel:", error);
    }
  }

  // Check if running on a physical device
  if (!Device.isDevice) {
    console.log(
      "❌ Push notifications require a physical device (simulator detected)",
    );
    return null;
  }

  console.log("✅ Physical device detected");

  // Check existing permissions
  const {
    status: existingStatus,
    ios,
    android,
  } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  console.log("🔐 Existing permission status:", existingStatus);
  if (Platform.OS === "ios" && ios) {
    console.log("   iOS - Alert:", ios.allowsAlert);
    console.log("   iOS - Badge:", ios.allowsBadge);
    console.log("   iOS - Sound:", ios.allowsSound);
  }
  if (Platform.OS === "android" && android) {
    console.log("   Android - Importance:", android.importance);
  }

  if (existingStatus !== "granted") {
    console.log("⚠️ Permissions not granted, requesting...");
    // Request permissions with iOS-specific options
    const result = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
        allowDisplayInCarPlay: false,
        allowCriticalAlerts: false,
        provideAppNotificationSettings: false,
        allowProvisional: false,
      },
    });
    finalStatus = result.status;
    console.log("📋 Permission request result:", finalStatus);

    if (Platform.OS === "ios" && result.ios) {
      console.log("   iOS - Alert:", result.ios.allowsAlert);
      console.log("   iOS - Badge:", result.ios.allowsBadge);
      console.log("   iOS - Sound:", result.ios.allowsSound);
    }
  } else {
    console.log("✅ Permissions already granted");
  }

  if (finalStatus !== "granted") {
    console.log("❌ Notification permission not granted. Status:", finalStatus);
    console.log("💡 User needs to enable notifications in device settings");
    return null;
  }

  console.log("✅ Permissions granted, getting push token...");

  try {
    // Get project ID from multiple sources for reliability
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.manifest?.extra?.eas?.projectId ??
      Constants.manifest2?.extra?.eas?.projectId ??
      process.env.EXPO_PUBLIC_PROJECT_ID;

    console.log("🔑 Project ID sources:");
    console.log(
      "   - expoConfig:",
      Constants.expoConfig?.extra?.eas?.projectId,
    );
    console.log("   - manifest:", Constants.manifest?.extra?.eas?.projectId);
    console.log("   - manifest2:", Constants.manifest2?.extra?.eas?.projectId);
    console.log("   - env var:", process.env.EXPO_PUBLIC_PROJECT_ID);
    console.log("   - Selected:", projectId);

    if (!projectId) {
      console.error("❌ No project ID found!");
      console.error("💡 Add projectId to app.json: extra.eas.projectId");
      return null;
    }

    console.log("🚀 Requesting Expo push token with project ID:", projectId);

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    token = tokenData.data;
    console.log("✅ Push token obtained successfully!");
    console.log("🎫 Token:", token);
  } catch (error: any) {
    console.error("❌ Error getting push token:", error);
    console.error("   Error message:", error?.message);
    console.error("   Error code:", error?.code);
    return null;
  }

  return token;
}
