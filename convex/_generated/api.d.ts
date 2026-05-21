/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as aiActions from "../aiActions.js";
import type * as audit from "../audit.js";
import type * as auth from "../auth.js";
import type * as crypto from "../crypto.js";
import type * as http from "../http.js";
import type * as results from "../results.js";
import type * as reviews from "../reviews.js";
import type * as students from "../students.js";
import type * as syntheticAnalysis from "../syntheticAnalysis.js";
import type * as tests from "../tests.js";
import type * as uploads from "../uploads.js";
import type * as users from "../users.js";
import type * as validators from "../validators.js";
import type * as works from "../works.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  aiActions: typeof aiActions;
  audit: typeof audit;
  auth: typeof auth;
  crypto: typeof crypto;
  http: typeof http;
  results: typeof results;
  reviews: typeof reviews;
  students: typeof students;
  syntheticAnalysis: typeof syntheticAnalysis;
  tests: typeof tests;
  uploads: typeof uploads;
  users: typeof users;
  validators: typeof validators;
  works: typeof works;
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
