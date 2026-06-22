import { v } from "convex/values";
import { authComponent, createAuth } from "./auth";
import { authedMutation, requireAuthUser } from "./lib/auth";
import { getOrCreateCmsUser } from "./lib/cmsUsers";
import { enforceRateLimit } from "./lib/rateLimit";

export const updateUserPassword = authedMutation({
  args: {
    currentPassword: v.string(),
    newPassword: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireAuthUser(ctx);
    const cmsUser = await getOrCreateCmsUser(ctx, user);
    await enforceRateLimit(ctx, "auth", cmsUser._id);

    const { auth, headers } = await authComponent.getAuth(createAuth, ctx);
    await auth.api.changePassword({
      body: {
        currentPassword: args.currentPassword,
        newPassword: args.newPassword,
      },
      headers,
    });
    return null;
  },
});
