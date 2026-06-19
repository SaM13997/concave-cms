import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import {
  auditResourceTypeValidator,
  fieldTypeValidator,
  historyActionValidator,
  schemaStatusValidator,
  userRoleValidator,
} from "./lib/validators";

const schemaField = v.object({
  id: v.string(),
  slug: v.string(),
  name: v.string(),
  type: fieldTypeValidator,
  required: v.boolean(),
  config: v.optional(v.record(v.string(), v.any())),
});

export default defineSchema({
  cmsUsers: defineTable({
    authUserId: v.string(),
    email: v.string(),
    name: v.string(),
    image: v.optional(v.string()),
    role: userRoleValidator,
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_authUserId", ["authUserId"])
    .index("by_email", ["email"])
    .index("by_role", ["role"]),

  schemas: defineTable({
    slug: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    fields: v.array(schemaField),
    version: v.number(),
    status: schemaStatusValidator,
    locked: v.boolean(),
    descriptorVersion: v.number(),
    createdBy: v.id("cmsUsers"),
    updatedBy: v.id("cmsUsers"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_status", ["status"])
    .index("by_updatedAt", ["updatedAt"]),

  schemaVersions: defineTable({
    schemaId: v.id("schemas"),
    slug: v.string(),
    version: v.number(),
    snapshot: v.any(),
    action: historyActionValidator,
    changedBy: v.id("cmsUsers"),
    changedAt: v.number(),
    summary: v.string(),
  })
    .index("by_schemaId", ["schemaId"])
    .index("by_slug", ["slug"])
    .index("by_changedAt", ["changedAt"]),

  entries: defineTable({
    contentType: v.string(),
    draftData: v.any(),
    publishedData: v.optional(v.any()),
    hasPublished: v.boolean(),
    hasUnpublishedChanges: v.boolean(),
    version: v.number(),
    createdBy: v.id("cmsUsers"),
    updatedBy: v.id("cmsUsers"),
    createdAt: v.number(),
    updatedAt: v.number(),
    publishedAt: v.optional(v.number()),
    publishedBy: v.optional(v.id("cmsUsers")),
  })
    .index("by_contentType", ["contentType"])
    .index("by_contentType_updatedAt", ["contentType", "updatedAt"])
    .index("by_updatedAt", ["updatedAt"])
    .index("by_hasPublished", ["hasPublished"]),

  entryVersions: defineTable({
    entryId: v.id("entries"),
    contentType: v.string(),
    version: v.number(),
    draftData: v.any(),
    publishedData: v.optional(v.any()),
    action: historyActionValidator,
    changedBy: v.id("cmsUsers"),
    changedAt: v.number(),
    summary: v.string(),
  })
    .index("by_entryId", ["entryId"])
    .index("by_entryId_version", ["entryId", "version"])
    .index("by_changedAt", ["changedAt"]),

  mediaAssets: defineTable({
    name: v.string(),
    mimeType: v.string(),
    sizeBytes: v.number(),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    alt: v.optional(v.string()),
    tags: v.array(v.string()),
    storageId: v.optional(v.id("_storage")),
    url: v.optional(v.string()),
    uploadedBy: v.id("cmsUsers"),
    uploadedAt: v.number(),
  })
    .index("by_name", ["name"])
    .index("by_uploadedAt", ["uploadedAt"])
    .index("by_uploadedBy", ["uploadedBy"]),

  auditLog: defineTable({
    actorId: v.id("cmsUsers"),
    actorEmail: v.string(),
    actorName: v.string(),
    action: v.string(),
    resourceType: auditResourceTypeValidator,
    resource: v.string(),
    details: v.string(),
    correlationId: v.optional(v.string()),
    timestamp: v.number(),
    metadata: v.optional(v.any()),
  })
    .index("by_timestamp", ["timestamp"])
    .index("by_actorId", ["actorId"])
    .index("by_resourceType", ["resourceType"])
    .index("by_action", ["action"]),

  presenceSessions: defineTable({
    userId: v.id("cmsUsers"),
    resourceType: v.string(),
    resourceId: v.string(),
    displayName: v.string(),
    initials: v.string(),
    color: v.string(),
    lastSeenAt: v.number(),
    expiresAt: v.number(),
  })
    .index("by_resource", ["resourceType", "resourceId"])
    .index("by_user", ["userId"])
    .index("by_expiresAt", ["expiresAt"]),

  previewTokens: defineTable({
    entryId: v.id("entries"),
    token: v.string(),
    createdBy: v.id("cmsUsers"),
    createdAt: v.number(),
    expiresAt: v.number(),
    revokedAt: v.optional(v.number()),
  })
    .index("by_token", ["token"])
    .index("by_entryId", ["entryId"])
    .index("by_expiresAt", ["expiresAt"]),

  publishMetrics: defineTable({
    entryId: v.id("entries"),
    contentType: v.string(),
    startedAt: v.number(),
    completedAt: v.number(),
    durationMs: v.number(),
    correlationId: v.string(),
    actorId: v.id("cmsUsers"),
  })
    .index("by_completedAt", ["completedAt"])
    .index("by_entryId", ["entryId"]),

  rateLimitBuckets: defineTable({
    key: v.string(),
    count: v.number(),
    windowStart: v.number(),
  }).index("by_key", ["key"]),
});
