// Google Calendar API utilities
import { useAuth } from '@clerk/clerk-expo';

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

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  async createEvent(event: CalendarEvent): Promise<any> {
    try {
      const response = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
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
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
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
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
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

// Hook to get Google Calendar service
export const useGoogleCalendar = () => {
  const { getToken } = useAuth();

  const getCalendarService = async (): Promise<GoogleCalendarService | null> => {
    try {
      const token = await getToken({ template: 'integration_google' });
      if (!token) {
        return null;
      }
      return new GoogleCalendarService(token);
    } catch (error) {
      console.error('Error getting calendar service:', error);
      return null;
    }
  };

  return { getCalendarService };
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
