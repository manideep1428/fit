# Migration Guide: One-Time Packages to Monthly Subscriptions

## Overview
This guide explains how to migrate from the old one-time package system to the new monthly subscription system.

## Schema Changes

### Backward Compatibility
The schema now supports BOTH old and new field names to allow for gradual migration:

**Packages Table:**
- New fields: `monthlyAmount`, `sessionsPerMonth`
- Old fields (still supported): `amount`, `sessions`, `durationMonths`

**ClientSubscriptions Table:**
- New fields: `sessionsPerMonth`, `currentPeriodStart`, `currentPeriodEnd`, `monthlyAmount`, `autoRenew`
- Old fields (still supported): `totalSessions`, `startDate`, `endDate`, `finalAmount`

## Migration Steps

### Option 1: Clean Start (Recommended for Development)
If you're in development and can delete old data:

1. Delete all existing packages from the database
2. Delete all existing subscriptions from the database
3. Run `npx convex dev` - schema will validate successfully
4. Create new monthly packages through the UI

### Option 2: Data Migration (For Production)
If you need to preserve existing data:

1. **Current State**: Schema is backward compatible, old packages still work
2. **Create Migration Script**: Create a Convex mutation to migrate old packages:

```typescript
// convex/migrations.ts
import { mutation } from "./_generated/server";

export const migratePackagesToMonthly = mutation({
  handler: async (ctx) => {
    const packages = await ctx.db.query("packages").collect();
    
    for (const pkg of packages) {
      // Skip if already migrated
      if (pkg.monthlyAmount && pkg.sessionsPerMonth) continue;
      
      // Skip if missing old fields
      if (!pkg.amount || !pkg.sessions || !pkg.durationMonths) continue;
      
      // Calculate monthly equivalent
      const monthlyAmount = pkg.amount / pkg.durationMonths;
      const sessionsPerMonth = pkg.sessions / pkg.durationMonths;
      
      await ctx.db.patch(pkg._id, {
        monthlyAmount,
        sessionsPerMonth,
      });
    }
    
    return { migrated: packages.length };
  },
});

export const migrateSubscriptionsToMonthly = mutation({
  handler: async (ctx) => {
    const subscriptions = await ctx.db.query("clientSubscriptions").collect();
    
    for (const sub of subscriptions) {
      // Skip if already migrated
      if (sub.currentPeriodStart && sub.currentPeriodEnd) continue;
      
      // Skip if missing old fields
      if (!sub.startDate || !sub.endDate || !sub.totalSessions) continue;
      
      // Get package to calculate monthly sessions
      const pkg = await ctx.db.get(sub.packageId);
      if (!pkg) continue;
      
      const sessionsPerMonth = pkg.sessionsPerMonth || 
        (pkg.sessions && pkg.durationMonths ? pkg.sessions / pkg.durationMonths : 0);
      
      await ctx.db.patch(sub._id, {
        sessionsPerMonth,
        currentPeriodStart: sub.startDate,
        currentPeriodEnd: sub.endDate,
        monthlyAmount: sub.finalAmount,
        autoRenew: true,
      });
    }
    
    return { migrated: subscriptions.length };
  },
});
```

3. **Run Migration**: Call these mutations from the Convex dashboard
4. **Verify**: Check that all packages and subscriptions have new fields
5. **Clean Up**: After verification, you can optionally remove old fields from schema

### Option 3: Manual Migration (Small Dataset)
If you have few packages:

1. Note down existing package details
2. Delete old packages from Convex dashboard
3. Create new monthly packages with equivalent pricing
4. Notify clients to re-subscribe

## Current Behavior

### Queries
- `getTrainerPackages`: Only returns packages with `monthlyAmount` and `sessionsPerMonth`
- `getActiveTrainerPackages`: Only returns active monthly packages
- `getActiveClientSubscription`: Works with both old and new subscriptions

### UI
- Trainer package creation: Only creates new monthly packages
- Client pricing: Only shows new monthly packages
- Old packages are hidden from UI but still exist in database

## Testing

1. Start Convex dev: `npx convex dev`
2. If you see schema validation errors about old packages:
   - Either delete them from the dashboard
   - Or run the migration script
3. Create a new monthly package through the trainer UI
4. Verify it appears correctly
5. Test client subscription flow

## Rollback Plan

If you need to rollback:

1. The old fields are still in the schema
2. Old subscriptions still work
3. You can revert the UI changes to show old packages
4. No data loss occurs during migration

## Notes

- Old packages won't appear in the UI but are still in the database
- Old subscriptions continue to work until they expire
- New subscriptions use the monthly model
- You can run both systems in parallel during transition
