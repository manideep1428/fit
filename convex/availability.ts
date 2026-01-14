import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Default availability settings
const DEFAULT_TIME_RANGES = [{ startTime: "09:00", endTime: "17:00" }];
const DEFAULT_SESSION_DURATION = 60;
const DEFAULT_TIMEZONE = "Europe/Oslo"; // Norway timezone

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
        timezone: DEFAULT_TIMEZONE,
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
    timezone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("availability")
      .withIndex("by_trainer", (q) => q.eq("trainerId", args.trainerId))
      .filter((q) => q.eq(q.field("dayOfWeek"), args.dayOfWeek))
      .first();

    const now = Date.now();
    const timezone = args.timezone || DEFAULT_TIMEZONE;

    if (existing) {
      await ctx.db.patch(existing._id, {
        enabled: args.enabled,
        timeRanges: args.timeRanges,
        breaks: args.breaks,
        sessionDuration: args.sessionDuration,
        timezone,
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
        timezone,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

// Migration: Update all availability records to have timezone (default Norway)
export const migrateTimezone = mutation({
  args: {},
  handler: async (ctx) => {
    const allAvailability = await ctx.db.query("availability").collect();
    
    let updated = 0;
    for (const record of allAvailability) {
      if (!record.timezone) {
        await ctx.db.patch(record._id, {
          timezone: DEFAULT_TIMEZONE,
          updatedAt: Date.now(),
        });
        updated++;
      }
    }
    
    return { 
      total: allAvailability.length, 
      updated,
      timezone: DEFAULT_TIMEZONE,
    };
  },
});

// Get trainer's timezone
export const getTrainerTimezone = query({
  args: { trainerId: v.string() },
  handler: async (ctx, args) => {
    const availability = await ctx.db
      .query("availability")
      .withIndex("by_trainer", (q) => q.eq("trainerId", args.trainerId))
      .first();
    return availability?.timezone || DEFAULT_TIMEZONE;
  },
});

// Get available dates for a month (dates that have availability)
export const getAvailableDatesForMonth = query({
  args: {
    trainerId: v.string(),
    year: v.number(),
    month: v.number(), // 0-11
  },
  handler: async (ctx, args) => {
    // Get trainer's availability settings
    const availability = await ctx.db
      .query("availability")
      .withIndex("by_trainer", (q) => q.eq("trainerId", args.trainerId))
      .collect();

    // Get enabled days of week
    const enabledDays = availability
      .filter((a) => a.enabled)
      .map((a) => a.dayOfWeek);

    if (enabledDays.length === 0) {
      return { availableDates: [], timezone: DEFAULT_TIMEZONE };
    }

    const timezone = availability[0]?.timezone || DEFAULT_TIMEZONE;

    // Generate all dates in the month that fall on enabled days
    const availableDates: string[] = [];
    const daysInMonth = new Date(args.year, args.month + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(args.year, args.month, day);
      const dayOfWeek = date.getDay();

      // Check if this day of week is enabled and date is not in the past
      if (enabledDays.includes(dayOfWeek) && date >= today) {
        const dateStr = date.toISOString().split("T")[0];
        availableDates.push(dateStr);
      }
    }

    return { availableDates, timezone };
  },
});
