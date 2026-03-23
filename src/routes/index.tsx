import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, Image, Layers, type LucideIcon, Settings } from "lucide-react";

import { UserButton } from "@/components/UserButton";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

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
            <h3 className="text-sm font-medium text-card-foreground">{title}</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
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
  const { data: session, isPending } = authClient.useSession();
  const user = session?.user ?? null;

  if (!isPending && !user) {
    return (
      <div className="flex min-h-screen flex-col bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8">
        <header className="mx-auto flex w-full max-w-3xl items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Welcome to Concave
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">Convex-native headless CMS</p>
          </div>
          <Button asChild>
            <Link to="/sign-in">Sign in</Link>
          </Button>
        </header>

        <main className="mx-auto flex w-full max-w-3xl flex-1 items-center justify-center">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
            <h2 className="text-2xl font-semibold tracking-tight">
              Sign in to manage your content
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Concave uses email OTP sign-in for a lightweight admin workflow with no passwords to
              remember.
            </p>
            <Button asChild className="mt-6">
              <Link to="/sign-in">Continue to sign in</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8">
      {/* Header */}
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Welcome to Concave
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Convex-native headless CMS</p>
        </div>
        {isPending ? (
          <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
        ) : user ? (
          <UserButton user={user} />
        ) : (
          <Button asChild>
            <Link to="/sign-in">Sign in</Link>
          </Button>
        )}
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
    </div>
  );
}
