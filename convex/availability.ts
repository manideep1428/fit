import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Default availability settings
const DEFAULT_TIME_RANGES = [{ startTime: "09:00", endTime: "17:00" }];
const DEFAULT_SESSION_DURATION = 60;

// Create default availability for a new trainer (Mon-Fri enabled, Sat-Sun disabled)
export const createDefaultAvailability = mutation({
  args: { trainerId: v.string() },
  handler: async (ctx, args) => {
    // Check if trainer already has availability set
    const existing = await ctx.db
      .query("availability")
      .withIndex("by_trainer", (q) => q.eq("trainerId", args.trainerId))
      .first();

    if (existing) {
      // Already has availability, don't overwrite
      return { created: false, message: "Availability already exists" };
    }

    const now = Date.now();
    const createdIds = [];

    // Create availability for all 7 days
    for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
      // Enable Monday (1) through Friday (5), disable Sunday (0) and Saturday (6)
      const enabled = dayOfWeek >= 1 && dayOfWeek <= 5;

      const id = await ctx.db.insert("availability", {
        trainerId: args.trainerId,
        dayOfWeek,
        enabled,
        timeRanges: DEFAULT_TIME_RANGES,
        breaks: [],
        sessionDuration: DEFAULT_SESSION_DURATION,
        createdAt: now,
        updatedAt: now,
      });
      createdIds.push(id);
    }

    return { created: true, ids: createdIds };
  },
});

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
    timeRanges: v.array(v.object({
      startTime: v.string(),
      endTime: v.string(),
    })),
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
        timeRanges: args.timeRanges,
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
        timeRanges: args.timeRanges,
        breaks: args.breaks,
        sessionDuration: args.sessionDuration,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});
