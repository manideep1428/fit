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

      // Check for any overlap
      return (
        (newStart >= bookingStart && newStart < bookingEnd) ||
        (newEnd > bookingStart && newEnd <= bookingEnd) ||
        (newStart <= bookingStart && newEnd >= bookingEnd)
      );
    });

    if (hasConflict) {
      throw new Error("This time slot is no longer available");
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
    const overlapsBooking = bookings.some((booking) => {
      const bookingStart = timeToMinutes(booking.startTime);
      const bookingEnd = timeToMinutes(booking.endTime);
      
      return (
        (slotStart >= bookingStart && slotStart < bookingEnd) ||
        (slotEndMinutes > bookingStart && slotEndMinutes <= bookingEnd) ||
        (slotStart <= bookingStart && slotEndMinutes >= bookingEnd)
      );
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
