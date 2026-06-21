import { describe, expect, it } from "vitest";
import {
  getPostLoginPath,
  isPublicPath,
  sanitizeRedirectTarget,
  shouldProtectRoute,
} from "./auth-redirect";

describe("isPublicPath", () => {
  it("treats login and auth API routes as public", () => {
    expect(isPublicPath("/login")).toBe(true);
    expect(isPublicPath("/login/")).toBe(true);
    expect(isPublicPath("/api/auth/callback")).toBe(true);
  });

  it("treats admin routes as non-public", () => {
    expect(isPublicPath("/")).toBe(false);
    expect(isPublicPath("/settings")).toBe(false);
  });
});

describe("shouldProtectRoute", () => {
  it("requires auth for admin routes", () => {
    expect(shouldProtectRoute("/")).toBe(true);
    expect(shouldProtectRoute("/content")).toBe(true);
  });

  it("does not require auth for public routes", () => {
    expect(shouldProtectRoute("/login")).toBe(false);
    expect(shouldProtectRoute("/api/auth/session")).toBe(false);
  });
});

describe("sanitizeRedirectTarget", () => {
  it("allows safe relative paths", () => {
    expect(sanitizeRedirectTarget("/")).toBe("/");
    expect(sanitizeRedirectTarget("/content/123")).toBe("/content/123");
  });

  it("rejects open-redirect targets", () => {
    expect(sanitizeRedirectTarget(undefined)).toBeUndefined();
    expect(sanitizeRedirectTarget("")).toBeUndefined();
    expect(sanitizeRedirectTarget("https://evil.example")).toBeUndefined();
    expect(sanitizeRedirectTarget("//evil.example")).toBeUndefined();
    expect(sanitizeRedirectTarget("/login?next=https://evil.example")).toBe(
      "/login?next=https://evil.example",
    );
  });
});

describe("getPostLoginPath", () => {
  it("falls back when redirect is unsafe", () => {
    expect(getPostLoginPath("https://evil.example")).toBe("/");
    expect(getPostLoginPath("/dashboard")).toBe("/dashboard");
  });
});
