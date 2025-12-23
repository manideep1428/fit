# Subscription System Redesign

## Overview

The subscription system has been completely redesigned to provide:

- Trainer-controlled subscription plans with visibility settings
- Custom billing periods (monthly, 3/6/12 months)
- Automatic yearly price calculations
- Client-specific and global discount support
- Modern UI matching the provided design

## Schema Changes

### New Tables

#### `trainerPlans`

Replaces the old `packages` table for new subscriptions.

```typescript
{
  trainerId: string,           // Clerk ID
  name: string,                // "Basic Fitness", "Elite Training"
  description: string,
  sessionsPerMonth: number,    // Sessions per month
  monthlyPrice: number,        // Base monthly price
  currency: string,            // "INR", "USD", etc.
  isVisible: boolean,          // Show to clients
  isActive: boolean,           // Accepting subscriptions
  discount: number,            // Default discount percentage
  features: string[],          // ["Cancel anytime", "Direct chat support"]
  createdAt: number,
  updatedAt: number,
}
```

### Updated Tables

#### `clientSubscriptions`

Enhanced to support custom billing periods.

```typescript
{
  clientId: string,
  trainerId: string,
  planId: Id<"trainerPlans">,   // Reference to trainer plan
  billingType: "monthly" | "custom",
  billingMonths: number,        // 1, 3, 6, or 12
  monthlyAmount: number,        // Monthly price at purchase
  totalAmount: number,          // Total for billing period
  discount: number,             // Applied discount
  sessionsPerMonth: number,
  remainingSessions: number,
  totalSessionsInPeriod: number,
  currentPeriodStart: string,
  currentPeriodEnd: string,
  status: "pending" | "active" | "expired" | "cancelled",
  paymentMethod: "offline" | "online",
  paymentStatus: "pending" | "paid",
  autoRenew: boolean,
  // ... timestamps
}
```

## API Changes

### New Convex Functions

#### `trainerPlans.ts`

- `createPlan` - Create a new subscription plan
- `getTrainerPlans` - Get all plans for trainer
- `getVisibleTrainerPlans` - Get client-visible plans
- `getPlanById` - Get plan by ID
- `updatePlan` - Update plan details
- `togglePlanVisibility` - Toggle visibility to clients
- `togglePlanActive` - Toggle accepting subscriptions
- `deletePlan` - Delete plan (only if no active subscriptions)
- `calculatePrice` - Calculate price with discounts for a client

#### Updated `subscriptions.ts`

- `createSubscription` - Now supports custom billing periods
- `getClientSubscriptions` - Returns enriched data with plan names
- `getTrainerSubscriptions` - Returns enriched data with plan/client names
- `approveSubscription` - New function (alias: `markOfflinePaymentPaid`)
- `renewSubscription` - New function (alias: `renewMonthlySubscription`)
- `getTrainerSubscriptionStats` - Dashboard stats

## UI Changes

### Trainer Side

#### `/packages` (Manage Plans)

- Create subscription plans with:
  - Name, description
  - Sessions per month
  - Monthly price & currency
  - Default discount percentage
  - Feature list selection
  - Visibility toggle
- View all plans with:
  - Discount badges
  - Visibility/Active status
  - Session & price info
- Actions: Show/Hide, Enable/Pause, Delete

#### `/subscriptions` (Manage Client Subscriptions)

- Stats: Active, Pending, Total
- Pending requests with approve action
- Active subscriptions with renew/cancel
- Discount badges displayed
- Plan name and billing type shown

### Client Side

#### `/pricing` (Purchase Subscription)

- Trainer info card
- Billing period selector (Monthly, 3/6/12 months)
- Yearly equivalent price display
- Plan cards with:
  - Selection indicator
  - Discount badges ("Save 20%")
  - Strikethrough original price
  - Sessions and features
- Fixed bottom action bar:
  - Price summary
  - Pay Online / Pay Offline buttons

## Discount System

### Priority Order

1. Client-specific discount (from `pricingRules`)
2. Global trainer discount (from `pricingRules`)
3. Plan default discount

### How It Works

- Trainers set discounts in `/pricing-admin`
- Can be for specific clients or all clients
- Automatically applied at checkout
- Shown as badges on plan cards

## Flow

### Trainer Setup

1. Go to "Subscription Plans"
2. Create plan with name, price, sessions, features
3. Set default discount (optional)
4. Toggle visibility when ready

### Client Purchase

1. Go to trainer's pricing page
2. Select billing period (monthly/custom)
3. Select plan
4. Choose payment method
5. Submit request

### Trainer Approval (Offline)

1. See pending request in Subscriptions
2. Review details
3. Click "Approve Subscription"
4. Client can now book sessions

## Backward Compatibility

- Old `packages` table kept for legacy data
- Old subscription fields still work
- New subscriptions use new schema
- Old API functions aliased to new ones
