/// <reference types="vite/client" />

import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import type { ConvexQueryClient } from "@convex-dev/react-query";
import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  redirect,
  Scripts,
  useRouteContext,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { createServerFn } from "@tanstack/react-start";
import type { ConvexReactClient } from "convex/react";
import type * as React from "react";
import { getSafeRedirect } from "@/lib/auth";
import { authClient } from "@/lib/auth-client";
import { getServerAuth, getServerSessionAuth } from "@/lib/auth-server";
import { BottomNav } from "../components/BottomNav";
import appCss from "../styles.css?url";

// Get auth information for SSR using available cookies
const fetchAuth = createServerFn({ method: "GET" }).handler(async () => {
  const auth = await getServerAuth();
  const sessionAuth = await getServerSessionAuth();

  return {
    userId: auth.userId,
    token: auth.token,
    sessionToken: sessionAuth.token,
  };
});

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
  convexClient: ConvexReactClient;
  convexQueryClient: ConvexQueryClient;
}>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico" },
    ],
  }),
  beforeLoad: async (ctx) => {
    // all queries, mutations and action made with TanStack Query will be
    // authenticated by an identity token.
    const { userId, token, sessionToken } = await fetchAuth();

    // During SSR only (the only time serverHttpClient exists),
    // set the auth token to make HTTP queries with.
    if (token) {
      ctx.context.convexQueryClient.serverHttpClient?.setAuth(token);
    }

    const isLoginRoute = ctx.location.pathname === "/login";

    if (!userId && !isLoginRoute) {
      const search = ctx.location.search as { redirect?: string | null };
      const next = getSafeRedirect(search.redirect);
      const redirectTarget = next ?? ctx.location.href;
      const reason = sessionToken ? "expired" : undefined;

      throw redirect({
        to: "/login",
        search: {
          redirect: redirectTarget,
          reason,
        },
      });
    }

    return { userId, token };
  },
  component: RootComponent,
});

function RootComponent() {
  const context = useRouteContext({ from: Route.id });
  return (
    <ConvexBetterAuthProvider client={context.convexClient} authClient={authClient}>
      <RootDocument>
        <Outlet />
      </RootDocument>
    </ConvexBetterAuthProvider>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body className="h-lvh flex flex-col overflow-x-clip w-full">
        <div className="flex-1 flex flex-col">{children}</div>
        <BottomNav />
        <TanStackDevtools
          config={{
            position: "bottom-right",
          }}
          plugins={[
            {
              name: "Tanstack Router",
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  );
}
