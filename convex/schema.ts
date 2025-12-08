import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    fullName: v.string(),
    username: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
    role: v.union(v.literal("trainer"), v.literal("client")),
    profileImageId: v.optional(v.id("_storage")),
    bio: v.optional(v.string()),
    specialty: v.optional(v.string()),
    googleAccessToken: v.optional(v.string()),
    googleRefreshToken: v.optional(v.string()),
    googleTokenExpiry: v.optional(v.number()),
    expoPushToken: v.optional(v.string()),
    notificationSettings: v.optional(v.object({
      sessionReminders: v.boolean(),
      reminderMinutes: v.array(v.number()), // [10, 5] for 10 and 5 min before
      paymentRequests: v.boolean(),
      goalUpdates: v.boolean(),
      newClients: v.boolean(),
      newBookings: v.boolean(),
    })),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_username", ["username"]),

  availability: defineTable({
    trainerId: v.string(), // Clerk ID
    dayOfWeek: v.number(), // 0-6 (Sunday-Saturday)
    enabled: v.boolean(),
    startTime: v.string(), // "09:00"
    endTime: v.string(), // "17:00"
    breaks: v.array(v.object({
      startTime: v.string(),
      endTime: v.string(),
    })),
    sessionDuration: v.number(), // in minutes (45, 60, 90)
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_trainer", ["trainerId"]),

  bookings: defineTable({
    trainerId: v.string(), // Clerk ID
    clientId: v.string(), // Clerk ID
    date: v.string(), // "2024-10-05"
    startTime: v.string(), // "09:00"
    endTime: v.string(), // "10:00"
    duration: v.union(v.literal(45), v.literal(60)), // in minutes
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("cancelled"),
      v.literal("completed")
    ),
    notes: v.optional(v.string()),
    googleCalendarEventId: v.optional(v.string()), // Google Calendar event ID
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_trainer", ["trainerId"])
    .index("by_client", ["clientId"])
    .index("by_date", ["date"]),

  notifications: defineTable({
    userId: v.string(), // Clerk ID
    type: v.union(
      v.literal("booking_created"),
      v.literal("booking_cancelled"),
      v.literal("booking_reminder"),
      v.literal("trainer_added")
    ),
    title: v.string(),
    message: v.string(),
    bookingId: v.optional(v.id("bookings")),
    read: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_read", ["read"]),

  clientTrainers: defineTable({
    clientId: v.string(), // Clerk ID
    trainerId: v.string(), // Clerk ID
    addedAt: v.number(),
  })
    .index("by_client", ["clientId"])
    .index("by_trainer", ["trainerId"])
    .index("by_client_trainer", ["clientId", "trainerId"]),

  goals: defineTable({
    clientId: v.string(), // Clerk ID
    trainerId: v.string(), // Clerk ID
    description: v.string(),
    deadline: v.optional(v.string()), // "2024-12-31"
    status: v.union(
      v.literal("active"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    // Weight tracking
    currentWeight: v.optional(v.number()),
    targetWeight: v.optional(v.number()),
    weightUnit: v.optional(v.string()), // "kg" or "lbs"
    // Body measurements
    measurements: v.optional(v.array(v.object({
      bodyPart: v.string(), // "Stomach", "Chest", "Arms", etc.
      current: v.number(),
      target: v.number(),
      unit: v.string(), // "in" or "cm"
    }))),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_client", ["clientId"])
    .index("by_trainer", ["trainerId"])
    .index("by_status", ["status"]),

  progressLogs: defineTable({
    goalId: v.id("goals"),
    clientId: v.string(), // Clerk ID
    trainerId: v.string(), // Clerk ID
    weight: v.optional(v.number()),
    measurements: v.optional(v.array(v.object({
      bodyPart: v.string(),
      value: v.number(),
      unit: v.string(),
    }))),
    note: v.optional(v.string()),
    loggedBy: v.union(v.literal("trainer"), v.literal("client")),
    createdAt: v.number(),
  })
    .index("by_goal", ["goalId"])
    .index("by_client", ["clientId"])
    .index("by_date", ["createdAt"]),

  paymentRequests: defineTable({
    trainerId: v.string(), // Clerk ID
    clientId: v.string(), // Clerk ID
    amount: v.number(),
    currency: v.string(), // "USD", "EUR", etc.
    description: v.string(),
    sessionDate: v.optional(v.string()), // "2024-12-31"
    bookingId: v.optional(v.id("bookings")),
    status: v.union(
      v.literal("pending"),
      v.literal("paid"),
      v.literal("cancelled")
    ),
    paidAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_trainer", ["trainerId"])
    .index("by_client", ["clientId"])
    .index("by_status", ["status"])
    .index("by_trainer_client", ["trainerId", "clientId"]),

  packages: defineTable({
    trainerId: v.string(), // Clerk ID
    name: v.string(),
    amount: v.number(),
    currency: v.string(), // "INR", "USD", etc.
    description: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_trainer", ["trainerId"]),
});
