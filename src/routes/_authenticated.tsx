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
      <RoleBootstrap />
      <PresenceTracker />
      <AdminChrome>
        <Outlet />
      </AdminChrome>
      <BottomNav />
    </ToastProvider>
  );
}
