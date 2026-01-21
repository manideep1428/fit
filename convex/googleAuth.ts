import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Store Google OAuth tokens for a user
export const storeGoogleTokens = mutation({
  args: {
    clerkId: v.string(),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    expiresIn: v.number(), // seconds until expiry
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const expiryTime = Date.now() + args.expiresIn * 1000;

    await ctx.db.patch(user._id, {
      googleAccessToken: args.accessToken,
      googleRefreshToken: args.refreshToken,
      googleTokenExpiry: expiryTime,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Get Google tokens for a user
export const getGoogleTokens = query({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      return null;
    }

    return {
      accessToken: user.googleAccessToken,
      refreshToken: user.googleRefreshToken,
      expiryTime: user.googleTokenExpiry,
    };
  },
});

// Clear Google tokens (for sign out)
export const clearGoogleTokens = mutation({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, {
      googleAccessToken: undefined,
      googleRefreshToken: undefined,
      googleTokenExpiry: undefined,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});
