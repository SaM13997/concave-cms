import { createFileRoute } from "@tanstack/react-router";
import { FileText, Image, Layers, Settings } from "lucide-react";
import { DashboardCard } from "@/components/home/DashboardCard";
import { UserButton } from "@/components/UserButton";
import { authClient } from "@/lib/auth-client";

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

export const Route = createFileRoute("/app/")({
  component: DashboardPage,
});

function DashboardPage() {
  const { data: session, isPending } = authClient.useSession();
  const user = session?.user ?? null;

  return (
    <>
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
        ) : null}
      </header>

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
    </>
  );
}
