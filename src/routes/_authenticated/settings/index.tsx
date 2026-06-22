import { createFileRoute } from "@tanstack/react-router";
import { Download, Server, Shield, User } from "lucide-react";
import { useCmsUserContext } from "@/components/CmsUserProvider";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { api, useQuery } from "@/lib/convex/hooks";
import { getClientEnv } from "@/lib/env";
import { getRoleDescription, getRoleLabel } from "@/lib/roles";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/settings/")({
  component: SettingsPage,
});

function SettingsPage() {
  const { data: sessionData } = authClient.useSession();
  const user = sessionData?.user;
  const { me, role, isLoading: isRoleLoading } = useCmsUserContext();
  const team = useQuery(api.cmsUsers.listTeam, role === "admin" ? {} : "skip");
  const convexUrl = getClientEnv().VITE_CONVEX_URL;
  const displayRole = me?.role ?? role;

  return (
    <div className="app-grid">
      <section className="app-panel rounded-[2rem] px-6 py-6 sm:px-8 sm:py-8">
        <PageHeader
          eyebrow="Governance layer"
          title="Profiles, roles, exports, and self-hosted environment details."
          description="This is where the admin surface explains who can act, which environment you're targeting, and how data can leave the system safely."
        />
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(20rem,1fr)]">
        <div className="app-grid">
          <section
            aria-labelledby="profile-heading"
            className="app-panel rounded-[1.8rem] px-5 py-5"
          >
            <div className="flex items-center gap-2">
              <div className="grid size-10 place-items-center rounded-2xl bg-secondary">
                <User className="h-4 w-4 text-secondary-foreground" aria-hidden="true" />
              </div>
              <div>
                <h2 id="profile-heading" className="text-lg font-semibold text-foreground">
                  Profile
                </h2>
                <p className="text-sm text-muted-foreground">
                  Identity details for the active session.
                </p>
              </div>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="profile-name">Display name</Label>
                <Input
                  id="profile-name"
                  defaultValue={me?.name ?? user?.name ?? ""}
                  readOnly
                  className="h-11 rounded-2xl bg-white/80"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-email">Email</Label>
                <Input
                  id="profile-email"
                  defaultValue={me?.email ?? user?.email ?? ""}
                  readOnly
                  className="h-11 rounded-2xl bg-white/80"
                />
              </div>
            </div>
            <p className="mt-4 text-xs leading-5 text-muted-foreground">
              Profile updates will sync once user management APIs are connected.
            </p>
          </section>

          <section
            aria-labelledby="team-heading"
            className="app-panel-soft rounded-[1.8rem] px-5 py-5"
          >
            <div className="flex items-center gap-2">
              <div className="grid size-10 place-items-center rounded-2xl bg-white shadow-sm">
                <Shield className="h-4 w-4 text-foreground" aria-hidden="true" />
              </div>
              <div>
                <h2 id="team-heading" className="text-lg font-semibold text-foreground">
                  Team and roles
                </h2>
                <p className="text-sm text-muted-foreground">
                  Role assignments are enforced server-side on every Convex request.
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-[1.35rem] bg-white/78 px-4 py-4 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">Your role</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {isRoleLoading ? "Loading role from Convex…" : getRoleDescription(displayRole)}
                  </p>
                </div>
                <span
                  className={cn(
                    "inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em]",
                    displayRole === "admin"
                      ? "bg-secondary text-secondary-foreground"
                      : "bg-accent text-accent-foreground",
                  )}
                >
                  {getRoleLabel(displayRole)}
                </span>
              </div>
            </div>

            {role === "admin" ? (
              team === undefined ? (
                <p className="mt-4 text-sm text-muted-foreground">Loading team directory…</p>
              ) : (
                <ul className="mt-4 divide-y divide-border rounded-[1.35rem] border border-border bg-white/78 px-4">
                  {team.map((member) => (
                    <li key={member._id} className="flex items-center justify-between gap-4 py-4">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      </div>
                      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        {getRoleLabel(member.role)}
                      </span>
                    </li>
                  ))}
                </ul>
              )
            ) : (
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                Team directory is visible to admins only.
              </p>
            )}
          </section>
        </div>

        <aside className="app-grid">
          <section
            aria-labelledby="export-heading"
            className="app-panel rounded-[1.8rem] px-5 py-5"
          >
            <div className="flex items-center gap-2">
              <div className="grid size-10 place-items-center rounded-2xl bg-secondary">
                <Download className="h-4 w-4 text-secondary-foreground" aria-hidden="true" />
              </div>
              <div>
                <h2 id="export-heading" className="text-lg font-semibold text-foreground">
                  Export tools
                </h2>
                <p className="text-sm text-muted-foreground">
                  Schema and content handoff for backup or migration.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3 rounded-[1.35rem] bg-muted px-4 py-4">
              <p className="text-sm leading-6 text-muted-foreground">
                Export schema and content as JSON for backups, rollback drills, or local development
                mirrors.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  disabled
                  className="rounded-full bg-white/80"
                  title="Requires backend export API"
                >
                  Export schema
                </Button>
                <Button
                  variant="outline"
                  disabled
                  className="rounded-full bg-white/80"
                  title="Requires backend export API"
                >
                  Export content
                </Button>
              </div>
            </div>
          </section>

          <section
            aria-labelledby="env-heading"
            className="app-panel-soft rounded-[1.8rem] px-5 py-5"
          >
            <div className="flex items-center gap-2">
              <div className="grid size-10 place-items-center rounded-2xl bg-white shadow-sm">
                <Server className="h-4 w-4 text-foreground" aria-hidden="true" />
              </div>
              <div>
                <h2 id="env-heading" className="text-lg font-semibold text-foreground">
                  Environment info
                </h2>
                <p className="text-sm text-muted-foreground">
                  Self-hosted context for the running instance.
                </p>
              </div>
            </div>

            <dl className="mt-5 rounded-[1.35rem] border border-border bg-white/78 divide-y divide-border">
              <div className="flex flex-col gap-1 px-4 py-4">
                <dt className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Convex URL
                </dt>
                <dd className="font-mono text-sm text-foreground break-all">{convexUrl}</dd>
              </div>
              <div className="flex flex-col gap-1 px-4 py-4">
                <dt className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Environment
                </dt>
                <dd className="text-sm font-semibold text-foreground">
                  {import.meta.env.DEV ? "Development" : "Production"}
                </dd>
              </div>
              <div className="flex flex-col gap-1 px-4 py-4">
                <dt className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Auth provider
                </dt>
                <dd className="text-sm font-semibold text-foreground">Better Auth + Convex</dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>
    </div>
  );
}
