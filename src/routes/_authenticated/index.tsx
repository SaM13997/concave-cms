import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CircleDashed,
  Clock3,
  FileText,
  Image,
  Layers,
  type LucideIcon,
  ScanSearch,
  Settings,
  Sparkles,
} from "lucide-react";
import { useMemo } from "react";
import { useCmsUser, useUserRole } from "@/components/CmsUserProvider";
import { PageHeader } from "@/components/PageHeader";
import { useSchemaStore } from "@/components/schema/SchemaProvider";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { deriveEntryStatus, mapSchemaToContentType } from "@/lib/content/live";
import { api, useQueries, useQuery } from "@/lib/convex/hooks";

export const Route = createFileRoute("/_authenticated/")({
  component: DashboardPage,
});

const dashboardSections = [
  {
    icon: Layers,
    title: "Visual schema engine",
    description: "Define collections, relationships, and field guardrails without leaving the app.",
    href: "/schema",
    eyebrow: "Marketer mode",
  },
  {
    icon: FileText,
    title: "Shadow draft lifecycle",
    description:
      "Edit drafts safely, compare versions, and publish without leaking unfinished work.",
    href: "/content",
    eyebrow: "Content engine",
  },
  {
    icon: Image,
    title: "Media operations",
    description: "Keep campaign assets close to content, with upload provenance and typed search.",
    href: "/media",
    eyebrow: "Asset library",
  },
  {
    icon: Settings,
    title: "Governance and access",
    description: "Review roles, environment details, and export paths for self-hosted teams.",
    href: "/settings",
    eyebrow: "Ops ready",
  },
] as const;

