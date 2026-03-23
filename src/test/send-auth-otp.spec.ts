import { describe, expect, it, vi } from "vitest";

import { sendAuthOtpEmail } from "../../convex/lib/send-auth-otp";

describe("sendAuthOtpEmail", () => {
  it("logs OTPs in non-production environments", async () => {
    const log = vi.fn();

    await sendAuthOtpEmail(
      {
        email: "hello@example.com",
        otp: "123456",
        type: "sign-in",
      },
      {
        env: "development",
        log,
      },
    );

    expect(log).toHaveBeenCalledWith("[auth:sign-in] OTP for hello@example.com: 123456");
  });

  it("throws in production without a configured mail transport", async () => {
    await expect(
      sendAuthOtpEmail(
        {
          email: "hello@example.com",
          otp: "123456",
          type: "sign-in",
        },
        {
          env: "production",
          log: vi.fn(),
        },
      ),
    ).rejects.toThrow("No auth email transport configured for production");
  });
});
