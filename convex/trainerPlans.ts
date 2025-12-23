import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a trainer plan
export const createPlan = mutation({
  args: {
    trainerId: v.string(),
    name: v.string(),
    description: v.string(),
    sessionsPerMonth: v.number(),
    monthlyPrice: v.number(),
    currency: v.string(),
    discount: v.optional(v.number()),
    features: v.optional(v.array(v.string())),
    isVisible: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    return await ctx.db.insert("trainerPlans", {
      trainerId: args.trainerId,
      name: args.name,
      description: args.description,
      sessionsPerMonth: args.sessionsPerMonth,
      monthlyPrice: args.monthlyPrice,
      currency: args.currency,
      isVisible: args.isVisible ?? true,
      isActive: true,
      discount: args.discount || 0,
      features: args.features || ["Cancel anytime"],
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Get all plans for a trainer
export const getTrainerPlans = query({
  args: { trainerId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("trainerPlans")
      .withIndex("by_trainer", (q) => q.eq("trainerId", args.trainerId))
      .order("desc")
      .collect();
  },
});

// Get visible active plans for a trainer (for clients to see)
export const getVisibleTrainerPlans = query({
  args: { trainerId: v.string() },
  handler: async (ctx, args) => {
    const plans = await ctx.db
      .query("trainerPlans")
      .withIndex("by_trainer", (q) => q.eq("trainerId", args.trainerId))
      .collect();

    return plans.filter((plan) => plan.isVisible && plan.isActive);
  },
});

// Get plan by ID
export const getPlanById = query({
  args: { planId: v.id("trainerPlans") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.planId);
  },
});

// Update a plan
export const updatePlan = mutation({
  args: {
    planId: v.id("trainerPlans"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    sessionsPerMonth: v.optional(v.number()),
    monthlyPrice: v.optional(v.number()),
    currency: v.optional(v.string()),
    isVisible: v.optional(v.boolean()),
    isActive: v.optional(v.boolean()),
    discount: v.optional(v.number()),
    features: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { planId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    await ctx.db.patch(planId, {
      ...filteredUpdates,
      updatedAt: Date.now(),
    });
  },
});

// Toggle plan visibility
export const togglePlanVisibility = mutation({
  args: { planId: v.id("trainerPlans") },
  handler: async (ctx, args) => {
    const plan = await ctx.db.get(args.planId);
    if (!plan) throw new Error("Plan not found");

    await ctx.db.patch(args.planId, {
      isVisible: !plan.isVisible,
      updatedAt: Date.now(),
    });
  },
});

// Toggle plan active status
export const togglePlanActive = mutation({
  args: { planId: v.id("trainerPlans") },
  handler: async (ctx, args) => {
    const plan = await ctx.db.get(args.planId);
    if (!plan) throw new Error("Plan not found");

    await ctx.db.patch(args.planId, {
      isActive: !plan.isActive,
      updatedAt: Date.now(),
    });
  },
});

// Delete a plan
export const deletePlan = mutation({
  args: { planId: v.id("trainerPlans") },
  handler: async (ctx, args) => {
    // Check if there are active subscriptions
    const subscriptions = await ctx.db
      .query("clientSubscriptions")
      .withIndex("by_plan", (q) => q.eq("planId", args.planId))
      .collect();

    const activeSubscriptions = subscriptions.filter(
      (sub) => sub.status === "active" || sub.status === "pending"
    );

    if (activeSubscriptions.length > 0) {
      throw new Error(
        "Cannot delete plan with active subscriptions. Please cancel all subscriptions first."
      );
    }

    await ctx.db.delete(args.planId);
  },
});

// Calculate price with discount
export const calculatePrice = query({
  args: {
    planId: v.id("trainerPlans"),
    trainerId: v.string(),
    clientId: v.string(),
    billingMonths: v.number(),
  },
  handler: async (ctx, args) => {
    const plan = await ctx.db.get(args.planId);
    if (!plan) throw new Error("Plan not found");

    // Get client-specific discount first
    const clientDiscount = await ctx.db
      .query("pricingRules")
      .withIndex("by_trainer_client", (q) =>
        q.eq("trainerId", args.trainerId).eq("clientId", args.clientId)
      )
      .first();

    // Get global discount if no client-specific discount
    let discount = 0;
    if (clientDiscount && clientDiscount.isActive) {
      discount = clientDiscount.discountPercentage;
    } else {
      // Check for global discount (clientId is undefined)
      const globalDiscount = await ctx.db
        .query("pricingRules")
        .withIndex("by_trainer", (q) => q.eq("trainerId", args.trainerId))
        .filter((q) => q.eq(q.field("clientId"), undefined))
        .first();

      if (globalDiscount && globalDiscount.isActive) {
        discount = globalDiscount.discountPercentage;
      } else if (plan.discount) {
        // Use plan's default discount
        discount = plan.discount;
      }
    }

    const monthlyPrice = plan.monthlyPrice;
    const discountedMonthlyPrice =
      monthlyPrice - (monthlyPrice * discount) / 100;
    const totalPrice = discountedMonthlyPrice * args.billingMonths;

    // Calculate yearly equivalent (for display)
    const yearlyPrice = discountedMonthlyPrice * 12;

    return {
      originalMonthlyPrice: monthlyPrice,
      discountedMonthlyPrice,
      discount,
      totalPrice,
      yearlyPrice,
      billingMonths: args.billingMonths,
      currency: plan.currency,
      sessionsPerMonth: plan.sessionsPerMonth,
      totalSessions: plan.sessionsPerMonth * args.billingMonths,
    };
  },
});
