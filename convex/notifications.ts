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
      v.literal("trainer_added")
    ),
    title: v.string(),
    message: v.string(),
    bookingId: v.optional(v.id("bookings")),
    read: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("notifications", {
      userId: args.userId,
      type: args.type,
      title: args.title,
      message: args.message,
      bookingId: args.bookingId,
      read: args.read ?? false,
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
