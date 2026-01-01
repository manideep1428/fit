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
    const goal = await ctx.db.get(args.goalId);
    if (!goal) throw new Error("Goal not found");

    await ctx.db.patch(args.goalId, {
      description: args.description,
      deadline: args.deadline,
      currentWeight: args.currentWeight,
      targetWeight: args.targetWeight,
      weightUnit: args.weightUnit,
      measurements: args.measurements,
      updatedAt: Date.now(),
    });

    return goal.clientId;
  },
});

// Get goal statistics
export const getGoalStatistics = query({
  args: { goalId: v.id("goals") },
  handler: async (ctx, args) => {
    const goal = await ctx.db.get(args.goalId);
    if (!goal) return null;

    const logs = await ctx.db
      .query("progressLogs")
      .withIndex("by_goal", (q) => q.eq("goalId", args.goalId))
      .order("desc")
      .collect();

    if (logs.length === 0) {
      return {
        totalLogs: 0,
        averageProgress: 0,
        weeklyChange: 0,
        estimatedCompletion: null,
      };
    }

    // Calculate statistics
    const latestLog = logs[0];
    const currentWeight = latestLog.weight || goal.currentWeight || 0;
    const totalChange = Math.abs((goal.targetWeight || 0) - (goal.currentWeight || 0));
    const currentChange = Math.abs(currentWeight - (goal.currentWeight || 0));
    const progress = totalChange > 0 ? Math.min((currentChange / totalChange) * 100, 100) : 0;

    // Calculate weekly change (last 7 days)
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentLogs = logs.filter(log => log.createdAt >= oneWeekAgo);
    const weeklyChange = recentLogs.length > 1
      ? Math.abs((recentLogs[0].weight || 0) - (recentLogs[recentLogs.length - 1].weight || 0))
      : 0;

    // Estimate completion date
    let estimatedCompletion = null;
    if (weeklyChange > 0 && progress < 100) {
      const remainingChange = totalChange - currentChange;
      const weeksToComplete = remainingChange / weeklyChange;
      estimatedCompletion = new Date(Date.now() + weeksToComplete * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    }

    return {
      totalLogs: logs.length,
      averageProgress: Math.round(progress),
      weeklyChange: Math.round(weeklyChange * 10) / 10,
      estimatedCompletion,
      latestWeight: currentWeight,
    };
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


// Get active goals with latest progress for a client
export const getActiveClientGoalsWithProgress = query({
  args: { clientId: v.string() },
  handler: async (ctx, args) => {
    const goals = await ctx.db
      .query("goals")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();
    
    const activeGoals = goals.filter((goal) => goal.status === "active");
    
    // Get latest progress for each goal
    const goalsWithProgress = await Promise.all(
      activeGoals.map(async (goal) => {
        const logs = await ctx.db
          .query("progressLogs")
          .withIndex("by_goal", (q) => q.eq("goalId", goal._id))
          .order("desc")
          .take(1);
        
        const latestLog = logs[0];
        let latestProgress = 0;
        let latestWeight = goal.currentWeight;
        
        if (latestLog && goal.currentWeight && goal.targetWeight) {
          latestWeight = latestLog.weight || goal.currentWeight;
          const totalChange = Math.abs(goal.targetWeight - goal.currentWeight);
          const currentChange = Math.abs(latestWeight - goal.currentWeight);
          latestProgress = totalChange > 0 
            ? Math.min(Math.round((currentChange / totalChange) * 100), 100) 
            : 0;
        }
        
        return {
          ...goal,
          latestProgress,
          latestWeight,
          latestMeasurements: latestLog?.measurements,
        };
      })
    );
    
    return goalsWithProgress;
  },
});
