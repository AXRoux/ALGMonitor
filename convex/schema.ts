import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  fisherProfiles: defineTable({
    clerkUserId: v.string(),      // From auth.getUserIdentity().subject
    name: v.string(),
    mmsi: v.string(),             // Marine Mobile Service Identity - should be unique
    phone: v.string(),            // For Twilio SMS alerts
    // organizationId: v.optional(v.string()), // Optional: If using Clerk organizations for role separation
  })
  .index("by_clerkUserId", ["clerkUserId"])
  .index("by_mmsi", ["mmsi"]),

  vesselPositions: defineTable({
    mmsi: v.string(),
    lat: v.float64(),
    lon: v.float64(),
    timestamp: v.number(),        // UNIX timestamp (e.g., Date.now())
  })
  .index("by_mmsi", ["mmsi"]),

  alertLogs: defineTable({
    fisherProfileId: v.id("fisherProfiles"),
    lat: v.float64(),
    lon: v.float64(),
    timestamp: v.number(),
    alertType: v.union(
      v.literal("restricted_zone_entry"), 
      v.literal("communication_test"), // Example other type
      v.literal("sos")                  // Example SOS type
    ),
    details: v.optional(v.string()),
  })
  .index("by_fisherProfileId", ["fisherProfileId"]),

  restrictedZones: defineTable({
    name: v.string(),
    // Storing GeoJSON MultiPolygon coordinates array as a JSON string.
    // Example: "[[[lon,lat],[lon,lat]],[[lon,lat],[lon,lat]]]" for a polygon with a hole.
    // Or "[[[lon,lat],[lon,lat]]]" for a simple polygon.
    geoJsonCoordinates: v.string(), 
    createdBy: v.string(),        // Clerk User ID of the admin who created it
    description: v.optional(v.string()),
  }),

  userRoles: defineTable({
    clerkUserId: v.string(),      // From auth.getUserIdentity().subject
    role: v.union(v.literal("admin"), v.literal("fisher")),
  })
  .index("by_clerkUserId", ["clerkUserId"])
  .index("by_role", ["role"])
}); 