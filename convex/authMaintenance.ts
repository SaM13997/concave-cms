import { v } from "convex/values";
import { components } from "./_generated/api";
import { internalMutation } from "./_generated/server";

/** Dev-only: clear encrypted JWKS after BETTER_AUTH_SECRET changes. */
export const clearJwks = internalMutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    let deleted = 0;
    let cursor: string | null = null;
    let isDone = false;

    while (!isDone) {
      const result: {
        count: number;
        isDone: boolean;
        continueCursor: string;
      } = await ctx.runMutation(components.betterAuth.adapter.deleteMany, {
        input: { model: "jwks" },
        paginationOpts: { numItems: 100, cursor },
      });
      deleted += result.count;
      isDone = result.isDone;
      cursor = result.continueCursor;
    }

    return deleted;
  },
});
