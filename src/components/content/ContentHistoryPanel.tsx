import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

type HistoryEvent = FunctionReturnType<typeof api.contentHistory.listEntryHistory>[number];
type CompareDiff = FunctionReturnType<typeof api.contentHistory.compareVersions>["diffs"][number];

type ContentHistoryPanelProps = {
  entryId: Id<"contentEntries">;
  canWrite: boolean;
};

function formatValue(value: unknown): string {
  if (value === undefined) {
    return "—";
  }
  if (typeof value === "string") {
    return value;
  }
  return JSON.stringify(value, null, 2);
}

export function ContentHistoryPanel({ entryId, canWrite }: ContentHistoryPanelProps) {
  const history = useQuery(api.contentHistory.listEntryHistory, { entryId });
  const revertEntry = useMutation(api.contentHistory.revertContentEntry);

  const [compareLeftId, setCompareLeftId] = useState<Id<"versionEvents"> | null>(null);
  const [compareRightId, setCompareRightId] = useState<Id<"versionEvents"> | null>(null);
  const [revertTargetId, setRevertTargetId] = useState<Id<"versionEvents"> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reverting, setReverting] = useState(false);

  const compareResult = useQuery(
    api.contentHistory.compareVersions,
    compareLeftId && compareRightId
      ? { leftEventId: compareLeftId, rightEventId: compareRightId }
      : "skip",
  );

  const handleCompare = (eventId: Id<"versionEvents">) => {
    if (!compareLeftId || (compareLeftId && compareRightId)) {
      setCompareLeftId(eventId);
      setCompareRightId(null);
      return;
    }
    if (compareLeftId === eventId) {
      return;
    }
    setCompareRightId(eventId);
  };

  const handleRevert = async () => {
    if (!revertTargetId) {
      return;
    }
    setError(null);
    setReverting(true);
    try {
      await revertEntry({ entryId, targetEventId: revertTargetId });
      setRevertTargetId(null);
      setCompareLeftId(null);
      setCompareRightId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to revert");
    } finally {
      setReverting(false);
    }
  };

  return (
    <section
      data-testid="content-history-panel"
      className="space-y-3 rounded-md border border-border p-3"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">Version history</p>
        {compareLeftId && (
          <Button
            data-testid="content-history-clear-compare"
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              setCompareLeftId(null);
              setCompareRightId(null);
            }}
          >
            Clear compare
          </Button>
        )}
      </div>

      {history === undefined ? (
        <p data-testid="content-history-loading" className="text-xs text-muted-foreground">
          Loading history...
        </p>
      ) : history.length === 0 ? (
        <p data-testid="content-history-empty" className="text-xs text-muted-foreground">
          No history yet
        </p>
      ) : (
        <ul data-testid="content-history-timeline" className="space-y-2">
          {history.map((event: HistoryEvent) => (
            <li
              key={event._id}
              data-testid={`content-history-event-${event._id}`}
              className={cn(
                "rounded-md border border-border px-3 py-2 text-xs",
                compareLeftId === event._id && "border-primary bg-muted/50",
                compareRightId === event._id && "border-primary bg-muted/50",
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{event.summary}</p>
                  <p className="text-muted-foreground">
                    {event.eventType} · {event.actorName} ·{" "}
                    {new Date(event.timestamp).toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1">
                  <Button
                    data-testid={`content-history-compare-${event._id}`}
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleCompare(event._id)}
                  >
                    Compare
                  </Button>
                  {canWrite && (
                    <Button
                      data-testid={`content-history-revert-${event._id}`}
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => setRevertTargetId(event._id)}
                    >
                      Revert
                    </Button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {compareLeftId && !compareRightId && (
        <p data-testid="content-history-compare-hint" className="text-xs text-muted-foreground">
          Select another version to compare
        </p>
      )}

      {compareResult && compareLeftId && compareRightId && (
        <div
          data-testid="content-history-compare-view"
          className="space-y-2 rounded-md border border-dashed border-border p-3"
        >
          <p className="text-sm font-medium">Compare</p>
          <div className="grid gap-3 md:grid-cols-2">
            <div data-testid="content-history-compare-left">
              <p className="mb-1 text-xs font-medium text-muted-foreground">Left</p>
              <p className="text-xs">{compareResult.leftSummary}</p>
            </div>
            <div data-testid="content-history-compare-right">
              <p className="mb-1 text-xs font-medium text-muted-foreground">Right</p>
              <p className="text-xs">{compareResult.rightSummary}</p>
            </div>
          </div>
          {compareResult.diffs.length === 0 ? (
            <p data-testid="content-history-no-diffs" className="text-xs text-muted-foreground">
              No differences
            </p>
          ) : (
            <ul data-testid="content-history-diffs" className="space-y-1 text-xs">
              {compareResult.diffs.map((diff: CompareDiff) => (
                <li
                  key={`${diff.path}-${diff.kind}`}
                  data-testid={`content-history-diff-${diff.path}`}
                  className="rounded border border-border/60 px-2 py-1"
                >
                  <span className="font-medium">{diff.path}</span> ({diff.kind})
                  {diff.kind === "changed" && (
                    <div className="mt-1 grid gap-2 md:grid-cols-2">
                      <pre className="overflow-x-auto whitespace-pre-wrap text-[10px] text-muted-foreground">
                        {formatValue(diff.before)}
                      </pre>
                      <pre className="overflow-x-auto whitespace-pre-wrap text-[10px]">
                        {formatValue(diff.after)}
                      </pre>
                    </div>
                  )}
                  {diff.kind === "added" && (
                    <pre className="mt-1 overflow-x-auto whitespace-pre-wrap text-[10px]">
                      {formatValue(diff.after)}
                    </pre>
                  )}
                  {diff.kind === "removed" && (
                    <pre className="mt-1 overflow-x-auto whitespace-pre-wrap text-[10px] text-muted-foreground">
                      {formatValue(diff.before)}
                    </pre>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {revertTargetId && (
        <div
          data-testid="content-history-revert-confirm"
          className="space-y-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3"
        >
          <p className="text-sm font-medium">Revert to this version?</p>
          <p className="text-xs text-muted-foreground">
            This restores the entry to the selected snapshot and records a revert event.
          </p>
          <div className="flex gap-2">
            <Button
              data-testid="content-history-revert-confirm-button"
              type="button"
              size="sm"
              disabled={reverting}
              onClick={() => void handleRevert()}
            >
              {reverting ? "Reverting..." : "Confirm revert"}
            </Button>
            <Button
              data-testid="content-history-revert-cancel-button"
              type="button"
              size="sm"
              variant="outline"
              disabled={reverting}
              onClick={() => setRevertTargetId(null)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {error && (
        <p data-testid="content-history-error" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </section>
  );
}
