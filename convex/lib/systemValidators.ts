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
);

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
  v.literal("media.upload"),
  v.literal("presence.heartbeat"),
);

export const systemTableSummaryValidator = v.object({
  schemas: v.number(),
  schemaVersions: v.number(),
  contentEntries: v.number(),
  versionEvents: v.number(),
  mediaAssets: v.number(),
  auditLog: v.number(),
  presenceSessions: v.number(),
});

export const contentEntryListItemValidator = v.object({
  _id: v.id("contentEntries"),
  _creationTime: v.number(),
  contentType: v.string(),
  title: v.string(),
  status: entryStatusValidator,
  updatedAt: v.number(),
});

export const contentEntryDetailValidator = v.object({
  _id: v.id("contentEntries"),
  _creationTime: v.number(),
  contentType: v.string(),
  title: v.string(),
  status: entryStatusValidator,
  data: v.any(),
  createdBy: v.id("cmsUsers"),
  updatedBy: v.id("cmsUsers"),
  createdAt: v.number(),
  updatedAt: v.number(),
  publishedAt: v.optional(v.number()),
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
