import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Helper to hash password (simple for now - in production use bcrypt or similar)
function hashPassword(password: string): string {
  // In production, use a proper hashing library like bcrypt
  // For now, we'll use a simple hash (NOT SECURE - replace with bcrypt)
  return Buffer.from(password).toString('base64');
}

function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

// Sign up new user
export const signUp = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    fullName: v.string(),
    phoneNumber: v.optional(v.string()),
    role: v.union(v.literal("trainer"), v.literal("client")),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .first();

    if (existingUser) {
      throw new Error("Email already registered");
    }

    // Hash password
    const passwordHash = hashPassword(args.password);

    // Create user
    const now = Date.now();
    const userId = await ctx.db.insert("users", {
      email: args.email.toLowerCase(),
      passwordHash,
      fullName: args.fullName,
      phoneNumber: args.phoneNumber,
      role: args.role,
      emailVerified: false, // Will be true after email verification
      createdAt: now,
      updatedAt: now,
    });

    // Return user data (without password hash)
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("Failed to create user");

    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },
});

// Sign in user
export const signIn = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    // Find user by email
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .first();

    if (!user) {
      throw new Error("Invalid email or password");
    }

    // Verify password
    if (!user.passwordHash || !verifyPassword(args.password, user.passwordHash)) {
      throw new Error("Invalid email or password");
    }

    // Update last login
    await ctx.db.patch(user._id, {
      lastLoginAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Return user data (without password hash)
    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },
});

// Update password
export const updatePassword = mutation({
  args: {
    userId: v.id("users"),
    currentPassword: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Verify current password
    if (!user.passwordHash || !verifyPassword(args.currentPassword, user.passwordHash)) {
      throw new Error("Current password is incorrect");
    }

    // Hash new password
    const newPasswordHash = hashPassword(args.newPassword);

    // Update password
    await ctx.db.patch(args.userId, {
      passwordHash: newPasswordHash,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Request password reset (generates reset token)
export const requestPasswordReset = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .first();

    if (!user) {
      // Don't reveal if email exists
      return { success: true };
    }

    // Generate reset token (6-digit code)
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    const resetTokenExpiry = Date.now() + 15 * 60 * 1000; // 15 minutes

    await ctx.db.patch(user._id, {
      resetToken,
      resetTokenExpiry,
      updatedAt: Date.now(),
    });

    // In production, send email with reset token
    // For now, we'll just return success
    return { success: true, resetToken }; // Remove resetToken in production
  },
});

// Verify reset token
export const verifyResetToken = mutation({
  args: {
    email: v.string(),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .first();

    if (!user || !user.resetToken || !user.resetTokenExpiry) {
      throw new Error("Invalid or expired reset token");
    }

    if (user.resetToken !== args.token) {
      throw new Error("Invalid reset token");
    }

    if (Date.now() > user.resetTokenExpiry) {
      throw new Error("Reset token has expired");
    }

    return { success: true, userId: user._id };
  },
});

// Reset password with token
export const resetPassword = mutation({
  args: {
    email: v.string(),
    token: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .first();

    if (!user || !user.resetToken || !user.resetTokenExpiry) {
      throw new Error("Invalid or expired reset token");
    }

    if (user.resetToken !== args.token) {
      throw new Error("Invalid reset token");
    }

    if (Date.now() > user.resetTokenExpiry) {
      throw new Error("Reset token has expired");
    }

    // Hash new password
    const newPasswordHash = hashPassword(args.newPassword);

    // Update password and clear reset token
    await ctx.db.patch(user._id, {
      passwordHash: newPasswordHash,
      resetToken: undefined,
      resetTokenExpiry: undefined,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Get user by ID
export const getUserById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },
});

// Get user by email
export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .first();

    if (!user) return null;

    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },
});
