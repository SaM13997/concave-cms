import { v } from "convex/values";

export const roleValidator = v.union(v.literal("admin"), v.literal("editor"));

export type Role = "admin" | "editor";

export const permissionValidator = v.union(
  v.literal("schema:read"),
  v.literal("schema:write"),
  v.literal("content:read"),
  v.literal("content:write"),
);

export type Permission = "schema:read" | "schema:write" | "content:read" | "content:write";

const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  admin: ["schema:read", "schema:write", "content:read", "content:write"],
  editor: ["content:read", "content:write"],
};

export function permissionsForRole(role: Role): readonly Permission[] {
  return ROLE_PERMISSIONS[role];
}

export function roleHasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function requirePermission(role: Role, permission: Permission): void {
  if (!roleHasPermission(role, permission)) {
    throw new Error(`Insufficient permissions: ${permission} required`);
  }
}
