// Google Calendar API utilities
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useUser } from '@clerk/clerk-expo';

export interface CalendarEvent {
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: 'email' | 'popup';
      minutes: number;
    }>;
  };
}

export class GoogleCalendarService {
  private accessToken: string;
  private refreshToken?: string;
  private expiryTime?: number;

  constructor(accessToken: string, refreshToken?: string, expiryTime?: number) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.expiryTime = expiryTime;
  }

  private async ensureValidToken(): Promise<string> {
    // Check if token is expired or about to expire (within 5 minutes)
    if (this.expiryTime && Date.now() >= this.expiryTime - 5 * 60 * 1000) {
      if (this.refreshToken) {
        // Refresh the token
        const newToken = await this.refreshAccessToken();
        return newToken;
      }
      throw new Error('Token expired and no refresh token available');
    }
    return this.accessToken;
  }

  private async refreshAccessToken(): Promise<string> {
    // This would need to be implemented with your backend
    // For now, throw an error to indicate re-authentication is needed
    throw new Error('Token refresh not implemented - please reconnect Google Calendar');
  }

  async createEvent(event: CalendarEvent): Promise<any> {
    try {
      const token = await this.ensureValidToken();
      const response = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to create calendar event');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating calendar event:', error);
      throw error;
    }
  }

  async deleteEvent(eventId: string): Promise<void> {
    try {
      const token = await this.ensureValidToken();
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete calendar event');
      }
    } catch (error) {
      console.error('Error deleting calendar event:', error);
      throw error;
    }
  }

  async updateEvent(eventId: string, event: CalendarEvent): Promise<any> {
    try {
      const token = await this.ensureValidToken();
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update calendar event');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating calendar event:', error);
      throw error;
    }
  }
}

// Hook to get Google Calendar service with stored tokens
export const useGoogleCalendar = () => {
  const { user } = useUser();
  const tokens = useQuery(
    api.googleAuth.getGoogleTokens,
    user?.id ? { clerkId: user.id } : "skip"
  );

  const getCalendarService = async (): Promise<GoogleCalendarService | null> => {
    try {
      if (!tokens?.accessToken) {
        console.log('No Google Calendar tokens found');
        return null;
      }
      
      return new GoogleCalendarService(
        tokens.accessToken,
        tokens.refreshToken,
        tokens.expiryTime
      );
    } catch (error) {
      console.error('Error getting calendar service:', error);
      return null;
    }
  };

  const isConnected = !!tokens?.accessToken;

  return { getCalendarService, isConnected };
};

// Helper to format booking data for Google Calendar
export const formatBookingForCalendar = (
  booking: {
    date: string;
    startTime: string;
    endTime: string;
    trainerName?: string;
    notes?: string;
  },
  timeZone: string = 'America/New_York'
): CalendarEvent => {
  const startDateTime = `${booking.date}T${booking.startTime}:00`;
  const endDateTime = `${booking.date}T${booking.endTime}:00`;

  return {
    summary: `Training Session with ${booking.trainerName || 'Trainer'}`,
    description: booking.notes || 'Personal training session',
    start: {
      dateTime: startDateTime,
      timeZone,
    },
    end: {
      dateTime: endDateTime,
      timeZone,
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 30 },
        { method: 'popup', minutes: 10 },
      ],
    },
  };
};
