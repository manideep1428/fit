import { useEffect, useRef } from 'react';
import { useUser } from '@clerk/clerk-expo';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync } from '@/utils/notifications';

export function useNotifications() {
  const { user } = useUser();
  const savePushToken = useMutation(api.users.savePushToken);
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  useEffect(() => {
    if (!user?.id) return;

    // Register for push notifications
    registerForPushNotificationsAsync().then((token) => {
      if (token && user.id) {
        savePushToken({
          clerkId: user.id,
          expoPushToken: token,
        }).catch(console.error);
      }
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
  }, [user?.id]);
}
