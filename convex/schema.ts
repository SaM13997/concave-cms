import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { roleValidator } from "./lib/permissions";
import {
  auditActionValidator,
  entryStatusValidator,
  fieldTypeValidator,
  schemaFieldValidator,
  schemaStatusValidator,
  versionEntityTypeValidator,
  versionEventTypeValidator,
} from "./lib/systemValidators";

export default defineSchema({
  cmsUsers: defineTable({
    authUserId: v.string(),
    email: v.string(),
    name: v.string(),
    role: roleValidator,
  }).index("by_auth_user_id", ["authUserId"]),

  schemas: defineTable({
    slug: v.string(),
    name: v.string(),
    fields: v.array(schemaFieldValidator),
    draftFields: v.optional(v.array(schemaFieldValidator)),
    draftName: v.optional(v.string()),
    baseActiveVersion: v.optional(v.number()),
    descriptorVersion: v.number(),
    version: v.number(),
    status: schemaStatusValidator,
    createdBy: v.id("cmsUsers"),
    updatedBy: v.id("cmsUsers"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_status", ["status"])
    .index("by_updated_at", ["updatedAt"]),

  schemaVersions: defineTable({
    schemaId: v.id("schemas"),
    version: v.number(),
    snapshot: v.object({
      slug: v.string(),
      name: v.string(),
      fields: v.array(schemaFieldValidator),
      descriptorVersion: v.number(),
      status: schemaStatusValidator,
    }),
    changeSummary: v.string(),
    createdBy: v.id("cmsUsers"),
    createdAt: v.number(),
  })
    .index("by_schema", ["schemaId"])
    .index("by_schema_and_version", ["schemaId", "version"]),

  contentEntries: defineTable({
    contentType: v.string(),
    title: v.string(),
    status: entryStatusValidator,
    data: v.any(),
    publishedTitle: v.optional(v.string()),
    publishedData: v.optional(v.any()),
    draftRevision: v.number(),
    publishedRevision: v.optional(v.number()),
    hasUnpublishedChanges: v.boolean(),
    createdBy: v.id("cmsUsers"),
    updatedBy: v.id("cmsUsers"),
    createdAt: v.number(),
    updatedAt: v.number(),
    publishedAt: v.optional(v.number()),
  })
    .index("by_content_type", ["contentType"])
    .index("by_content_type_and_status", ["contentType", "status"])
    .index("by_updated_at", ["updatedAt"]),

  previewTokens: defineTable({
    entryId: v.id("contentEntries"),
    token: v.string(),
    draftRevision: v.number(),
    expiresAt: v.number(),
    revokedAt: v.optional(v.number()),
    createdBy: v.id("cmsUsers"),
    createdAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_entry", ["entryId"]),

  publishMetrics: defineTable({
    entryId: v.id("contentEntries"),
    publishDurationMs: v.number(),
    timestamp: v.number(),
    actorId: v.id("cmsUsers"),
  }).index("by_timestamp", ["timestamp"]),

  versionEvents: defineTable({
    entityType: versionEntityTypeValidator,
    entityId: v.string(),
    eventType: versionEventTypeValidator,
    summary: v.string(),
    actorId: v.id("cmsUsers"),
    timestamp: v.number(),
    payload: v.any(),
  })
    .index("by_entity", ["entityType", "entityId"])
    .index("by_timestamp", ["timestamp"]),

  mediaAssets: defineTable({
    filename: v.string(),
    mimeType: v.string(),
    sizeBytes: v.number(),
    storageId: v.optional(v.string()),
    alt: v.optional(v.string()),
    uploadedBy: v.id("cmsUsers"),
    createdAt: v.number(),
  })
    .index("by_uploaded_by", ["uploadedBy"])
    .index("by_created_at", ["createdAt"]),

  auditLog: defineTable({
    action: auditActionValidator,
    resourceType: v.string(),
    resourceId: v.string(),
    actorId: v.id("cmsUsers"),
    timestamp: v.number(),
    metadata: v.any(),
  })
    .index("by_timestamp", ["timestamp"])
    .index("by_actor", ["actorId"])
    .index("by_resource", ["resourceType", "resourceId"]),

  presenceSessions: defineTable({
    userId: v.id("cmsUsers"),
    routePath: v.string(),
    lastSeenAt: v.number(),
    expiresAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_route", ["routePath"])
    .index("by_expires_at", ["expiresAt"]),

  // Reactive E2E/debug counter for live subscription demos
  debugCounters: defineTable({
    label: v.string(),
    value: v.number(),
    updatedAt: v.number(),
  }).index("by_label", ["label"]),

  rateLimitEvents: defineTable({
    key: v.string(),
    windowStart: v.number(),
    count: v.number(),
  }).index("by_key", ["key"]),
});

// Re-export field type for use elsewhere
export { fieldTypeValidator };
