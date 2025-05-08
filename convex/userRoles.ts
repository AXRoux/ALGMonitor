import { ConvexError, v } from "convex/values";
import { mutation, query, action } from "./_generated/server";

/**
 * Shared helper: ensure the caller is authenticated *and* an admin.
 * Returns the caller's identity on success.
 */
async function requireAdmin(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError("Authentication required.");
  }
  const roleDoc = await ctx.db
    .query("userRoles")
    .withIndex("by_clerkUserId", (q: any) => q.eq("clerkUserId", identity.subject))
    .unique();
  if (!roleDoc || roleDoc.role !== "admin") {
    throw new ConvexError("User is not an admin.");
  }
  return identity;
}

// ────────────────────────────────────────────
// Bootstrapping: first user becomes admin once.
// ────────────────────────────────────────────
export const bootstrapFirstAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Authentication required.");

    const existing = await ctx.db.query("userRoles").collect();
    if (existing.length > 0) {
      throw new ConvexError("Admin already initialised.");
    }

    const allowed = (process.env.INITIAL_ADMIN_IDS || "").split(",").map((s) => s.trim()).filter(Boolean);
    if (!allowed.includes(identity.subject)) {
      throw new ConvexError("Current user is not permitted to bootstrap admin role.");
    }

    const id = await ctx.db.insert("userRoles", {
      clerkUserId: identity.subject,
      role: "admin",
    });
    return id;
  },
});

// ────────────────────────────────────────────
// Query: current user's role (or null)
// ────────────────────────────────────────────
export const getMyRole = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const roleDoc = await ctx.db
      .query("userRoles")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", identity.subject))
      .unique();
    return roleDoc ?? null;
  },
});

// ────────────────────────────────────────────
// Query: list all roles (admin-only)
// ────────────────────────────────────────────
export const listAllRoles = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("userRoles").collect();
  },
});

// ────────────────────────────────────────────
// Mutation: assign or change a role (admin-only)
// ────────────────────────────────────────────
export const assignRoleByAdmin = mutation({
  args: {
    clerkUserId: v.string(),
    role: v.union(v.literal("admin"), v.literal("fisher")),
  },
  handler: async (ctx, { clerkUserId, role }) => {
    await requireAdmin(ctx);

    // Upsert behaviour: if userRoles exists, patch; else insert
    const existing = await ctx.db
      .query("userRoles")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", clerkUserId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { role });
      return existing._id;
    }

    const id = await ctx.db.insert("userRoles", { clerkUserId, role });
    return id;
  },
});

// ────────────────────────────────────────────
// Action: fetch Clerk users for admin UI
// ────────────────────────────────────────────
export const fetchClerkUsers = action({
  args: {},
  handler: async (ctx) => {
    // Actions cannot access ctx.db directly; verify admin via runQuery.
    // @ts-ignore – server-side FunctionReference string accepted by Convex runtime
    const roleDoc = await ctx.runQuery("userRoles:getMyRole", {});
    if (!roleDoc || roleDoc.role !== "admin") {
      throw new ConvexError("User is not an admin.");
    }

    const secretKey = process.env.CLERK_SECRET_KEY;
    if (!secretKey) {
      throw new ConvexError("CLERK_SECRET_KEY environment variable is not set.");
    }

    const response = await fetch("https://api.clerk.com/v1/users?limit=100", {
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
    });

    if (!response.ok) {
      throw new ConvexError(`Failed to fetch users from Clerk: ${response.statusText}`);
    }

    type ClerkUser = {
      id: string;
      email_addresses: { email_address: string }[];
    };

    const data: ClerkUser[] = await response.json();

    // Map to minimal safe shape.
    return data.map((u) => ({
      id: u.id,
      email: u.email_addresses?.[0]?.email_address ?? "",
    }));
  },
}); 