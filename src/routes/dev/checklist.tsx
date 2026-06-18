import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getGapCounts, getStatusCounts } from "@/lib/checklist-utils";

type ChecklistItem = {
  id: string;
  title: string;
  source: string;
  category?: string;
  phase?: string;
  status: string;
  acceptanceCriteria: string[];
  evidence: string[];
  gaps: string[];
  launchPlanRefs?: string[];
  notes?: string;
};

type LaunchGate = {
  id: string;
  title: string;
  source: string;
  status: string;
  relatedFeatureIds: string[];
  acceptanceCriteria: string[];
  evidence: string[];
  gaps: string[];
};

type HygieneCheck = {
  id: string;
  title: string;
  status: string;
  source: string;
  evidence: string[];
  gaps: string[];
};

type ChecklistData = {
  version: number;
  sources: string[];
  statusValues: string[];
  gapCategories: string[];
  features: ChecklistItem[];
  launchGates: LaunchGate[];
  hygieneChecks: HygieneCheck[];
};

const loadChecklist = createServerFn({ method: "GET" }).handler(async () => {
  if (!import.meta.env.DEV) {
    return null;
  }

  const [{ readFile }, { join }] = await Promise.all([
    import("node:fs/promises"),
    import("node:path"),
  ]);
  const raw = await readFile(join(process.cwd(), "featureList.json"), "utf8");
  return JSON.parse(raw) as ChecklistData;
});

export const Route = createFileRoute("/dev/checklist")({
  loader: () => loadChecklist(),
  component: ChecklistPage,
});

function ChecklistPage() {
  const data = Route.useLoaderData();

  if (!import.meta.env.DEV || !data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
        <h1 className="text-lg font-semibold">Not found</h1>
      </main>
    );
  }

  const statusCounts = getStatusCounts(data.features, data.statusValues);
  const gapCounts = getGapCounts(
    [...data.features, ...data.launchGates, ...data.hygieneChecks],
    data.gapCategories,
  );
  const missingEvidence = data.features.filter(
    (feature) => feature.evidence.length === 0,
  );
  const topRisks = data.features
    .filter((feature) => feature.gaps.length > 0)
    .slice(0, 8);
  const phases = Array.from(new Set(data.features.map((feature) => feature.phase)));

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Dev-only review surface
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Launch checklist
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Read-only macro and micro review for requirement coverage, launch
            gates, evidence, and checklist hygiene.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard title="Requirement coverage" value={data.features.length}>
            <div className="mt-3 flex flex-wrap gap-2">
              {data.statusValues.map((status) => (
                <Badge key={status} label={`${status}: ${statusCounts[status]}`} />
              ))}
            </div>
          </SummaryCard>
          <SummaryCard title="Launch gates" value={data.launchGates.length}>
            <p className="mt-3 text-xs text-muted-foreground">
              Launch definition and release checklist progress are seeded as
              planned until evidence is linked.
            </p>
          </SummaryCard>
          <SummaryCard title="Evidence" value={data.features.length - missingEvidence.length}>
            <p className="mt-3 text-xs text-muted-foreground">
              {missingEvidence.length} requirements still need evidence.
            </p>
          </SummaryCard>
          <SummaryCard title="Changelog / feature list hygiene" value={data.hygieneChecks.length}>
            <p className="mt-3 text-xs text-muted-foreground">
              Tracks root featureList, AGENTS, and changelog expectations.
            </p>
          </SummaryCard>
        </section>

        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-lg font-semibold">Gap categories</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {data.gapCategories.map((gap) => (
              <div key={gap} className="rounded-md border border-border p-3">
                <p className="text-xs text-muted-foreground">{gap}</p>
                <p className="mt-1 text-xl font-semibold">{gapCounts[gap]}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <Panel title="Macro review">
            <h3 className="text-sm font-medium">Phase readiness</h3>
            <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
              {phases.map((phase) => (
                <li key={phase}>{phase}: planned, evidence pending</li>
              ))}
            </ul>
            <h3 className="mt-5 text-sm font-medium">Top launch risks</h3>
            <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
              {topRisks.map((feature) => (
                <li key={feature.id}>
                  {feature.id}: {feature.gaps.join(", ")}
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="Launch gates / phase status">
            <div className="space-y-3">
              {data.launchGates.map((gate) => (
                <div key={gate.id} className="rounded-md border border-border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium">{gate.id}: {gate.title}</p>
                    <Badge label={gate.status} />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Gaps: {gate.gaps.join(", ")}
                  </p>
                </div>
              ))}
            </div>
          </Panel>
        </section>

        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-lg font-semibold">Evidence / test status</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Evidence count is {data.features.reduce((count, item) => count + item.evidence.length, 0)} across seeded requirements.
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            Missing evidence list: {missingEvidence.map((feature) => feature.id).join(", ")}
          </p>
        </section>

        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-lg font-semibold">Micro review</h2>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {data.features.map((feature) => (
              <article key={feature.id} className="rounded-md border border-border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold">{feature.id}: {feature.title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{feature.phase}</p>
                  </div>
                  <Badge label={feature.status} />
                </div>
                <dl className="mt-3 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                  <div><dt>Acceptance</dt><dd className="text-foreground">{feature.acceptanceCriteria.length}</dd></div>
                  <div><dt>Evidence</dt><dd className="text-foreground">{feature.evidence.length}</dd></div>
                  <div><dt>Gaps</dt><dd className="text-foreground">{feature.gaps.length}</dd></div>
                </dl>
                <p className="mt-3 text-xs text-muted-foreground">
                  Gap categories: {feature.gaps.join(", ")}
                </p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function SummaryCard({
  title,
  value,
  children,
}: {
  title: string;
  value: number;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <h2 className="text-sm font-medium text-muted-foreground">{title}</h2>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
      {children}
    </section>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <span className="inline-flex rounded-full border border-border px-2 py-0.5 text-xs font-medium text-muted-foreground">
      {label}
    </span>
  );
}
