import { describe, expect, it } from "vitest";
import {
  assertSafeText,
  assertValidSlug,
  assertValidTitle,
  rejectInjectionPayload,
  sanitizeSearchQuery,
} from "./inputValidation";

describe("inputValidation", () => {
  it("sanitizes search queries", () => {
    expect(sanitizeSearchQuery("  hello  ")).toBe("hello");
    expect(sanitizeSearchQuery("x".repeat(300)).length).toBe(200);
  });

  it("rejects injection payloads", () => {
    expect(rejectInjectionPayload('<script>alert("xss")</script>')).toBe(true);
    expect(rejectInjectionPayload("hello world")).toBe(false);
  });

  it("validates titles", () => {
    expect(assertValidTitle("  Blog post  ")).toBe("Blog post");
    expect(() => assertValidTitle("   ")).toThrow("Title is required");
    expect(() => assertValidTitle('<img onerror="alert(1)">')).toThrow("Invalid characters");
  });

  it("validates slugs", () => {
    expect(assertValidSlug("blog-post")).toBe("blog-post");
    expect(() => assertValidSlug("Bad Slug")).toThrow("Slug must use");
  });

  it("assertSafeText enforces max length", () => {
    expect(() => assertSafeText("x".repeat(20_000), "Body")).toThrow("too long");
  });
});
