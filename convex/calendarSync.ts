import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";

const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

async function refreshAccessToken(refreshToken: string) {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error("Missing Google credentials in environment variables");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error_description || "Failed to refresh token");
  }

  return response.json();
}

// Add booking to Google Calendar for trainer (auto-sync)
export const addBookingToTrainerCalendar = action({
  args: {
    bookingId: v.id("bookings"),
    trainerId: v.string(),
    clientId: v.string(),
    date: v.string(),
    startTime: v.string(),
    endTime: v.string(),
    clientName: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ success: boolean; eventId?: string; error?: string }> => {
    try {
      // Get trainer's Google tokens
      const tokens = await ctx.runQuery(api.googleAuth.getGoogleTokens, {
        clerkId: args.trainerId,
      });

      if (!tokens?.accessToken) {
        // Trainer doesn't have Google Calendar connected
        // Send notification to trainer
        await ctx.runMutation(api.notifications.createNotification, {
          userId: args.trainerId,
          type: "booking_created",
          title: "Calendar Sync Failed",
          message: `New booking with ${args.clientName} on ${args.date} at ${args.startTime}. Connect Google Calendar to auto-sync.`,
          bookingId: args.bookingId,
        });
        return { success: false, error: "Google Calendar not connected" };
      }

      let accessToken = tokens.accessToken;

      // Check for expiry (give 5 minute buffer)
      if (tokens.expiryTime && Date.now() > tokens.expiryTime - 300000) {
        console.log("Token expired or expiring soon, refreshing...");
        if (tokens.refreshToken) {
          try {
            const newTokens = await refreshAccessToken(tokens.refreshToken);
            accessToken = newTokens.access_token;

            // Store new tokens
            await ctx.runMutation(api.googleAuth.storeGoogleTokens, {
              clerkId: args.trainerId,
              accessToken: newTokens.access_token,
              refreshToken: tokens.refreshToken, // Keep existing refresh token
              expiresIn: newTokens.expires_in,
            });
          } catch (refreshError) {
            console.error("Failed to refresh token:", refreshError);
            // Continue with old token, might still work if clock skew
          }
        }
      }

      // Create calendar event
      const startDateTime = `${args.date}T${args.startTime}:00`;
      const endDateTime = `${args.date}T${args.endTime}:00`;

      const event = {
        summary: `Training Session with ${args.clientName}`,
        description:
          args.notes || `Personal training session with ${args.clientName}`,
        start: {
          dateTime: startDateTime,
          timeZone: "Europe/Oslo", // Default timezone, should be from trainer's settings
        },
        end: {
          dateTime: endDateTime,
          timeZone: "Europe/Oslo",
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: "popup" as const, minutes: 30 },
            { method: "popup" as const, minutes: 10 },
          ],
        },
      };

      const response: Response = await fetch(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(event),
        },
      );

      if (!response.ok) {
        const error: any = await response.json();
        console.error("Google Calendar API error:", error);

        // Send error notification to trainer
        await ctx.runMutation(api.notifications.createNotification, {
          userId: args.trainerId,
          type: "booking_created",
          title: "Calendar Sync Failed",
          message: `Failed to add booking with ${args.clientName} to your calendar. Please add manually.`,
          bookingId: args.bookingId,
        });

        return {
          success: false,
          error: error.error?.message || "Failed to create calendar event",
        };
      }

      const calendarEvent: any = await response.json();

      // Update booking with calendar event ID
      await ctx.runMutation(api.bookings.updateBookingCalendarEvent, {
        bookingId: args.bookingId,
        googleCalendarEventId: calendarEvent.id,
      });

      // Send success notification to trainer
      await ctx.runMutation(api.notifications.createNotification, {
        userId: args.trainerId,
        type: "booking_created",
        title: "Added to Calendar",
        message: `Session with ${args.clientName} on ${args.date} at ${args.startTime} added to your Google Calendar.`,
        bookingId: args.bookingId,
      });

      return { success: true, eventId: calendarEvent.id };
    } catch (error) {
      console.error("Error adding to calendar:", error);

      // Send error notification to trainer
      await ctx.runMutation(api.notifications.createNotification, {
        userId: args.trainerId,
        type: "booking_created",
        title: "Calendar Sync Error",
        message: `Error syncing booking with ${args.clientName}. Please check your Google Calendar connection.`,
        bookingId: args.bookingId,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

// Add booking to client's Google Calendar (manual)
export const addBookingToClientCalendar = action({
  args: {
    bookingId: v.id("bookings"),
    clientId: v.string(),
    trainerId: v.string(),
    date: v.string(),
    startTime: v.string(),
    endTime: v.string(),
    trainerName: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ success: boolean; eventId?: string; error?: string }> => {
    try {
      // Get client's Google tokens
      const tokens = await ctx.runQuery(api.googleAuth.getGoogleTokens, {
        clerkId: args.clientId,
      });

      if (!tokens?.accessToken) {
        return { success: false, error: "Google Calendar not connected" };
      }

      let accessToken = tokens.accessToken;

      // Check for expiry (give 5 minute buffer)
      if (tokens.expiryTime && Date.now() > tokens.expiryTime - 300000) {
        if (tokens.refreshToken) {
          try {
            const newTokens = await refreshAccessToken(tokens.refreshToken);
            accessToken = newTokens.access_token;

            // Store new tokens
            await ctx.runMutation(api.googleAuth.storeGoogleTokens, {
              clerkId: args.clientId,
              accessToken: newTokens.access_token,
              refreshToken: tokens.refreshToken,
              expiresIn: newTokens.expires_in,
            });
          } catch (e) {
            console.error("Refresh failed", e);
          }
        }
      }

      // Create calendar event
      const startDateTime = `${args.date}T${args.startTime}:00`;
      const endDateTime = `${args.date}T${args.endTime}:00`;

      const event = {
        summary: `Training Session with ${args.trainerName}`,
        description:
          args.notes || `Personal training session with ${args.trainerName}`,
        start: {
          dateTime: startDateTime,
          timeZone: "Europe/Oslo",
        },
        end: {
          dateTime: endDateTime,
          timeZone: "Europe/Oslo",
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: "popup" as const, minutes: 30 },
            { method: "popup" as const, minutes: 10 },
          ],
        },
      };

      const response: Response = await fetch(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(event),
        },
      );

      if (!response.ok) {
        const error: any = await response.json();
        console.error("Google Calendar API error:", error);
        return {
          success: false,
          error: error.error?.message || "Failed to create calendar event",
        };
      }

      const calendarEvent: any = await response.json();

      // Send success notification to client
      await ctx.runMutation(api.notifications.createNotification, {
        userId: args.clientId,
        type: "booking_created",
        title: "Added to Calendar",
        message: `Session with ${args.trainerName} on ${args.date} at ${args.startTime} added to your Google Calendar.`,
        bookingId: args.bookingId,
      });

      return { success: true, eventId: calendarEvent.id };
    } catch (error) {
      console.error("Error adding to calendar:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});
