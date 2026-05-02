import { createClient } from "@convex-dev/better-auth";
import { convex, crossDomain } from "@convex-dev/better-auth/plugins";
import { betterAuth } from "better-auth";
import { emailOTP } from "better-auth/plugins";

import { components } from "./_generated/api";
import { getPublicUrl, requireEnv } from "./lib/env";
import { sendAuthOtpEmail } from "./lib/send-auth-otp";

export const betterAuthComponent = createClient(components.betterAuth);

type AuthContext = Parameters<typeof betterAuthComponent.adapter>[0];

async function sendVerificationOTP({
  email,
  otp,
  type,
}: {
  email: string;
  otp: string;
  type: "sign-in" | "email-verification" | "forget-password";
}) {
  await sendAuthOtpEmail({ email, otp, type });
}

export function createAuth(ctx: AuthContext, _opts?: { optionsOnly?: boolean }) {
  const publicUrl = getPublicUrl();

  return betterAuth({
    database: betterAuthComponent.adapter(ctx),
    baseURL: publicUrl,
    basePath: "/api/auth",
    secret: requireEnv("BETTER_AUTH_SECRET"),
    rateLimit: {
      storage: "database",
    },
    plugins: [
      emailOTP({
        expiresIn: 60 * 5,
        otpLength: 6,
        allowedAttempts: 3,
        sendVerificationOTP,
      }),
      crossDomain({
        siteUrl: publicUrl,
      }),
      convex(),
    ],
  });
}
