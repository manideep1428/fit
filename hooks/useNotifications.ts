import { useEffect, useRef, useCallback } from 'react';
import { useUser } from '@clerk/clerk-expo';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync } from '@/utils/pushNotifications';
import { Platform } from 'react-native';

export function useNotifications() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const savePushToken = useMutation(api.users.savePushToken);
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);
  const tokenRegistered = useRef(false);

  // Check if user exists in Convex before trying to save push token
  const convexUser = useQuery(
    api.users.getUserByClerkId,
    user?.id ? { clerkId: user.id } : 'skip'
  );

  // Get unread notification count for badge
  const unreadCount = useQuery(
    api.notifications.getUnreadCount,
    user?.id ? { userId: user.id } : 'skip'
  );

  // Update badge count when unread count changes
  useEffect(() => {
    if (typeof unreadCount === 'number') {
      Notifications.setBadgeCountAsync(unreadCount).catch(error => {
        console.error('Error setting badge count:', error);
      });
    }
  }, [unreadCount]);

  const registerToken = useCallback(async () => {
    if (!user?.id || !convexUser || tokenRegistered.current) return;
    
    try {
      const token = await registerForPushNotificationsAsync();
      
      if (token) {
        console.log('✅ Push token obtained:', token);
        await savePushToken({
          clerkId: user.id,
          expoPushToken: token,
        });
        console.log('✅ Push token saved successfully');
        tokenRegistered.current = true;
      } else {
        console.log('⚠️ No push token obtained - device may be simulator or permissions denied');
      }
    } catch (error) {
      console.error('❌ Error registering for push notifications:', error);
    }
  }, [user?.id, convexUser, savePushToken]);

  useEffect(() => {
    // Wait for Clerk to load and user to exist in Convex
    if (!isUserLoaded || !user?.id || !convexUser) return;

    // Register for push notifications
    registerToken();

    // Listen for notifications while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log('📬 Notification received:', notification);
      
      // Update badge count
      if (typeof unreadCount === 'number') {
        Notifications.setBadgeCountAsync(unreadCount + 1);
      }
    });

    // Listen for user interactions with notifications
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('👆 Notification tapped:', response);
      
      // Handle navigation based on notification data
      const data = response.notification.request.content.data;
      console.log('Notification data:', data);
      
      // Clear badge when user interacts with notification
      Notifications.setBadgeCountAsync(0);
      
      // You can add navigation logic here based on data
      // Example: router.push('/bookings') if data.type === 'booking_created'
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [isUserLoaded, user?.id, convexUser, registerToken, unreadCount]);

  // Reset token registration flag when user changes
  useEffect(() => {
    tokenRegistered.current = false;
  }, [user?.id]);
}
