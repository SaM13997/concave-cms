import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { AuthUser } from "./authValidators";
import type { Role } from "./permissions";

export type CmsUser = Doc<"cmsUsers">;

export async function getCmsUserByAuthId(
  ctx: QueryCtx | MutationCtx,
  authUserId: string,
): Promise<CmsUser | null> {
  return await ctx.db
    .query("cmsUsers")
    .withIndex("by_auth_user_id", (q) => q.eq("authUserId", authUserId))
    .unique();
}

export async function getOrCreateCmsUser(
  ctx: MutationCtx,
  authUser: AuthUser,
  defaultRole: Role = "editor",
): Promise<CmsUser> {
  const existing = await getCmsUserByAuthId(ctx, authUser._id);
  if (existing) {
    return existing;
  }

  const cmsUserId = await ctx.db.insert("cmsUsers", {
    authUserId: authUser._id,
    email: authUser.email,
    name: authUser.name,
    role: defaultRole,
  });

  const cmsUser = await ctx.db.get(cmsUserId);
  if (!cmsUser) {
    throw new Error("Failed to create CMS user profile");
  }

  return cmsUser;
}

export async function requireCmsUser(
  ctx: QueryCtx | MutationCtx,
  authUserId: string,
): Promise<CmsUser> {
  const cmsUser = await getCmsUserByAuthId(ctx, authUserId);
  if (!cmsUser) {
    throw new Error("CMS user profile not found");
  }
  return cmsUser;
}

export async function countAdmins(ctx: QueryCtx | MutationCtx): Promise<number> {
  const admins = await ctx.db
    .query("cmsUsers")
    .filter((q) => q.eq(q.field("role"), "admin"))
    .collect();
  return admins.length;
}

export async function setCmsUserRole(
  ctx: MutationCtx,
  cmsUserId: Id<"cmsUsers">,
  role: Role,
): Promise<void> {
  await ctx.db.patch(cmsUserId, { role });
}
