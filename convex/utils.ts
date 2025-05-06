import { GenericQueryCtx } from "convex/server";
import { DataModel, TableNames } from "./_generated/dataModel";

/**
 * Retrieves a user-related document by their Clerk user ID from a specified table.
 *
 * @param ctx - The query or mutation context.
 * @param clerkUserId - The Clerk user ID (identity.subject).
 * @param tableName - The name of the table to query (e.g., "userRoles", "fisherProfiles").
 * @returns The user document if found, otherwise null.
 */
export const getUserByClerkId = async <TN extends TableNames>(
  ctx: GenericQueryCtx<DataModel>,
  clerkUserId: string,
  tableName: TN
) => {
  const result = await ctx.db
    .query(tableName)
    // @ts-expect-error Type inference fortableName and its respective 'by_clerkUserId' index is tricky
    .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", clerkUserId))
    .unique();
  return result;
}; 