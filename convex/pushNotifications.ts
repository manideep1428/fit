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
  handler: async (
    ctx,
    args
  ): Promise<{ success: boolean; result?: any; error?: string }> => {
    // Get user's push token
    const user: any = await ctx.runQuery(api.users.getUserByClerkId, {
      clerkId: args.userId,
    });

    if (!user?.expoPushToken) {
      console.log(`No push token for user ${args.userId}`);
      return { success: false, error: "No push token" };
    }

    // Validate Expo push token format
    if (!user.expoPushToken.startsWith('ExponentPushToken[') && 
        !user.expoPushToken.startsWith('ExpoPushToken[')) {
      console.log(`Invalid push token format for user ${args.userId}: ${user.expoPushToken}`);
      return { success: false, error: "Invalid push token format" };
    }

    // Check notification settings
    const settings = user.notificationSettings;

    // Send push notification via Expo Push API
    try {
      const message: any = {
        to: user.expoPushToken,
        sound: "default",
        title: args.title,
        body: args.body,
        data: args.data || {},
        priority: "high",
        channelId: "default",
        badge: 1,
      };

      console.log(`Sending push notification to ${user.expoPushToken}:`, message);

      const response: any = await fetch(
        "https://exp.host/--/api/v2/push/send",
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Accept-Encoding": "gzip, deflate",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(message),
        }
      );

      const result: any = await response.json();
      
      // Check for Expo push errors
      if (result.data?.status === "error") {
        console.error("Expo push error:", result.data.message, result.data.details);
        return { success: false, error: result.data.message, result };
      }
      
      console.log("Push notification sent successfully:", result);
      return { success: true, result };
    } catch (error) {
      console.error("Error sending push notification:", error);
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
        title: "New Trainer Added",
        body: `${args.trainerName} has added you as their client`,
        data: { type: "trainer_added" },
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
        title: "New Booking",
        body: `${args.clientName} booked a session on ${args.date} at ${args.time}`,
        data: { type: "booking_created" },
      });
    }

    // Notify client
    const client = await ctx.runQuery(api.users.getUserByClerkId, {
      clerkId: args.clientId,
    });

    if (client?.notificationSettings?.newBookings !== false) {
      await ctx.runAction(api.pushNotifications.sendPushNotification, {
        userId: args.clientId,
        title: "Booking Confirmed",
        body: `Your session with ${args.trainerName} on ${args.date} at ${args.time} is confirmed`,
        data: { type: "booking_created" },
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
        title: "Payment Request",
        body: `${args.trainerName} sent a payment request for $${args.amount} - ${args.description}`,
        data: { type: "payment_request" },
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
        title: "Progress Updated",
        body: `${args.trainerName} updated your progress for: ${args.goalDescription}`,
        data: { type: "goal_update" },
      });
    }
  },
});

// Send notification when subscription request is sent
export const notifySubscriptionRequest = action({
  args: {
    trainerId: v.string(),
    clientId: v.string(),
    clientName: v.string(),
    trainerName: v.string(),
    packageName: v.string(),
    totalSessions: v.number(),
    monthlyAmount: v.number(),
  },
  handler: async (ctx, args) => {
    // Notify trainer about new request
    const trainer = await ctx.runQuery(api.users.getUserByClerkId, {
      clerkId: args.trainerId,
    });

    if (trainer?.notificationSettings?.newBookings !== false) {
      await ctx.runAction(api.pushNotifications.sendPushNotification, {
        userId: args.trainerId,
        title: "New Subscription Request! 📋",
        body: `${args.clientName} requested ${args.packageName} - ${args.totalSessions} sessions/month (${args.monthlyAmount}/month)`,
        data: { type: "subscription_request" },
      });
    }

    // Notify client that request was sent
    const client = await ctx.runQuery(api.users.getUserByClerkId, {
      clerkId: args.clientId,
    });

    if (client?.notificationSettings?.newBookings !== false) {
      await ctx.runAction(api.pushNotifications.sendPushNotification, {
        userId: args.clientId,
        title: "Request Sent! 📤",
        body: `Your subscription request for ${args.packageName} has been sent to ${args.trainerName}`,
        data: { type: "subscription_request_sent" },
      });
    }
  },
});

