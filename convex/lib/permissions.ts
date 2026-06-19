export type UserRole = "admin" | "editor";

export type Permission =
  | "schema:read"
  | "schema:write"
  | "schema:apply"
  | "schema:export"
  | "content:read"
  | "content:write"
  | "content:publish"
  | "content:revert"
  | "media:read"
  | "media:write"
  | "audit:read"
  | "search:global"
  | "presence:write"
  | "preview:create"
  | "users:manage";

const ROLE_PERMISSIONS: Record<UserRole, ReadonlySet<Permission>> = {
  admin: new Set<Permission>([
    "schema:read",
    "schema:write",
    "schema:apply",
    "schema:export",
    "content:read",
    "content:write",
    "content:publish",
    "content:revert",
    "media:read",
    "media:write",
    "audit:read",
    "search:global",
    "presence:write",
    "preview:create",
    "users:manage",
  ]),
  editor: new Set<Permission>([
    "content:read",
    "content:write",
    "content:publish",
    "content:revert",
    "media:read",
    "media:write",
    "search:global",
    "presence:write",
    "preview:create",
    "schema:read",
  ]),
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].has(permission);
}

export function requirePermission(role: UserRole, permission: Permission): void {
  if (!hasPermission(role, permission)) {
    throw new Error(`Insufficient permissions: ${permission}`);
  }
}

export function canManageSchema(role: UserRole): boolean {
  return hasPermission(role, "schema:write");
}
