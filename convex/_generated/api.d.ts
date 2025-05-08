/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as aisActions from "../aisActions.js";
import type * as crons from "../crons.js";
import type * as fisherProfiles from "../fisherProfiles.js";
import type * as invites from "../invites.js";
import type * as invitesActions from "../invitesActions.js";
import type * as restrictedZones from "../restrictedZones.js";
import type * as userRoles from "../userRoles.js";
import type * as users from "../users.js";
import type * as utils from "../utils.js";
import type * as vesselPositions from "../vesselPositions.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  aisActions: typeof aisActions;
  crons: typeof crons;
  fisherProfiles: typeof fisherProfiles;
  invites: typeof invites;
  invitesActions: typeof invitesActions;
  restrictedZones: typeof restrictedZones;
  userRoles: typeof userRoles;
  users: typeof users;
  utils: typeof utils;
  vesselPositions: typeof vesselPositions;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
