import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * Test local notification to verify notification setup
 * Call this function to test if notifications are working properly
 */
export async function sendTestNotification() {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    
    if (status !== 'granted') {
      console.log('Notification permissions not granted');
      return false;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Test Notification 🔔",
        body: "If you see this with sound, notifications are working!",
        sound: Platform.OS === 'ios' ? 'default' : 'default',
        priority: Notifications.AndroidNotificationPriority.MAX,
        badge: 1,
        data: { test: true },
      },
      trigger: null, // Show immediately
    });

    console.log('Test notification sent');
    return true;
  } catch (error) {
    console.error('Error sending test notification:', error);
    return false;
  }
}
