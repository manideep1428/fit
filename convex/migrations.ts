import { mutation } from "./_generated/server";

// Migration: Convert old one-time packages to monthly subscriptions
export const migratePackagesToMonthly = mutation({
  handler: async (ctx) => {
    const packages = await ctx.db.query("packages").collect();
    let migrated = 0;
    let skipped = 0;
    
    for (const pkg of packages) {
      // Skip if already migrated
      if (pkg.monthlyAmount && pkg.sessionsPerMonth) {
        skipped++;
        continue;
      }
      
      // Skip if missing old fields
      if (!pkg.amount || !pkg.sessions || !pkg.durationMonths) {
        skipped++;
        continue;
      }
      
      // Calculate monthly equivalent
      const monthlyAmount = Math.round((pkg.amount / pkg.durationMonths) * 100) / 100;
      const sessionsPerMonth = Math.round((pkg.sessions / pkg.durationMonths) * 100) / 100;
      
      await ctx.db.patch(pkg._id, {
        monthlyAmount,
        sessionsPerMonth,
      });
      
      migrated++;
    }
    
    return { 
      total: packages.length,
      migrated, 
      skipped,
      message: `Migrated ${migrated} packages, skipped ${skipped}`
    };
  },
});

// Migration: Convert old subscriptions to monthly model
export const migrateSubscriptionsToMonthly = mutation({
  handler: async (ctx) => {
    const subscriptions = await ctx.db.query("clientSubscriptions").collect();
    let migrated = 0;
    let skipped = 0;
    
    for (const sub of subscriptions) {
      // Skip if already migrated
      if (sub.currentPeriodStart && sub.currentPeriodEnd && sub.sessionsPerMonth) {
        skipped++;
        continue;
      }
      
      // Skip if missing old fields
      if (!sub.startDate || !sub.endDate || !sub.totalSessions) {
        skipped++;
        continue;
      }
      
      // Get package to calculate monthly sessions
      const pkg = await ctx.db.get(sub.packageId);
      if (!pkg) {
        skipped++;
        continue;
      }
      
      // Calculate sessions per month
      let sessionsPerMonth = 0;
      if (pkg.sessionsPerMonth) {
        sessionsPerMonth = pkg.sessionsPerMonth;
      } else if (pkg.sessions && pkg.durationMonths) {
        sessionsPerMonth = Math.round((pkg.sessions / pkg.durationMonths) * 100) / 100;
      }
      
      // Calculate monthly amount
      let monthlyAmount = 0;
      if (pkg.monthlyAmount) {
        monthlyAmount = pkg.monthlyAmount;
      } else if (pkg.amount && pkg.durationMonths) {
        monthlyAmount = Math.round((pkg.amount / pkg.durationMonths) * 100) / 100;
      }
      
      await ctx.db.patch(sub._id, {
        sessionsPerMonth,
        currentPeriodStart: sub.startDate,
        currentPeriodEnd: sub.endDate,
        monthlyAmount: monthlyAmount || sub.finalAmount,
        autoRenew: true,
      });
      
      migrated++;
    }
    
    return { 
      total: subscriptions.length,
      migrated, 
      skipped,
      message: `Migrated ${migrated} subscriptions, skipped ${skipped}`
    };
  },
});

// Delete old packages (use with caution!)
export const deleteOldPackages = mutation({
  handler: async (ctx) => {
    const packages = await ctx.db.query("packages").collect();
    let deleted = 0;
    
    for (const pkg of packages) {
      // Only delete packages that don't have new fields
      if (!pkg.monthlyAmount || !pkg.sessionsPerMonth) {
        await ctx.db.delete(pkg._id);
        deleted++;
      }
    }
    
    return { 
      deleted,
      message: `Deleted ${deleted} old packages`
    };
  },
});

// List packages that need migration
export const listPackagesNeedingMigration = mutation({
  handler: async (ctx) => {
    const packages = await ctx.db.query("packages").collect();
    
    const needMigration = packages.filter(pkg => 
      !pkg.monthlyAmount || !pkg.sessionsPerMonth
    );
    
    return {
      total: packages.length,
      needMigration: needMigration.length,
      packages: needMigration.map(pkg => ({
        id: pkg._id,
        name: pkg.name,
        trainerId: pkg.trainerId,
        hasOldFields: !!(pkg.amount && pkg.sessions && pkg.durationMonths),
        hasNewFields: !!(pkg.monthlyAmount && pkg.sessionsPerMonth),
      }))
    };
  },
});
