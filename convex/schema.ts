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
    invitedByTrainerId: v.optional(v.string()), // For clients invited by trainers
    profileImageId: v.optional(v.id("_storage")),
    bio: v.optional(v.string()),
    specialty: v.optional(v.string()),
    googleAccessToken: v.optional(v.string()),
    googleRefreshToken: v.optional(v.string()),
    googleTokenExpiry: v.optional(v.number()),
    expoPushToken: v.optional(v.string()),
    notificationSettings: v.optional(
      v.object({
        sessionReminders: v.boolean(),
        reminderMinutes: v.array(v.number()), // [10, 5] for 10 and 5 min before
        paymentRequests: v.boolean(),
        goalUpdates: v.boolean(),
        newClients: v.boolean(),
        newBookings: v.boolean(),
      })
    ),
    // Profile setup tracking for trainers
    profileSetupStep: v.optional(v.number()), // Current step in profile setup (1-4)
    profileSetupData: v.optional(v.string()), // JSON string of saved form data
    profileCompleted: v.optional(v.boolean()), // Whether profile setup is complete
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
    timeRanges: v.optional(
      v.array(
        v.object({
          startTime: v.string(), // "09:00"
          endTime: v.string(), // "17:00"
        })
      )
    ),
    breaks: v.array(
      v.object({
        startTime: v.string(),
        endTime: v.string(),
      })
    ),
    sessionDuration: v.number(), // in minutes (45, 60, 90)
    timezone: v.optional(v.string()), // Default: "Europe/Oslo" (Norway)
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_trainer", ["trainerId"]),

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
      v.literal("completed"),
      v.literal("cancellation_requested")
    ),
    cancellationRequestedBy: v.optional(v.string()), // Clerk ID of who requested cancellation
    cancellationRequestedAt: v.optional(v.number()),
    notes: v.optional(v.string()),
    googleCalendarEventId: v.optional(v.string()), // Google Calendar event ID
    subscriptionId: v.optional(v.id("clientSubscriptions")), // Link to subscription
    sessionDeducted: v.optional(v.boolean()), // Whether session was deducted from package
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_trainer", ["trainerId"])
    .index("by_client", ["clientId"])
    .index("by_date", ["date"])
    .index("by_subscription", ["subscriptionId"]),

  notifications: defineTable({
    userId: v.string(), // Clerk ID
    type: v.union(
      v.literal("booking_created"),
      v.literal("booking_cancelled"),
      v.literal("booking_reminder"),
      v.literal("trainer_added"),
      v.literal("subscription_created"),
      v.literal("subscription_request"),
      v.literal("subscription_request_sent"),
      v.literal("subscription_approved"),
      v.literal("subscription_rejected"),
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
    read: v.boolean(),
    filter: v.optional(
      v.union(
        v.literal("bookings"),
        v.literal("trainers"),
        v.literal("discounts")
      )
    ),
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
    measurements: v.optional(
      v.array(
        v.object({
          bodyPart: v.string(), // "Stomach", "Chest", "Arms", etc.
          current: v.number(),
          target: v.number(),
          unit: v.string(), // "in" or "cm"
        })
      )
    ),
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
    measurements: v.optional(
      v.array(
        v.object({
          bodyPart: v.string(),
          value: v.number(),
          unit: v.string(),
        })
      )
    ),
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
    currency: v.string(), // "NOK", "USD", etc.
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

  // Trainer subscription plans - trainers create these for clients to purchase
  trainerPlans: defineTable({
    trainerId: v.string(), // Clerk ID
    name: v.string(), // "Basic Fitness", "Elite Training"
    description: v.string(),
    sessionsPerMonth: v.number(), // Number of sessions per month
    monthlyPrice: v.number(), // Monthly price
    currency: v.string(), // "NOK", "USD", etc.
    isVisible: v.boolean(), // Whether visible to clients
    isActive: v.boolean(), // Whether accepting new subscriptions
    discount: v.optional(v.number()), // Default discount percentage (0-100)
    features: v.optional(v.array(v.string())), // List of features like ["Cancel anytime", "Direct chat support"]
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_trainer", ["trainerId"]),

  // Client subscriptions to trainer plans
  clientSubscriptions: defineTable({
    clientId: v.string(), // Clerk ID
    trainerId: v.string(), // Clerk ID
    // New plan reference (optional for backward compatibility)
    planId: v.optional(v.id("trainerPlans")), // Reference to trainer plan
    // Legacy package reference (for old subscriptions)
    packageId: v.optional(v.id("packages")), // Old package reference
    // Billing configuration (optional for backward compatibility)
    billingType: v.optional(
      v.union(
        v.literal("monthly"), // Standard 1-month billing
        v.literal("custom") // Custom months (3, 6, 12, etc.)
      )
    ),
    billingMonths: v.optional(v.number()), // 1 for monthly, or custom number
    // Pricing (calculated at subscription time)
    monthlyAmount: v.optional(v.number()), // Monthly price at time of subscription
    totalAmount: v.optional(v.number()), // Total amount for billing period
    discount: v.optional(v.number()), // Discount applied
    // Sessions
    sessionsPerMonth: v.optional(v.number()), // Sessions per month from plan
    remainingSessions: v.number(), // Remaining sessions in current month
    totalSessionsInPeriod: v.optional(v.number()), // Total sessions for entire billing period
    totalSessions: v.optional(v.number()), // Old field for backward compat
    // Billing period
    currentPeriodStart: v.optional(v.string()), // "2024-12-22"
    currentPeriodEnd: v.optional(v.string()), // "2025-01-22"
    startDate: v.optional(v.string()), // Old field
    endDate: v.optional(v.string()), // Old field
    finalAmount: v.optional(v.number()), // Old field
    nextBillingDate: v.optional(v.string()), // Next billing date for auto-renew
    // Status
    status: v.union(
      v.literal("pending"), // Awaiting approval
      v.literal("active"),
      v.literal("expired"),
      v.literal("cancelled")
    ),
    paymentMethod: v.union(v.literal("offline"), v.literal("online")),
    paymentStatus: v.union(v.literal("pending"), v.literal("paid"), v.literal("rejected")),
    autoRenew: v.optional(v.boolean()),
    approvedAt: v.optional(v.number()), // Timestamp when subscription was approved
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_client", ["clientId"])
    .index("by_trainer", ["trainerId"])
    .index("by_status", ["status"])
    .index("by_client_trainer", ["clientId", "trainerId"])
    .index("by_plan", ["planId"]),

  // Pricing rules - trainer can set custom discounts per client or for all
  pricingRules: defineTable({
    trainerId: v.string(), // Clerk ID
    clientId: v.optional(v.string()), // If null, applies to all clients
    discountPercentage: v.number(), // 0-100
    description: v.string(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_trainer", ["trainerId"])
    .index("by_client", ["clientId"])
    .index("by_trainer_client", ["trainerId", "clientId"]),

  // Client questionnaires - questions trainers ask clients
  clientQuestions: defineTable({
    trainerId: v.string(), // Clerk ID - trainer who created the question
    clientId: v.string(), // Clerk ID - client the question is for
    question: v.string(),
    answer: v.optional(v.string()),
    answeredAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_trainer", ["trainerId"])
    .index("by_client", ["clientId"])
    .index("by_trainer_client", ["trainerId", "clientId"]),

  // FAQ questions - trainer templates for common questions
  faqQuestions: defineTable({
    trainerId: v.string(), // Clerk ID - trainer who created the FAQ
    question: v.string(),
    isActive: v.boolean(),
    order: v.optional(v.number()), // For ordering FAQs
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_trainer", ["trainerId"]),

  // Legacy packages table (for backward compatibility - will be deprecated)
  packages: defineTable({
    trainerId: v.string(),
    name: v.string(),
    monthlyAmount: v.optional(v.number()),
    sessionsPerMonth: v.optional(v.number()),
    amount: v.optional(v.number()),
    sessions: v.optional(v.number()),
    durationMonths: v.optional(v.number()),
    currency: v.string(),
    description: v.string(),
    discount: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_trainer", ["trainerId"]),
});
