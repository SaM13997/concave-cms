import { v } from "convex/values";
import { createCorrelationId, writeAuditEvent } from "./lib/auth";
import { authedMutation, authedQuery } from "./lib/customFunctions";
import { ConflictError, NotFoundError } from "./lib/errors";
import { entryDocValidator, entryVersionValidator } from "./lib/validators";

export const compareVersions = authedQuery({
  args: {
    entryId: v.id("entries"),
    fromVersion: v.number(),
    toVersion: v.number(),
  },
  returns: v.object({
    from: v.union(entryVersionValidator, v.null()),
    to: v.union(entryVersionValidator, v.null()),
    changedFields: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    const versions = await ctx.db
      .query("entryVersions")
      .withIndex("by_entryId", (q) => q.eq("entryId", args.entryId))
      .collect();

    const from = versions.find((v) => v.version === args.fromVersion) ?? null;
    const to = versions.find((v) => v.version === args.toVersion) ?? null;

    const changedFields: string[] = [];
    if (from && to) {
      const fromData = (from.draftData ?? {}) as Record<string, unknown>;
      const toData = (to.draftData ?? {}) as Record<string, unknown>;
      const keys = new Set([...Object.keys(fromData), ...Object.keys(toData)]);
      for (const key of keys) {
        if (JSON.stringify(fromData[key]) !== JSON.stringify(toData[key])) {
          changedFields.push(key);
        }
      }
    }

    return { from, to, changedFields };
  },
});

export const revertToVersion = authedMutation({
  args: {
    entryId: v.id("entries"),
    targetVersion: v.number(),
    expectedVersion: v.number(),
  },
  returns: entryDocValidator,
  handler: async (ctx, args) => {
    const entry = await ctx.db.get(args.entryId);
    if (!entry) {
      throw new NotFoundError("Entry");
    }
    if (entry.version !== args.expectedVersion) {
      throw new ConflictError("Entry version conflict. Refresh and try again.");
    }

    const target = await ctx.db
      .query("entryVersions")
      .withIndex("by_entryId_version", (q) =>
        q.eq("entryId", args.entryId).eq("version", args.targetVersion),
      )
      .unique();

    if (!target) {
      throw new NotFoundError("Target version");
    }

    const now = Date.now();
    const nextVersion = entry.version + 1;
    await ctx.db.patch(args.entryId, {
      draftData: target.draftData,
      hasUnpublishedChanges: entry.hasPublished,
      version: nextVersion,
      updatedBy: ctx.user._id,
      updatedAt: now,
    });

    const reverted = await ctx.db.get(args.entryId);
    if (!reverted) {
      throw new Error("Failed to revert entry");
    }

    await ctx.db.insert("entryVersions", {
      entryId: reverted._id,
      contentType: reverted.contentType,
      version: reverted.version,
      draftData: reverted.draftData,
      publishedData: reverted.publishedData,
      action: "reverted",
      changedBy: ctx.user._id,
      changedAt: now,
      summary: `Reverted to version ${args.targetVersion}`,
    });

    await writeAuditEvent(ctx, {
      actor: ctx.user,
      action: "content.revert",
      resourceType: "content",
      resource: `${reverted.contentType}/${args.entryId}`,
      details: `Reverted to version ${args.targetVersion}`,
      correlationId: createCorrelationId(),
      metadata: { targetVersion: args.targetVersion },
    });

    return reverted;
  },
});
