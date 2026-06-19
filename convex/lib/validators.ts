import { v } from "convex/values";

export const userRoleValidator = v.union(v.literal("admin"), v.literal("editor"));

export const schemaStatusValidator = v.union(
  v.literal("draft"),
  v.literal("active"),
  v.literal("archived"),
);

export const fieldTypeValidator = v.union(
  v.literal("text"),
  v.literal("richtext"),
  v.literal("number"),
  v.literal("boolean"),
  v.literal("image"),
  v.literal("reference"),
  v.literal("date"),
  v.literal("select"),
  v.literal("json"),
);

export const schemaFieldValidator = v.object({
  id: v.string(),
  slug: v.string(),
  name: v.string(),
  type: fieldTypeValidator,
  required: v.boolean(),
  config: v.optional(v.record(v.string(), v.any())),
});

export const schemaDescriptorValidator = v.object({
  slug: v.string(),
  name: v.string(),
  description: v.optional(v.string()),
  fields: v.array(schemaFieldValidator),
  version: v.number(),
  status: schemaStatusValidator,
  locked: v.boolean(),
  descriptorVersion: v.number(),
});

export const auditResourceTypeValidator = v.union(
  v.literal("schema"),
  v.literal("content"),
  v.literal("media"),
  v.literal("settings"),
  v.literal("auth"),
);

export const historyActionValidator = v.union(
  v.literal("created"),
  v.literal("updated"),
  v.literal("published"),
  v.literal("reverted"),
  v.literal("schema_applied"),
);

export const cmsUserValidator = v.object({
  _id: v.id("cmsUsers"),
  _creationTime: v.number(),
  authUserId: v.string(),
  email: v.string(),
  name: v.string(),
  image: v.optional(v.string()),
  role: userRoleValidator,
  createdAt: v.number(),
  updatedAt: v.number(),
});

export const schemaDocValidator = v.object({
  _id: v.id("schemas"),
  _creationTime: v.number(),
  slug: v.string(),
  name: v.string(),
  description: v.optional(v.string()),
  fields: v.array(schemaFieldValidator),
  version: v.number(),
  status: schemaStatusValidator,
  locked: v.boolean(),
  descriptorVersion: v.number(),
  createdBy: v.id("cmsUsers"),
  updatedBy: v.id("cmsUsers"),
  createdAt: v.number(),
  updatedAt: v.number(),
});

export const entryDocValidator = v.object({
  _id: v.id("entries"),
  _creationTime: v.number(),
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
});

export const mediaAssetValidator = v.object({
  _id: v.id("mediaAssets"),
  _creationTime: v.number(),
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
});

export const auditEventValidator = v.object({
  _id: v.id("auditLog"),
  _creationTime: v.number(),
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
});

export const presenceSessionValidator = v.object({
  _id: v.id("presenceSessions"),
  _creationTime: v.number(),
  userId: v.id("cmsUsers"),
  resourceType: v.string(),
  resourceId: v.string(),
  displayName: v.string(),
  initials: v.string(),
  color: v.string(),
  lastSeenAt: v.number(),
  expiresAt: v.number(),
});

export const searchResultValidator = v.object({
  id: v.string(),
  group: v.union(v.literal("content"), v.literal("schema"), v.literal("media")),
  title: v.string(),
  subtitle: v.optional(v.string()),
  href: v.string(),
  score: v.number(),
});

export const fieldErrorValidator = v.object({
  path: v.string(),
  message: v.string(),
  fieldId: v.optional(v.string()),
});

export const entryVersionValidator = v.object({
  _id: v.id("entryVersions"),
  _creationTime: v.number(),
  entryId: v.id("entries"),
  version: v.number(),
  draftData: v.any(),
  publishedData: v.optional(v.any()),
  action: historyActionValidator,
  changedBy: v.id("cmsUsers"),
  changedAt: v.number(),
  summary: v.string(),
});
