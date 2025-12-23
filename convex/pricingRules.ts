import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a pricing rule (discount)
export const createPricingRule = mutation({
  args: {
    trainerId: v.string(),
    clientId: v.optional(v.string()), // null = applies to all clients
    discountPercentage: v.number(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    return await ctx.db.insert("pricingRules", {
      trainerId: args.trainerId,
      clientId: args.clientId,
      discountPercentage: args.discountPercentage,
      description: args.description,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Get pricing rules for a trainer
export const getTrainerPricingRules = query({
  args: { trainerId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("pricingRules")
      .withIndex("by_trainer", (q) => q.eq("trainerId", args.trainerId))
      .order("desc")
      .collect();
  },
});

// Get active pricing rules for a specific client
export const getClientPricingRules = query({
  args: { 
    trainerId: v.string(),
    clientId: v.string(),
  },
  handler: async (ctx, args) => {
    const rules = await ctx.db
      .query("pricingRules")
      .withIndex("by_trainer", (q) => q.eq("trainerId", args.trainerId))
      .collect();

    // Return client-specific rule or global rule
    const clientRule = rules.find(r => r.clientId === args.clientId && r.isActive);
    const globalRule = rules.find(r => !r.clientId && r.isActive);

    return clientRule || globalRule || null;
  },
});

// Get discount for a client
export const getClientDiscount = query({
  args: {
    trainerId: v.string(),
    clientId: v.string(),
  },
  handler: async (ctx, args) => {
    const rules = await ctx.db
      .query("pricingRules")
      .withIndex("by_trainer", (q) => q.eq("trainerId", args.trainerId))
      .collect();

    // Client-specific discount takes priority
    const clientRule = rules.find(r => r.clientId === args.clientId && r.isActive);
    if (clientRule) {
      return clientRule.discountPercentage;
    }

    // Otherwise use global discount
    const globalRule = rules.find(r => !r.clientId && r.isActive);
    return globalRule?.discountPercentage || 0;
  },
});

// Update pricing rule
export const updatePricingRule = mutation({
  args: {
    ruleId: v.id("pricingRules"),
    discountPercentage: v.optional(v.number()),
    description: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { ruleId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    await ctx.db.patch(ruleId, {
      ...filteredUpdates,
      updatedAt: Date.now(),
    });
  },
});

// Delete pricing rule
export const deletePricingRule = mutation({
  args: { ruleId: v.id("pricingRules") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.ruleId);
  },
});

// Calculate final price with discount
export const calculateFinalPrice = query({
  args: {
    trainerId: v.string(),
    clientId: v.string(),
    originalAmount: v.number(),
  },
  handler: async (ctx, args) => {
    // Get discount percentage
    const rules = await ctx.db
      .query("pricingRules")
      .withIndex("by_trainer", (q) => q.eq("trainerId", args.trainerId))
      .collect();

    // Client-specific discount takes priority
    const clientRule = rules.find(r => r.clientId === args.clientId && r.isActive);
    const discount = clientRule?.discountPercentage || 
                     rules.find(r => !r.clientId && r.isActive)?.discountPercentage || 
                     0;

    const discountAmount = (args.originalAmount * discount) / 100;
    const finalAmount = args.originalAmount - discountAmount;

    return {
      originalAmount: args.originalAmount,
      discount,
      discountAmount,
      finalAmount,
    };
  },
});
