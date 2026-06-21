import { v } from "convex/values";
import { authComponent, createAuth } from "./auth";
import { authedMutation } from "./lib/auth";

export const updateUserPassword = authedMutation({
  args: {
    currentPassword: v.string(),
    newPassword: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
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
