import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  schemas: defineTable({
    slug: v.string(),
    name: v.string(),
    fields: v.array(
      v.object({
        slug: v.string(),
        name: v.string(),
        type: v.union(
          v.literal("text"),
          v.literal("richtext"),
          v.literal("number"),
          v.literal("boolean"),
          v.literal("image"),
          v.literal("reference"),
          v.literal("date"),
          v.literal("select"),
          v.literal("json"),
        ),
        required: v.boolean(),
        config: v.any(),
      }),
    ),
    version: v.number(),
    status: v.union(v.literal("draft"), v.literal("active"), v.literal("archived")),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_status", ["status"]),

  entries: defineTable({
    contentType: v.string(),
    status: v.union(v.literal("draft"), v.literal("published")),
    data: v.any(),
    createdBy: v.id("users"),
    updatedBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
    publishedAt: v.optional(v.number()),
  })
    .index("by_contentType", ["contentType"])
    .index("by_contentType_status", ["contentType", "status"])
    .index("by_createdAt", ["createdAt"]),

  media: defineTable({
    key: v.string(),
    url: v.string(),
    name: v.string(),
    type: v.string(),
    size: v.number(),
    createdBy: v.id("users"),
    createdAt: v.number(),
  }).index("by_key", ["key"]),

  auditLog: defineTable({
    action: v.string(),
    entityType: v.string(),
    entityId: v.string(),
    userId: v.id("users"),
    changes: v.any(),
    timestamp: v.number(),
  })
    .index("by_entity", ["entityType", "entityId"])
    .index("by_timestamp", ["timestamp"]),

  presence: defineTable({
    userId: v.id("users"),
    entryId: v.id("entries"),
    lastSeen: v.number(),
  })
    .index("by_entry", ["entryId"])
    .index("by_user", ["userId"]),
});
