import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get available time slots for a trainer on a specific date
export const getAvailableSlots = query({
  args: {
    trainerId: v.string(),
    date: v.string(),
    duration: v.number(),
  },
  handler: async (ctx, args) => {
    // Validate duration
    if (args.duration !== 45 && args.duration !== 60) {
      throw new Error("Invalid duration. Only 45 minutes and 1 hour sessions are supported.");
    }

    // Get day of week from date in GMT+1
    const dateObj = new Date(args.date + "T00:00:00+01:00");
    const dayOfWeek = dateObj.getUTCDay();

    // Get trainer's availability for this day
    const availability = await ctx.db
      .query("availability")
      .withIndex("by_trainer", (q) => q.eq("trainerId", args.trainerId))
      .filter((q) => q.eq(q.field("dayOfWeek"), dayOfWeek))
      .first();

    if (!availability || !availability.enabled) {
      return [];
    }

    // Get existing bookings for this date (exclude cancelled)
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_trainer", (q) => q.eq("trainerId", args.trainerId))
      .filter((q) => q.eq(q.field("date"), args.date))
      .filter((q) => q.neq(q.field("status"), "cancelled"))
      .collect();

    // Check if date is today to filter past times (in GMT+1)
    const now = new Date();
    const gmtPlus1Now = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Paris" }));
    const todayGMT1 = new Date(gmtPlus1Now.getFullYear(), gmtPlus1Now.getMonth(), gmtPlus1Now.getDate());
    const targetDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
    const isToday = todayGMT1.getTime() === targetDate.getTime();
    const currentTimeMinutes = isToday ? gmtPlus1Now.getHours() * 60 + gmtPlus1Now.getMinutes() : 0;

    // Handle both old schema (startTime/endTime) and new schema (timeRanges)
    let timeRanges: Array<{ startTime: string; endTime: string }> = [];
    
    if (availability.timeRanges && availability.timeRanges.length > 0) {
      timeRanges = availability.timeRanges;
    } else if ((availability as any).startTime && (availability as any).endTime) {
      // Fallback for old schema
      timeRanges = [{ 
        startTime: (availability as any).startTime, 
        endTime: (availability as any).endTime 
      }];
    } else {
      return [];
    }

    // Generate time slots for all time ranges
    const allSlots: string[] = [];
    for (const range of timeRanges) {
      const slots = generateTimeSlots(
        range.startTime,
        range.endTime,
        args.duration,
        availability.breaks,
        bookings,
        isToday ? currentTimeMinutes : null
      );
      allSlots.push(...slots);
    }

    // Sort slots by time
    return allSlots.sort((a, b) => {
      const [aHour, aMin] = a.split(':').map(Number);
      const [bHour, bMin] = b.split(':').map(Number);
      return (aHour * 60 + aMin) - (bHour * 60 + bMin);
    });
  },
});

// Create a booking
export const createBooking = mutation({
  args: {
    trainerId: v.string(),
    clientId: v.string(),
    date: v.string(),
    startTime: v.string(),
    duration: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Validate duration
    if (args.duration !== 45 && args.duration !== 60) {
      throw new Error("Invalid duration. Only 45 minutes and 1 hour sessions are supported.");
    }

    const endTime = addMinutesToTime(args.startTime, args.duration);
    const now = Date.now();

    // Check if slot is still available (prevent race conditions)
    const existingBookings = await ctx.db
      .query("bookings")
      .withIndex("by_trainer", (q) => q.eq("trainerId", args.trainerId))
      .filter((q) => q.eq(q.field("date"), args.date))
      .filter((q) => q.neq(q.field("status"), "cancelled"))
      .collect();

    const hasConflict = existingBookings.some((booking) => {
      const bookingStart = timeToMinutes(booking.startTime);
      const bookingEnd = timeToMinutes(booking.endTime);
      const newStart = timeToMinutes(args.startTime);
      const newEnd = timeToMinutes(endTime);

      // Check for any overlap greater than 5 minutes
      const overlapStart = Math.max(newStart, bookingStart);
      const overlapEnd = Math.min(newEnd, bookingEnd);
      const overlapDuration = Math.max(0, overlapEnd - overlapStart);

      // Only consider it a conflict if overlap is more than 5 minutes
      return overlapDuration > 5;
    });

    if (hasConflict) {
      throw new Error("This time slot is no longer available (conflicts with existing booking)");
    }

    const bookingId = await ctx.db.insert("bookings", {
      trainerId: args.trainerId,
      clientId: args.clientId,
      date: args.date,
      startTime: args.startTime,
      endTime,
      duration: args.duration,
      status: "confirmed",
      notes: args.notes,
      sessionDeducted: false,
      createdAt: now,
      updatedAt: now,
    });

    // Get trainer and client info for notifications
    const trainer = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.trainerId))
      .first();

    const client = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clientId))
      .first();

    // Create notification for trainer
    await ctx.db.insert("notifications", {
      userId: args.trainerId,
      type: "booking_created",
      title: "New Booking",
      message: `${client?.fullName || "A client"} booked a session on ${args.date} at ${args.startTime}`,
      bookingId,
      read: false,
      createdAt: now,
    });

    // Create notification for client
    await ctx.db.insert("notifications", {
      userId: args.clientId,
      type: "booking_created",
      title: "Booking Confirmed",
      message: `Your session with ${trainer?.fullName || "trainer"} on ${args.date} at ${args.startTime} is confirmed`,
      bookingId,
      read: false,
      createdAt: now,
    });

    return bookingId;
  },
});

