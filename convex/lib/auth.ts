import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { authComponent } from "../auth";
import { isAdminEmail } from "./config";
import { ForbiddenError, UnauthorizedError } from "./errors";
import type { Permission, UserRole } from "./permissions";
import { requirePermission } from "./permissions";

export type CmsUser = Doc<"cmsUsers">;

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) {
    return (parts[0]?.slice(0, 2) ?? "?").toUpperCase();
  }
  return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
}

function colorFromUserId(userId: string): string {
  const palette = [
    "bg-violet-500",
    "bg-emerald-500",
    "bg-sky-500",
    "bg-amber-500",
    "bg-rose-500",
    "bg-cyan-500",
  ];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash + userId.charCodeAt(i)) % palette.length;
  }
  return palette[hash] ?? "bg-slate-500";
}

export function getPresenceColor(userId: string): string {
  return colorFromUserId(userId);
}

export function getPresenceInitials(name: string): string {
  return initialsFromName(name);
}

async function getAuthIdentity(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null;
  }
  return identity;
}

export async function getAuthUserFromComponent(ctx: QueryCtx | MutationCtx) {
  return await authComponent.getAuthUser(ctx);
}

export async function syncCmsUser(ctx: MutationCtx): Promise<CmsUser> {
  const authUser = await getAuthUserFromComponent(ctx);
  if (!authUser) {
    throw new UnauthorizedError();
  }

  const authUserId = authUser.userId ?? authUser._id;
  const email = authUser.email;
  const name = authUser.name ?? email.split("@")[0] ?? "User";
  const now = Date.now();

  const existing = await ctx.db
    .query("cmsUsers")
    .withIndex("by_authUserId", (q) => q.eq("authUserId", authUserId))
    .unique();

  if (existing) {
    await ctx.db.patch(existing._id, {
      email,
      name,
      image: authUser.image ?? undefined,
      updatedAt: now,
    });
    const updated = await ctx.db.get(existing._id);
    if (!updated) {
      throw new Error("Failed to load CMS user after sync");
    }
    return updated;
  }

  const userCount = await ctx.db.query("cmsUsers").collect();
  const defaultRole: UserRole = userCount.length === 0 || isAdminEmail(email) ? "admin" : "editor";

  const userId = await ctx.db.insert("cmsUsers", {
    authUserId,
    email,
    name,
    image: authUser.image ?? undefined,
    role: defaultRole,
    createdAt: now,
    updatedAt: now,
  });

  const created = await ctx.db.get(userId);
  if (!created) {
    throw new Error("Failed to create CMS user");
  }
  return created;
}

export async function getCurrentCmsUser(ctx: QueryCtx | MutationCtx): Promise<CmsUser> {
  const identity = await getAuthIdentity(ctx);
  if (!identity) {
    throw new UnauthorizedError();
  }

  const authUser = await getAuthUserFromComponent(ctx);
  if (!authUser) {
    throw new UnauthorizedError();
  }

  const authUserId = authUser.userId ?? authUser._id;
  const user = await ctx.db
    .query("cmsUsers")
    .withIndex("by_authUserId", (q) => q.eq("authUserId", authUserId))
    .unique();

  if (!user) {
    throw new UnauthorizedError("CMS user profile not found. Call cmsUsers.sync first.");
  }

  return user;
}

export async function getCurrentCmsUserOrNull(
  ctx: QueryCtx | MutationCtx,
): Promise<CmsUser | null> {
  try {
    return await getCurrentCmsUser(ctx);
  } catch {
    return null;
  }
}

export async function requireCmsUserWithPermission(
  ctx: QueryCtx | MutationCtx,
  permission: Permission,
): Promise<CmsUser> {
  const user = await getCurrentCmsUser(ctx);
  try {
    requirePermission(user.role, permission);
  } catch {
    throw new ForbiddenError(`Insufficient permissions: ${permission}`);
  }
  return user;
}

export async function requireAdmin(ctx: QueryCtx | MutationCtx): Promise<CmsUser> {
  return await requireCmsUserWithPermission(ctx, "schema:write");
}

export function createCorrelationId(): string {
  return `corr_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export type AuditInput = {
  actor: CmsUser;
  action: string;
  resourceType: "schema" | "content" | "media" | "settings" | "auth";
  resource: string;
  details: string;
  correlationId?: string;
  metadata?: Record<string, unknown>;
};

export async function writeAuditEvent(
  ctx: MutationCtx,
  input: AuditInput,
): Promise<Id<"auditLog">> {
  return await ctx.db.insert("auditLog", {
    actorId: input.actor._id,
    actorEmail: input.actor.email,
    actorName: input.actor.name,
    action: input.action,
    resourceType: input.resourceType,
    resource: input.resource,
    details: input.details,
    correlationId: input.correlationId,
    timestamp: Date.now(),
    metadata: input.metadata,
  });
}
