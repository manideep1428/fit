import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a payment request
export const createPaymentRequest = mutation({
  args: {
    trainerId: v.string(),
    clientId: v.string(),
    amount: v.number(),
    currency: v.string(),
    description: v.string(),
    sessionDate: v.optional(v.string()),
    bookingId: v.optional(v.id("bookings")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    return await ctx.db.insert("paymentRequests", {
      trainerId: args.trainerId,
      clientId: args.clientId,
      amount: args.amount,
      currency: args.currency,
      description: args.description,
      sessionDate: args.sessionDate,
      bookingId: args.bookingId,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Get payment requests for a trainer
export const getTrainerPaymentRequests = query({
  args: { trainerId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("paymentRequests")
      .withIndex("by_trainer", (q) => q.eq("trainerId", args.trainerId))
      .order("desc")
      .collect();
  },
});

// Get payment requests for a client
export const getClientPaymentRequests = query({
  args: { clientId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("paymentRequests")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .order("desc")
      .collect();
  },
});

// Get pending payment requests for a client
export const getPendingClientPaymentRequests = query({
  args: { clientId: v.string() },
  handler: async (ctx, args) => {
    const requests = await ctx.db
      .query("paymentRequests")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();
    
    return requests.filter((req) => req.status === "pending");
  },
});

// Mark payment request as paid
export const markPaymentAsPaid = mutation({
  args: { paymentRequestId: v.id("paymentRequests") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.paymentRequestId, {
      status: "paid",
      paidAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Cancel payment request
export const cancelPaymentRequest = mutation({
  args: { paymentRequestId: v.id("paymentRequests") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.paymentRequestId, {
      status: "cancelled",
      updatedAt: Date.now(),
    });
  },
});

// Get payment request by ID
export const getPaymentRequestById = query({
  args: { paymentRequestId: v.id("paymentRequests") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.paymentRequestId);
  },
});
