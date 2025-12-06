import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get trainer's availability
export const getTrainerAvailability = query({
  args: { trainerId: v.string() },
  handler: async (ctx, args) => {
    const availability = await ctx.db
      .query("availability")
      .withIndex("by_trainer", (q) => q.eq("trainerId", args.trainerId))
      .collect();
    return availability;
  },
});

// Save or update availability for a specific day
export const saveAvailability = mutation({
  args: {
    trainerId: v.string(),
    dayOfWeek: v.number(),
    enabled: v.boolean(),
    startTime: v.string(),
    endTime: v.string(),
    breaks: v.array(v.object({
      startTime: v.string(),
      endTime: v.string(),
    })),
    sessionDuration: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("availability")
      .withIndex("by_trainer", (q) => q.eq("trainerId", args.trainerId))
      .filter((q) => q.eq(q.field("dayOfWeek"), args.dayOfWeek))
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        enabled: args.enabled,
        startTime: args.startTime,
        endTime: args.endTime,
        breaks: args.breaks,
        sessionDuration: args.sessionDuration,
        updatedAt: now,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("availability", {
        trainerId: args.trainerId,
        dayOfWeek: args.dayOfWeek,
        enabled: args.enabled,
        startTime: args.startTime,
        endTime: args.endTime,
        breaks: args.breaks,
        sessionDuration: args.sessionDuration,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});
