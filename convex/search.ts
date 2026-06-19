import { v } from "convex/values";
import { authedQuery } from "./lib/customFunctions";
import { hasPermission } from "./lib/permissions";
import { searchResultValidator } from "./lib/validators";

function scoreMatch(haystack: string, query: string): number {
  const lower = haystack.toLowerCase();
  const q = query.toLowerCase();
  if (lower === q) return 100;
  if (lower.startsWith(q)) return 80;
  if (lower.includes(q)) return 50;
  return 0;
}

export const globalSearch = authedQuery({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(searchResultValidator),
  handler: async (ctx, args) => {
    if (!hasPermission(ctx.user.role, "search:global")) {
      return [];
    }

    const q = args.query.trim();
    const limit = Math.min(args.limit ?? 30, 100);
    if (!q) {
      return [];
    }

    const results: Array<{
      id: string;
      group: "content" | "schema" | "media";
      title: string;
      subtitle?: string;
      href: string;
      score: number;
    }> = [];

    if (hasPermission(ctx.user.role, "content:read")) {
      const entries = await ctx.db.query("entries").take(500);
      for (const entry of entries) {
        const data = entry.draftData as Record<string, unknown>;
        const title = String(data.title ?? data.name ?? entry._id);
        const haystack = `${title} ${entry.contentType}`;
        const score = scoreMatch(haystack, q);
        if (score > 0) {
          const status = entry.hasPublished
            ? entry.hasUnpublishedChanges
              ? "Unpublished changes"
              : "Published"
            : "Draft";
          results.push({
            id: `content-${entry._id}`,
            group: "content",
            title,
            subtitle: `${entry.contentType} · ${status}`,
            href: `/content/${entry.contentType}/${entry._id}`,
            score,
          });
        }
      }
    }

    if (hasPermission(ctx.user.role, "schema:read")) {
      const schemas = await ctx.db.query("schemas").collect();
      for (const schema of schemas) {
        const haystack = `${schema.name} ${schema.slug} ${schema.description ?? ""}`;
        const score = scoreMatch(haystack, q);
        if (score > 0) {
          results.push({
            id: `schema-${schema._id}`,
            group: "schema",
            title: schema.name,
            subtitle: `Table · ${schema.fields.length} fields`,
            href: `/schema/${schema.slug}`,
            score,
          });
        }
      }
    }

    if (hasPermission(ctx.user.role, "media:read")) {
      const assets = await ctx.db.query("mediaAssets").take(200);
      for (const asset of assets) {
        const haystack = `${asset.name} ${asset.tags.join(" ")}`;
        const score = scoreMatch(haystack, q);
        if (score > 0) {
          results.push({
            id: `media-${asset._id}`,
            group: "media",
            title: asset.name,
            subtitle: asset.mimeType,
            href: `/media?asset=${asset._id}`,
            score,
          });
        }
      }
    }

    return results.sort((a, b) => b.score - a.score).slice(0, limit);
  },
});
