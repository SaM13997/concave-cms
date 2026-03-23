import { createClient } from "@convex-dev/better-auth";
import { convex, crossDomain } from "@convex-dev/better-auth/plugins";
import { betterAuth } from "better-auth";
import { emailOTP } from "better-auth/plugins";

import { components } from "./_generated/api";

export const betterAuthComponent = createClient(components.betterAuth);

type AuthContext = Parameters<typeof betterAuthComponent.adapter>[0];

function getPublicAuthUrl() {
  return process.env.SITE_URL ?? process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
}

function getAppOrigin() {
  return process.env.SITE_URL ?? process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
}

async function sendVerificationOTP({
  email,
  otp,
  type,
}: {
  email: string;
  otp: string;
  type: "sign-in" | "email-verification" | "forget-password";
}) {
  console.info(`[auth:${type}] OTP for ${email}: ${otp}`);
}

export function createAuth(ctx: AuthContext, _opts?: { optionsOnly?: boolean }) {
  return betterAuth({
    database: betterAuthComponent.adapter(ctx),
    baseURL: getPublicAuthUrl(),
    basePath: "/api/auth",
    secret: process.env.BETTER_AUTH_SECRET,
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
        siteUrl: getAppOrigin(),
      }),
      convex(),
    ],
  });
}
