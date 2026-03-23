import { convexClient, crossDomainClient } from "@convex-dev/better-auth/client/plugins";
import { emailOTPClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authBaseUrl = import.meta.env.VITE_CONVEX_SITE_URL ?? "https://example.convex.site";
export const authBasePath = "/api/auth";

export const authClient = createAuthClient({
  baseURL: authBaseUrl,
  basePath: authBasePath,
  plugins: [emailOTPClient(), convexClient(), crossDomainClient()],
});
