import { v } from "convex/values";

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
  slug: v.string(),
  name: v.string(),
  type: fieldTypeValidator,
  required: v.boolean(),
  config: v.record(v.string(), v.any()),
});

export const schemaStatusValidator = v.union(
  v.literal("draft"),
  v.literal("active"),
  v.literal("archived"),
  v.literal("apply_failed"),
);

export const schemaValidationErrorValidator = v.object({
  code: v.string(),
  message: v.string(),
  field: v.optional(v.string()),
});

export const destructiveChangeValidator = v.object({
  type: v.union(
    v.literal("delete_field"),
    v.literal("delete_table"),
    v.literal("change_field_type"),
    v.literal("remove_required"),
  ),
  target: v.string(),
  affectedEntryCount: v.number(),
  message: v.string(),
});

export const schemaDescriptorValidator = v.object({
  slug: v.string(),
  name: v.string(),
  fields: v.array(schemaFieldValidator),
  descriptorVersion: v.number(),
  version: v.number(),
  status: schemaStatusValidator,
  createdAt: v.number(),
  updatedAt: v.number(),
});

export const entryStatusValidator = v.union(v.literal("draft"), v.literal("published"));

export const versionEntityTypeValidator = v.union(
  v.literal("schema"),
  v.literal("entry"),
  v.literal("media"),
);

export const versionEventTypeValidator = v.union(
  v.literal("created"),
  v.literal("updated"),
  v.literal("published"),
  v.literal("reverted"),
  v.literal("archived"),
);

export const auditActionValidator = v.union(
  v.literal("schema.create"),
  v.literal("schema.update"),
  v.literal("schema.apply"),
  v.literal("content.create"),
  v.literal("content.update"),
  v.literal("content.publish"),
  v.literal("content.revert"),
  v.literal("media.upload"),
  v.literal("presence.heartbeat"),
);

export const contentEntrySnapshotValidator = v.object({
  title: v.string(),
  data: v.any(),
  status: entryStatusValidator,
  draftRevision: v.number(),
  publishedRevision: v.optional(v.number()),
  publishedTitle: v.optional(v.string()),
  publishedData: v.optional(v.any()),
  hasUnpublishedChanges: v.boolean(),
});

export const contentDiffEntryValidator = v.object({
  path: v.string(),
  kind: v.union(v.literal("added"), v.literal("removed"), v.literal("changed")),
  before: v.optional(v.any()),
  after: v.optional(v.any()),
});

export const contentHistoryItemValidator = v.object({
  _id: v.id("versionEvents"),
  eventType: versionEventTypeValidator,
  summary: v.string(),
  actorId: v.id("cmsUsers"),
  actorName: v.string(),
  timestamp: v.number(),
  snapshot: contentEntrySnapshotValidator,
});

export const contentCompareResultValidator = v.object({
  leftEventId: v.id("versionEvents"),
  rightEventId: v.id("versionEvents"),
  leftSummary: v.string(),
  rightSummary: v.string(),
  diffs: v.array(contentDiffEntryValidator),
});

export const systemTableSummaryValidator = v.object({
  schemas: v.number(),
  schemaVersions: v.number(),
  contentEntries: v.number(),
  versionEvents: v.number(),
  mediaAssets: v.number(),
  auditLog: v.number(),
  presenceSessions: v.number(),
  previewTokens: v.number(),
  publishMetrics: v.number(),
});

export const contentEntryListItemValidator = v.object({
  _id: v.id("contentEntries"),
  _creationTime: v.number(),
  contentType: v.string(),
  title: v.string(),
  status: entryStatusValidator,
  hasUnpublishedChanges: v.boolean(),
  updatedAt: v.number(),
});

export const richTextValueValidator = v.object({
  format: v.literal("html"),
  html: v.string(),
});

export const resolvedReferenceValidator = v.object({
  _id: v.id("contentEntries"),
  title: v.string(),
  contentType: v.string(),
});

export const resolvedMediaValidator = v.object({
  _id: v.id("mediaAssets"),
  filename: v.string(),
  url: v.union(v.string(), v.null()),
  alt: v.optional(v.string()),
});

export const contentTypeDescriptorValidator = v.object({
  slug: v.string(),
  name: v.string(),
  fields: v.array(schemaFieldValidator),
});

export const contentEntryDetailValidator = v.object({
  _id: v.id("contentEntries"),
  _creationTime: v.number(),
  contentType: v.string(),
  title: v.string(),
  status: entryStatusValidator,
  data: v.any(),
  publishedTitle: v.optional(v.string()),
  publishedData: v.optional(v.any()),
  hasUnpublishedChanges: v.boolean(),
  draftRevision: v.number(),
  publishedRevision: v.optional(v.number()),
  schemaFields: v.array(schemaFieldValidator),
  resolvedReferences: v.record(v.string(), v.union(resolvedReferenceValidator, v.null())),
  resolvedMedia: v.record(v.string(), v.union(resolvedMediaValidator, v.null())),
  createdBy: v.id("cmsUsers"),
  updatedBy: v.id("cmsUsers"),
  createdAt: v.number(),
  updatedAt: v.number(),
  publishedAt: v.optional(v.number()),
});

export const publicContentViewValidator = v.object({
  _id: v.id("contentEntries"),
  contentType: v.string(),
  title: v.string(),
  data: v.any(),
  publishedAt: v.optional(v.number()),
  isPreview: v.boolean(),
});

export const previewTokenListItemValidator = v.object({
  _id: v.id("previewTokens"),
  token: v.string(),
  draftRevision: v.number(),
  expiresAt: v.number(),
  revokedAt: v.optional(v.number()),
  createdAt: v.number(),
  isExpired: v.boolean(),
  isRevoked: v.boolean(),
  isStale: v.boolean(),
});

export const publishResultValidator = v.object({
  entry: contentEntryListItemValidator,
  publishDurationMs: v.number(),
});

export const referenceOptionValidator = v.object({
  _id: v.id("contentEntries"),
  title: v.string(),
  contentType: v.string(),
});

export const mediaAssetListItemValidator = v.object({
  _id: v.id("mediaAssets"),
  _creationTime: v.number(),
  filename: v.string(),
  mimeType: v.string(),
  sizeBytes: v.number(),
  alt: v.optional(v.string()),
  url: v.union(v.string(), v.null()),
  createdAt: v.number(),
});

export const schemaListItemValidator = v.object({
  _id: v.id("schemas"),
  _creationTime: v.number(),
  slug: v.string(),
  name: v.string(),
  status: schemaStatusValidator,
  version: v.number(),
  updatedAt: v.number(),
});

export const debugCounterItemValidator = v.object({
  _id: v.id("debugCounters"),
  _creationTime: v.number(),
  label: v.string(),
  value: v.number(),
  updatedAt: v.number(),
});
