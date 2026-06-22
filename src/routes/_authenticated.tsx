import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AdminChrome } from "@/components/admin/AdminChrome";
import { PresenceTracker } from "@/components/admin/PresenceIndicator";
import { BottomNav } from "@/components/BottomNav";
import { RoleBootstrap } from "@/components/role-bootstrap";
import { ToastProvider } from "@/lib/toast";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: ({ context, location }) => {
    if (!context.userId) {
      throw redirect({
        to: "/login",
        search: { redirect: location.pathname },
      });
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return (
    <ToastProvider>
      <button
        type="button"
        onClick={() => {
          document.getElementById("main-content")?.focus();
        }}
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:shadow-lg"
      >
        Skip to main content
      </button>
      <RoleBootstrap>
        <PresenceTracker />
        <AdminChrome>
          <main id="main-content" tabIndex={-1}>
            <Outlet />
          </main>
        </AdminChrome>
        <BottomNav />
      </RoleBootstrap>
    </ToastProvider>
  );
}
