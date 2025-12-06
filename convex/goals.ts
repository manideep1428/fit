import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new goal
export const createGoal = mutation({
  args: {
    clientId: v.string(),
    trainerId: v.string(),
    description: v.string(),
    deadline: v.optional(v.string()),
    currentWeight: v.optional(v.number()),
    targetWeight: v.optional(v.number()),
    weightUnit: v.optional(v.string()),
    measurements: v.optional(v.array(v.object({
      bodyPart: v.string(),
      current: v.number(),
      target: v.number(),
      unit: v.string(),
    }))),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    return await ctx.db.insert("goals", {
      clientId: args.clientId,
      trainerId: args.trainerId,
      description: args.description,
      deadline: args.deadline,
      status: "active",
      currentWeight: args.currentWeight,
      targetWeight: args.targetWeight,
      weightUnit: args.weightUnit,
      measurements: args.measurements,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Get client's goals
export const getClientGoals = query({
  args: { clientId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("goals")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .order("desc")
      .collect();
  },
});

// Get active goals for a client
export const getActiveClientGoals = query({
  args: { clientId: v.string() },
  handler: async (ctx, args) => {
    const goals = await ctx.db
      .query("goals")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();
    
    return goals.filter((goal) => goal.status === "active");
  },
});

// Update goal status
export const updateGoalStatus = mutation({
  args: {
    goalId: v.id("goals"),
    status: v.union(
      v.literal("active"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.goalId, {
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});

// Delete a goal
export const deleteGoal = mutation({
  args: { goalId: v.id("goals") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.goalId);
  },
});

// Create a progress log
export const createProgressLog = mutation({
  args: {
    goalId: v.id("goals"),
    clientId: v.string(),
    trainerId: v.string(),
    weight: v.optional(v.number()),
    measurements: v.optional(v.array(v.object({
      bodyPart: v.string(),
      value: v.number(),
      unit: v.string(),
    }))),
    note: v.optional(v.string()),
    loggedBy: v.union(v.literal("trainer"), v.literal("client")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("progressLogs", {
      goalId: args.goalId,
      clientId: args.clientId,
      trainerId: args.trainerId,
      weight: args.weight,
      measurements: args.measurements,
      note: args.note,
      loggedBy: args.loggedBy,
      createdAt: Date.now(),
    });
  },
});

// Get progress logs for a goal
export const getGoalProgressLogs = query({
  args: { goalId: v.id("goals") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("progressLogs")
      .withIndex("by_goal", (q) => q.eq("goalId", args.goalId))
      .order("desc")
      .collect();
  },
});

// Get all progress logs for a client
export const getClientProgressLogs = query({
  args: { clientId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("progressLogs")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .order("desc")
      .take(50);
  },
});

// Update a goal
export const updateGoal = mutation({
  args: {
    goalId: v.id("goals"),
    description: v.string(),
    deadline: v.optional(v.string()),
    currentWeight: v.optional(v.number()),
    targetWeight: v.optional(v.number()),
    weightUnit: v.optional(v.string()),
    measurements: v.optional(v.array(v.object({
      bodyPart: v.string(),
      current: v.number(),
      target: v.number(),
      unit: v.string(),
    }))),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.goalId, {
      description: args.description,
      deadline: args.deadline,
      currentWeight: args.currentWeight,
      targetWeight: args.targetWeight,
      weightUnit: args.weightUnit,
      measurements: args.measurements,
      updatedAt: Date.now(),
    });
  },
});

// Check if goal name is unique for a client
export const checkGoalNameUnique = query({
  args: { 
    clientId: v.string(), 
    description: v.string(),
    excludeGoalId: v.optional(v.id("goals"))
  },
  handler: async (ctx, args) => {
    const goals = await ctx.db
      .query("goals")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();
    
    const duplicate = goals.find(
      (goal) => 
        goal.description.toLowerCase() === args.description.toLowerCase() &&
        goal._id !== args.excludeGoalId
    );
    
    return !duplicate; // Returns true if unique, false if duplicate
  },
});
