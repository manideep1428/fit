import { v } from "convex/values";
import { mutation, query, action, internalMutation } from "./_generated/server";
import { api } from "./_generated/api";

// Internal mutation to create pricing rule
export const _createPricingRule = internalMutation({
  args: {
    trainerId: v.string(),
    clientId: v.optional(v.string()),
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

// Create a pricing rule (discount) with notification
export const createPricingRule = action({
  args: {
    trainerId: v.string(),
    clientId: v.optional(v.string()),
    discountPercentage: v.number(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    // Create the pricing rule
    const ruleId = await ctx.runMutation(api.pricingRules._createPricingRule, args);

    // If client-specific discount, send notification
    if (args.clientId) {
      const trainer = await ctx.runQuery(api.users.getUserByClerkId, {
        clerkId: args.trainerId,
      });

      if (trainer) {
        await ctx.runAction(api.pushNotifications.notifyDiscountAdded, {
          clientId: args.clientId,
          trainerName: trainer.fullName || "Your trainer",
          discountPercentage: args.discountPercentage,
          description: args.description,
        });

        // Create in-app notification
        await ctx.runMutation(api.notifications.createNotification, {
          userId: args.clientId,
          type: "discount_added",
          title: "New Discount Applied! 🎉",
          message: `${trainer.fullName || "Your trainer"} added a ${args.discountPercentage}% discount for you - ${args.description}`,
        });
      }
    }

    return ruleId;
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

// Internal mutation to update pricing rule
export const _updatePricingRule = internalMutation({
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

// Get pricing rule by ID
export const getPricingRuleById = query({
  args: { ruleId: v.id("pricingRules") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.ruleId);
  },
});

// Update pricing rule with notification
export const updatePricingRule = action({
  args: {
    ruleId: v.id("pricingRules"),
    discountPercentage: v.optional(v.number()),
    description: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Get the existing rule
    const existingRule = await ctx.runQuery(api.pricingRules.getPricingRuleById, {
      ruleId: args.ruleId,
    });

    if (!existingRule) {
      throw new Error("Pricing rule not found");
    }

    // Update the rule
    await ctx.runMutation(api.pricingRules._updatePricingRule, args);

    // If client-specific discount and discount percentage changed, send notification
    if (existingRule.clientId && args.discountPercentage !== undefined && args.discountPercentage !== existingRule.discountPercentage) {
      const trainer = await ctx.runQuery(api.users.getUserByClerkId, {
        clerkId: existingRule.trainerId,
      });

      if (trainer) {
        await ctx.runAction(api.pushNotifications.notifyDiscountUpdated, {
          clientId: existingRule.clientId,
          trainerName: trainer.fullName || "Your trainer",
          oldDiscountPercentage: existingRule.discountPercentage,
          newDiscountPercentage: args.discountPercentage,
          description: args.description || existingRule.description,
        });

        // Create in-app notification
        await ctx.runMutation(api.notifications.createNotification, {
          userId: existingRule.clientId,
          type: "discount_updated",
          title: "Discount Updated! 💰",
          message: `${trainer.fullName || "Your trainer"} updated your discount from ${existingRule.discountPercentage}% to ${args.discountPercentage}%`,
        });
      }
    }
  },
});

// Internal mutation to delete pricing rule
export const _deletePricingRule = internalMutation({
  args: { ruleId: v.id("pricingRules") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.ruleId);
  },
});

// Delete pricing rule with notification
export const deletePricingRule = action({
  args: { ruleId: v.id("pricingRules") },
  handler: async (ctx, args) => {
    // Get the existing rule before deleting
    const existingRule = await ctx.runQuery(api.pricingRules.getPricingRuleById, {
      ruleId: args.ruleId,
    });

    if (!existingRule) {
      throw new Error("Pricing rule not found");
    }

    // Delete the rule
    await ctx.runMutation(api.pricingRules._deletePricingRule, args);

    // If client-specific discount, send notification
    if (existingRule.clientId) {
      const trainer = await ctx.runQuery(api.users.getUserByClerkId, {
        clerkId: existingRule.trainerId,
      });

      if (trainer) {
        await ctx.runAction(api.pushNotifications.notifyDiscountRemoved, {
          clientId: existingRule.clientId,
          trainerName: trainer.fullName || "Your trainer",
          discountPercentage: existingRule.discountPercentage,
        });

        // Create in-app notification
        await ctx.runMutation(api.notifications.createNotification, {
          userId: existingRule.clientId,
          type: "discount_removed",
          title: "Discount Removed",
          message: `${trainer.fullName || "Your trainer"} removed your ${existingRule.discountPercentage}% discount`,
        });
      }
    }
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
