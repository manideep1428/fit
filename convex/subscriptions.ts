import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";

// Create a subscription (when client purchases a plan)
export const createSubscription = mutation({
  args: {
    clientId: v.string(),
    trainerId: v.string(),
    planId: v.id("trainerPlans"),
    billingType: v.union(v.literal("monthly"), v.literal("custom")),
    billingMonths: v.number(), // 1 for monthly, or 3, 6, 12 for custom
    monthlyAmount: v.number(),
    totalAmount: v.number(),
    discount: v.optional(v.number()),
    paymentMethod: v.union(v.literal("offline"), v.literal("online")),
    autoRenew: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + args.billingMonths);

    // Get the plan details
    const plan = await ctx.db.get(args.planId);
    if (!plan) throw new Error("Plan not found");

    // For offline payment, set status to pending until trainer approves
    const initialStatus =
      args.paymentMethod === "offline" ? "pending" : "active";

    const subscriptionId = await ctx.db.insert("clientSubscriptions", {
      clientId: args.clientId,
      trainerId: args.trainerId,
      planId: args.planId,
      billingType: args.billingType,
      billingMonths: args.billingMonths,
      monthlyAmount: args.monthlyAmount,
      totalAmount: args.totalAmount,
      discount: args.discount || 0,
      sessionsPerMonth: plan.sessionsPerMonth,
      remainingSessions: plan.sessionsPerMonth,
      totalSessionsInPeriod: plan.sessionsPerMonth * args.billingMonths,
      currentPeriodStart: startDate.toISOString().split("T")[0],
      currentPeriodEnd: endDate.toISOString().split("T")[0],
      status: initialStatus,
      paymentMethod: args.paymentMethod,
      paymentStatus: "pending",
      autoRenew:
        args.autoRenew !== undefined
          ? args.autoRenew
          : args.billingType === "monthly",
      createdAt: now,
      updatedAt: now,
    });

    // Get client and trainer info
    const client = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clientId))
      .first();

    const trainer = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.trainerId))
      .first();

    const billingText =
      args.billingMonths === 1 ? "monthly" : `${args.billingMonths} months`;

    // Notify trainer about new subscription request
    await ctx.db.insert("notifications", {
      userId: args.trainerId,
      type: "subscription_request",
      title: "New Subscription Request! 📋",
      message: `${client?.fullName || "A client"} requested ${plan.name} (${billingText} - ${args.totalAmount} ${plan.currency})`,
      read: false,
      createdAt: now,
    });

    // Notify client about request sent
    await ctx.db.insert("notifications", {
      userId: args.clientId,
      type: "subscription_request_sent",
      title: "Subscription Request Sent! 📤",
      message: `Your request for ${plan.name} has been sent to ${trainer?.fullName || "your trainer"}. You'll be notified once approved.`,
      read: false,
      createdAt: now,
    });

    // Send push notifications
    await ctx.scheduler.runAfter(
      0,
      api.pushNotifications.notifySubscriptionRequest,
      {
        trainerId: args.trainerId,
        clientId: args.clientId,
        clientName: client?.fullName || "Client",
        trainerName: trainer?.fullName || "Trainer",
        packageName: plan.name,
        totalSessions: plan.sessionsPerMonth,
        monthlyAmount: args.monthlyAmount,
      }
    );

    return subscriptionId;
  },
});

// Get active subscription for a client with a trainer
export const getActiveClientSubscription = query({
  args: {
    clientId: v.string(),
    trainerId: v.string(),
  },
  handler: async (ctx, args) => {
    const subscriptions = await ctx.db
      .query("clientSubscriptions")
      .withIndex("by_client_trainer", (q) =>
        q.eq("clientId", args.clientId).eq("trainerId", args.trainerId)
      )
      .collect();

    return subscriptions.find((sub) => {
      // Only return active subscriptions with paid status
      if (sub.status !== "active" || sub.paymentStatus !== "paid") {
        return false;
      }

      // Check if subscription is still valid
      if (sub.currentPeriodEnd) {
        return (
          sub.remainingSessions > 0 &&
          new Date(sub.currentPeriodEnd) >= new Date()
        );
      }
      return false;
    });
  },
});

