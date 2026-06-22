export type UserRole = "admin" | "editor";

export function getRoleLabel(role: UserRole): string {
  return role === "admin" ? "Admin" : "Editor";
}

export function getRoleDescription(role: UserRole): string {
  return role === "admin"
    ? "Full access including schema, settings, and audit."
    : "Can manage content and media.";
}

export function isAdminRole(role: UserRole): boolean {
  return role === "admin";
}

export function canManageSchema(role: UserRole): boolean {
  return isAdminRole(role);
}

/** Conservative default while the CMS profile is still loading. */
export function getDefaultRole(): UserRole {
  return "editor";
}