// Get bookings for a trainer
export const getTrainerBookings = query({
  args: { trainerId: v.string() },
  handler: async (ctx, args) => {
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_trainer", (q) => q.eq("trainerId", args.trainerId))
      .collect();
    return bookings;
  },
});

// Get bookings for a client
export const getClientBookings = query({
  args: { clientId: v.string() },
  handler: async (ctx, args) => {
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();
    return bookings;
  },
});

// Helper functions
function generateTimeSlots(
  startTime: string,
  endTime: string,
  duration: number,
  breaks: Array<{ startTime: string; endTime: string }>,
  bookings: Array<{ startTime: string; endTime: string }>,
  currentTimeMinutes: number | null = null
): string[] {
  const slots: string[] = [];
  let currentTime = startTime;

  while (timeToMinutes(currentTime) + duration <= timeToMinutes(endTime)) {
    const slotEnd = addMinutesToTime(currentTime, duration);
    const slotStart = timeToMinutes(currentTime);
    const slotEndMinutes = timeToMinutes(slotEnd);

    // Skip past time slots if checking for today
    if (currentTimeMinutes !== null && slotStart < currentTimeMinutes) {
      currentTime = addMinutesToTime(currentTime, duration);
      continue;
    }

    // Check if slot overlaps with breaks (any overlap at all)
    const overlapsBreak = breaks.some((br) => {
      const breakStart = timeToMinutes(br.startTime);
      const breakEnd = timeToMinutes(br.endTime);

      return (
        (slotStart >= breakStart && slotStart < breakEnd) ||
        (slotEndMinutes > breakStart && slotEndMinutes <= breakEnd) ||
        (slotStart <= breakStart && slotEndMinutes >= breakEnd)
      );
    });

    // Check if slot overlaps with bookings (any overlap at all)
    // Check if slot overlaps with bookings (allow <= 5 min overlap)
    const overlapsBooking = bookings.some((booking) => {
      const bookingStart = timeToMinutes(booking.startTime);
      const bookingEnd = timeToMinutes(booking.endTime);

      const overlapStart = Math.max(slotStart, bookingStart);
      const overlapEnd = Math.min(slotEndMinutes, bookingEnd);
      const overlapDuration = Math.max(0, overlapEnd - overlapStart);

      // Only consider it a conflict if overlap is more than 5 minutes
      return overlapDuration > 5;
    });

    if (!overlapsBreak && !overlapsBooking) {
      slots.push(currentTime);
    }

    // Move to next slot (no gaps, continuous slots)
    currentTime = addMinutesToTime(currentTime, duration);
  }

  return slots;
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function addMinutesToTime(time: string, minutes: number): string {
  const totalMinutes = timeToMinutes(time) + minutes;
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

// Update booking with Google Calendar event ID
export const updateBookingCalendarEvent = mutation({
  args: {
    bookingId: v.id("bookings"),
    googleCalendarEventId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.bookingId, {
      googleCalendarEventId: args.googleCalendarEventId,
      updatedAt: Date.now(),
    });
  },
});

// Get booking by ID
export const getBookingById = query({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.bookingId);
  },
});

