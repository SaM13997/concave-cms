import { authClient } from "@/lib/auth-client";

function getErrorMessage(error: unknown, fallback: string) {
  if (
    typeof error === "object" &&
    error &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return fallback;
}

export async function requestSignInCode(email: string) {
  const result = await authClient.emailOtp.sendVerificationOtp({
    email,
    type: "sign-in",
  });

  if (result.error) {
    return {
      ok: false as const,
      error: getErrorMessage(result.error, "Could not send code"),
    };
  }

  return { ok: true as const };
}

export async function verifySignInCode(email: string, otp: string) {
  const result = await authClient.signIn.emailOtp({ email, otp });

  if (result.error) {
    return {
      ok: false as const,
      error: getErrorMessage(result.error, "Invalid or expired code"),
    };
  }

  return { ok: true as const };
}
