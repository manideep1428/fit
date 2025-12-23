import { mutation } from "./_generated/server";

// Migration to add new fields to existing packages
export const migrateExistingPackages = mutation({
  handler: async (ctx) => {
    const packages = await ctx.db.query("packages").collect();
    
    let updated = 0;
    for (const pkg of packages) {
      // Check if package already has new fields
      if (pkg.sessions === undefined || pkg.durationMonths === undefined || pkg.isActive === undefined) {
        await ctx.db.patch(pkg._id, {
          sessions: pkg.sessions || 12, // Default 12 sessions
          durationMonths: pkg.durationMonths || 3, // Default 3 months
          discount: pkg.discount || 0,
          isActive: pkg.isActive !== undefined ? pkg.isActive : true,
        });
        updated++;
      }
    }

    return { 
      message: `Migration complete. Updated ${updated} packages.`,
      total: packages.length,
      updated,
    };
  },
});

// Migration to add sessionDeducted field to existing bookings
export const migrateExistingBookings = mutation({
  handler: async (ctx) => {
    const bookings = await ctx.db.query("bookings").collect();
    
    let updated = 0;
    for (const booking of bookings) {
      if (booking.sessionDeducted === undefined) {
        await ctx.db.patch(booking._id, {
          sessionDeducted: false,
        });
        updated++;
      }
    }

    return { 
      message: `Migration complete. Updated ${updated} bookings.`,
      total: bookings.length,
      updated,
    };
  },
});