// Get all subscriptions for a client
export const getClientSubscriptions = query({
  args: { clientId: v.string() },
  handler: async (ctx, args) => {
    const subscriptions = await ctx.db
      .query("clientSubscriptions")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .order("desc")
      .collect();

    // Enrich with plan/package and trainer details
    const enrichedSubscriptions = await Promise.all(
      subscriptions.map(async (sub) => {
        // Try new plan first, then fall back to old package
        let planName = "Unknown Plan";
        let planCurrency = "INR";

        if (sub.planId) {
          const plan = await ctx.db.get(sub.planId);
          planName = plan?.name || planName;
          planCurrency = plan?.currency || planCurrency;
        } else if (sub.packageId) {
          const pkg = await ctx.db.get(sub.packageId);
          planName = pkg?.name || planName;
          planCurrency = pkg?.currency || planCurrency;
        }

        // Get trainer info
        const trainer = await ctx.db
          .query("users")
          .withIndex("by_clerk_id", (q) => q.eq("clerkId", sub.trainerId))
          .first();

        return {
          ...sub,
          planName,
          planCurrency,
          trainerName: trainer?.fullName || "Trainer",
          trainerSpecialty: trainer?.specialty || "Personal Trainer",
          // Normalize fields for backward compatibility
          billingMonths: sub.billingMonths || 1,
          billingType: sub.billingType || "monthly",
          sessionsPerMonth: sub.sessionsPerMonth || sub.totalSessions || 0,
        };
      })
    );

    return enrichedSubscriptions;
  },
});

// Get all subscriptions for a trainer
export const getTrainerSubscriptions = query({
  args: { trainerId: v.string() },
  handler: async (ctx, args) => {
    const subscriptions = await ctx.db
      .query("clientSubscriptions")
      .withIndex("by_trainer", (q) => q.eq("trainerId", args.trainerId))
      .order("desc")
      .collect();

    // Enrich with plan and client details
    const enrichedSubscriptions = await Promise.all(
      subscriptions.map(async (sub) => {
        // Try new plan first, then fall back to old package
        let planName = "Unknown Plan";
        let planCurrency = "INR";

        if (sub.planId) {
          const plan = await ctx.db.get(sub.planId);
          planName = plan?.name || planName;
          planCurrency = plan?.currency || planCurrency;
        } else if (sub.packageId) {
          const pkg = await ctx.db.get(sub.packageId);
          planName = pkg?.name || planName;
          planCurrency = pkg?.currency || planCurrency;
        }

        const client = await ctx.db
          .query("users")
          .withIndex("by_clerk_id", (q) => q.eq("clerkId", sub.clientId))
          .first();

        return {
          ...sub,
          planName,
          planCurrency,
          clientName: client?.fullName || "Unknown Client",
          // Normalize fields for backward compatibility
          billingMonths: sub.billingMonths || 1,
          billingType: sub.billingType || "monthly",
          sessionsPerMonth: sub.sessionsPerMonth || sub.totalSessions || 0,
        };
      })
    );

    return enrichedSubscriptions;
  },
});

