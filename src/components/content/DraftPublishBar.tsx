import { Copy, ExternalLink, RotateCcw, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { EntryStatus } from "@/lib/mock/content";
import { cn } from "@/lib/utils";

type DraftPublishBarProps = {
  status: EntryStatus;
  previewUrl: string;
  isDirty?: boolean;
  onPublish?: () => void;
  onDiscardDraft?: () => void;
  onCopyPreview?: () => void;
};

function StatusBadge({ status }: { status: EntryStatus }) {
  const styles: Record<EntryStatus, string> = {
    published: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    draft: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    published_with_draft: "border-sky-500/30 bg-sky-500/10 text-sky-400",
  };

  const labels: Record<EntryStatus, string> = {
    published: "Published",
    draft: "Draft",
    published_with_draft: "Unpublished changes",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        styles[status],
      )}
    >
      {labels[status]}
    </span>
  );
}

export function DraftPublishBar({
  status,
  previewUrl,
  isDirty = false,
  onPublish,
  onDiscardDraft,
  onCopyPreview,
}: DraftPublishBarProps) {
  const canPublish = status !== "published" || isDirty;
  const canDiscard = status === "published_with_draft" || status === "draft";

  return (
    <section
      className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
      aria-label="Publish controls"
    >
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={status} />
        {isDirty && <span className="text-xs text-muted-foreground">Unsaved changes</span>}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div
          className="flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2 py-1 text-xs text-muted-foreground"
          data-blocker="BE-005"
          title="BLOCKER(BE-005): Preview token URLs require Phase 5 backend"
        >
          <ExternalLink className="size-3.5 shrink-0" aria-hidden />
          <span className="max-w-[12rem] truncate sm:max-w-xs">{previewUrl}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Copy preview URL"
            data-blocker="BE-005"
            onClick={onCopyPreview}
          >
            <Copy className="size-3.5" />
          </Button>
        </div>

        {canDiscard && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-blocker="BE-004"
            title="BLOCKER(BE-004): Discard draft requires atomic publish backend"
            onClick={onDiscardDraft}
          >
            <RotateCcw className="size-3.5" />
            Discard draft
          </Button>
        )}

        <Button
          type="button"
          size="sm"
          disabled={!canPublish}
          data-blocker="BE-004"
          title="BLOCKER(BE-004): Publish requires Convex transactional atomicity"
          onClick={onPublish}
        >
          <Upload className="size-3.5" />
          Publish
        </Button>
      </div>
    </section>
  );
}
