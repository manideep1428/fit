# Notification System - Package Lifecycle

## Overview

Comprehensive notification system that keeps both trainers and clients informed about subscription/package lifecycle events.

## Notification Types Added

### 1. **Subscription Created** (`subscription_created`)

**Triggered when:** Client purchases a package

**Notifications sent:**

#### To Trainer:

- **Title:** "New Subscription Purchase! 🎉"
- **Message:** "[Client Name] purchased [Package Name] - X sessions (Offline payment pending / Paid online)"
- **Purpose:** Inform trainer of new revenue and client commitment

#### To Client:

- **Title:** "Subscription Activated! ✅"
- **Message:** "Your [Package Name] with [Trainer Name] is now active. You have X sessions until [End Date]."
- **Purpose:** Confirm purchase and provide package details

**Location:** `convex/subscriptions.ts` - `createSubscription` mutation

---

### 2. **Session Completed** (`session_completed`)

**Triggered when:** Trainer marks a session as complete (session deducted)

**Notifications sent:**

#### To Client:

- **Title:** "Session Completed! ✅"
- **Message:** "Session completed successfully. X session(s) remaining in your [Package Name]."
- **Purpose:** Confirm session completion and show remaining balance

#### To Trainer:

- **Title:** "Session Completed"
- **Message:** "Session with [Client Name] completed. They have X session(s) remaining."
- **Purpose:** Track session completion and client's remaining balance

**Location:** `convex/subscriptions.ts` - `deductSession` mutation

---

### 3. **Package Ending Soon** (`subscription_ending`)

**Triggered when:** Session deduction leaves ≤3 sessions remaining

**Notifications sent:**

#### To Client:

- **Title:** "Package Ending Soon! ⚠️"
- **Message:** "Only X session(s) remaining in your [Package Name]. Consider renewing to continue your training!"
- **Purpose:** Encourage renewal before package expires

#### To Trainer:

- **Title:** "Client Package Ending"
- **Message:** "[Client Name] has only X session(s) remaining. Consider reaching out about renewal."
- **Purpose:** Prompt trainer to discuss renewal with client

**Trigger Condition:** `newRemaining > 0 && newRemaining <= 3`

**Location:** `convex/subscriptions.ts` - `deductSession` mutation

---

### 4. **Package Expired** (`subscription_expired`)

**Triggered when:** Last session is deducted (0 sessions remaining)

**Notifications sent:**

#### To Client:

- **Title:** "Package Expired 📦"
- **Message:** "Your [Package Name] with [Trainer Name] has expired. Purchase a new package to continue training!"
- **Purpose:** Inform about expiration and encourage repurchase

#### To Trainer:

- **Title:** "Client Package Expired"
- **Message:** "[Client Name]'s package has expired. Reach out to discuss renewal options."
- **Purpose:** Alert trainer to follow up with client for renewal

**Trigger Condition:** `newRemaining === 0`

**Location:** `convex/subscriptions.ts` - `deductSession` mutation

---

## Implementation Details

### Schema Updates

**File:** `convex/schema.ts`

Added new notification types to the union:

```typescript
type: v.union(
  v.literal("booking_created"),
  v.literal("booking_cancelled"),
  v.literal("booking_reminder"),
  v.literal("trainer_added"),
  v.literal("subscription_created"),    // NEW
  v.literal("session_completed"),       // NEW
  v.literal("subscription_ending"),     // NEW
  v.literal("subscription_expired")     // NEW
),
```

### Notification Flow

#### 1. Subscription Purchase Flow

```
Client purchases package
    ↓
createSubscription mutation
    ↓
Insert subscription record
    ↓
Get package, client, trainer details
    ↓
Create notification for trainer (purchase alert)
    ↓
Create notification for client (confirmation)
```

#### 2. Session Completion Flow

```
Trainer marks session complete
    ↓
deductSession mutation
    ↓
Deduct 1 session from remainingSessions
    ↓
Get package, client, trainer details
    ↓
Create notifications for both (session completed)
    ↓
Check remaining sessions count
    ↓
If ≤3 sessions: Create "ending soon" notifications
    ↓
If 0 sessions: Create "expired" notifications
```

### Data Retrieved for Notifications

For each notification, we fetch:

