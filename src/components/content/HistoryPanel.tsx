import { GitCompare, History, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { HistoryEvent } from "@/lib/mock/content";
import { formatRelativeDate } from "@/lib/mock/content";
import { cn } from "@/lib/utils";

type HistoryPanelProps = {
  events: HistoryEvent[];
  selectedVersion?: number | null;
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
  onSelectVersion,
  onRevert,
}: HistoryPanelProps) {
  return (
    <aside
      className="flex h-full flex-col rounded-lg border border-border bg-card"
      aria-label="Version history"
      data-blocker="BE-006"
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
                    {event.userName} · {formatRelativeDate(event.timestamp)}
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
        <div className="space-y-2 border-t border-border p-3" data-blocker="BE-006">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <GitCompare className="size-3.5" aria-hidden />
            Compare / revert (placeholder)
          </div>
          <p className="text-xs text-muted-foreground">
            Side-by-side diff UI will render here once BE-006 version APIs are available.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            data-blocker="BE-006"
            title="BLOCKER(BE-006): Revert requires version history backend"
            onClick={() => onRevert?.(selectedVersion)}
          >
            <RotateCcw className="size-3.5" />
            Revert to v{selectedVersion}
          </Button>
        </div>
      )}
    </aside>
  );
}
