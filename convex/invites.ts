// 'use node'; // removed – not needed in browser runtime
import { ConvexError, v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

// Helper to require admin
async function requireAdmin(ctx: any) {
  await ctx.runQuery(internal.users.internalEnsureAdmin, {});
}

// Comment out createInvite mutation (moved to action)
// export const createInvite = mutation({
//   args: {
//     email: v.string(),
//     role: v.union(v.literal("admin"), v.literal("fisher")),
//   },
//   handler: async (ctx, { email, role }) => {
//     await requireAdmin(ctx);
//
//     // Add email to Clerk allowlist via Management API
//     const secretKey = process.env.CLERK_SECRET_KEY;
//     if (!secretKey) {
//       throw new ConvexError("CLERK_SECRET_KEY environment variable not set");
//     }
//
//     const allowRes = await fetch("https://api.clerk.com/v1/allowlist_identifiers", {
//       method: "POST",
//       headers: {
//         Authorization: `Bearer ${secretKey}`,
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({ identifier: email }),
//     });
//
//     if (!allowRes.ok) {
//       const text = await allowRes.text();
//       throw new ConvexError(`Failed to add to allowlist: ${text}`);
//     }
//
//     const token = crypto.randomBytes(16).toString("hex");
//     await ctx.db.insert("invites", { email, token, role });
//     return token;
//   },
// });

export const listInvites = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const rows = await ctx.db.query("invites").collect();
    return rows;
  },
});

export const revokeInvite = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    await requireAdmin(ctx);
    const invite = await ctx.db
      .query("invites")
      .withIndex("by_token", (q) => q.eq("token", token))
      .unique();
    if (!invite) throw new ConvexError("Invite not found");
    await ctx.db.delete(invite._id);
    return true;
  },
});

export const redeemInvite = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Authentication required");

    const invite = await ctx.db
      .query("invites")
      .withIndex("by_token", (q) => q.eq("token", token))
      .unique();
    if (!invite || invite.consumedBy) {
      throw new ConvexError("Invalid or already used invite");
    }

    // Add role mapping
    await ctx.db.insert("userRoles", {
      clerkUserId: identity.subject,
      role: invite.role,
    });
    // mark consumed
    await ctx.db.patch(invite._id, { consumedBy: identity.subject });
    return invite.role;
  },
});

// Internal mutation: insert invite row (callable from Node action)
export const _insertInvite = internalMutation({
  args: {
    email: v.string(),
    token: v.string(),
    role: v.union(v.literal("admin"), v.literal("fisher")),
  },
  handler: async (ctx, { email, token, role }) => {
    await ctx.db.insert("invites", { email, token, role });
    return true;
  },
}); 