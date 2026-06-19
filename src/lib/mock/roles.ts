export type UserRole = "admin" | "editor";

export type MockTeamMember = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

/**
 * BLOCKER(BE-001): Replace with server RBAC role from Convex session.
 * Client-side mock only — editors could bypass via devtools.
 */
export function getMockRole(email: string | undefined): UserRole {
  if (!email) {
    return "editor";
  }

  const normalized = email.toLowerCase();

  if (
    normalized.endsWith("@concave.dev") ||
    normalized.includes("+admin@") ||
    normalized.startsWith("admin@")
  ) {
    return "admin";
  }

  return "editor";
}

/** Alias used by settings and other pages. */
export function getMockRoleFromEmail(email: string | undefined): UserRole {
  return getMockRole(email);
}

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

/** BLOCKER(BE-001): Replace with team directory from Convex. */
export const mockTeamMembers: MockTeamMember[] = [
  {
    id: "member-alex",
    name: "Alex Admin",
    email: "admin@concave.dev",
    role: "admin",
  },
  {
    id: "member-eve",
    name: "Eve Editor",
    email: "eve@example.com",
    role: "editor",
  },
  {
    id: "member-sam",
    name: "Sam Editor",
    email: "sam@example.com",
    role: "editor",
  },
];
