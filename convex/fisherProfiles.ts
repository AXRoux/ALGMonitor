import { ConvexError, v } from "convex/values";
import { mutation, query, internalQuery } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { getUserByClerkId } from "./utils";

// Admin Mutation: Register a new fisher and assign them the 'fisher' role.
export const registerFisherByAdmin = mutation({
  args: {
    targetClerkUserId: v.string(),
    name: v.string(),
    mmsi: v.string(),
    phone: v.string(),
  },
  handler: async (ctx, { targetClerkUserId, name, mmsi, phone }) => {
    // 1. Ensure the caller is an admin by running the internal query.
    // internal.users.internalEnsureAdmin will throw an error if the user is not an admin.
    await ctx.runQuery(internal.users.internalEnsureAdmin, {});

    // 2. Check for duplicates
    const existingByClerkId = await getUserByClerkId(ctx, targetClerkUserId, "fisherProfiles");
    if (existingByClerkId) {
      throw new ConvexError(`A fisher profile already exists for Clerk User ID: ${targetClerkUserId}`);
    }
    const existingByMmsi = await ctx.db
      .query("fisherProfiles")
      .withIndex("by_mmsi", (q) => q.eq("mmsi", mmsi))
      .first();
    if (existingByMmsi) {
      throw new ConvexError(`A fisher profile with MMSI ${mmsi} already exists.`);
    }

    // 3. Create the fisher profile
    const fisherProfileId = await ctx.db.insert("fisherProfiles", {
      clerkUserId: targetClerkUserId,
      name,
      mmsi,
      phone,
    });

    // 4. Schedule the 'fisher' role assignment (uses a public mutation from users.ts)
    // Uses api.users.assignRoleToUser for a public mutation.
    try {
      await ctx.scheduler.runAfter(0, api.users.assignRoleToUser, {
        targetClerkUserId: targetClerkUserId,
        role: "fisher",
      });
    } catch (error) {
      console.error(`Failed to schedule 'fisher' role assignment for ${targetClerkUserId}:`, error);
      // Consider implications if scheduling fails.
    }

    return fisherProfileId;
  },
});

// Admin Query: List all fisher profiles.
export const listFisherProfiles = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Authentication required.");
    }
    // Check role directly within the query for access control
    const userRole = await ctx.db.query("userRoles").withIndex("by_clerkUserId", q => q.eq("clerkUserId", identity.subject)).unique();
    if(userRole?.role !== 'admin'){
      throw new ConvexError("Only admins can list fisher profiles.");
    }

    const profiles = await ctx.db.query("fisherProfiles").collect();
    return profiles;
  },
});

// Fisher Query: Get the current logged-in fisher's profile.
export const getMyFisherProfile = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null; 
    }
    const profile = await getUserByClerkId(ctx, identity.subject, "fisherProfiles");
    if (!profile) {
      return null; 
    }
    return profile;
  },
});

// Fisher Mutation: Update their own profile details.
export const updateMyFisherProfile = mutation({
  args: {
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, { name, phone }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Authentication required to update profile.");
    }
    
    // Get existing profile or create one if it doesn't exist
    let existingProfile = await getUserByClerkId(ctx, identity.subject, "fisherProfiles");
    
    if (!existingProfile) {
      // Check if user has fisher role
      const userRole = await ctx.db
        .query("userRoles")
        .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", identity.subject))
        .unique();
      
      if (!userRole || userRole.role !== "fisher") {
        throw new ConvexError("Only users with 'fisher' role can create a profile.");
      }
      
      // Create a new profile with defaults
      const newProfileId = await ctx.db.insert("fisherProfiles", {
        clerkUserId: identity.subject,
        name: name || identity.name || "Fisher",
        mmsi: `temp-${Date.now()}`, // temporary MMSI until real one is provided
        phone: phone || "",
        alertsEnabled: true, // default to enabled
      });
      
      // Get the newly created profile
      existingProfile = await ctx.db.get(newProfileId);
    }
    
    // Update the profile with any changed fields
    const updates: { name?: string; phone?: string } = {};
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    
    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(existingProfile!._id, updates);
    }
    
    return existingProfile!._id;
  },
});

// Internal Query: Fetch a fisher profile by MMSI, used by AIS alerting logic.
export const getFisherProfileByMmsiInternal = internalQuery({
  args: {
    mmsi: v.string(),
  },
  handler: async (ctx, { mmsi }) => {
    const profile = await ctx.db
      .query("fisherProfiles")
      .withIndex("by_mmsi", (q) => q.eq("mmsi", mmsi))
      .unique();
    return profile ?? null;
  },
});

// Admin Mutation: Update a fisher profile (name, phone, alertsEnabled)
export const updateFisherByAdmin = mutation({
  args: {
    profileId: v.id("fisherProfiles"),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    alertsEnabled: v.optional(v.boolean()),
  },
  handler: async (ctx, { profileId, name, phone, alertsEnabled }) => {
    // require admin via internal query
    await ctx.runQuery(internal.users.internalEnsureAdmin, {});

    const existing = await ctx.db.get(profileId);
    if (!existing) throw new ConvexError("Fisher profile not found.");

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (alertsEnabled !== undefined) updates.alertsEnabled = alertsEnabled;

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(existing!._id, updates);
    }
    return existing!._id;
  },
}); 