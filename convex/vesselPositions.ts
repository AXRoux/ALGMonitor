import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";

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

// Internal Mutation: Bulk upsert vessel positions to minimize HTTP round-trips from
// the external ingestion worker.
export const bulkUpsertVesselPositions = internalMutation({
  args: {
    positions: v.array(
      v.object({
        mmsi: v.string(),
        lat: v.float64(),
        lon: v.float64(),
        timestamp: v.number(),
      })
    ),
  },
  handler: async (ctx, { positions }) => {
    for (const { mmsi, lat, lon, timestamp } of positions) {
      const existing = await ctx.db
        .query("vesselPositions")
        .withIndex("by_mmsi", (q) => q.eq("mmsi", mmsi))
        .unique();

      if (existing) {
        if (timestamp > existing.timestamp) {
          await ctx.db.patch(existing._id, { lat, lon, timestamp });
        }
      } else {
        await ctx.db.insert("vesselPositions", { mmsi, lat, lon, timestamp });
      }
    }
    return true;
  },
});

// Note: A query to get live vessel positions for the map can also live here
// or in a more general 'mapData.ts' or 'queries.ts' file.
// For now, we'll assume it's handled elsewhere or will be added later.

// Query: get recent vessel positions (last 30 minutes)
export const listRecentPositions = query({
  args: {},
  handler: async (ctx) => {
    const since = Date.now() - 30 * 60 * 1000;
    const positions = await ctx.db.query("vesselPositions").collect();
    
    // Get all recent positions
    const recentPositions = positions.filter((v) => v.timestamp >= since);
    
    // Enhance position data with vessel names from fisherVessels table
    const enhancedPositions = await Promise.all(
      recentPositions.map(async (position) => {
        // Try to find the vessel details by MMSI
        const vessel = await ctx.db
          .query("fisherVessels")
          .withIndex("by_mmsi", (q) => q.eq("mmsi", position.mmsi))
          .first();
          
        return {
          ...position,
          vesselName: vessel?.vesselName || "Unknown Vessel",
          isRegistered: !!vessel,
        };
      })
    );
    
    return enhancedPositions;
  },
});

// Query: get the last position for a specific MMSI
export const getLastPositionByMmsi = query({
  args: {
    mmsi: v.string(),
  },
  handler: async (ctx, { mmsi }) => {
    const position = await ctx.db
      .query("vesselPositions")
      .withIndex("by_mmsi", (q) => q.eq("mmsi", mmsi))
      .order("desc")
      .first();
    
    return position || null;
  },
}); 