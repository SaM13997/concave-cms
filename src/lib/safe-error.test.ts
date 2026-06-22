import { describe, expect, it } from "vitest";
import { toSafeErrorMessage } from "./safe-error";

describe("safe-error", () => {
  it("returns safe known messages", () => {
    expect(toSafeErrorMessage(new Error("Not authenticated"))).toBe("Not authenticated");
    expect(toSafeErrorMessage(new Error("Too many requests. Please try again later."))).toBe(
      "Too many requests. Please try again later.",
    );
  });

  it("hides internal error details", () => {
    expect(toSafeErrorMessage(new Error("convex/server mutation failed at schemas.ts:42"))).toBe(
      "Something went wrong. Please try again.",
    );
  });

  it("handles rate limit and validation error names", () => {
    const rateLimit = new Error("Too many requests");
    rateLimit.name = "RateLimitError";
    expect(toSafeErrorMessage(rateLimit)).toBe("Too many requests");

    const validation = new Error("Invalid characters in Title");
    validation.name = "InputValidationError";
    expect(toSafeErrorMessage(validation)).toBe("Invalid characters in Title");
  });
});
