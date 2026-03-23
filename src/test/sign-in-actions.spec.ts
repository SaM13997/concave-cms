import { beforeEach, describe, expect, it, vi } from "vitest";

const authClientMock = vi.hoisted(() => ({
  sendVerificationOtp: vi.fn(),
  signInEmailOtp: vi.fn(),
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    emailOtp: {
      sendVerificationOtp: authClientMock.sendVerificationOtp,
    },
    signIn: {
      emailOtp: authClientMock.signInEmailOtp,
    },
  },
}));

import { requestSignInCode, verifySignInCode } from "@/components/auth/sign-in-actions";

describe("sign-in actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requests an email OTP", async () => {
    authClientMock.sendVerificationOtp.mockResolvedValue({ data: null, error: null });

    const result = await requestSignInCode("hello@example.com");

    expect(authClientMock.sendVerificationOtp).toHaveBeenCalledWith({
      email: "hello@example.com",
      type: "sign-in",
    });
    expect(result).toEqual({ ok: true });
  });

  it("surfaces send-code errors", async () => {
    authClientMock.sendVerificationOtp.mockResolvedValue({
      data: null,
      error: { message: "Could not send code" },
    });

    const result = await requestSignInCode("hello@example.com");

    expect(result).toEqual({ ok: false, error: "Could not send code" });
  });

  it("submits the OTP for sign in", async () => {
    authClientMock.signInEmailOtp.mockResolvedValue({ data: null, error: null });

    const result = await verifySignInCode("hello@example.com", "123456");

    expect(authClientMock.signInEmailOtp).toHaveBeenCalledWith({
      email: "hello@example.com",
      otp: "123456",
    });
    expect(result).toEqual({ ok: true });
  });

  it("surfaces verify-code errors", async () => {
    authClientMock.signInEmailOtp.mockResolvedValue({
      data: null,
      error: { message: "Invalid or expired code" },
    });

    const result = await verifySignInCode("hello@example.com", "123456");

    expect(result).toEqual({ ok: false, error: "Invalid or expired code" });
  });
});
