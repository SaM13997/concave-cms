import { GitCompare, History, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatContentDate } from "@/lib/content/live";
import { cn } from "@/lib/utils";

type HistoryEvent = {
  id: string;
  timestamp: number;
  action: "created" | "updated" | "published" | "reverted";
  userName: string;
  summary: string;
  version: number;
};

type HistoryPanelProps = {
  events: HistoryEvent[];
  selectedVersion?: number | null;
  changedFields?: string[];
  isComparing?: boolean;
  isReverting?: boolean;
  onSelectVersion?: (version: number) => void;
  onRevert?: (version: number) => void;
};

const actionLabels: Record<HistoryEvent["action"], string> = {
  created: "Created",
  updated: "Updated",
  published: "Published",
  reverted: "Reverted",
};

const actionColors: Record<HistoryEvent["action"], string> = {
  created: "bg-muted text-muted-foreground",
  updated: "bg-sky-500/10 text-sky-400",
  published: "bg-emerald-500/10 text-emerald-400",
  reverted: "bg-violet-500/10 text-violet-400",
};

export function HistoryPanel({
  events,
  selectedVersion = null,
  changedFields = [],
  isComparing = false,
  isReverting = false,
  onSelectVersion,
  onRevert,
}: HistoryPanelProps) {
  return (
    <aside
      className="flex h-full flex-col rounded-lg border border-border bg-card"
      aria-label="Version history"
    >
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <History className="size-4 text-muted-foreground" aria-hidden />
        <h2 className="text-sm font-medium">History</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <ol className="relative space-y-0 border-l border-border pl-4">
          {events.map((event, index) => {
            const isSelected = selectedVersion === event.version;
            return (
              <li key={event.id} className="relative pb-4 last:pb-0">
                <span
                  className={cn(
                    "absolute -left-[1.3rem] top-1 size-2.5 rounded-full border-2 border-background",
                    isSelected ? "bg-primary" : "bg-muted-foreground/50",
                  )}
                  aria-hidden
                />
                <button
                  type="button"
                  className={cn(
                    "w-full rounded-md p-2 text-left transition-colors hover:bg-muted/50",
                    isSelected && "bg-muted/60 ring-1 ring-border",
                  )}
                  onClick={() => onSelectVersion?.(event.version)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                        actionColors[event.action],
                      )}
                    >
                      {actionLabels[event.action]}
                    </span>
                    <span className="text-[10px] text-muted-foreground">v{event.version}</span>
                  </div>
                  <p className="mt-1 text-sm font-medium leading-snug">{event.summary}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {event.userName} / {formatContentDate(event.timestamp)}
                  </p>
                </button>
                {index === 0 && events.length > 1 && (
                  <p className="mt-1 px-2 text-[10px] text-muted-foreground">Latest</p>
                )}
              </li>
            );
          })}
        </ol>
      </div>

      {selectedVersion !== null && (
        <div className="space-y-2 border-t border-border p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <GitCompare className="size-3.5" aria-hidden />
            Compare with current draft
          </div>
          {isComparing ? (
            <p className="text-xs text-muted-foreground">Loading changed fields...</p>
          ) : changedFields.length > 0 ? (
            <p className="text-xs text-muted-foreground">
              Changed fields: {changedFields.join(", ")}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              No field changes against the current draft.
            </p>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            disabled={isReverting}
            onClick={() => onRevert?.(selectedVersion)}
          >
            <RotateCcw className="size-3.5" />
            {isReverting ? `Reverting v${selectedVersion}...` : `Revert to v${selectedVersion}`}
          </Button>
        </div>
      )}
    </aside>
  );
}
