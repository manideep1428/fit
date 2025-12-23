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

    // Get day of week from date
    const dateObj = new Date(args.date);
    const dayOfWeek = dateObj.getDay();

    // Get trainer's availability for this day
    const availability = await ctx.db
      .query("availability")
      .withIndex("by_trainer", (q) => q.eq("trainerId", args.trainerId))
      .filter((q) => q.eq(q.field("dayOfWeek"), dayOfWeek))
      .first();

    if (!availability || !availability.enabled) {
      return [];
    }

    // Get existing bookings for this date
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_trainer", (q) => q.eq("trainerId", args.trainerId))
      .filter((q) => q.eq(q.field("date"), args.date))
      .filter((q) => q.neq(q.field("status"), "cancelled"))
      .collect();

    // Generate time slots
    const slots = generateTimeSlots(
      availability.startTime,
      availability.endTime,
      args.duration,
      availability.breaks,
      bookings
    );

    return slots;
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
  bookings: Array<{ startTime: string; endTime: string }>
): string[] {
  const slots: string[] = [];
  let currentTime = startTime;

  while (timeToMinutes(currentTime) + duration <= timeToMinutes(endTime)) {
    const slotEnd = addMinutesToTime(currentTime, duration);
    const slotStart = timeToMinutes(currentTime);
    const slotEndMinutes = timeToMinutes(slotEnd);

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
      new Date(sub.endDate) >= new Date()
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