// Deduct session from subscription
export const deductSession = mutation({
  args: { subscriptionId: v.id("clientSubscriptions") },
  handler: async (ctx, args) => {
    const subscription = await ctx.db.get(args.subscriptionId);

    if (!subscription) {
      throw new Error("Subscription not found");
    }

    if (subscription.remainingSessions <= 0) {
      throw new Error("No sessions remaining this month");
    }

    const newRemaining = subscription.remainingSessions - 1;
    const now = Date.now();

    await ctx.db.patch(args.subscriptionId, {
      remainingSessions: newRemaining,
      updatedAt: now,
    });

    // Get plan/package and user details for notifications
    const plan = subscription.planId
      ? await ctx.db.get(subscription.planId)
      : subscription.packageId
        ? await ctx.db.get(subscription.packageId)
        : null;
    const client = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", subscription.clientId))
      .first();
    const trainer = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", subscription.trainerId))
      .first();

    // Notify client about session completion
    await ctx.db.insert("notifications", {
      userId: subscription.clientId,
      type: "session_completed",
      title: "Session Completed! ✅",
      message: `Session completed! ${newRemaining} session${newRemaining !== 1 ? "s" : ""} remaining this month.`,
      read: false,
      createdAt: now,
    });

    // Notify trainer
    await ctx.db.insert("notifications", {
      userId: subscription.trainerId,
      type: "session_completed",
      title: "Session Completed",
      message: `Session with ${client?.fullName || "client"} completed. ${newRemaining} session${newRemaining !== 1 ? "s" : ""} remaining.`,
      read: false,
      createdAt: now,
    });

    // Send push notifications
    await ctx.scheduler.runAfter(
      0,
      api.pushNotifications.notifySessionCompleted,
      {
        trainerId: subscription.trainerId,
        clientId: subscription.clientId,
        clientName: client?.fullName || "Client",
        packageName: plan?.name || "Package",
        remainingSessions: newRemaining,
      }
    );

    // Warning when sessions running low (3 or fewer)
    if (newRemaining > 0 && newRemaining <= 3) {
      await ctx.db.insert("notifications", {
        userId: subscription.clientId,
        type: "subscription_ending",
        title: "Sessions Running Low! ⚠️",
        message: `Only ${newRemaining} session${newRemaining !== 1 ? "s" : ""} remaining. ${subscription.autoRenew ? "Auto-renews next period." : "Consider renewing soon."}`,
        read: false,
        createdAt: now,
      });

      await ctx.scheduler.runAfter(
        0,
        api.pushNotifications.notifyPackageEnding,
        {
          trainerId: subscription.trainerId,
          clientId: subscription.clientId,
          clientName: client?.fullName || "Client",
          packageName: plan?.name || "Package",
          remainingSessions: newRemaining,
        }
      );
    }

    return newRemaining;
  },
});

// Approve subscription (mark as paid)
export const approveSubscription = mutation({
  args: { subscriptionId: v.id("clientSubscriptions") },
  handler: async (ctx, args) => {
    const subscription = await ctx.db.get(args.subscriptionId);

    if (!subscription) {
      throw new Error("Subscription not found");
    }

    const now = Date.now();

    await ctx.db.patch(args.subscriptionId, {
      paymentStatus: "paid",
      status: "active",
      approvedAt: now,
      updatedAt: now,
    });

    // Get plan/package and user details
    const plan = subscription.planId
      ? await ctx.db.get(subscription.planId)
      : subscription.packageId
        ? await ctx.db.get(subscription.packageId)
        : null;
    const client = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", subscription.clientId))
      .first();
    const trainer = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", subscription.trainerId))
      .first();

    const sessionsPerMonth =
      subscription.sessionsPerMonth || subscription.totalSessions || 0;

    // Notify client
    await ctx.db.insert("notifications", {
      userId: subscription.clientId,
      type: "subscription_approved",
      title: "Subscription Activated! 🎉",
      message: `Your ${plan?.name || "subscription"} has been approved! You have ${sessionsPerMonth} sessions/month. Start booking now!`,
      read: false,
      createdAt: now,
    });

    // Notify trainer
    await ctx.db.insert("notifications", {
      userId: subscription.trainerId,
      type: "subscription_approved",
      title: "Subscription Approved",
      message: `You approved ${client?.fullName || "client"}'s subscription. They can now book sessions.`,
      read: false,
      createdAt: now,
    });

    // Send push notifications
    await ctx.scheduler.runAfter(
      0,
      api.pushNotifications.notifySubscriptionApproved,
      {
        trainerId: subscription.trainerId,
        clientId: subscription.clientId,
        clientName: client?.fullName || "Client",
        trainerName: trainer?.fullName || "Trainer",
        packageName: plan?.name || "Package",
        sessionsPerMonth: sessionsPerMonth,
      }
    );
  },
});

// Alias for backward compatibility
export const markOfflinePaymentPaid = approveSubscription;

