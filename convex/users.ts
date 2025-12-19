import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create or update user after signup
export const createUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    fullName: v.string(),
    phoneNumber: v.optional(v.string()),
    role: v.union(v.literal("trainer"), v.literal("client")),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    const now = Date.now();

    if (existingUser) {
      // Update existing user
      await ctx.db.patch(existingUser._id, {
        email: args.email,
        fullName: args.fullName,
        phoneNumber: args.phoneNumber,
        role: args.role,
        updatedAt: now,
      });
      return existingUser._id;
    } else {
      // Create new user
      const userId = await ctx.db.insert("users", {
        clerkId: args.clerkId,
        email: args.email,
        fullName: args.fullName,
        phoneNumber: args.phoneNumber,
        role: args.role,
        createdAt: now,
        updatedAt: now,
      });
      return userId;
    }
  },
});

// Get user by Clerk ID
export const getUserByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
    return user;
  },
});

// Update user role
export const updateUserRole = mutation({
  args: {
    clerkId: v.string(),
    role: v.union(v.literal("trainer"), v.literal("client")),
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
      role: args.role,
      updatedAt: Date.now(),
    });

    return user._id;
  },
});

// Update user profile
export const updateUserProfile = mutation({
  args: {
    clerkId: v.string(),
    fullName: v.optional(v.string()),
    username: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
    bio: v.optional(v.string()),
    specialty: v.optional(v.string()),
    profileImageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const updates: any = { updatedAt: Date.now() };
    if (args.fullName !== undefined) updates.fullName = args.fullName;
    if (args.username !== undefined) updates.username = args.username;
    if (args.phoneNumber !== undefined) updates.phoneNumber = args.phoneNumber;
    if (args.bio !== undefined) updates.bio = args.bio;
    if (args.specialty !== undefined) updates.specialty = args.specialty;
    if (args.profileImageId !== undefined) updates.profileImageId = args.profileImageId;

    await ctx.db.patch(user._id, updates);

    return user._id;
  },
});

// Generate upload URL for profile image
export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

// Get profile image URL
export const getProfileImageUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

// Save Google OAuth tokens for calendar access
export const saveGoogleTokens = mutation({
  args: {
    clerkId: v.string(),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    expiresIn: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const tokenExpiry = args.expiresIn
      ? Date.now() + (args.expiresIn * 1000)
      : undefined;

    await ctx.db.patch(user._id, {
      googleAccessToken: args.accessToken,
      googleRefreshToken: args.refreshToken,
      googleTokenExpiry: tokenExpiry,
      updatedAt: Date.now(),
    });

    console.log(`Google Calendar token saved for user ${args.clerkId}`);
    console.log(`Token expires at: ${tokenExpiry ? new Date(tokenExpiry).toISOString() : 'never'}`);

    return user._id;
  },
});

// Get Google Calendar token status
export const getGoogleTokenStatus = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      return { connected: false, expired: false };
    }

    const hasToken = !!user.googleAccessToken;
    const isExpired = user.googleTokenExpiry ? Date.now() > user.googleTokenExpiry : false;

    return {
      connected: hasToken,
      expired: isExpired,
      expiresAt: user.googleTokenExpiry,
      hasRefreshToken: !!user.googleRefreshToken,
    };
  },
});


// Search trainers by username
export const searchTrainersByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    if (!args.username || args.username.length < 2) {
      return [];
    }

    const trainers = await ctx.db
      .query("users")
      .filter((q) => 
        q.and(
          q.eq(q.field("role"), "trainer"),
          q.neq(q.field("username"), undefined)
        )
      )
      .collect();

    // Filter by username match (case-insensitive)
    return trainers.filter((trainer) =>
      trainer.username?.toLowerCase().includes(args.username.toLowerCase())
    );
  },
});

// Get all trainers
export const getAllTrainers = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "trainer"))
      .collect();
  },
});

// Get all clients
export const getAllClients = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "client"))
      .collect();
  },
});

// Add trainer to client's list
export const addTrainerToClient = mutation({
  args: {
    clientId: v.string(),
    trainerId: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if relationship already exists
    const existing = await ctx.db
      .query("clientTrainers")
      .withIndex("by_client_trainer", (q) =>
        q.eq("clientId", args.clientId).eq("trainerId", args.trainerId)
      )
      .first();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("clientTrainers", {
      clientId: args.clientId,
      trainerId: args.trainerId,
      addedAt: Date.now(),
    });
  },
});

// Get client's trainers
export const getClientTrainers = query({
  args: { clientId: v.string() },
  handler: async (ctx, args) => {
    const relationships = await ctx.db
      .query("clientTrainers")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();

    const trainerIds = relationships.map((r) => r.trainerId);
    
    const trainers = await Promise.all(
      trainerIds.map(async (trainerId) => {
        return await ctx.db
          .query("users")
          .withIndex("by_clerk_id", (q) => q.eq("clerkId", trainerId))
          .first();
      })
    );

    return trainers.filter((t) => t !== null);
  },
});

// Get trainer's clients (from clientTrainers relationships)
export const getTrainerClients = query({
  args: { trainerId: v.string() },
  handler: async (ctx, args) => {
    const relationships = await ctx.db
      .query("clientTrainers")
      .withIndex("by_trainer", (q) => q.eq("trainerId", args.trainerId))
      .collect();

    const clientIds = relationships.map((r) => r.clientId);
    
    const clients = await Promise.all(
      clientIds.map(async (clientId) => {
        return await ctx.db
          .query("users")
          .withIndex("by_clerk_id", (q) => q.eq("clerkId", clientId))
          .first();
      })
    );

    return clients.filter((c) => c !== null);
  },
});

// Save Expo push token
export const savePushToken = mutation({
  args: {
    clerkId: v.string(),
    expoPushToken: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    // If user doesn't exist yet, silently return - they'll get the token saved when they complete registration
    if (!user) {
      console.log("User not found for push token, will be saved later");
      return null;
    }

    await ctx.db.patch(user._id, {
      expoPushToken: args.expoPushToken,
      updatedAt: Date.now(),
    });
    
    return user._id;
  },
});

// Update notification settings
export const updateNotificationSettings = mutation({
  args: {
    clerkId: v.string(),
    settings: v.object({
      sessionReminders: v.boolean(),
      reminderMinutes: v.array(v.number()),
      paymentRequests: v.boolean(),
      goalUpdates: v.boolean(),
      newClients: v.boolean(),
      newBookings: v.boolean(),
    }),
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
      notificationSettings: args.settings,
      updatedAt: Date.now(),
    });
  },
});

// Search clients by name or email
export const searchClients = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    if (!args.query || args.query.length < 2) {
      return [];
    }

    const clients = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "client"))
      .collect();

    const searchLower = args.query.toLowerCase();
    
    return clients.filter((client) =>
      client.fullName?.toLowerCase().includes(searchLower) ||
      client.email?.toLowerCase().includes(searchLower)
    );
  },
});

// Add client to trainer's list (reverse of addTrainerToClient)
export const addClientToTrainer = mutation({
  args: {
    trainerId: v.string(),
    clientId: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if relationship already exists
    const existing = await ctx.db
      .query("clientTrainers")
      .withIndex("by_client_trainer", (q) =>
        q.eq("clientId", args.clientId).eq("trainerId", args.trainerId)
      )
      .first();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("clientTrainers", {
      clientId: args.clientId,
      trainerId: args.trainerId,
      addedAt: Date.now(),
    });
  },
});
