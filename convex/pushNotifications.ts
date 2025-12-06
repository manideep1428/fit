import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";

// Send push notification via Expo Push API
export const sendPushNotification = action({
  args: {
    userId: v.string(),
    title: v.string(),
    body: v.string(),
    data: v.optional(v.any()),
  },
  handler: async (ctx, args): Promise<{ success: boolean; result?: any; error?: string }> => {
    // Get user's push token
    const user: any = await ctx.runQuery(api.users.getUserByClerkId, {
      clerkId: args.userId,
    });

    if (!user?.expoPushToken) {
      console.log('No push token for user:', args.userId);
      return { success: false, error: 'No push token' };
    }

    // Check notification settings
    const settings = user.notificationSettings;
    
    // Send push notification via Expo Push API
    try {
      const message: any = {
        to: user.expoPushToken,
        sound: 'default',
        title: args.title,
        body: args.body,
        data: args.data || {},
      };

      const response: any = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      const result: any = await response.json();
      return { success: true, result };
    } catch (error) {
      console.error('Error sending push notification:', error);
      return { success: false, error: String(error) };
    }
  },
});

// Send notification when client is added
export const notifyClientAdded = action({
  args: {
    clientId: v.string(),
    trainerName: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(api.users.getUserByClerkId, {
      clerkId: args.clientId,
    });

    if (user?.notificationSettings?.newClients !== false) {
      await ctx.runAction(api.pushNotifications.sendPushNotification, {
        userId: args.clientId,
        title: 'New Trainer Added',
        body: `${args.trainerName} has added you as their client`,
        data: { type: 'trainer_added' },
      });
    }
  },
});

// Send notification when booking is created
export const notifyBookingCreated = action({
  args: {
    trainerId: v.string(),
    clientId: v.string(),
    clientName: v.string(),
    trainerName: v.string(),
    date: v.string(),
    time: v.string(),
  },
  handler: async (ctx, args) => {
    // Notify trainer
    const trainer = await ctx.runQuery(api.users.getUserByClerkId, {
      clerkId: args.trainerId,
    });
    
    if (trainer?.notificationSettings?.newBookings !== false) {
      await ctx.runAction(api.pushNotifications.sendPushNotification, {
        userId: args.trainerId,
        title: 'New Booking',
        body: `${args.clientName} booked a session on ${args.date} at ${args.time}`,
        data: { type: 'booking_created' },
      });
    }

    // Notify client
    const client = await ctx.runQuery(api.users.getUserByClerkId, {
      clerkId: args.clientId,
    });
    
    if (client?.notificationSettings?.newBookings !== false) {
      await ctx.runAction(api.pushNotifications.sendPushNotification, {
        userId: args.clientId,
        title: 'Booking Confirmed',
        body: `Your session with ${args.trainerName} on ${args.date} at ${args.time} is confirmed`,
        data: { type: 'booking_created' },
      });
    }
  },
});

// Send notification for payment request
export const notifyPaymentRequest = action({
  args: {
    clientId: v.string(),
    trainerName: v.string(),
    amount: v.number(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(api.users.getUserByClerkId, {
      clerkId: args.clientId,
    });

    if (user?.notificationSettings?.paymentRequests !== false) {
      await ctx.runAction(api.pushNotifications.sendPushNotification, {
        userId: args.clientId,
        title: 'Payment Request',
        body: `${args.trainerName} sent a payment request for $${args.amount} - ${args.description}`,
        data: { type: 'payment_request' },
      });
    }
  },
});

// Send notification for goal update
export const notifyGoalUpdate = action({
  args: {
    clientId: v.string(),
    trainerName: v.string(),
    goalDescription: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(api.users.getUserByClerkId, {
      clerkId: args.clientId,
    });

    if (user?.notificationSettings?.goalUpdates !== false) {
      await ctx.runAction(api.pushNotifications.sendPushNotification, {
        userId: args.clientId,
        title: 'Progress Updated',
        body: `${args.trainerName} updated your progress for: ${args.goalDescription}`,
        data: { type: 'goal_update' },
      });
    }
  },
});
