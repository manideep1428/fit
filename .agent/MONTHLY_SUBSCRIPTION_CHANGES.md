# Monthly Subscription System Changes

## Overview
Converted the trainer package system from one-time purchases to monthly recurring subscriptions with currency-based pricing.

## Key Changes

### 1. Schema Updates (convex/schema.ts)
- **packages table**: Changed from one-time packages to monthly subscriptions
  - `amount` → `monthlyAmount` (monthly subscription price)
  - `sessions` → `sessionsPerMonth` (sessions per month)
  - Removed `durationMonths` (now always monthly)
  
- **clientSubscriptions table**: Updated for monthly recurring model
  - `totalSessions` → `sessionsPerMonth` (sessions allocated per month)
  - `startDate/endDate` → `currentPeriodStart/currentPeriodEnd` (current billing period)
  - `finalAmount` → `monthlyAmount` (monthly recurring amount)
  - Added `autoRenew` field for automatic monthly renewal

### 2. Package Management (convex/packages.ts)
- Updated `createPackage` mutation to use `monthlyAmount` and `sessionsPerMonth`
- Simplified `getTrainerPackages` query (removed old package filtering)
- Updated `updatePackage` mutation with new field names
- Updated `getActiveTrainerPackages` query

### 3. Subscription Management (convex/subscriptions.ts)
- **createSubscription**: Now creates monthly subscriptions
  - Sets billing period to 1 month
  - Includes `autoRenew` option
  - Updated notifications to reflect monthly model
  
- **deductSession**: Updated for monthly sessions
  - Sessions reset monthly instead of expiring permanently
  - Updated notifications to mention "this month"
  - Removed package expiration logic (subscriptions renew monthly)
  
- **renewMonthlySubscription**: New mutation to handle monthly renewals
  - Resets sessions for new billing period
  - Updates period start/end dates
  - Sends renewal notifications to both client and trainer

- Removed `addSessionsToSubscription` (replaced by monthly renewal)

### 4. Pricing Rules (convex/pricingRules.ts)
- Fixed `calculateFinalPrice` query error
- Now properly calculates discount inline instead of calling another query

### 5. Trainer Package Screen (app/(trainer)/packages.tsx)
- Updated state variables: `amount` → `monthlyAmount`, `sessions` → `sessionsPerMonth`
- Removed `durationMonths` field
- Updated UI to show "Sessions/Month" and "Per Month" labels
- Changed modal title to "Create Monthly Package"
- Updated form fields and placeholders

### 6. Trainer Setup (app/(auth)/trainer-setup.tsx)
- Updated package state type with new field names
- Changed validation to check `sessionsPerMonth` and `monthlyAmount`
- Updated package creation to use new field names
- Changed UI text to "Monthly Packages" and "Monthly subscription packages"
- Updated form fields to show "Sessions Per Month" and "Monthly Amount"

### 7. Client Pricing Screen (app/(client)/pricing.tsx)
- Updated subscription creation to use monthly model
- Changed purchase confirmation to show "/month" pricing
- Updated UI to show "Sessions/Month" and "Monthly Renewal" indicators
- Changed button text to "Subscribe - Pay Offline/Online"
- Updated pricing display to show monthly amounts
- Changed header to "Monthly Packages"

## Benefits of Monthly Subscription Model

1. **Predictable Revenue**: Trainers get recurring monthly income
2. **Flexibility**: Clients can cancel or continue month-to-month
3. **Automatic Renewal**: Sessions reset automatically each month
4. **Better Cash Flow**: Regular monthly payments instead of large upfront costs
5. **Simpler Management**: No need to track total package duration
6. **Currency-Based**: Clear pricing in INR or other currencies

## Notifications Updated

- Subscription creation: Now mentions "monthly subscription" and "sessions per month"
- Session completion: Shows "remaining this month" instead of total remaining
- Low sessions warning: Mentions auto-renewal status
- Removed package expiration notifications (subscriptions renew monthly)
- Added renewal notifications for monthly billing cycles

## Next Steps for Implementation

1. **Auto-Renewal Logic**: Implement scheduled job to auto-renew subscriptions at period end
2. **Payment Processing**: Integrate payment gateway for automatic monthly billing
3. **Subscription Management**: Add client UI to manage auto-renewal settings
4. **Billing History**: Track monthly payment history per subscription
5. **Proration**: Handle mid-month subscription changes
6. **Grace Period**: Add grace period for failed payments before cancellation
