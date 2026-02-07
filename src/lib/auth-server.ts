import { fetchAuth, getCookieNames } from "@convex-dev/better-auth/react-start";
import { getCookie, getRequest } from "@tanstack/react-start/server";
import { createAuth } from "convex/auth";
import { getClientEnv } from "./env";

const { VITE_CONVEX_SITE_URL } = getClientEnv();

export async function getServerAuth() {
  const request = getRequest();
  const { userId, token } = (await fetchAuth(request, {
    convexSiteUrl: VITE_CONVEX_SITE_URL,
  })) ?? { userId: undefined, token: undefined };

  return { userId, token };
}

export async function getServerSessionAuth() {
  const { sessionToken } = getCookieNames(createAuth);
  const token = getCookie(sessionToken);

  return {
    token,
  };
}
