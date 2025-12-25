import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a notification
export const createNotification = mutation({
  args: {
    userId: v.string(),
    type: v.union(
      v.literal("booking_created"),
      v.literal("booking_cancelled"),
      v.literal("booking_reminder"),
      v.literal("trainer_added"),
      v.literal("subscription_created"),
      v.literal("subscription_request"),
      v.literal("subscription_request_sent"),
      v.literal("subscription_approved"),
      v.literal("session_completed"),
      v.literal("subscription_ending"),
      v.literal("subscription_expired"),
      v.literal("discount_added"),
      v.literal("discount_updated"),
      v.literal("discount_removed")
    ),
    title: v.string(),
    message: v.string(),
    bookingId: v.optional(v.id("bookings")),
    read: v.optional(v.boolean()),
    filter: v.optional(v.union(
      v.literal("bookings"),
      v.literal("trainers"),
      v.literal("discounts")
    )),
  },
  handler: async (ctx, args) => {
    // Determine filter based on type
    let filter: "bookings" | "trainers" | "discounts" | undefined;
    if (args.type === "booking_created" || args.type === "booking_cancelled" || args.type === "booking_reminder") {
      filter = "bookings";
    } else if (args.type === "trainer_added") {
      filter = "trainers";
    } else if (args.type === "discount_added" || args.type === "discount_updated" || args.type === "discount_removed") {
      filter = "discounts";
    }

    return await ctx.db.insert("notifications", {
      userId: args.userId,
      type: args.type,
      title: args.title,
      message: args.message,
      bookingId: args.bookingId,
      read: args.read ?? false,
      filter: args.filter ?? filter,
      createdAt: Date.now(),
    });
  },
});

// Get user notifications
export const getUserNotifications = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(50);
  },
});

// Get unread notification count
export const getUnreadCount = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("read"), false))
      .collect();
    
    return notifications.length;
  },
});

// Mark notification as read
export const markAsRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.notificationId, { read: true });
  },
});

// Mark all notifications as read
export const markAllAsRead = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("read"), false))
      .collect();

    await Promise.all(
      notifications.map((notification) =>
        ctx.db.patch(notification._id, { read: true })
      )
    );
  },
});

// Delete all notifications for a user
export const deleteAllNotifications = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    await Promise.all(
      notifications.map((notification) =>
        ctx.db.delete(notification._id)
      )
    );
  },
});
