import { v } from "convex/values";
import { roleHasPermission } from "./lib/permissions";
import { type AuthedRoleCtx, authedQueryWithRole } from "./lib/rbac";
import { rankSearchMatch, sortByScore } from "./lib/searchRanking";
import { globalSearchResultValidator } from "./lib/systemValidators";

const DEFAULT_LIMIT_PER_GROUP = 8;

export const globalSearch = authedQueryWithRole({
  args: {
    query: v.string(),
    limitPerGroup: v.optional(v.number()),
  },
  returns: globalSearchResultValidator,
  handler: async (ctx, args) => {
    const roleCtx = ctx as typeof ctx & AuthedRoleCtx;
    const query = args.query.trim();
    const limit = Math.min(args.limitPerGroup ?? DEFAULT_LIMIT_PER_GROUP, 20);

    if (query.length < 1) {
      return { groups: [] };
    }

    const groups: Array<{
      entityType: "content" | "schema" | "media";
      label: string;
      results: Array<{
        id: string;
        entityType: "content" | "schema" | "media";
        title: string;
        subtitle?: string;
        href: string;
        score: number;
      }>;
    }> = [];

    if (roleHasPermission(roleCtx.role, "content:read")) {
      const entries = await ctx.db
        .query("contentEntries")
        .withIndex("by_updated_at")
        .order("desc")
        .take(200);

      const contentResults = sortByScore(
        entries
          .map((entry) => {
            const score = rankSearchMatch(query, {
              primary: entry.title,
              secondary: entry.contentType,
            });
            return {
              id: entry._id,
              entityType: "content" as const,
              title: entry.title,
              subtitle: entry.contentType,
              href: `/content?type=${encodeURIComponent(entry.contentType)}&entry=${entry._id}`,
              score,
            };
          })
          .filter((item) => item.score > 0),
      ).slice(0, limit);

      if (contentResults.length > 0) {
        groups.push({
          entityType: "content",
          label: "Content",
          results: contentResults,
        });
      }
    }

    if (roleHasPermission(roleCtx.role, "schema:read")) {
      const schemas = await ctx.db.query("schemas").order("desc").take(100);

      const schemaResults = sortByScore(
        schemas
          .map((schema) => {
            const score = Math.max(
              rankSearchMatch(query, { primary: schema.name, secondary: schema.slug }),
              rankSearchMatch(query, { primary: schema.slug, secondary: schema.name }),
            );
            return {
              id: schema._id,
              entityType: "schema" as const,
              title: schema.name,
              subtitle: schema.slug,
              href: `/schema?table=${encodeURIComponent(schema.slug)}`,
              score,
            };
          })
          .filter((item) => item.score > 0),
      ).slice(0, limit);

      if (schemaResults.length > 0) {
        groups.push({
          entityType: "schema",
          label: "Schemas",
          results: schemaResults,
        });
      }
    }

    if (roleHasPermission(roleCtx.role, "content:read")) {
      const assets = await ctx.db
        .query("mediaAssets")
        .withIndex("by_created_at")
        .order("desc")
        .take(100);

      const mediaResults = sortByScore(
        assets
          .map((asset) => {
            const score = rankSearchMatch(query, {
              primary: asset.filename,
              secondary: asset.alt,
            });
            return {
              id: asset._id,
              entityType: "media" as const,
              title: asset.filename,
              subtitle: asset.mimeType,
              href: `/media?asset=${asset._id}`,
              score,
            };
          })
          .filter((item) => item.score > 0),
      ).slice(0, limit);

      if (mediaResults.length > 0) {
        groups.push({
          entityType: "media",
          label: "Media",
          results: mediaResults,
        });
      }
    }

    return { groups };
  },
});
