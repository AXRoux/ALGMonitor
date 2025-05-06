import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Admin Mutation: Add a new restricted zone.
export const addRestrictedZoneByAdmin = mutation({
  args: {
    name: v.string(),
    // GeoJSON coordinates string. Example for a simple polygon:
    // "[[[lon1,lat1],[lon2,lat2],[lon3,lat3],[lon1,lat1]]]"
    // For MultiPolygon or polygons with holes, the structure is more complex but still a JSON string.
    geoJsonCoordinates: v.string(), 
    description: v.optional(v.string()),
  },
  handler: async (ctx, { name, geoJsonCoordinates, description }) => {
    // Inline admin check
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Authentication required.");
    }
    const userRole = await ctx.db
      .query("userRoles")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", identity.subject))
      .unique();
    if (!userRole || userRole.role !== "admin") {
      throw new ConvexError("User is not an admin.");
    }

    // 2. Validate geoJsonCoordinates (basic validation for now)
    try {
      const parsedCoordinates = JSON.parse(geoJsonCoordinates);
      if (!Array.isArray(parsedCoordinates)) {
        throw new Error("GeoJSON coordinates should be an array.");
      }
      // Add more sophisticated validation if needed (e.g., check structure, point values)
    } catch (e: any) {
      throw new ConvexError(`Invalid GeoJSON coordinates format: ${e.message}`);
    }

    // 3. Insert the new restricted zone.
    const zoneId = await ctx.db.insert("restrictedZones", {
      name,
      geoJsonCoordinates,
      description,
      createdBy: identity.subject, // Store the admin's Clerk User ID
    });

    return zoneId;
  },
});

// Query: List all restricted zones.
// This is typically public or accessible to all authenticated users for map display.
export const listRestrictedZones = query({
  args: {},
  handler: async (ctx) => {
    // No specific admin check here, as maps for all users might need this data.
    // Access control can be at the page/component level if needed, 
    // or if only admins should see certain zones, add a filter.
    const zones = await ctx.db.query("restrictedZones").collect();
    return zones;
  },
});

// Optional: Mutation for an admin to delete a restricted zone.
export const deleteRestrictedZoneByAdmin = mutation({
  args: { zoneId: v.id("restrictedZones") },
  handler: async (ctx, { zoneId }) => {
    // Inline admin check
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Authentication required.");
    const role = await ctx.db
      .query("userRoles")
      .withIndex("by_clerkUserId", q => q.eq("clerkUserId", identity.subject))
      .unique();
    if (!role || role.role !== "admin") throw new ConvexError("User is not an admin.");

    // 2. Delete the zone.
    await ctx.db.delete(zoneId);
    return true;
  },
});

// Optional: Mutation for an admin to update a restricted zone.
export const updateRestrictedZoneByAdmin = mutation({
  args: {
    zoneId: v.id("restrictedZones"),
    name: v.optional(v.string()),
    geoJsonCoordinates: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, { zoneId, name, geoJsonCoordinates, description }) => {
    // Inline admin check
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Authentication required.");
    const role = await ctx.db
      .query("userRoles")
      .withIndex("by_clerkUserId", q => q.eq("clerkUserId", identity.subject))
      .unique();
    if (!role || role.role !== "admin") throw new ConvexError("User is not an admin.");

    // 2. Validate geoJsonCoordinates if provided
    if (geoJsonCoordinates !== undefined) {
      try {
        const parsedCoordinates = JSON.parse(geoJsonCoordinates);
        if (!Array.isArray(parsedCoordinates)) {
          throw new Error("GeoJSON coordinates should be an array.");
        }
      } catch (e: any) {
        throw new ConvexError(`Invalid GeoJSON coordinates format: ${e.message}`);
      }
    }

    // 3. Construct the update object only with provided fields.
    const updates: {
      name?: string;
      geoJsonCoordinates?: string;
      description?: string;
    } = {};
    if (name !== undefined) updates.name = name;
    if (geoJsonCoordinates !== undefined) updates.geoJsonCoordinates = geoJsonCoordinates;
    if (description !== undefined) updates.description = description;

    if (Object.keys(updates).length === 0) {
      return zoneId; // No actual changes provided
    }

    // 4. Patch the document.
    await ctx.db.patch(zoneId, updates);
    return zoneId;
  },
}); 