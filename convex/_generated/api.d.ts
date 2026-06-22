/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auditLog from "../auditLog.js";
import type * as auth from "../auth.js";
import type * as cmsUsers from "../cmsUsers.js";
import type * as content from "../content.js";
import type * as contentHistory from "../contentHistory.js";
import type * as debugReactive from "../debugReactive.js";
import type * as exports from "../exports.js";
import type * as http from "../http.js";
import type * as lib_audit from "../lib/audit.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_authValidators from "../lib/authValidators.js";
import type * as lib_cmsUsers from "../lib/cmsUsers.js";
import type * as lib_contentHistory from "../lib/contentHistory.js";
import type * as lib_contentPublish from "../lib/contentPublish.js";
import type * as lib_contentSchemas from "../lib/contentSchemas.js";
import type * as lib_contentValidation from "../lib/contentValidation.js";
import type * as lib_eventPayloads from "../lib/eventPayloads.js";
import type * as lib_inputValidation from "../lib/inputValidation.js";
import type * as lib_logging from "../lib/logging.js";
import type * as lib_permissions from "../lib/permissions.js";
import type * as lib_presenceConstants from "../lib/presenceConstants.js";
import type * as lib_previewToken from "../lib/previewToken.js";
import type * as lib_rateLimit from "../lib/rateLimit.js";
import type * as lib_rbac from "../lib/rbac.js";
import type * as lib_restoreDrill from "../lib/restoreDrill.js";
import type * as lib_schemaApply from "../lib/schemaApply.js";
import type * as lib_schemaDestructive from "../lib/schemaDestructive.js";
import type * as lib_schemaDiff from "../lib/schemaDiff.js";
import type * as lib_schemaExport from "../lib/schemaExport.js";
import type * as lib_schemaInvariants from "../lib/schemaInvariants.js";
import type * as lib_schemaTypes from "../lib/schemaTypes.js";
import type * as lib_searchRanking from "../lib/searchRanking.js";
import type * as lib_systemValidators from "../lib/systemValidators.js";
import type * as media from "../media.js";
import type * as navigation from "../navigation.js";
import type * as presence from "../presence.js";
import type * as preview from "../preview.js";
import type * as publicContent from "../publicContent.js";
import type * as schemaBuilder from "../schemaBuilder.js";
import type * as schemas from "../schemas.js";
import type * as search from "../search.js";
import type * as systemDebug from "../systemDebug.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auditLog: typeof auditLog;
  auth: typeof auth;
  cmsUsers: typeof cmsUsers;
  content: typeof content;
  contentHistory: typeof contentHistory;
  debugReactive: typeof debugReactive;
  exports: typeof exports;
  http: typeof http;
  "lib/audit": typeof lib_audit;
  "lib/auth": typeof lib_auth;
  "lib/authValidators": typeof lib_authValidators;
  "lib/cmsUsers": typeof lib_cmsUsers;
  "lib/contentHistory": typeof lib_contentHistory;
  "lib/contentPublish": typeof lib_contentPublish;
  "lib/contentSchemas": typeof lib_contentSchemas;
  "lib/contentValidation": typeof lib_contentValidation;
  "lib/eventPayloads": typeof lib_eventPayloads;
  "lib/inputValidation": typeof lib_inputValidation;
  "lib/logging": typeof lib_logging;
  "lib/permissions": typeof lib_permissions;
  "lib/presenceConstants": typeof lib_presenceConstants;
  "lib/previewToken": typeof lib_previewToken;
  "lib/rateLimit": typeof lib_rateLimit;
  "lib/rbac": typeof lib_rbac;
  "lib/restoreDrill": typeof lib_restoreDrill;
  "lib/schemaApply": typeof lib_schemaApply;
  "lib/schemaDestructive": typeof lib_schemaDestructive;
  "lib/schemaDiff": typeof lib_schemaDiff;
  "lib/schemaExport": typeof lib_schemaExport;
  "lib/schemaInvariants": typeof lib_schemaInvariants;
  "lib/schemaTypes": typeof lib_schemaTypes;
  "lib/searchRanking": typeof lib_searchRanking;
  "lib/systemValidators": typeof lib_systemValidators;
  media: typeof media;
  navigation: typeof navigation;
  presence: typeof presence;
  preview: typeof preview;
  publicContent: typeof publicContent;
  schemaBuilder: typeof schemaBuilder;
  schemas: typeof schemas;
  search: typeof search;
  systemDebug: typeof systemDebug;
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

export declare const components: {
  betterAuth: import("@convex-dev/better-auth/_generated/component.js").ComponentApi<"betterAuth">;
};
