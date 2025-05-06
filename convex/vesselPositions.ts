import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

// Internal Mutation: Update or insert a vessel's position.
// Called by the AIS ingestion action.
export const upsertVesselPosition = internalMutation({
  args: {
    mmsi: v.string(),
    lat: v.float64(),
    lon: v.float64(),
    timestamp: v.number(), // UNIX timestamp from AIS data
    // Optional: course: v.optional(v.float64()), speed: v.optional(v.float64()), heading: v.optional(v.float64())
  },
  handler: async (ctx, { mmsi, lat, lon, timestamp }) => {
    const existingPosition = await ctx.db
      .query("vesselPositions")
      .withIndex("by_mmsi", (q) => q.eq("mmsi", mmsi))
      .unique();

    if (existingPosition) {
      // Update existing position if the new data is more recent
      if (timestamp > existingPosition.timestamp) {
        await ctx.db.patch(existingPosition._id, { lat, lon, timestamp });
      }
    } else {
      // Insert new position
      await ctx.db.insert("vesselPositions", { mmsi, lat, lon, timestamp });
    }
    return true;
  },
});

// Note: A query to get live vessel positions for the map can also live here
// or in a more general 'mapData.ts' or 'queries.ts' file.
// For now, we'll assume it's handled elsewhere or will be added later. 