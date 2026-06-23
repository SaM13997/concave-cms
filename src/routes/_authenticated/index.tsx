import { createFileRoute, Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import {
  type DashboardSection,
  dashboardSections,
  dashboardSectionsForPermissions,
  isPublicNavItem,
} from "@/config/navigation";
import { useMyRole } from "@/hooks/use-my-role";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/")({
  component: HomePage,
});

function DashboardCard({
  icon: Icon,
  title,
  description,
  href,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  href: DashboardSection["href"];
}) {
  return (
    <Link
      to={href}
      viewTransition
      className={cn(
        "group relative cursor-pointer rounded-lg border border-border bg-card p-5",
        "transition-colors hover:border-muted-foreground/25 hover:bg-muted/40",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-card-foreground">{title}</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}

function HomePage() {
  const { permissions } = useMyRole();
  const visibleSections = permissions
    ? dashboardSectionsForPermissions(permissions)
    : dashboardSections.filter(isPublicNavItem);

  return (
    <AdminPageLayout
      title="Concave CMS"
      description="Convex-native headless CMS"
      className="pb-24"
      contentClassName="space-y-6"
    >
      <OnboardingWizard />

      <div className="grid gap-3 sm:grid-cols-2">
        {visibleSections.map((section) => (
          <DashboardCard
            key={section.title}
            icon={section.icon}
            title={section.title}
            description={section.description}
            href={section.href}
          />
        ))}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Keyboard: press{" "}
        <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">
          g
        </kbd>{" "}
        then a letter —{" "}
        <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">
          h
        </kbd>{" "}
        home,{" "}
        <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">
          c
        </kbd>{" "}
        content,{" "}
        <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">
          m
        </kbd>{" "}
        media,{" "}
        <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">
          s
        </kbd>{" "}
        schema
      </p>
    </AdminPageLayout>
  );
}
