'use node';

import { action } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import crypto from "crypto";
import { internal } from "./_generated/api";

async function requireAdmin(ctx: any) {
  await ctx.runQuery(internal.users.internalEnsureAdmin, {});
}

export const createInvite = action({
  args: {
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("fisher")),
  },
  handler: async (ctx, { email, role }) => {
    await requireAdmin(ctx);

    const secretKey = process.env.CLERK_SECRET_KEY;
    if (!secretKey) {
      throw new ConvexError("CLERK_SECRET_KEY environment variable not set");
    }

    const allowRes = await fetch("https://api.clerk.com/v1/allowlist_identifiers", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ identifier: email }),
    });

    if (!allowRes.ok) {
      const text = await allowRes.text();
      throw new ConvexError(`Failed to add to allowlist: ${text}`);
    }

    const token = crypto.randomBytes(16).toString("hex");
    // Insert invite via internal mutation in default runtime
    // @ts-ignore – function reference by string
    await ctx.runMutation("invites:_insertInvite", { email, token, role });
    return token;
  },
}); 