- **Package details:** `packageDetails = await ctx.db.get(subscription.packageId)`
- **Client info:** Query users table by `clerkId`
- **Trainer info:** Query users table by `clerkId`

This ensures personalized, informative notifications with names and package details.

## User Experience

### For Clients

**Journey:**

1. **Purchase Package** → Get confirmation notification
2. **Complete Session** → Get completion notification with remaining count
3. **3 Sessions Left** → Get warning to renew
4. **2 Sessions Left** → Get another warning
5. **1 Session Left** → Get final warning
6. **0 Sessions** → Get expiration notice

**Benefits:**

- Always know remaining session count
- Advance warning before expiration
- Clear call-to-action for renewal

### For Trainers

**Journey:**

1. **Client Purchases** → Get purchase notification
2. **Complete Session** → Get confirmation with client's remaining count
3. **Client has ≤3 Sessions** → Get reminder to discuss renewal
4. **Client Package Expires** → Get alert to follow up

**Benefits:**

- Track all subscription purchases
- Monitor client session usage
- Proactive renewal opportunities
- Better client retention

## Notification Message Templates

### Dynamic Elements

All messages include:

- ✅ Client/Trainer names (fallback to "Client"/"Trainer")
- ✅ Package names (fallback to "package")
- ✅ Session counts with proper pluralization
- ✅ Dates formatted for readability
- ✅ Payment method information
- ✅ Emojis for visual appeal

### Pluralization

Messages handle singular/plural correctly:

```typescript
`${newRemaining} session${newRemaining !== 1 ? "s" : ""} remaining`;
```

- 1 session remaining ✓
- 2 sessions remaining ✓

## Testing Scenarios

### 1. Test Subscription Creation

- [ ] Purchase package with offline payment
- [ ] Purchase package with online payment
- [ ] Verify trainer receives purchase notification
- [ ] Verify client receives confirmation notification
- [ ] Check notification includes correct package name and session count

### 2. Test Session Completion

- [ ] Complete a session (>3 sessions remaining)
- [ ] Verify both parties receive completion notification
- [ ] Check remaining count is correct
- [ ] Verify no "ending soon" notification

### 3. Test Package Ending Warnings

- [ ] Complete session when 4 sessions remain
- [ ] Verify "ending soon" notifications sent
- [ ] Complete another session (3 → 2)
- [ ] Verify another warning sent
- [ ] Continue until 1 session
- [ ] Verify warnings at each step

### 4. Test Package Expiration

- [ ] Complete final session (1 → 0)
- [ ] Verify "expired" notifications sent to both
- [ ] Check subscription status changed to "expired"
- [ ] Verify messages encourage renewal

## Future Enhancements

1. **Email Notifications**: Send email in addition to in-app notifications
2. **Push Notifications**: Mobile push notifications for critical events
3. **Notification Preferences**: Let users customize which notifications they receive
4. **Notification History**: Archive of all past notifications
5. **Bulk Actions**: Mark all as read, delete all, etc.
6. **Notification Grouping**: Group related notifications
7. **Smart Timing**: Send renewal reminders at optimal times
8. **A/B Testing**: Test different message formats for better engagement
9. **Analytics**: Track notification open rates and conversion

## Integration Points

### Current Integration

- ✅ `convex/subscriptions.ts` - createSubscription
- ✅ `convex/subscriptions.ts` - deductSession
- ✅ `convex/schema.ts` - notification types

### Future Integration

- ⏳ `convex/bookings.ts` - completeSession (already calls deductSession)
- ⏳ Push notification service
- ⏳ Email service
- ⏳ SMS service (optional)

## Performance Considerations

- **Batch Notifications**: Currently creates notifications individually
- **Optimization**: Could batch multiple notification inserts
- **Indexing**: Notifications indexed by userId and read status for fast queries
- **Cleanup**: Consider archiving old notifications after 30-90 days

## Error Handling

All notification creation is wrapped in try-catch blocks (implicit in Convex):

- If notification creation fails, it won't block the main operation
- Errors are logged but don't prevent subscription/session operations
- Ensures core functionality remains reliable

## Summary

This notification system provides:

- ✅ Real-time updates on subscription lifecycle
- ✅ Proactive renewal reminders
- ✅ Clear communication between trainers and clients
- ✅ Better client retention through timely engagement
- ✅ Revenue protection through renewal prompts
- ✅ Professional, personalized messaging