// Renew subscription
export const renewSubscription = mutation({
  args: {
    subscriptionId: v.id("clientSubscriptions"),
    paymentStatus: v.optional(v.union(v.literal("pending"), v.literal("paid"))),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db.get(args.subscriptionId);

    if (!subscription) {
      throw new Error("Subscription not found");
    }

    const now = Date.now();
    const newPeriodStart = new Date();
    const newPeriodEnd = new Date();
    const billingMonths = subscription.billingMonths || 1;
    const sessionsPerMonth =
      subscription.sessionsPerMonth || subscription.totalSessions || 0;
    newPeriodEnd.setMonth(newPeriodEnd.getMonth() + billingMonths);

    await ctx.db.patch(args.subscriptionId, {
      remainingSessions: sessionsPerMonth,
      currentPeriodStart: newPeriodStart.toISOString().split("T")[0],
      currentPeriodEnd: newPeriodEnd.toISOString().split("T")[0],
      status: "active",
      paymentStatus: args.paymentStatus || subscription.paymentStatus,
      updatedAt: now,
    });

    // Get plan/package and user details
    const plan = subscription.planId
      ? await ctx.db.get(subscription.planId)
      : subscription.packageId
        ? await ctx.db.get(subscription.packageId)
        : null;
    const client = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", subscription.clientId))
      .first();

    // Notify client
    await ctx.db.insert("notifications", {
      userId: subscription.clientId,
      type: "subscription_created",
      title: "Subscription Renewed! 🎉",
      message: `Your ${plan?.name || "subscription"} has been renewed. ${sessionsPerMonth} sessions available.`,
      read: false,
      createdAt: now,
    });

    // Notify trainer
    await ctx.db.insert("notifications", {
      userId: subscription.trainerId,
      type: "subscription_created",
      title: "Client Renewed Subscription",
      message: `${client?.fullName || "Client"}'s subscription renewed for another period.`,
      read: false,
      createdAt: now,
    });
  },
});

// Alias for backward compatibility
export const renewMonthlySubscription = renewSubscription;

// Cancel subscription
export const cancelSubscription = mutation({
  args: { subscriptionId: v.id("clientSubscriptions") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.subscriptionId, {
      status: "cancelled",
      updatedAt: Date.now(),
    });
  },
});

// Get subscription by ID
export const getSubscriptionById = query({
  args: { subscriptionId: v.id("clientSubscriptions") },
  handler: async (ctx, args) => {
    const subscription = await ctx.db.get(args.subscriptionId);

    if (!subscription) {
      return null;
    }

    // Try new plan first, then fall back to old package
    let planName = "Unknown Plan";
    let planCurrency = "INR";

    if (subscription.planId) {
      const plan = await ctx.db.get(subscription.planId);
      planName = plan?.name || planName;
      planCurrency = plan?.currency || planCurrency;
    } else if (subscription.packageId) {
      const pkg = await ctx.db.get(subscription.packageId);
      planName = pkg?.name || planName;
      planCurrency = pkg?.currency || planCurrency;
    }

    const client = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", subscription.clientId))
      .first();

    return {
      ...subscription,
      planName,
      planCurrency,
      clientName: client?.fullName || "Unknown Client",
      // Normalize fields for backward compatibility
      billingMonths: subscription.billingMonths || 1,
      billingType: subscription.billingType || "monthly",
      sessionsPerMonth:
        subscription.sessionsPerMonth || subscription.totalSessions || 0,
    };
  },
});

// Get subscription stats for trainer dashboard
export const getTrainerSubscriptionStats = query({
  args: { trainerId: v.string() },
  handler: async (ctx, args) => {
    const subscriptions = await ctx.db
      .query("clientSubscriptions")
      .withIndex("by_trainer", (q) => q.eq("trainerId", args.trainerId))
      .collect();

    const pending = subscriptions.filter((s) => s.paymentStatus === "pending");
    const active = subscriptions.filter(
      (s) => s.status === "active" && s.paymentStatus === "paid"
    );
    const totalRevenue = active.reduce(
      (sum, s) => sum + (s.totalAmount || s.monthlyAmount || 0),
      0
    );

    return {
      pendingCount: pending.length,
      activeCount: active.length,
      totalCount: subscriptions.length,
      totalRevenue,
    };
  },
});
