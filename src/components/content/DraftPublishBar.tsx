import { Copy, ExternalLink, RotateCcw, Save, Sparkles, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { canDiscardLiveDraft, type EntryStatus } from "@/lib/content/live";
import { cn } from "@/lib/utils";

type DraftPublishBarProps = {
  status: EntryStatus;
  previewUrl?: string | null;
  previewExpiresAt?: string | null;
  isDirty?: boolean;
  isSaving?: boolean;
  isPublishing?: boolean;
  isDiscarding?: boolean;
  isGeneratingPreview?: boolean;
  onSaveDraft?: () => void;
  onPublish?: () => void;
  onDiscardDraft?: () => void;
  onGeneratePreview?: () => void;
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
  previewExpiresAt,
  isDirty = false,
  isSaving = false,
  isPublishing = false,
  isDiscarding = false,
  isGeneratingPreview = false,
  onSaveDraft,
  onPublish,
  onDiscardDraft,
  onGeneratePreview,
  onCopyPreview,
}: DraftPublishBarProps) {
  const canPublish = status !== "published" || isDirty;
  const canDiscard = canDiscardLiveDraft(status);

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
        {onSaveDraft && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!isDirty || isSaving}
            onClick={onSaveDraft}
          >
            <Save className="size-3.5" />
            {isSaving ? "Saving..." : "Save draft"}
          </Button>
        )}

        {previewUrl ? (
          <div className="flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2 py-1 text-xs text-muted-foreground">
            <ExternalLink className="size-3.5 shrink-0" aria-hidden />
            <span className="max-w-[12rem] truncate sm:max-w-xs">{previewUrl}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Copy preview URL"
              onClick={onCopyPreview}
            >
              <Copy className="size-3.5" />
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isGeneratingPreview}
            onClick={onGeneratePreview}
          >
            <Sparkles className="size-3.5" />
            {isGeneratingPreview ? "Generating..." : "Generate preview link"}
          </Button>
        )}

        {previewUrl && previewExpiresAt && (
          <span className="text-xs text-muted-foreground">Expires {previewExpiresAt}</span>
        )}

        {canDiscard && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isDiscarding}
            onClick={onDiscardDraft}
          >
            <RotateCcw className="size-3.5" />
            {isDiscarding ? "Discarding..." : "Discard draft"}
          </Button>
        )}

        <Button type="button" size="sm" disabled={!canPublish || isPublishing} onClick={onPublish}>
          <Upload className="size-3.5" />
          {isPublishing ? "Publishing..." : "Publish"}
        </Button>
      </div>
    </section>
  );
}
