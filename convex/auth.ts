import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { betterAuth } from "better-auth";
import { v } from "convex/values";
import { components } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { query } from "./_generated/server";

const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";
const googleClientId = process.env.GOOGLE_CLIENT_ID!;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET!;

export const authComponent = createClient<DataModel>(components.betterAuth);

export const createAuth = (
  ctx: GenericCtx<DataModel>,
  { optionsOnly } = { optionsOnly: false },
) => {
  return betterAuth({
    logger: {
      disabled: optionsOnly,
    },
    baseURL: siteUrl,
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    socialProviders: {
      google: {
        clientId: googleClientId,
        clientSecret: googleClientSecret,
      },
    },
    plugins: [convex()],
  });
};

const authUserValidator = v.union(
  v.object({
    _id: v.string(),
    userId: v.optional(v.string()),
    email: v.string(),
    name: v.optional(v.string()),
    image: v.optional(v.union(v.string(), v.null())),
  }),
  v.null(),
);

export const getCurrentUser = query({
  args: {},
  returns: authUserValidator,
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      return null;
    }
    return {
      _id: user._id,
      userId: user.userId ?? undefined,
      email: user.email,
      name: user.name ?? undefined,
      image: user.image ?? undefined,
    };
  },
});