// Send notification when subscription is approved
export const notifySubscriptionApproved = action({
  args: {
    trainerId: v.string(),
    clientId: v.string(),
    clientName: v.string(),
    trainerName: v.string(),
    packageName: v.string(),
    sessionsPerMonth: v.number(),
  },
  handler: async (ctx, args) => {
    // Notify client about approval
    const client = await ctx.runQuery(api.users.getUserByClerkId, {
      clerkId: args.clientId,
    });

    if (client?.notificationSettings?.newBookings !== false) {
      await ctx.runAction(api.pushNotifications.sendPushNotification, {
        userId: args.clientId,
        title: "Subscription Activated! 🎉",
        body: `${args.trainerName} approved your ${args.packageName} subscription! You now have ${args.sessionsPerMonth} sessions per month. Start booking!`,
        data: { type: "subscription_approved" },
      });
    }

    // Notify trainer about approval confirmation
    const trainer = await ctx.runQuery(api.users.getUserByClerkId, {
      clerkId: args.trainerId,
    });

    if (trainer?.notificationSettings?.newBookings !== false) {
      await ctx.runAction(api.pushNotifications.sendPushNotification, {
        userId: args.trainerId,
        title: "Subscription Approved",
        body: `You approved ${args.clientName}'s ${args.packageName} subscription`,
        data: { type: "subscription_approved" },
      });
    }
  },
});

// Send notification when subscription is created/purchased
export const notifySubscriptionCreated = action({
  args: {
    trainerId: v.string(),
    clientId: v.string(),
    clientName: v.string(),
    trainerName: v.string(),
    packageName: v.string(),
    totalSessions: v.number(),
    paymentMethod: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    // Notify trainer
    const trainer = await ctx.runQuery(api.users.getUserByClerkId, {
      clerkId: args.trainerId,
    });

    if (trainer?.notificationSettings?.newBookings !== false) {
      await ctx.runAction(api.pushNotifications.sendPushNotification, {
        userId: args.trainerId,
        title: "New Subscription Purchase! 🎉",
        body: `${args.clientName} purchased ${args.packageName} - ${args.totalSessions} sessions`,
        data: { type: "subscription_created" },
      });
    }

    // Notify client
    const client = await ctx.runQuery(api.users.getUserByClerkId, {
      clerkId: args.clientId,
    });

    if (client?.notificationSettings?.newBookings !== false) {
      await ctx.runAction(api.pushNotifications.sendPushNotification, {
        userId: args.clientId,
        title: "Subscription Activated! ✅",
        body: `Your ${args.packageName} with ${args.trainerName} is now active. ${args.totalSessions} sessions until ${args.endDate}`,
        data: { type: "subscription_created" },
      });
    }
  },
});

// Send notification when session is completed
export const notifySessionCompleted = action({
  args: {
    trainerId: v.string(),
    clientId: v.string(),
    clientName: v.string(),
    packageName: v.string(),
    remainingSessions: v.number(),
  },
  handler: async (ctx, args) => {
    // Notify client
    const client = await ctx.runQuery(api.users.getUserByClerkId, {
      clerkId: args.clientId,
    });

    if (client?.notificationSettings?.newBookings !== false) {
      await ctx.runAction(api.pushNotifications.sendPushNotification, {
        userId: args.clientId,
        title: "Session Completed! ✅",
        body: `Session completed successfully. ${args.remainingSessions} session${args.remainingSessions !== 1 ? "s" : ""} remaining in your ${args.packageName}`,
        data: {
          type: "session_completed",
          remainingSessions: args.remainingSessions,
        },
      });
    }

    // Notify trainer
    const trainer = await ctx.runQuery(api.users.getUserByClerkId, {
      clerkId: args.trainerId,
    });

    if (trainer?.notificationSettings?.newBookings !== false) {
      await ctx.runAction(api.pushNotifications.sendPushNotification, {
        userId: args.trainerId,
        title: "Session Completed",
        body: `Session with ${args.clientName} completed. They have ${args.remainingSessions} session${args.remainingSessions !== 1 ? "s" : ""} remaining`,
        data: { type: "session_completed" },
      });
    }
  },
});

