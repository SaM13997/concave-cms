import type { Infer } from "convex/values";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import type { auditActionValidator } from "./systemValidators";

type AuditAction = Infer<typeof auditActionValidator>;

export async function writeAuditLog(
  ctx: MutationCtx,
  args: {
    action: AuditAction;
    resourceType: string;
    resourceId: string;
    actorId: Id<"cmsUsers">;
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  await ctx.db.insert("auditLog", {
    action: args.action,
    resourceType: args.resourceType,
    resourceId: args.resourceId,
    actorId: args.actorId,
    timestamp: Date.now(),
    metadata: args.metadata ?? {},
  });
}
