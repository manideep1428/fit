/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as availability from "../availability.js";
import type * as bookings from "../bookings.js";
import type * as goals from "../goals.js";
import type * as migratePackages from "../migratePackages.js";
import type * as migrations from "../migrations.js";
import type * as notifications from "../notifications.js";
import type * as packages from "../packages.js";
import type * as paymentRequests from "../paymentRequests.js";
import type * as pricingRules from "../pricingRules.js";
import type * as pushNotifications from "../pushNotifications.js";
import type * as questions from "../questions.js";
import type * as subscriptions from "../subscriptions.js";
import type * as trainerPlans from "../trainerPlans.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  availability: typeof availability;
  bookings: typeof bookings;
  goals: typeof goals;
  migratePackages: typeof migratePackages;
  migrations: typeof migrations;
  notifications: typeof notifications;
  packages: typeof packages;
  paymentRequests: typeof paymentRequests;
  pricingRules: typeof pricingRules;
  pushNotifications: typeof pushNotifications;
  questions: typeof questions;
  subscriptions: typeof subscriptions;
  trainerPlans: typeof trainerPlans;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
