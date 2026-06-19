import { createFileRoute } from "@tanstack/react-router";
import { Download, Server, Shield, User } from "lucide-react";
import { BlockerNotice } from "@/components/BlockerNotice";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { getClientEnv } from "@/lib/env";
import {
  getMockRoleFromEmail,
  getRoleDescription,
  getRoleLabel,
  mockTeamMembers,
} from "@/lib/mock/roles";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/settings/")({
  component: SettingsPage,
});

function SettingsPage() {
  const { data: sessionData } = authClient.useSession();
  const user = sessionData?.user;
  const role = getMockRoleFromEmail(user?.email);
  const convexUrl = getClientEnv().VITE_CONVEX_URL;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader
        title="Settings"
        description="Manage your profile, team access, and workspace configuration."
      />

      <section aria-labelledby="profile-heading" className="space-y-4">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <h2 id="profile-heading" className="text-base font-medium text-foreground">
            Profile
          </h2>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="profile-name">Display name</Label>
              <Input id="profile-name" defaultValue={user?.name ?? ""} readOnly />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-email">Email</Label>
              <Input id="profile-email" defaultValue={user?.email ?? ""} readOnly />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Profile updates will sync once user management APIs are connected.
          </p>
        </div>
      </section>

      <section aria-labelledby="team-heading" className="space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <h2 id="team-heading" className="text-base font-medium text-foreground">
            Team &amp; Roles
          </h2>
        </div>

        {/* BLOCKER(BE-001): Server RBAC enforcement requires Convex auth + role matrix */}
        <BlockerNotice
          blockerId="BE-001"
          message="Role assignments are mocked client-side until server RBAC is available (BE-001)."
        />

        <div className="rounded-lg border border-border bg-card p-4 space-y-4">
          <div className="flex items-start justify-between gap-4 rounded-md bg-muted/40 p-3">
            <div>
              <p className="text-sm font-medium text-foreground">Your role</p>
              <p className="text-xs text-muted-foreground">{getRoleDescription(role)}</p>
            </div>
            <span
              className={cn(
                "inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                role === "admin"
                  ? "bg-violet-500/15 text-violet-300"
                  : "bg-sky-500/15 text-sky-300",
              )}
            >
              {getRoleLabel(role)}
            </span>
          </div>

          <ul className="divide-y divide-border">
            {mockTeamMembers.map((member) => (
              <li key={member.id} className="flex items-center justify-between gap-4 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{member.name}</p>
                  <p className="text-xs text-muted-foreground">{member.email}</p>
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  {getRoleLabel(member.role)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="export-heading" className="space-y-4">
        <div className="flex items-center gap-2">
          <Download className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <h2 id="export-heading" className="text-base font-medium text-foreground">
            Export tools
          </h2>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            Export schema and content as JSON for backups or migration.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" disabled title="Requires backend export API">
              Export schema
            </Button>
            <Button variant="outline" disabled title="Requires backend export API">
              Export content
            </Button>
          </div>
        </div>
      </section>

      <section aria-labelledby="env-heading" className="space-y-4">
        <div className="flex items-center gap-2">
          <Server className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <h2 id="env-heading" className="text-base font-medium text-foreground">
            Environment info
          </h2>
        </div>
        <dl className="rounded-lg border border-border bg-card divide-y divide-border">
          <div className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:justify-between">
            <dt className="text-sm text-muted-foreground">Convex URL</dt>
            <dd className="text-sm font-mono text-foreground break-all">{convexUrl}</dd>
          </div>
          <div className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:justify-between">
            <dt className="text-sm text-muted-foreground">Environment</dt>
            <dd className="text-sm text-foreground">
              {import.meta.env.DEV ? "Development" : "Production"}
            </dd>
          </div>
          <div className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:justify-between">
            <dt className="text-sm text-muted-foreground">Auth provider</dt>
            <dd className="text-sm text-foreground">Better Auth + Convex</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
