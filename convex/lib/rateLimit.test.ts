import { describe, expect, it } from "vitest";
import { isRateLimited, isWindowExpired } from "./rateLimit";

describe("rateLimit", () => {
  it("detects expired windows", () => {
    expect(isWindowExpired(0, 120_000, 60_000)).toBe(true);
    expect(isWindowExpired(100_000, 120_000, 60_000)).toBe(false);
  });

  it("detects when count exceeds max", () => {
    expect(isRateLimited(10, 10)).toBe(true);
    expect(isRateLimited(9, 10)).toBe(false);
  });
});
