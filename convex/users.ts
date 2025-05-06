import { ConvexError, v } from "convex/values";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { getUserByClerkId } from "./utils"; // We'll create this helper

// Query to get the role of the currently authenticated user
export const getMyUserRole = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null; // Not logged in
    }

    const userRoleEntry = await ctx.db
      .query("userRoles")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", identity.subject))
      .unique();

    return userRoleEntry ? userRoleEntry.role : null;
  },
});

// Internal helper to check if the current user is an admin
export const internalEnsureAdmin = internalQuery(
  async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Authentication required.");
    }
    const userRoleEntry = await ctx.db
      .query("userRoles")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", identity.subject))
      .unique();

    if (!userRoleEntry || userRoleEntry.role !== "admin") {
      throw new ConvexError("User is not an admin.");
    }
    return identity; // Return identity if admin for convenience
  }
);

// Mutation for an admin to assign a role to a user
// This is callable by an admin to set another user's role or their own initial role.
export const assignRoleToUser = mutation({
  args: {
    targetClerkUserId: v.string(),
    role: v.union(v.literal("admin"), v.literal("fisher")),
  },
  handler: async (ctx, { targetClerkUserId, role }) => {
    // First, ensure the calling user is an admin
    const callingUserIdentity = await ctx.auth.getUserIdentity();
    if (!callingUserIdentity) {
      throw new ConvexError("Authentication required to assign roles.");
    }

    const callerRoleEntry = await ctx.db
      .query("userRoles")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", callingUserIdentity.subject))
      .unique();

    if (!callerRoleEntry || callerRoleEntry.role !== "admin") {
      throw new ConvexError("Only admins can assign roles.");
    }

    // Check if the target user already has a role entry
    const existingRoleEntry = await getUserByClerkId(ctx, targetClerkUserId, "userRoles");

    if (existingRoleEntry) {
      // If role is the same, do nothing to avoid unnecessary writes
      if (existingRoleEntry.role === role) {
        return existingRoleEntry._id;
      }
      // Update existing role
      await ctx.db.patch(existingRoleEntry._id, { role });
      return existingRoleEntry._id;
    } else {
      // Create new role entry
      return await ctx.db.insert("userRoles", {
        clerkUserId: targetClerkUserId,
        role,
      });
    }
  },
});

// Utility to be called, perhaps on first sign-in via a frontend effect, 
// or when an admin creates a user that doesn't have a role yet.
// This version just ensures a user has a role, defaulting to 'fisher' if none exists.
// More sophisticated logic might be needed for initial admin setup.
export const ensureUserRoleDefaults = internalMutation({
  args: { clerkUserId: v.string(), name: v.optional(v.string()), email: v.optional(v.string()) }, // name & email from Clerk identity
  handler: async (ctx, { clerkUserId }) => {
    const existingRole = await getUserByClerkId(ctx, clerkUserId, "userRoles");

    if (!existingRole) {
      // Default new users to 'fisher'. Admins must be explicitly assigned.
      await ctx.db.insert("userRoles", {
        clerkUserId: clerkUserId,
        role: "fisher", 
      });
      console.log(`Defaulted user ${clerkUserId} to role 'fisher'.`);
    }
    return true;
  },
}); 