import { describe, expect, it } from "vitest";
import { getSafeRedirect, isSafeRedirect } from "@/lib/auth";

describe("auth redirect helpers", () => {
  it("accepts safe relative paths", () => {
    expect(isSafeRedirect("/")).toBe(true);
    expect(isSafeRedirect("/dashboard")).toBe(true);
    expect(isSafeRedirect("/settings/profile?tab=profile")).toBe(true);
  });

  it("rejects unsafe or external paths", () => {
    expect(isSafeRedirect("https://example.com")).toBe(false);
    expect(isSafeRedirect("//example.com")).toBe(false);
    expect(isSafeRedirect("http://example.com")).toBe(false);
    expect(isSafeRedirect("javascript:alert(1)")).toBe(false);
    expect(isSafeRedirect("://example.com")).toBe(false);
    expect(isSafeRedirect("profile")).toBe(false);
  });

  it("getSafeRedirect returns undefined for unsafe values", () => {
    expect(getSafeRedirect("//example.com")).toBeUndefined();
    expect(getSafeRedirect("https://example.com")).toBeUndefined();
  });

  it("getSafeRedirect returns path for safe values", () => {
    expect(getSafeRedirect("/")).toBe("/");
    expect(getSafeRedirect("/content")).toBe("/content");
  });
});
