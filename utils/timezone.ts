import { DateTime, IANAZone } from 'luxon';

/**
 * Timezone utilities for Cal.com/Calendly-style timezone handling.
 * All availability is stored in host timezone (wall-clock time).
 * All bookings are stored in UTC.
 */

/**
 * Validates if a string is a valid IANA timezone identifier.
 */
export function isValidTimezone(timezone: string): boolean {
  return IANAZone.isValidZone(timezone);
}

/**
 * Converts a wall-clock time on a specific date in a timezone to UTC epoch milliseconds.
 * @param date - Date string in "YYYY-MM-DD" format
 * @param time - Time string in "HH:MM" format (24-hour)
 * @param timezone - IANA timezone identifier (e.g., "Asia/Kolkata")
 * @returns UTC epoch milliseconds
 */
export function toUTC(date: string, time: string, timezone: string): number {
  const dt = DateTime.fromISO(`${date}T${time}`, { zone: timezone });
  if (!dt.isValid) {
    throw new Error(`Invalid date/time: ${date}T${time} in ${timezone}`);
  }
  return dt.toMillis();
}

/**
 * Converts UTC epoch milliseconds to wall-clock time in a specific timezone.
 * @param utcMs - UTC epoch milliseconds
 * @param timezone - IANA timezone identifier
 * @returns Object with date ("YYYY-MM-DD") and time ("HH:MM")
 */
export function fromUTC(utcMs: number, timezone: string): { date: string; time: string } {
  const dt = DateTime.fromMillis(utcMs, { zone: timezone });
  if (!dt.isValid) {
    throw new Error(`Invalid UTC timestamp: ${utcMs}`);
  }
  return {
    date: dt.toFormat('yyyy-MM-dd'),
    time: dt.toFormat('HH:mm'),
  };
}

/**
 * Gets the current viewer's timezone using the Intl API.
 * Falls back to UTC if detection fails.
 */
export function getViewerTimezone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return isValidTimezone(tz) ? tz : 'UTC';
  } catch {
    return 'UTC';
  }
}


/**
 * Formats a UTC timestamp for display in a specific timezone.
 * @param utcMs - UTC epoch milliseconds
 * @param timezone - IANA timezone identifier
 * @param format - Optional Luxon format string (default: "h:mm a")
 * @returns Formatted time string in the viewer's timezone
 */
export function formatForDisplay(
  utcMs: number,
  timezone: string,
  format: string = 'h:mm a'
): string {
  const dt = DateTime.fromMillis(utcMs, { zone: timezone });
  if (!dt.isValid) {
    throw new Error(`Invalid UTC timestamp: ${utcMs}`);
  }
  return dt.toFormat(format);
}

/**
 * Formats a UTC timestamp with full date and time for display.
 * @param utcMs - UTC epoch milliseconds
 * @param timezone - IANA timezone identifier
 * @returns Formatted date and time string
 */
export function formatDateTimeForDisplay(utcMs: number, timezone: string): string {
  const dt = DateTime.fromMillis(utcMs, { zone: timezone });
  if (!dt.isValid) {
    throw new Error(`Invalid UTC timestamp: ${utcMs}`);
  }
  return dt.toFormat('MMM d, yyyy h:mm a');
}

/**
 * Checks if two UTC time ranges overlap.
 * @returns true if ranges overlap, false otherwise
 */
export function rangesOverlap(
  start1: number,
  end1: number,
  start2: number,
  end2: number
): boolean {
  return start1 < end2 && start2 < end1;
}

/**
 * Gets the day of week (0=Sunday, 6=Saturday) for a date in a specific timezone.
 * @param date - Date string in "YYYY-MM-DD" format
 * @param timezone - IANA timezone identifier
 * @returns Day of week (0-6)
 */
export function getDayOfWeek(date: string, timezone: string): number {
  const dt = DateTime.fromISO(date, { zone: timezone });
  if (!dt.isValid) {
    throw new Error(`Invalid date: ${date}`);
  }
  // Luxon weekday: 1=Monday, 7=Sunday. Convert to 0=Sunday, 6=Saturday
  return dt.weekday === 7 ? 0 : dt.weekday;
}

/**
 * Generates time slots within a UTC range.
 * @param startUTC - Start time in UTC epoch milliseconds
 * @param endUTC - End time in UTC epoch milliseconds
 * @param durationMinutes - Duration of each slot in minutes
 * @returns Array of slot objects with startTimeUTC and endTimeUTC
 */
export function generateSlotsInRange(
  startUTC: number,
  endUTC: number,
  durationMinutes: number
): Array<{ startTimeUTC: number; endTimeUTC: number }> {
  const slots: Array<{ startTimeUTC: number; endTimeUTC: number }> = [];
  const durationMs = durationMinutes * 60 * 1000;
  
  let currentStart = startUTC;
  while (currentStart + durationMs <= endUTC) {
    slots.push({
      startTimeUTC: currentStart,
      endTimeUTC: currentStart + durationMs,
    });
    currentStart += durationMs;
  }
  
  return slots;
}

/**
 * Gets the current time in UTC epoch milliseconds.
 */
export function nowUTC(): number {
  return DateTime.utc().toMillis();
}

/**
 * Checks if a UTC timestamp is in the past.
 */
export function isPast(utcMs: number): boolean {
  return utcMs < nowUTC();
}