// Send notification when package is ending soon
export const notifyPackageEnding = action({
  args: {
    trainerId: v.string(),
    clientId: v.string(),
    clientName: v.string(),
    packageName: v.string(),
    remainingSessions: v.number(),
  },
  handler: async (ctx, args) => {
    // Notify client
    const client = await ctx.runQuery(api.users.getUserByClerkId, {
      clerkId: args.clientId,
    });

    if (client?.notificationSettings?.newBookings !== false) {
      await ctx.runAction(api.pushNotifications.sendPushNotification, {
        userId: args.clientId,
        title: "Package Ending Soon! ⚠️",
        body: `Only ${args.remainingSessions} session${args.remainingSessions !== 1 ? "s" : ""} remaining in your ${args.packageName}. Consider renewing!`,
        data: {
          type: "subscription_ending",
          remainingSessions: args.remainingSessions,
        },
      });
    }

    // Notify trainer
    const trainer = await ctx.runQuery(api.users.getUserByClerkId, {
      clerkId: args.trainerId,
    });

    if (trainer?.notificationSettings?.newBookings !== false) {
      await ctx.runAction(api.pushNotifications.sendPushNotification, {
        userId: args.trainerId,
        title: "Client Package Ending",
        body: `${args.clientName} has only ${args.remainingSessions} session${args.remainingSessions !== 1 ? "s" : ""} remaining`,
        data: { type: "subscription_ending" },
      });
    }
  },
});

// Send notification when package expires
export const notifyPackageExpired = action({
  args: {
    trainerId: v.string(),
    clientId: v.string(),
    clientName: v.string(),
    trainerName: v.string(),
    packageName: v.string(),
  },
  handler: async (ctx, args) => {
    // Notify client
    const client = await ctx.runQuery(api.users.getUserByClerkId, {
      clerkId: args.clientId,
    });

    if (client?.notificationSettings?.newBookings !== false) {
      await ctx.runAction(api.pushNotifications.sendPushNotification, {
        userId: args.clientId,
        title: "Package Expired 📦",
        body: `Your ${args.packageName} with ${args.trainerName} has expired. Purchase a new package to continue!`,
        data: { type: "subscription_expired" },
      });
    }

    // Notify trainer
    const trainer = await ctx.runQuery(api.users.getUserByClerkId, {
      clerkId: args.trainerId,
    });

    if (trainer?.notificationSettings?.newBookings !== false) {
      await ctx.runAction(api.pushNotifications.sendPushNotification, {
        userId: args.trainerId,
        title: "Client Package Expired",
        body: `${args.clientName}'s package has expired. Reach out to discuss renewal`,
        data: { type: "subscription_expired" },
      });
    }
  },
});

// Send notification when discount is added
export const notifyDiscountAdded = action({
  args: {
    clientId: v.string(),
    trainerName: v.string(),
    discountPercentage: v.number(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const client = await ctx.runQuery(api.users.getUserByClerkId, {
      clerkId: args.clientId,
    });

    if (client?.notificationSettings?.newBookings !== false) {
      await ctx.runAction(api.pushNotifications.sendPushNotification, {
        userId: args.clientId,
        title: "New Discount Applied! 🎉",
        body: `${args.trainerName} added a ${args.discountPercentage}% discount for you - ${args.description}`,
        data: { 
          type: "discount_added",
          discountPercentage: args.discountPercentage,
        },
      });
    }
  },
});

// Send notification when discount is updated
export const notifyDiscountUpdated = action({
  args: {
    clientId: v.string(),
    trainerName: v.string(),
    oldDiscountPercentage: v.number(),
    newDiscountPercentage: v.number(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const client = await ctx.runQuery(api.users.getUserByClerkId, {
      clerkId: args.clientId,
    });

    if (client?.notificationSettings?.newBookings !== false) {
      await ctx.runAction(api.pushNotifications.sendPushNotification, {
        userId: args.clientId,
        title: "Discount Updated! 💰",
        body: `${args.trainerName} updated your discount from ${args.oldDiscountPercentage}% to ${args.newDiscountPercentage}% - ${args.description}`,
        data: { 
          type: "discount_updated",
          oldDiscountPercentage: args.oldDiscountPercentage,
          newDiscountPercentage: args.newDiscountPercentage,
        },
      });
    }
  },
});

// Send notification when discount is removed
export const notifyDiscountRemoved = action({
  args: {
    clientId: v.string(),
    trainerName: v.string(),
    discountPercentage: v.number(),
  },
  handler: async (ctx, args) => {
    const client = await ctx.runQuery(api.users.getUserByClerkId, {
      clerkId: args.clientId,
    });

    if (client?.notificationSettings?.newBookings !== false) {
      await ctx.runAction(api.pushNotifications.sendPushNotification, {
        userId: args.clientId,
        title: "Discount Removed",
        body: `${args.trainerName} removed your ${args.discountPercentage}% discount`,
        data: { 
          type: "discount_removed",
          discountPercentage: args.discountPercentage,
        },
      });
    }
  },
});