function DashboardPage() {
  const { data: sessionData, isPending } = authClient.useSession();
  const { tables } = useSchemaStore();
  const me = useCmsUser();
  const role = useUserRole();
  const activeSchemas = useQuery(api.schemas.list, { status: "active" });
  const user = sessionData?.user ?? null;
  const displayName = user?.name?.trim() || user?.email?.split("@")[0] || "team";
  const contentTypes = useMemo(
    () => (activeSchemas ?? []).map(mapSchemaToContentType),
    [activeSchemas],
  );
  const entryRequests = useMemo(
    () =>
      Object.fromEntries(
        contentTypes.map((type) => [
          type.slug,
          {
            query: api.entries.listByType,
            args: {
              contentType: type.slug,
              paginationOpts: {
                cursor: null,
                numItems: 1000,
              },
            },
          },
        ]),
      ),
    [contentTypes],
  );
  const entryResults = useQueries(entryRequests);
  const mediaSnapshot = useQuery(api.media.list, {
    paginationOpts: {
      cursor: null,
      numItems: 100,
    },
  });
  const auditSnapshot = useQuery(
    api.auditLog.list,
    me?.role === "admin"
      ? {
          paginationOpts: {
            cursor: null,
            numItems: 100,
          },
        }
      : "skip",
  );

  const { draftCount, publishedCount } = useMemo(() => {
    let drafts = 0;
    let published = 0;

    for (const type of contentTypes) {
      const result = entryResults[type.slug];
      if (!result || result instanceof Error) {
        continue;
      }

      for (const entry of result.page) {
        if (deriveEntryStatus(entry) === "published") {
          published += 1;
        } else {
          drafts += 1;
        }
      }
    }

    return { draftCount: drafts, publishedCount: published };
  }, [contentTypes, entryResults]);

  const mediaCountLabel =
    mediaSnapshot === undefined
      ? "..."
      : mediaSnapshot.isDone
        ? String(mediaSnapshot.page.length)
        : `${mediaSnapshot.page.length}+`;
  const auditCountLabel =
    me === undefined
      ? "..."
      : role !== "admin"
        ? "Admin only"
        : auditSnapshot === undefined
          ? "..."
          : auditSnapshot.isDone
            ? String(auditSnapshot.page.length)
            : `${auditSnapshot.page.length}+`;

  return (
    <div className="app-grid">
      <section className="app-panel rounded-[2rem] px-6 py-6 sm:px-8 sm:py-8">
        <PageHeader
          eyebrow="Concave command surface"
          title={isPending ? "Convex-native content operations." : `Welcome back, ${displayName}.`}
          description="Schema is the source of truth here. Shape content types visually, move drafts through review, and publish to reactive frontends without sync jobs or stale APIs."
          actions={
            <>
              <Button asChild variant="outline" className="rounded-full bg-white/80">
                <Link to="/onboarding">Run onboarding</Link>
              </Button>
              <Button asChild className="rounded-full">
                <Link to="/schema">
                  Open builder
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
            </>
          }
        />

        <div className="mt-8 grid gap-3 lg:grid-cols-[minmax(0,1.7fr)_minmax(18rem,1fr)]">
          <div className="grid gap-3 sm:grid-cols-3">
            <MetricCard
              label="Collections staged"
              value={String(tables.length)}
              note="Visual and code views stay aligned."
              tone="mint"
            />
            <MetricCard
              label="Draft-safe entries"
              value={String(draftCount)}
              note="Unpublished edits are isolated from production."
              tone="yellow"
            />
            <MetricCard
              label="Published records"
              value={String(publishedCount)}
              note="Reactive consumers see changes instantly."
              tone="peach"
            />
          </div>

          <div className="app-panel-soft rounded-[1.7rem] px-5 py-5">
            <div className="flex items-center gap-3">
              <div className="grid size-11 place-items-center rounded-2xl bg-white shadow-sm">
                <ScanSearch className="size-5 text-foreground" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Launch readiness</p>
                <p className="text-xs text-muted-foreground">
                  Core admin flows are reading live backend data.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {[
                `Schema builder collections: ${tables.length}`,
                `Media items indexed: ${mediaCountLabel}`,
                `Audit events visible: ${auditCountLabel}`,
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-2xl bg-white/75 px-3 py-3"
                >
                  <Sparkles className="size-4 text-primary" aria-hidden="true" />
                  <span className="text-sm text-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(19rem,1fr)]">
        <section className="app-grid">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="app-kicker">Product pillars</p>
              <h2 className="mt-3 text-2xl font-semibold text-foreground">
                The Convex-native edge, translated into workflows.
              </h2>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {dashboardSections.map((section) => (
              <DashboardCard key={section.title} {...section} />
            ))}
          </div>
        </section>

        <aside className="app-grid">
          <section className="app-panel-soft rounded-[1.8rem] px-5 py-5">
            <p className="app-kicker">Today</p>
            <h2 className="mt-3 text-xl font-semibold text-foreground">Editing lane</h2>
            <div className="mt-5 space-y-3">
              {[
                {
                  title: "Draft editing is live",
                  detail:
                    "Schemas, entries, preview links, and publish actions now flow through Convex.",
                  icon: CircleDashed,
                },
                {
                  title: "Operations views are filling in",
                  detail:
                    "Dashboard metrics, media inventory, and audit history are moving off placeholders.",
                  icon: Clock3,
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="rounded-[1.35rem] bg-white/78 px-4 py-4 shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <div className="grid size-10 place-items-center rounded-2xl bg-secondary">
                        <Icon className="size-4 text-secondary-foreground" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{item.title}</p>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                          {item.detail}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="app-panel rounded-[1.8rem] px-5 py-5">
            <p className="app-kicker">Fast path</p>
            <h2 className="mt-3 text-xl font-semibold text-foreground">
              Ship the first blog in under two minutes.
            </h2>
            <ol className="mt-5 space-y-4">
              {[
                "Create a Blog Post collection from the starter schema.",
                "Add rich text, image, and author references.",
                "Draft the first entry and open a preview URL.",
                "Publish when the reactive frontend matches expectation.",
              ].map((step, index) => (
                <li key={step} className="flex gap-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold text-foreground">
                    {index + 1}
                  </span>
                  <span className="text-sm leading-6 text-muted-foreground">{step}</span>
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>
    </div>
  );
}

function DashboardCard({
  icon: Icon,
  title,
  description,
  href,
  eyebrow,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
  eyebrow: string;
}) {
  return (
    <Link
      to={href}
      className="app-panel group rounded-[1.8rem] px-5 py-5 transition-transform hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="grid size-11 place-items-center rounded-2xl bg-secondary text-secondary-foreground shadow-sm">
          <Icon className="size-5" aria-hidden="true" />
        </div>
        <span className="rounded-full border border-border bg-white px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {eyebrow}
        </span>
      </div>
      <h3 className="mt-5 text-xl font-semibold text-foreground">{title}</h3>
      <p className="mt-2 max-w-[34ch] text-sm leading-6 text-muted-foreground">{description}</p>
      <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-foreground">
        Open surface
        <ArrowRight
          className="size-4 transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </span>
    </Link>
  );
}

function MetricCard({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: string;
  note: string;
  tone: "mint" | "yellow" | "peach";
}) {
  return (
    <div className="app-metric" data-tone={tone}>
      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-3 text-[clamp(2rem,3vw,2.8rem)] font-semibold leading-none text-foreground">
        {value}
      </p>
      <p className="mt-3 text-xs leading-5 text-[color:var(--ink-soft)]">{note}</p>
    </div>
  );
}
