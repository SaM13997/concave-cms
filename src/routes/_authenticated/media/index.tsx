import { createFileRoute } from "@tanstack/react-router";
import { FileImage, FileText, ImagePlus, Search, Shapes, Upload, Video } from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";
import { useCmsUser, useUserRole } from "@/components/CmsUserProvider";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, useMutation, usePaginatedQuery, useQuery } from "@/lib/convex/hooks";
import {
  formatFileSize,
  formatUploadDate,
  getMediaAssetType,
  getMediaUploaderLabel,
  type MediaAssetType,
} from "@/lib/media/live";
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
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [mimeType, setMimeType] = useState("image/jpeg");
  const [sizeBytes, setSizeBytes] = useState("0");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [alt, setAlt] = useState("");
  const [tags, setTags] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const me = useCmsUser();
  const role = useUserRole();
  const team = useQuery(api.cmsUsers.listTeam, role === "admin" ? {} : "skip");
  const createAsset = useMutation(api.media.createMetadata);
  const mediaQuery = usePaginatedQuery(
    api.media.list,
    { query: query.trim() || undefined },
    { initialNumItems: 24 },
  );

  const filteredAssets = useMemo(
    () =>
      mediaQuery.results.filter(
        (asset) => typeFilter === "all" || getMediaAssetType(asset.mimeType) === typeFilter,
      ),
    [mediaQuery.results, typeFilter],
  );

  const handleCreateAsset = async (event: FormEvent) => {
    event.preventDefault();

    const trimmedName = name.trim();
    const trimmedUrl = url.trim();
    const normalizedSize = Number(sizeBytes);
    const normalizedWidth = width.trim() ? Number(width) : undefined;
    const normalizedHeight = height.trim() ? Number(height) : undefined;

    if (!trimmedName || !trimmedUrl || !mimeType.trim()) {
      setFormError("Name, asset URL, and MIME type are required.");
      return;
    }

    if (!Number.isFinite(normalizedSize) || normalizedSize < 0) {
      setFormError("Size must be zero or a positive number.");
      return;
    }

    if (
      normalizedWidth !== undefined &&
      (!Number.isFinite(normalizedWidth) || normalizedWidth <= 0)
    ) {
      setFormError("Width must be a positive number when provided.");
      return;
    }

    if (
      normalizedHeight !== undefined &&
      (!Number.isFinite(normalizedHeight) || normalizedHeight <= 0)
    ) {
      setFormError("Height must be a positive number when provided.");
      return;
    }

    setIsCreating(true);
    setFormError(null);
    setStatusMessage(null);

    try {
      await createAsset({
        name: trimmedName,
        url: trimmedUrl,
        mimeType: mimeType.trim(),
        sizeBytes: normalizedSize,
        width: normalizedWidth,
        height: normalizedHeight,
        alt: alt.trim() || undefined,
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      });
      setName("");
      setUrl("");
      setMimeType("image/jpeg");
      setSizeBytes("0");
      setWidth("");
      setHeight("");
      setAlt("");
      setTags("");
      setIsComposerOpen(false);
      setStatusMessage("Asset added to the live media library.");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Could not add this asset.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="app-grid">
      <section className="app-panel rounded-[2rem] px-6 py-6 sm:px-8 sm:py-8">
        <PageHeader
          eyebrow="Media operations"
          title="Assets with context, provenance, and campaign-ready retrieval."
          description="Search, tag, and inspect the visual layer that powers entries across the CMS. The library now reads live backend records, and URL-backed assets can be added immediately."
          actions={
            <Button
              type="button"
              className="rounded-full"
              onClick={() => setIsComposerOpen((open) => !open)}
            >
              <Upload className="h-4 w-4" aria-hidden="true" />
              {isComposerOpen ? "Close asset form" : "Add URL asset"}
            </Button>
          }
        />

        <div className="mt-8 grid gap-3 md:grid-cols-3">
          <MetricCard
            label="Indexed assets"
            value={
              mediaQuery.isLoading && mediaQuery.results.length === 0
                ? "..."
                : String(mediaQuery.results.length)
            }
            tone="mint"
          />
          <MetricCard
            label="Filtered view"
            value={typeFilter === "all" ? "All" : typeFilter}
            tone="yellow"
          />
          <MetricCard label="Search results" value={String(filteredAssets.length)} tone="peach" />
        </div>
      </section>

      {isComposerOpen ? (
        <section className="app-panel rounded-[1.8rem] px-6 py-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="app-kicker">Quick intake</p>
              <h2 className="mt-3 text-xl font-semibold text-foreground">
                Add a live asset record
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Use a hosted file URL for now. Direct uploads can land later without changing how
                the library is managed.
              </p>
            </div>
            <p className="text-xs text-muted-foreground">Storage upload can follow later.</p>
          </div>

          <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleCreateAsset}>
            <label htmlFor="media-name" className="space-y-2">
              <span className="text-sm font-medium text-foreground">Name</span>
              <Input
                id="media-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Homepage hero"
              />
            </label>
            <label htmlFor="media-mime-type" className="space-y-2">
              <span className="text-sm font-medium text-foreground">MIME type</span>
              <Input
                id="media-mime-type"
                value={mimeType}
                onChange={(event) => setMimeType(event.target.value)}
                placeholder="image/jpeg"
              />
            </label>
            <label htmlFor="media-url" className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-foreground">Asset URL</span>
              <Input
                id="media-url"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://cdn.example.com/assets/hero.jpg"
              />
            </label>
            <label htmlFor="media-size-bytes" className="space-y-2">
              <span className="text-sm font-medium text-foreground">Size in bytes</span>
              <Input
                id="media-size-bytes"
                type="number"
                min="0"
                value={sizeBytes}
                onChange={(event) => setSizeBytes(event.target.value)}
                placeholder="0"
              />
            </label>
            <label htmlFor="media-tags" className="space-y-2">
              <span className="text-sm font-medium text-foreground">Tags</span>
              <Input
                id="media-tags"
                value={tags}
                onChange={(event) => setTags(event.target.value)}
                placeholder="homepage, campaign, summer"
              />
            </label>
            <label htmlFor="media-width" className="space-y-2">
              <span className="text-sm font-medium text-foreground">Width</span>
              <Input
                id="media-width"
                type="number"
                min="1"
                value={width}
                onChange={(event) => setWidth(event.target.value)}
                placeholder="1600"
              />
            </label>
            <label htmlFor="media-height" className="space-y-2">
              <span className="text-sm font-medium text-foreground">Height</span>
              <Input
                id="media-height"
                type="number"
                min="1"
                value={height}
                onChange={(event) => setHeight(event.target.value)}
                placeholder="900"
              />
            </label>
            <label htmlFor="media-alt" className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-foreground">Alt text</span>
              <Input
                id="media-alt"
                value={alt}
                onChange={(event) => setAlt(event.target.value)}
                placeholder="Homepage hero image"
              />
            </label>

            <div className="md:col-span-2 flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={isCreating}>
                {isCreating ? "Adding..." : "Add asset"}
              </Button>
              {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
              {!formError && statusMessage ? (
                <p className="text-sm text-muted-foreground">{statusMessage}</p>
              ) : null}
            </div>
          </form>
        </section>
      ) : statusMessage ? (
        <p className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {statusMessage}
        </p>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.75fr)_minmax(18rem,1fr)]">
        <section className="app-grid">
          <div className="app-panel-soft rounded-[1.8rem] px-5 py-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search
                  className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by name or tag..."
                  className="h-11 rounded-full border-white/70 bg-white/80 pl-10"
                  aria-label="Search media assets"
                />
              </div>
              <fieldset className="flex flex-wrap gap-2">
                <legend className="sr-only">Filter by type</legend>
                {typeFilters.map((filter) => (
                  <Button
                    key={filter.value}
                    type="button"
                    size="sm"
                    variant={typeFilter === filter.value ? "default" : "outline"}
                    className="rounded-full"
                    onClick={() => setTypeFilter(filter.value)}
                  >
                    {filter.label}
                  </Button>
                ))}
              </fieldset>
            </div>
          </div>

          {mediaQuery.isLoading && mediaQuery.results.length === 0 ? (
            <div className="app-panel rounded-[1.8rem] px-6 py-12 text-center">
              <p className="text-sm text-muted-foreground">Loading media library...</p>
            </div>
          ) : filteredAssets.length === 0 ? (
            <EmptyState
              icon={FileImage}
              title="No assets found"
              description={
                query || typeFilter !== "all"
                  ? "Try adjusting your search or filters."
                  : "Add your first asset to start populating the live library."
              }
            />
          ) : (
            <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredAssets.map((asset) => (
                <li
                  key={asset._id}
                  className="app-panel group overflow-hidden rounded-[1.8rem] transition-transform hover:-translate-y-0.5"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                    {getMediaAssetType(asset.mimeType) === "image" && asset.url ? (
                      <img
                        src={asset.url}
                        alt={asset.alt ?? asset.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.24),transparent_58%),linear-gradient(180deg,rgba(22,26,31,0.94),rgba(44,52,61,0.92))]">
                        <PreviewIcon mimeType={asset.mimeType} />
                      </div>
                    )}
                    <span className="absolute top-3 right-3 rounded-full bg-background/88 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground backdrop-blur-sm">
                      {getMediaAssetType(asset.mimeType)}
                    </span>
                  </div>
                  <div className="space-y-3 px-4 py-4">
                    <div>
                      <p className="truncate text-sm font-semibold text-foreground">{asset.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatFileSize(asset.sizeBytes)}
                        {asset.width && asset.height ? ` | ${asset.width}x${asset.height}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {asset.tags.map((tag) => (
                        <span
                          key={tag}
                          className={cn(
                            "rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground",
                          )}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                      <span>
                        Uploaded by {getMediaUploaderLabel(asset.uploadedBy, me, team ?? null)}
                      </span>
                      <span>{formatUploadDate(asset.uploadedAt)}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {mediaQuery.status !== "Exhausted" ? (
            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                disabled={mediaQuery.status !== "CanLoadMore"}
                onClick={() => mediaQuery.loadMore(24)}
              >
                {mediaQuery.status === "LoadingMore" ? "Loading more..." : "Load more assets"}
              </Button>
            </div>
          ) : null}
        </section>

        <aside className="app-grid">
          <section className="app-panel-soft rounded-[1.8rem] px-5 py-5">
            <p className="app-kicker">Built for campaigns</p>
            <h2 className="mt-3 text-xl font-semibold text-foreground">
              Metadata stays close to the image, not in somebody's memory.
            </h2>
            <div className="mt-5 space-y-3">
              {[
                {
                  icon: ImagePlus,
                  title: "Asset-first browsing",
                  note: "Names, tags, alt text, and uploader context make retrieval fast.",
                },
                {
                  icon: Shapes,
                  title: "Type-aware organization",
                  note: "Images, videos, and documents are filterable without leaving the flow.",
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
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.note}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="app-panel rounded-[1.8rem] px-5 py-5">
            <p className="app-kicker">Current mode</p>
            <h2 className="mt-3 text-xl font-semibold text-foreground">
              URL-backed assets are ready now.
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Direct binary upload can be layered in later, but teams can already track and reuse
              live media records without waiting on that last mile.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}

function PreviewIcon({ mimeType }: { mimeType: string }) {
  const type = getMediaAssetType(mimeType);
  const Icon = type === "video" ? Video : type === "document" ? FileText : FileImage;

  return (
    <div className="grid place-items-center gap-3 text-center text-white/85">
      <div className="grid size-14 place-items-center rounded-3xl bg-white/10 backdrop-blur">
        <Icon className="size-7" aria-hidden="true" />
      </div>
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.12em]">{type}</p>
        <p className="mt-1 text-xs text-white/65">{mimeType}</p>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "mint" | "yellow" | "peach";
}) {
  return (
    <div className="app-metric" data-tone={tone}>
      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-3 text-[clamp(1.8rem,3vw,2.7rem)] font-semibold leading-none text-foreground">
        {value}
      </p>
    </div>
  );
}
