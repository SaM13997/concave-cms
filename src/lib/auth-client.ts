import { convexClient, crossDomainClient } from "@convex-dev/better-auth/client/plugins";
import { emailOTPClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import { getClientEnv } from "./env";

export const authBaseUrl = getClientEnv().VITE_CONVEX_SITE_URL;
export const authBasePath = "/api/auth";

export const authClient = createAuthClient({
  baseURL: authBaseUrl,
  basePath: authBasePath,
  plugins: [emailOTPClient(), convexClient(), crossDomainClient()],
});