// Mark session as completed and deduct from subscription
export const completeSession = mutation({
  args: { 
    bookingId: v.id("bookings"),
  },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    
    if (!booking) {
      throw new Error("Booking not found");
    }

    if (booking.status === "completed") {
      throw new Error("Session already completed");
    }

    // Find active subscription for this client-trainer pair
    const subscriptions = await ctx.db
      .query("clientSubscriptions")
      .withIndex("by_client_trainer", (q) => 
        q.eq("clientId", booking.clientId).eq("trainerId", booking.trainerId)
      )
      .collect();

    const activeSubscription = subscriptions.find(sub => 
      sub.status === "active" && 
      sub.remainingSessions > 0 &&
      (sub.endDate ? new Date(sub.endDate) >= new Date() : true)
    );

    if (!activeSubscription) {
      throw new Error("No active subscription found. Client needs to purchase a package.");
    }

    // Deduct session
    const newRemaining = activeSubscription.remainingSessions - 1;
    const newStatus = newRemaining === 0 ? "expired" : activeSubscription.status;

    await ctx.db.patch(activeSubscription._id, {
      remainingSessions: newRemaining,
      status: newStatus as any,
      updatedAt: Date.now(),
    });

    // Update booking
    await ctx.db.patch(args.bookingId, {
      status: "completed",
      subscriptionId: activeSubscription._id,
      sessionDeducted: true,
      updatedAt: Date.now(),
    });

    // Create notification for client
    const client = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", booking.clientId))
      .first();

    await ctx.db.insert("notifications", {
      userId: booking.clientId,
      type: "booking_created",
      title: "Session Completed",
      message: `Session completed! ${newRemaining} sessions remaining in your package.`,
      bookingId: args.bookingId,
      read: false,
      createdAt: Date.now(),
    });

    return {
      remainingSessions: newRemaining,
      subscriptionStatus: newStatus,
    };
  },
});

// Cancel booking
export const cancelBooking = mutation({
  args: { 
    bookingId: v.id("bookings"),
    cancelledBy: v.string(), // clerkId of who cancelled
  },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    
    if (!booking) {
      throw new Error("Booking not found");
    }

    if (booking.status === "cancelled") {
      throw new Error("Booking already cancelled");
    }

    // If session was already deducted, refund it
    if (booking.sessionDeducted && booking.subscriptionId) {
      const subscription = await ctx.db.get(booking.subscriptionId);
      if (subscription) {
        await ctx.db.patch(booking.subscriptionId, {
          remainingSessions: subscription.remainingSessions + 1,
          status: "active",
          updatedAt: Date.now(),
        });
      }
    }

    await ctx.db.patch(args.bookingId, {
      status: "cancelled",
      updatedAt: Date.now(),
    });

    // Notify both parties
    const trainer = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", booking.trainerId))
      .first();

    const client = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", booking.clientId))
      .first();

    const now = Date.now();

    await ctx.db.insert("notifications", {
      userId: booking.trainerId,
      type: "booking_cancelled",
      title: "Booking Cancelled",
      message: `${client?.fullName || "Client"} cancelled the session on ${booking.date} at ${booking.startTime}`,
      bookingId: args.bookingId,
      read: false,
      createdAt: now,
    });

    await ctx.db.insert("notifications", {
      userId: booking.clientId,
      type: "booking_cancelled",
      title: "Booking Cancelled",
      message: `Your session with ${trainer?.fullName || "trainer"} on ${booking.date} at ${booking.startTime} has been cancelled`,
      bookingId: args.bookingId,
      read: false,
      createdAt: now,
    });
  },
});

