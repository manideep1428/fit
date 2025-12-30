import { useEffect, useRef } from 'react';
import { useUser } from '@clerk/clerk-expo';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync } from '@/utils/pushNotifications';

export function useNotifications() {
  const { user } = useUser();
  const savePushToken = useMutation(api.users.savePushToken);
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  // Check if user exists in Convex before trying to save push token
  const convexUser = useQuery(
    api.users.getUserByClerkId,
    user?.id ? { clerkId: user.id } : 'skip'
  );

  useEffect(() => {
    // Only register for push notifications if user exists in Convex
    if (!user?.id || !convexUser) return;

    // Register for push notifications
    registerForPushNotificationsAsync().then((token) => {
      if (token && user.id) {
        savePushToken({
          clerkId: user.id,
          expoPushToken: token,
        }).catch(() => {
          // Silently handle errors - user might not exist yet
        });
      }
    });

    // Listen for notifications while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(() => {
      // Notification received - handled silently
    });

    // Listen for user interactions with notifications
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      // Handle navigation based on notification data
      const data = response.notification.request.content.data;
      // You can add navigation logic here based on data
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [user?.id, convexUser]);
}
