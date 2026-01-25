# Quick Fix Guide - Schema Validation Error

## The Problem
You're seeing this error:
```
Document with ID "k573b6h2qzf27h8mncmk6rs6bh7xv2f3" in table "packages" does not match the schema
Object is missing the required field `monthlyAmount`
```

This happens because you have old packages in the database with the old field names (`amount`, `sessions`, `durationMonths`) but the schema now expects new field names (`monthlyAmount`, `sessionsPerMonth`).

## Quick Solutions

### Solution 1: Delete Old Packages (Fastest - Development Only)
If you're in development and don't need the old data:

1. Open Convex Dashboard: https://dashboard.convex.dev
2. Go to your project → Data → packages table
3. Delete all packages that have `amount` instead of `monthlyAmount`
4. Run `npx convex dev` again
5. Create new packages through the trainer UI

### Solution 2: Run Migration Script (Recommended)
Migrate old packages to the new format:

1. Make sure `npx convex dev` is running
2. Open Convex Dashboard
3. Go to Functions tab
4. Find and run: `migrations:listPackagesNeedingMigration`
   - This shows which packages need migration
5. Run: `migrations:migratePackagesToMonthly`
   - This converts old packages to monthly format
6. Run: `migrations:migrateSubscriptionsToMonthly`
   - This converts old subscriptions to monthly format
7. Refresh - schema should now validate

### Solution 3: Manual Fix (Small Dataset)
If you only have a few packages:

1. Open Convex Dashboard → Data → packages
2. For each package, click Edit
3. Add these fields:
   - `monthlyAmount`: (calculate: amount ÷ durationMonths)
   - `sessionsPerMonth`: (calculate: sessions ÷ durationMonths)
4. Save each package
5. Run `npx convex dev` again

## What Changed

### Old Package Structure
```javascript
{
  name: "Basic Package",
  amount: 20000,           // Total price
  sessions: 55,            // Total sessions
  durationMonths: 1,       // Package duration
  currency: "INR"
}
```

### New Package Structure
```javascript
{
  name: "Basic Package",
  monthlyAmount: 20000,    // Monthly price
  sessionsPerMonth: 55,    // Sessions per month
  currency: "INR",
  // Old fields still supported for backward compatibility
  amount: 20000,
  sessions: 55,
  durationMonths: 1
}
```

## Verification

After fixing, verify:
1. `npx convex dev` runs without errors
2. Trainer can see packages in the UI
3. Trainer can create new monthly packages
4. Client can view and subscribe to packages

## Need Help?

Check these files:
- `.agent/MIGRATION_GUIDE.md` - Detailed migration guide
- `.agent/MONTHLY_SUBSCRIPTION_CHANGES.md` - What changed and why
- `convex/migrations.ts` - Migration scripts

## Prevention

Going forward:
- New packages created through the UI will have the correct format
- Old packages are hidden from UI but still in database
- Schema supports both formats during transition period