// Request cancellation (client-initiated, requires trainer approval)
export const requestCancellation = mutation({
  args: {
    bookingId: v.id("bookings"),
    requestedBy: v.string(), // clerkId of client
  },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    
    if (!booking) {
      throw new Error("Booking not found");
    }

    if (booking.status === "cancelled") {
      throw new Error("Booking already cancelled");
    }

    if (booking.status === "cancellation_requested") {
      throw new Error("Cancellation already requested");
    }

    const now = Date.now();

    await ctx.db.patch(args.bookingId, {
      status: "cancellation_requested",
      cancellationRequestedBy: args.requestedBy,
      cancellationRequestedAt: now,
      updatedAt: now,
    });

    // Get client and trainer info
    const client = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", booking.clientId))
      .first();

    const trainer = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", booking.trainerId))
      .first();

    // Notify trainer about cancellation request
    await ctx.db.insert("notifications", {
      userId: booking.trainerId,
      type: "booking_cancelled",
      title: "Cancellation Request",
      message: `${client?.fullName || "Client"} requested to cancel session on ${booking.date} at ${booking.startTime}`,
      bookingId: args.bookingId,
      read: false,
      createdAt: now,
    });

    // Notify client that request was sent
    await ctx.db.insert("notifications", {
      userId: booking.clientId,
      type: "booking_cancelled",
      title: "Cancellation Requested",
      message: `Your cancellation request for ${booking.date} at ${booking.startTime} is pending trainer approval`,
      bookingId: args.bookingId,
      read: false,
      createdAt: now,
    });
  },
});

// Approve cancellation (trainer approves client's cancellation request)
export const approveCancellation = mutation({
  args: {
    bookingId: v.id("bookings"),
    approvedBy: v.string(), // clerkId of trainer
  },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    
    if (!booking) {
      throw new Error("Booking not found");
    }

    if (booking.status !== "cancellation_requested") {
      throw new Error("No cancellation request to approve");
    }

    const now = Date.now();

    // Find active subscription for this client-trainer pair
    const subscriptions = await ctx.db
      .query("clientSubscriptions")
      .withIndex("by_client_trainer", (q) => 
        q.eq("clientId", booking.clientId).eq("trainerId", booking.trainerId)
      )
      .collect();

    const activeSubscription = subscriptions.find(sub => 
      sub.status === "active" && 
      new Date(sub.currentPeriodEnd || sub.endDate || "") >= new Date()
    );

    // Return session to subscription
    if (activeSubscription) {
      await ctx.db.patch(activeSubscription._id, {
        remainingSessions: activeSubscription.remainingSessions + 1,
        updatedAt: now,
      });
    }

    // Update booking status
    await ctx.db.patch(args.bookingId, {
      status: "cancelled",
      updatedAt: now,
    });

    // Get client and trainer info
    const client = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", booking.clientId))
      .first();

    const trainer = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", booking.trainerId))
      .first();

    // Notify client that cancellation was approved
    await ctx.db.insert("notifications", {
      userId: booking.clientId,
      type: "booking_cancelled",
      title: "Cancellation Approved",
      message: `Your session on ${booking.date} at ${booking.startTime} has been cancelled. 1 session returned to your package.`,
      bookingId: args.bookingId,
      read: false,
      createdAt: now,
    });

    // Notify trainer
    await ctx.db.insert("notifications", {
      userId: booking.trainerId,
      type: "booking_cancelled",
      title: "Cancellation Approved",
      message: `Session with ${client?.fullName || "client"} on ${booking.date} at ${booking.startTime} has been cancelled`,
      bookingId: args.bookingId,
      read: false,
      createdAt: now,
    });
  },
});

// Reject cancellation (trainer rejects client's cancellation request)
export const rejectCancellation = mutation({
  args: {
    bookingId: v.id("bookings"),
    rejectedBy: v.string(), // clerkId of trainer
  },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    
    if (!booking) {
      throw new Error("Booking not found");
    }

    if (booking.status !== "cancellation_requested") {
      throw new Error("No cancellation request to reject");
    }

    const now = Date.now();

    // Revert to confirmed status
    await ctx.db.patch(args.bookingId, {
      status: "confirmed",
      cancellationRequestedBy: undefined,
      cancellationRequestedAt: undefined,
      updatedAt: now,
    });

    // Get client info
    const client = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", booking.clientId))
      .first();

    // Notify client that cancellation was rejected
    await ctx.db.insert("notifications", {
      userId: booking.clientId,
      type: "booking_cancelled",
      title: "Cancellation Declined",
      message: `Your cancellation request for ${booking.date} at ${booking.startTime} was declined by your trainer`,
      bookingId: args.bookingId,
      read: false,
      createdAt: now,
    });
  },
});

// Update booking to link with subscription
export const linkBookingToSubscription = mutation({
  args: {
    bookingId: v.id("bookings"),
    subscriptionId: v.id("clientSubscriptions"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.bookingId, {
      subscriptionId: args.subscriptionId,
      sessionDeducted: false,
      updatedAt: Date.now(),
    });
  },
});
