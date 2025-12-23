import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a package
export const createPackage = mutation({
    args: {
        trainerId: v.string(),
        name: v.string(),
        monthlyAmount: v.number(),
        currency: v.string(),
        description: v.optional(v.string()),
        sessionsPerMonth: v.number(),
        discount: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const now = Date.now();

        return await ctx.db.insert("packages", {
            trainerId: args.trainerId,
            name: args.name,
            monthlyAmount: args.monthlyAmount,
            currency: args.currency,
            description: args.description || "",
            sessionsPerMonth: args.sessionsPerMonth,
            discount: args.discount || 0,
            isActive: true,
            createdAt: now,
            updatedAt: now,
        });
    },
});

// Get all packages for a trainer (only new monthly packages)
export const getTrainerPackages = query({
    args: { trainerId: v.string() },
    handler: async (ctx, args) => {
        const packages = await ctx.db
            .query("packages")
            .withIndex("by_trainer", (q) => q.eq("trainerId", args.trainerId))
            .order("desc")
            .collect();
        
        // Only return new monthly packages (with monthlyAmount and sessionsPerMonth)
        return packages.filter(pkg => pkg.monthlyAmount && pkg.sessionsPerMonth);
    },
});

// Get package by ID
export const getPackageById = query({
    args: { packageId: v.id("packages") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.packageId);
    },
});

// Update a package
export const updatePackage = mutation({
    args: {
        packageId: v.id("packages"),
        name: v.optional(v.string()),
        monthlyAmount: v.optional(v.number()),
        currency: v.optional(v.string()),
        description: v.optional(v.string()),
        sessionsPerMonth: v.optional(v.number()),
        discount: v.optional(v.number()),
        isActive: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const { packageId, ...updates } = args;
        const filteredUpdates = Object.fromEntries(
            Object.entries(updates).filter(([_, v]) => v !== undefined)
        );

        await ctx.db.patch(packageId, {
            ...filteredUpdates,
            updatedAt: Date.now(),
        });
    },
});

// Delete a package
export const deletePackage = mutation({
    args: { packageId: v.id("packages") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.packageId);
    },
});

// Get active packages for a trainer (only new monthly packages)
export const getActiveTrainerPackages = query({
    args: { trainerId: v.string() },
    handler: async (ctx, args) => {
        const packages = await ctx.db
            .query("packages")
            .withIndex("by_trainer", (q) => q.eq("trainerId", args.trainerId))
            .collect();
        
        // Only return new monthly packages that are active
        return packages.filter(pkg => 
            pkg.monthlyAmount && 
            pkg.sessionsPerMonth &&
            (pkg.isActive === undefined || pkg.isActive === true)
        );
    },
});
