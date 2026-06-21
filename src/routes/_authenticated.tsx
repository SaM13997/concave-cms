import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: ({ context, location }) => {
    if (!context.userId) {
      throw redirect({
        to: "/login",
        search: { redirect: location.pathname },
      });
    }
  },
});
