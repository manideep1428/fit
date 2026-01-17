import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Comprehensive notification debugging utility
 * Call this to diagnose notification issues
 */
export async function debugNotifications() {
  console.log('=== NOTIFICATION DEBUG START ===');
  
  // 1. Check device type
  console.log('1. Device Check:');
  console.log('   - Is Physical Device:', Device.isDevice);
  console.log('   - Platform:', Platform.OS);
  console.log('   - Device Name:', Device.deviceName);
  
  // 2. Check permissions
  console.log('\n2. Permission Status:');
  const { status, ios, android } = await Notifications.getPermissionsAsync();
  console.log('   - Overall Status:', status);
  if (Platform.OS === 'ios' && ios) {
    console.log('   - iOS Alert:', ios.allowsAlert);
    console.log('   - iOS Badge:', ios.allowsBadge);
    console.log('   - iOS Sound:', ios.allowsSound);
  }
  if (Platform.OS === 'android' && android) {
    console.log('   - Android Importance:', android.importance);
  }
  
  // 3. Check project ID
  console.log('\n3. Project Configuration:');
  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  console.log('   - Project ID:', projectId || 'NOT FOUND');
  
  // 4. Try to get push token
  console.log('\n4. Push Token:');
  try {
    if (Device.isDevice && status === 'granted' && projectId) {
      const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
      console.log('   - Token:', tokenData.data);
    } else {
      console.log('   - Cannot get token:');
      if (!Device.isDevice) console.log('     * Not a physical device');
      if (status !== 'granted') console.log('     * Permissions not granted');
      if (!projectId) console.log('     * Project ID missing');
    }
  } catch (error) {
    console.log('   - Error getting token:', error);
  }
  
  // 5. Check notification channels (Android)
  if (Platform.OS === 'android') {
    console.log('\n5. Android Notification Channels:');
    try {
      const channels = await Notifications.getNotificationChannelsAsync();
      console.log('   - Channels:', channels.map(c => ({
        id: c.id,
        name: c.name,
        importance: c.importance,
        sound: c.sound,
      })));
    } catch (error) {
      console.log('   - Error getting channels:', error);
    }
  }
  
  // 6. Check badge count
  console.log('\n6. Badge Count:');
  try {
    const count = await Notifications.getBadgeCountAsync();
    console.log('   - Current Badge Count:', count);
  } catch (error) {
    console.log('   - Error getting badge count:', error);
  }
  
  // 7. Test local notification
  console.log('\n7. Testing Local Notification:');
  if (status === 'granted') {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: "🔔 Debug Test",
          body: "If you see this, local notifications work!",
          sound: 'default',
          badge: 1,
          priority: Notifications.AndroidNotificationPriority.MAX,
          data: { debug: true },
        },
        trigger: null,
      });
      console.log('   - Test notification scheduled:', notificationId);
      console.log('   - ✅ If you see a notification, local notifications are working!');
    } catch (error) {
      console.log('   - ❌ Error scheduling test notification:', error);
    }
  } else {
    console.log('   - ⚠️ Skipped (permissions not granted)');
  }
  
  console.log('\n=== NOTIFICATION DEBUG END ===\n');
  
  return {
    isDevice: Device.isDevice,
    platform: Platform.OS,
    permissionStatus: status,
    hasProjectId: !!projectId,
  };
}

/**
 * Request permissions with detailed logging
 */
export async function requestNotificationPermissions() {
  console.log('Requesting notification permissions...');
  
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  console.log('Existing status:', existingStatus);
  
  if (existingStatus === 'granted') {
    console.log('✅ Permissions already granted');
    return true;
  }
  
  const { status } = await Notifications.requestPermissionsAsync({
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
  
  console.log('New status:', status);
  
  if (status === 'granted') {
    console.log('✅ Permissions granted');
    return true;
  } else {
    console.log('❌ Permissions denied');
    return false;
  }
}

/**
 * Set badge count on app icon
 */
export async function setBadgeCount(count: number) {
  try {
    await Notifications.setBadgeCountAsync(count);
    console.log(`✅ Badge count set to ${count}`);
    return true;
  } catch (error) {
    console.error('❌ Error setting badge count:', error);
    return false;
  }
}

/**
 * Clear badge count
 */
export async function clearBadge() {
  return setBadgeCount(0);
}
