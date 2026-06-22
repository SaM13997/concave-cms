import { describe, expect, it } from "vitest";
import {
  type Permission,
  permissionsForRole,
  requirePermission,
  roleHasPermission,
} from "./permissions";

const ALL_PERMISSIONS: Permission[] = [
  "schema:read",
  "schema:write",
  "content:read",
  "content:write",
];

describe("permissionsForRole", () => {
  it("grants admin all permissions", () => {
    expect(permissionsForRole("admin")).toEqual(ALL_PERMISSIONS);
  });

  it("grants editor content permissions only", () => {
    expect(permissionsForRole("editor")).toEqual(["content:read", "content:write"]);
  });
});

describe("roleHasPermission", () => {
  it.each([
    ["admin", "schema:read", true],
    ["admin", "schema:write", true],
    ["admin", "content:read", true],
    ["admin", "content:write", true],
    ["editor", "schema:read", false],
    ["editor", "schema:write", false],
    ["editor", "content:read", true],
    ["editor", "content:write", true],
  ] as const)("role %s permission %s => %s", (role, permission, expected) => {
    expect(roleHasPermission(role, permission)).toBe(expected);
  });
});

describe("requirePermission", () => {
  it("does not throw when permission is granted", () => {
    expect(() => requirePermission("admin", "schema:write")).not.toThrow();
    expect(() => requirePermission("editor", "content:write")).not.toThrow();
  });

  it("throws when permission is denied", () => {
    expect(() => requirePermission("editor", "schema:read")).toThrow(
      "Insufficient permissions: schema:read required",
    );
    expect(() => requirePermission("editor", "schema:write")).toThrow(
      "Insufficient permissions: schema:write required",
    );
  });
});

describe("RBAC matrix for sensitive mutations", () => {
  const sensitiveBoundaries = [
    { action: "getSchemaDraft", permission: "schema:read" as const },
    { action: "updateSchemaDraft", permission: "schema:write" as const },
    { action: "listContentEntries", permission: "content:read" as const },
    { action: "createContentEntry", permission: "content:write" as const },
  ];

  for (const { action, permission } of sensitiveBoundaries) {
    it(`admin can ${action}`, () => {
      expect(roleHasPermission("admin", permission)).toBe(true);
    });

    it(`editor ${permission.startsWith("schema") ? "cannot" : "can"} ${action}`, () => {
      const allowed = roleHasPermission("editor", permission);
      if (permission.startsWith("schema")) {
        expect(allowed).toBe(false);
      } else {
        expect(allowed).toBe(true);
      }
    });
  }
});
