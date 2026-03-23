import { describe, expect, it } from "vitest";

import { authBasePath, authBaseUrl, authClient } from "@/lib/auth-client";

describe("authClient", () => {
  it("exposes the email OTP and Convex auth helpers", () => {
    expect(authBaseUrl).toMatch(/^https:\/\//);
    expect(authBasePath).toBe("/api/auth");
    expect(typeof authClient.emailOtp.sendVerificationOtp).toBe("function");
    expect(typeof authClient.signIn.emailOtp).toBe("function");
    expect(typeof authClient.convex.token).toBe("function");
  });
});
