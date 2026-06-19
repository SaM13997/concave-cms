import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, Image, Layers, type LucideIcon, Settings } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/")({
  component: DashboardPage,
});

const dashboardSections = [
  {
    icon: Layers,
    title: "Content Types",
    description: "Define and manage your content schemas",
    href: "/schema",
    adminOnly: true,
  },
  {
    icon: FileText,
    title: "Content Entries",
    description: "Create, edit, and publish content",
    href: "/content",
  },
  {
    icon: Image,
    title: "Media Library",
    description: "Upload and organize your assets",
    href: "/media",
  },
  {
    icon: Settings,
    title: "Settings",
    description: "Configure your CMS instance",
    href: "/settings",
    adminOnly: true,
  },
] as const;

function DashboardCard({
  icon: Icon,
  title,
  description,
  href,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      to={href}
      className={cn(
        "group relative rounded-lg border border-border bg-card p-5",
        "transition-colors hover:border-muted-foreground/25",
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
        <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          Soon
        </span>
      </div>
    </Link>
  );
}

function DashboardPage() {
  const { data: sessionData, isPending } = authClient.useSession();
  const user = sessionData?.user ?? null;
  const displayName = user?.name?.trim() || user?.email?.split("@")[0] || "there";

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
      <PageHeader
        title={isPending ? "Dashboard" : `Welcome back, ${displayName}`}
        description="Convex-native headless CMS"
        breadcrumbs={[{ label: "Dashboard" }]}
        actions={
          <Button variant="outline" size="sm" disabled>
            New entry
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2">
        {dashboardSections.map((section) => (
          <DashboardCard
            key={section.title}
            icon={section.icon}
            title={section.title}
            description={section.description}
            href={section.href}
          />
        ))}
      </div>
    </div>
  );
}
