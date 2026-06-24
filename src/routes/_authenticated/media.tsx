import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { InsufficientPermissions } from "@/components/insufficient-permissions";
import { useMyRole } from "@/hooks/use-my-role";
import { api } from "../../../convex/_generated/api";

type MediaSearch = {
  asset?: string;
};

export const Route = createFileRoute("/_authenticated/media")({
  validateSearch: (search: Record<string, unknown>): MediaSearch => ({
    asset: typeof search.asset === "string" ? search.asset : undefined,
  }),
  component: MediaPage,
});

function MediaPage() {
  const search = Route.useSearch();
  const { hasPermission, isLoading: roleLoading } = useMyRole();
  const canQuery = !roleLoading && hasPermission("content:read");
  const assets = useQuery(api.media.listMediaAssets, canQuery ? {} : "skip");

  if (roleLoading) {
    return <div data-testid="media-loading">Loading...</div>;
  }

  if (!hasPermission("content:read")) {
    return <InsufficientPermissions requiredPermission="content:read" />;
  }

  return (
    <AdminPageLayout
      title="Media"
      description="Uploaded assets library"
      contentTestId="media-library"
    >
      {assets === undefined ? (
        <p className="text-sm text-muted-foreground">Loading assets...</p>
      ) : assets.length === 0 ? (
        <p data-testid="media-empty" className="text-sm text-muted-foreground">
          No media assets yet
        </p>
      ) : (
        <ul data-testid="media-assets-list" className="space-y-2">
          {assets.map((asset) => (
            <li
              key={asset._id}
              data-testid={`media-asset-${asset._id}`}
              data-selected={search.asset === asset._id ? "true" : "false"}
              className="rounded-md border border-border px-3 py-2 text-sm"
            >
              <span className="font-medium">{asset.filename}</span>
              <span className="ml-2 text-xs text-muted-foreground">{asset.mimeType}</span>
            </li>
          ))}
        </ul>
      )}
    </AdminPageLayout>
  );
}
