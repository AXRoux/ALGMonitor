import { ConvexError, v } from "convex/values";
import { mutation, query, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { getUserByClerkId } from "./utils";

// Helper to ensure caller is admin
async function requireAdmin(ctx: any) {
  await ctx.runQuery(internal.users.internalEnsureAdmin, {});
}

// ────────────────────────────────────────────
// Fisher-side: CRUD operations on their vessels
// ────────────────────────────────────────────

export const listMyVessels = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Authentication required.");

    return await ctx.db
      .query("fisherVessels")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", identity.subject))
      .collect();
  },
});

export const addVessel = mutation({
  args: {
    vesselName: v.string(),
    mmsi: v.string(),
  },
  handler: async (ctx, { vesselName, mmsi }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Authentication required.");

    // Ensure caller has fisher role
    const roleDoc = await ctx.db
      .query("userRoles")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", identity.subject))
      .unique();
    if (!roleDoc || roleDoc.role !== "fisher") {
      throw new ConvexError("Only users with 'fisher' role can add vessels.");
    }

    // Prevent duplicate MMSI across system
    const existing = await ctx.db
      .query("fisherVessels")
      .withIndex("by_mmsi", (q) => q.eq("mmsi", mmsi))
      .unique();
    if (existing) {
      throw new ConvexError("A vessel with this MMSI already exists.");
    }

    const id = await ctx.db.insert("fisherVessels", {
      clerkUserId: identity.subject,
      vesselName,
      mmsi,
    });
    return id;
  },
});

export const updateVessel = mutation({
  args: {
    vesselId: v.id("fisherVessels"),
    vesselName: v.optional(v.string()),
    mmsi: v.optional(v.string()),
  },
  handler: async (ctx, { vesselId, vesselName, mmsi }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Authentication required.");

    const vessel = await ctx.db.get(vesselId);
    if (!vessel) throw new ConvexError("Vessel not found.");
    if (vessel.clerkUserId !== identity.subject) {
      throw new ConvexError("You do not own this vessel record.");
    }

    const updates: any = {};
    if (vesselName !== undefined) updates.vesselName = vesselName;
    if (mmsi !== undefined) {
      // ensure new MMSI unique
      const duplicate = await ctx.db
        .query("fisherVessels")
        .withIndex("by_mmsi", (q) => q.eq("mmsi", mmsi))
        .unique();
      if (duplicate && duplicate._id !== vesselId) {
        throw new ConvexError("Another vessel already uses this MMSI.");
      }
      updates.mmsi = mmsi;
    }

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(vesselId, updates);
    }
    return vesselId;
  },
});

export const removeVessel = mutation({
  args: { vesselId: v.id("fisherVessels") },
  handler: async (ctx, { vesselId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Authentication required.");

    const vessel = await ctx.db.get(vesselId);
    if (!vessel) throw new ConvexError("Vessel not found.");
    if (vessel.clerkUserId !== identity.subject) {
      throw new ConvexError("You do not own this vessel record.");
    }

    await ctx.db.delete(vesselId);
    return true;
  },
});

// ────────────────────────────────────────────
// Admin-side helpers
// ────────────────────────────────────────────

export const listAllVessels = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("fisherVessels").collect();
  },
});

export const updateVesselByAdmin = mutation({
  args: {
    vesselId: v.id("fisherVessels"),
    vesselName: v.optional(v.string()),
    mmsi: v.optional(v.string()),
    clerkUserId: v.optional(v.string()),
  },
  handler: async (ctx, { vesselId, vesselName, mmsi, clerkUserId }) => {
    await requireAdmin(ctx);

    const existing = await ctx.db.get(vesselId);
    if (!existing) throw new ConvexError("Vessel not found.");

    const updates: any = {};
    if (vesselName !== undefined) updates.vesselName = vesselName;
    if (clerkUserId !== undefined) updates.clerkUserId = clerkUserId;
    if (mmsi !== undefined) {
      const duplicate = await ctx.db
        .query("fisherVessels")
        .withIndex("by_mmsi", (q) => q.eq("mmsi", mmsi))
        .unique();
      if (duplicate && duplicate._id !== vesselId) {
        throw new ConvexError("Another vessel already uses this MMSI.");
      }
      updates.mmsi = mmsi;
    }

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(vesselId, updates);
    }
    return vesselId;
  },
});

// Internal query: list all vessels (no auth)
export const listAllVesselsInternal = internalQuery(async (ctx) => {
  return await ctx.db.query("fisherVessels").collect();
}); 