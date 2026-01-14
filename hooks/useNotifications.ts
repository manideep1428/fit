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
        console.log('Push token obtained:', token);
        savePushToken({
          clerkId: user.id,
          expoPushToken: token,
        }).then(() => {
          console.log('Push token saved successfully');
        }).catch((error) => {
          console.error('Failed to save push token:', error);
        });
      } else {
        console.log('No push token obtained - device may be simulator or permissions denied');
      }
    }).catch((error) => {
      console.error('Error registering for push notifications:', error);
    });

    // Listen for notifications while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification);
    });

    // Listen for user interactions with notifications
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification response:', response);
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
