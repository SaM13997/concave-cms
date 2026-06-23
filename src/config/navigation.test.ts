import { describe, expect, it } from "vitest";
import type { Permission } from "../../convex/lib/permissions";
import {
  dashboardSectionsForPermissions,
  hasAdminAccess,
  isPublicNavItem,
  navItemsForPermissions,
} from "./navigation";

const editorPermissions: Permission[] = ["content:read", "content:write"];
const adminPermissions: Permission[] = [
  "schema:read",
  "schema:write",
  "content:read",
  "content:write",
];

describe("navigation RBAC helpers", () => {
  it("treats schema:write as admin access", () => {
    expect(hasAdminAccess(adminPermissions)).toBe(true);
    expect(hasAdminAccess(editorPermissions)).toBe(false);
  });

  it("hides admin-only settings from bottom nav for editors", () => {
    const editorNav = navItemsForPermissions(editorPermissions);
    expect(editorNav.some((item) => item.href === "/settings")).toBe(false);
    expect(editorNav.some((item) => item.href === "/debug/system")).toBe(false);
    expect(editorNav.some((item) => item.href === "/debug/reactive")).toBe(false);
    expect(editorNav.some((item) => item.href === "/content")).toBe(true);
  });

  it("shows settings in bottom nav for admins", () => {
    const adminNav = navItemsForPermissions(adminPermissions);
    expect(adminNav.some((item) => item.href === "/settings")).toBe(true);
    expect(adminNav.some((item) => item.href === "/debug/system")).toBe(true);
    expect(adminNav.some((item) => item.href === "/debug/reactive")).toBe(true);
  });

  it("hides admin-only settings card from dashboard for editors", () => {
    const editorCards = dashboardSectionsForPermissions(editorPermissions);
    expect(editorCards.some((section) => section.href === "/settings")).toBe(false);
    expect(editorCards.some((section) => section.href === "/content")).toBe(true);
  });

  it("shows settings card on dashboard for admins", () => {
    const adminCards = dashboardSectionsForPermissions(adminPermissions);
    expect(adminCards.some((section) => section.href === "/settings")).toBe(true);
  });

  it("excludes gated items from public loading fallback", () => {
    expect(isPublicNavItem({ requiresAdmin: true })).toBe(false);
    expect(isPublicNavItem({ requiredPermission: "content:read" })).toBe(false);
    expect(isPublicNavItem({})).toBe(true);
  });
});
