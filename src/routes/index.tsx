import { createFileRoute, Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { UserButton } from "@/components/User-button";
import {
  Layers,
  FileText,
  Image,
  Settings,
  type LucideIcon,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: HomePage,
});

const dashboardSections = [
  {
    icon: Layers,
    title: "Content Types",
    description: "Define and manage your content schemas",
  },
  {
    icon: FileText,
    title: "Content Entries",
    description: "Create, edit, and publish content",
  },
  {
    icon: Image,
    title: "Media Library",
    description: "Upload and organize your assets",
  },
  {
    icon: Settings,
    title: "Settings",
    description: "Configure your CMS instance",
  },
] as const;

function DashboardCard({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div
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
            <h3 className="text-sm font-medium text-card-foreground">
              {title}
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {description}
            </p>
          </div>
        </div>
        <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          Soon
        </span>
      </div>
    </div>
  );
}

function HomePage() {
  const { data: sessionData, isPending } = authClient.useSession();

  const user = sessionData?.user ?? null;
  const isAuthenticated = !!sessionData?.session;
  const displayName =
    (user?.name && user.name.trim()) ||
    (user?.email && user.email.split("@")[0]) ||
    null;

  return (
    <div className="flex min-h-screen flex-col bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8">
      {/* Header */}
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between">
        <div>
          {isPending ? (
            <div className="h-7 w-48 animate-pulse rounded bg-muted" />
          ) : (
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              {isAuthenticated && displayName
                ? `Welcome back, ${displayName}`
                : "Welcome to Concave"}
            </h1>
          )}
          <p className="mt-1 text-sm text-muted-foreground">
            Convex-native headless CMS
          </p>
        </div>
        {isAuthenticated && <UserButton />}
      </header>

      {/* Dashboard Grid */}
      <main className="mx-auto mt-8 w-full max-w-3xl flex-1">
        <div className="grid gap-3 sm:grid-cols-2">
          {dashboardSections.map((section) => (
            <DashboardCard
              key={section.title}
              icon={section.icon}
              title={section.title}
              description={section.description}
            />
          ))}
        </div>
      </main>

      {/* Auth CTA */}
      {!isPending && !isAuthenticated && (
        <div className="mx-auto mt-8 w-full max-w-3xl">
          <div className="rounded-lg border border-border bg-card p-5 text-center">
            <p className="text-sm text-muted-foreground">
              Sign in to start managing your content.
            </p>
            <Button asChild variant="default" size="sm" className="mt-3">
              <Link to="/login">Sign in</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
