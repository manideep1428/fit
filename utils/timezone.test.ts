import * as fc from 'fast-check';
import { DateTime } from 'luxon';
import {
  toUTC,
  fromUTC,
  isValidTimezone,
  rangesOverlap,
  generateSlotsInRange,
  getDayOfWeek,
} from './timezone';

// Configure fast-check for minimum 100 iterations
fc.configureGlobal({ numRuns: 100 });

// Common IANA timezones for testing (including DST and non-DST zones)
const TIMEZONES = [
  'UTC',
  'America/New_York',    // DST
  'America/Los_Angeles', // DST
  'Europe/London',       // DST
  'Europe/Paris',        // DST
  'Asia/Kolkata',        // No DST
  'Asia/Tokyo',          // No DST
  'Australia/Sydney',    // DST (southern hemisphere)
  'Pacific/Auckland',    // DST (southern hemisphere)
];

// Arbitrary for valid dates (2020-2030)
const dateArb = fc.date({
  min: new Date('2020-01-01'),
  max: new Date('2030-12-31'),
}).map(d => d.toISOString().split('T')[0]);

// Arbitrary for valid times (HH:MM format)
const timeArb = fc.tuple(
  fc.integer({ min: 0, max: 23 }),
  fc.integer({ min: 0, max: 59 })
).map(([h, m]) => `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);

// Arbitrary for timezone selection
const timezoneArb = fc.constantFrom(...TIMEZONES);

describe('Timezone Utilities', () => {
  describe('isValidTimezone', () => {
    it('should return true for valid IANA timezones', () => {
      TIMEZONES.forEach(tz => {
        expect(isValidTimezone(tz)).toBe(true);
      });
    });

    it('should return false for invalid timezones', () => {
      expect(isValidTimezone('Invalid/Timezone')).toBe(false);
      expect(isValidTimezone('GMT+5')).toBe(false);
      expect(isValidTimezone('')).toBe(false);
    });
  });

  /**
   * Feature: timezone-aware-booking, Property 3: Slot Generation Round-Trip
   * Validates: Requirements 3.2, 3.3
   * 
   * For any availability rule with hostTimezone, startTime, and endTime,
   * generating slots for a date and converting the resulting UTC timestamps
   * back to the host timezone SHALL produce times that match the original.
   */
  describe('Property 3: Slot Generation Round-Trip', () => {
    it('toUTC then fromUTC should return original date and time', () => {
      fc.assert(
        fc.property(dateArb, timeArb, timezoneArb, (date, time, timezone) => {
          // Convert to UTC
          const utcMs = toUTC(date, time, timezone);
          
          // Convert back to local
          const result = fromUTC(utcMs, timezone);
          
          // Should match original
          expect(result.date).toBe(date);
          expect(result.time).toBe(time);
        }),
        { numRuns: 100 }
      );
    });

    it('fromUTC then toUTC should return original UTC timestamp', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1577836800000, max: 1924991999000 }), // 2020-2030 in ms
          timezoneArb,
          (utcMs, timezone) => {
            // Convert to local
            const local = fromUTC(utcMs, timezone);
            
            // Convert back to UTC
            const resultUtc = toUTC(local.date, local.time, timezone);
            
            // Should match original (within 1 minute due to HH:MM precision)
            const diffMs = Math.abs(resultUtc - utcMs);
            expect(diffMs).toBeLessThan(60000); // Less than 1 minute difference
          }
        ),
        { numRuns: 100 }
      );
    });
  });


  /**
   * Feature: timezone-aware-booking, Property 8: DST Correctness
   * Validates: Requirements 6.1, 6.2
   * 
   * For any timezone with DST transitions and a wall-clock time,
   * generating slots for dates before and after a DST transition SHALL
   * produce different UTC values that, when converted back to the host
   * timezone, both display as the same wall-clock time.
   */
  describe('Property 8: DST Correctness', () => {
    it('same wall-clock time produces different UTC values across DST transition', () => {
      // America/New_York DST transitions:
      // Spring forward: March 8, 2026 at 2:00 AM (EST -> EDT)
      // Fall back: November 1, 2026 at 2:00 AM (EDT -> EST)
      
      const timezone = 'America/New_York';
      const time = '09:00'; // 9 AM local time
      
      // Winter date (EST, UTC-5)
      const winterDate = '2026-01-15';
      const winterUTC = toUTC(winterDate, time, timezone);
      
      // Summer date (EDT, UTC-4)
      const summerDate = '2026-07-15';
      const summerUTC = toUTC(summerDate, time, timezone);
      
      // UTC values should be different (1 hour apart for same local time)
      // In winter: 9 AM EST = 14:00 UTC
      // In summer: 9 AM EDT = 13:00 UTC
      const winterHourUTC = DateTime.fromMillis(winterUTC).toUTC().hour;
      const summerHourUTC = DateTime.fromMillis(summerUTC).toUTC().hour;
      
      expect(winterHourUTC).toBe(14); // 9 AM EST = 14:00 UTC
      expect(summerHourUTC).toBe(13); // 9 AM EDT = 13:00 UTC
      
      // But when converted back, both should show 09:00 local time
      const winterLocal = fromUTC(winterUTC, timezone);
      const summerLocal = fromUTC(summerUTC, timezone);
      
      expect(winterLocal.time).toBe('09:00');
      expect(summerLocal.time).toBe('09:00');
    });

    it('wall-clock availability remains stable across DST for any timezone with DST', () => {
      // Test with multiple DST timezones
      const dstTimezones = [
        'America/New_York',
        'America/Los_Angeles',
        'Europe/London',
        'Australia/Sydney',
      ];
      
      fc.assert(
        fc.property(
          fc.constantFrom(...dstTimezones),
          timeArb,
          (timezone, time) => {
            // Pick dates that are definitely in different DST states
            // January is winter in northern hemisphere, summer in southern
            // July is summer in northern hemisphere, winter in southern
            const date1 = '2026-01-15';
            const date2 = '2026-07-15';
            
            const utc1 = toUTC(date1, time, timezone);
            const utc2 = toUTC(date2, time, timezone);
            
            // Convert back to local time
            const local1 = fromUTC(utc1, timezone);
            const local2 = fromUTC(utc2, timezone);
            
            // Wall-clock time should be preserved
            expect(local1.time).toBe(time);
            expect(local2.time).toBe(time);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('non-DST timezone produces consistent UTC offset year-round', () => {
      // Asia/Kolkata has no DST, always UTC+5:30
      const timezone = 'Asia/Kolkata';
      const time = '09:00';
      
      fc.assert(
        fc.property(dateArb, (date) => {
          const utcMs = toUTC(date, time, timezone);
          const dt = DateTime.fromMillis(utcMs).setZone(timezone);
          
          // Offset should always be +5:30 (330 minutes)
          expect(dt.offset).toBe(330);
          
          // Local time should always be 09:00
          expect(dt.toFormat('HH:mm')).toBe('09:00');
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('rangesOverlap', () => {
    it('should detect overlapping ranges', () => {
      // Range 1: 10:00-11:00, Range 2: 10:30-11:30 (overlap)
      expect(rangesOverlap(1000, 1100, 1030, 1130)).toBe(true);
      
      // Range 1: 10:00-11:00, Range 2: 11:00-12:00 (adjacent, no overlap)
      expect(rangesOverlap(1000, 1100, 1100, 1200)).toBe(false);
      
      // Range 1: 10:00-12:00, Range 2: 10:30-11:30 (contained)
      expect(rangesOverlap(1000, 1200, 1030, 1130)).toBe(true);
    });

    it('property: overlap is symmetric', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 1000 }),
          fc.integer({ min: 1, max: 100 }),
          fc.integer({ min: 0, max: 1000 }),
          fc.integer({ min: 1, max: 100 }),
          (start1, len1, start2, len2) => {
            const end1 = start1 + len1;
            const end2 = start2 + len2;
            
            // Overlap should be symmetric
            expect(rangesOverlap(start1, end1, start2, end2))
              .toBe(rangesOverlap(start2, end2, start1, end1));
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('generateSlotsInRange', () => {
    it('should generate correct number of slots', () => {
      // 2 hour range with 30 min slots = 4 slots
      const start = 0;
      const end = 2 * 60 * 60 * 1000; // 2 hours in ms
      const duration = 30; // 30 minutes
      
      const slots = generateSlotsInRange(start, end, duration);
      expect(slots.length).toBe(4);
    });

    it('property: all slots have correct duration', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 1000000000 }),
          fc.integer({ min: 60, max: 480 }), // 1-8 hours in minutes
          fc.integer({ min: 15, max: 120 }), // 15-120 minute slots
          (startMs, rangeMinutes, durationMinutes) => {
            const endMs = startMs + rangeMinutes * 60 * 1000;
            const slots = generateSlotsInRange(startMs, endMs, durationMinutes);
            
            const expectedDurationMs = durationMinutes * 60 * 1000;
            
            slots.forEach(slot => {
              expect(slot.endTimeUTC - slot.startTimeUTC).toBe(expectedDurationMs);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('property: slots do not exceed range', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 1000000000 }),
          fc.integer({ min: 60, max: 480 }),
          fc.integer({ min: 15, max: 120 }),
          (startMs, rangeMinutes, durationMinutes) => {
            const endMs = startMs + rangeMinutes * 60 * 1000;
            const slots = generateSlotsInRange(startMs, endMs, durationMinutes);
            
            slots.forEach(slot => {
              expect(slot.startTimeUTC).toBeGreaterThanOrEqual(startMs);
              expect(slot.endTimeUTC).toBeLessThanOrEqual(endMs);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('getDayOfWeek', () => {
    it('should return correct day of week', () => {
      // Known dates
      expect(getDayOfWeek('2026-01-14', 'UTC')).toBe(3); // Wednesday
      expect(getDayOfWeek('2026-01-18', 'UTC')).toBe(0); // Sunday
      expect(getDayOfWeek('2026-01-19', 'UTC')).toBe(1); // Monday
    });
  });
});
