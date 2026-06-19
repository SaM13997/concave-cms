import { createFileRoute } from "@tanstack/react-router";
import { FileImage, Search, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import { BlockerNotice } from "@/components/BlockerNotice";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  filterMediaAssets,
  formatFileSize,
  type MediaAssetType,
  mockMediaAssets,
} from "@/lib/mock/media";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/media/")({
  component: MediaLibraryPage,
});

const typeFilters: Array<{ value: MediaAssetType | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "image", label: "Images" },
  { value: "video", label: "Videos" },
  { value: "document", label: "Documents" },
];

function MediaLibraryPage() {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<MediaAssetType | "all">("all");

  const filteredAssets = useMemo(
    () => filterMediaAssets(mockMediaAssets, query, typeFilter),
    [query, typeFilter],
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Media Library"
        description="Browse and manage uploaded assets. Upload requires backend storage."
        actions={
          <Button
            disabled
            title="BLOCKER BE-010: Media upload/storage requires Phase 4 backend"
            data-blocker="BE-010"
          >
            <Upload className="h-4 w-4" aria-hidden="true" />
            Upload
          </Button>
        }
      />

      {/* BLOCKER(BE-010): Media upload/storage requires Phase 4 backend */}
      <BlockerNotice
        blockerId="BE-010"
        message="Upload is disabled until media storage APIs are available (BE-010)."
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, tag, or uploader…"
            className="pl-9"
            aria-label="Search media assets"
          />
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by type">
          {typeFilters.map((filter) => (
            <Button
              key={filter.value}
              type="button"
              size="sm"
              variant={typeFilter === filter.value ? "default" : "outline"}
              onClick={() => setTypeFilter(filter.value)}
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </div>

      {filteredAssets.length === 0 ? (
        <EmptyState
          icon={FileImage}
          title="No assets found"
          description={
            query || typeFilter !== "all"
              ? "Try adjusting your search or filters."
              : "Upload assets once media storage is connected."
          }
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAssets.map((asset) => (
            <li
              key={asset.id}
              className="group overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-muted-foreground/30"
            >
              <div className="relative aspect-video overflow-hidden bg-muted">
                <img
                  src={asset.url}
                  alt={asset.alt ?? asset.name}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  loading="lazy"
                />
                <span className="absolute top-2 right-2 rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-foreground backdrop-blur-sm">
                  {asset.type}
                </span>
              </div>
              <div className="space-y-2 p-4">
                <div>
                  <p className="truncate text-sm font-medium text-foreground">{asset.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(asset.sizeBytes)}
                    {asset.width && asset.height ? ` · ${asset.width}×${asset.height}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {asset.tags.map((tag) => (
                    <span
                      key={tag}
                      className={cn(
                        "rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground",
                      )}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Uploaded by {asset.uploadedBy}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
