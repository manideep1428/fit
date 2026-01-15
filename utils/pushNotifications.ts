import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Configure notification behavior for both iOS and Android
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    console.log('Handling notification:', notification);
    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      priority: Notifications.AndroidNotificationPriority.MAX,
    };
  },
});

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token = null;

  // Set up Android notification channel first
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default Notifications',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#3B82F6',
      sound: 'default',
      enableVibrate: true,
      showBadge: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: false,
    });
  }

  // Check if running on a physical device
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  console.log('Existing notification permission status:', existingStatus);
  
  if (existingStatus !== 'granted') {
    // Request permissions with iOS-specific options
    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
        allowDisplayInCarPlay: false,
        allowCriticalAlerts: false,
        provideAppNotificationSettings: false,
        allowProvisional: false,
        allowAnnouncements: false,
      },
    });
    finalStatus = status;
    console.log('Requested notification permission, new status:', status);
  }
  
  if (finalStatus !== 'granted') {
    console.log('Notification permission not granted');
    return null;
  }
  
  try {
    // Get project ID from multiple sources for reliability
    const projectId = 
      Constants.expoConfig?.extra?.eas?.projectId ??
      process.env.EXPO_PUBLIC_PROJECT_ID;
    
    if (!projectId) {
      console.error('No project ID found. Check app.json extra.eas.projectId or EXPO_PUBLIC_PROJECT_ID env var');
      return null;
    }
    
    console.log('Getting push token with project ID:', projectId);
    
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    token = tokenData.data;
    console.log('Push token obtained:', token);
  } catch (error) {
    console.error('Error getting push token:', error);
    return null;
  }

  return token;
}