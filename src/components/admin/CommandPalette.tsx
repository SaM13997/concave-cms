import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { api } from "../../../convex/_generated/api";

type FlatResult = {
  groupIndex: number;
  resultIndex: number;
  entityType: string;
  title: string;
  subtitle?: string;
  href: string;
};

type CommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const sessionReady = useRouterState({
    select: (state) => state.location.pathname.length > 0,
  });

  const searchResults = useQuery(
    api.search.globalSearch,
    open && query.trim().length > 0 ? { query: query.trim() } : "skip",
  );

  const flatResults = useMemo<FlatResult[]>(() => {
    if (!searchResults) {
      return [];
    }

    const flat: FlatResult[] = [];
    for (let groupIndex = 0; groupIndex < searchResults.groups.length; groupIndex++) {
      const group = searchResults.groups[groupIndex];
      if (!group) continue;
      for (let resultIndex = 0; resultIndex < group.results.length; resultIndex++) {
        const result = group.results[resultIndex];
        if (!result) continue;
        flat.push({
          groupIndex,
          resultIndex,
          entityType: result.entityType,
          title: result.title,
          subtitle: result.subtitle,
          href: result.href,
        });
      }
    }
    return flat;
  }, [searchResults]);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setActiveIndex(0);
    }
  }, [open]);

  const selectResult = useCallback(
    (result: FlatResult) => {
      onOpenChange(false);
      const url = new URL(result.href, window.location.origin);
      const search = Object.fromEntries(url.searchParams.entries());
      void navigate({ to: url.pathname, search });
      showToast({
        type: "info",
        title: "Navigating",
        message: result.title,
        durationMs: 2000,
      });
    },
    [navigate, onOpenChange, showToast],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onOpenChange(false);
        return;
      }

      if (flatResults.length === 0) {
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((index) => (index + 1) % flatResults.length);
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((index) => (index - 1 + flatResults.length) % flatResults.length);
      }

      if (event.key === "Enter") {
        event.preventDefault();
        const selected = flatResults[activeIndex];
        if (selected) {
          selectResult(selected);
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, flatResults, activeIndex, onOpenChange, selectResult]);

  if (!open || !sessionReady) {
    return null;
  }

  return (
    <div
      data-testid="command-palette"
      className="fixed inset-0 z-[90] flex items-start justify-center bg-black/60 px-4 pt-[12vh]"
    >
      <button
        type="button"
        aria-label="Close command palette"
        className="absolute inset-0 cursor-default"
        onClick={() => onOpenChange(false)}
      />
      <div
        className="relative w-full max-w-xl overflow-hidden rounded-xl border border-border bg-background shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
      >
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            ref={inputRef}
            data-testid="command-palette-input"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            placeholder="Search content, schemas, media…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
            esc
          </kbd>
        </div>

        <div data-testid="command-palette-results" className="max-h-80 overflow-y-auto p-2">
          {query.trim().length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">
              Type to search across the CMS
            </p>
          ) : searchResults === undefined ? (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">Searching…</p>
          ) : flatResults.length === 0 ? (
            <p
              data-testid="command-palette-empty"
              className="px-2 py-6 text-center text-sm text-muted-foreground"
            >
              No results for “{query.trim()}”
            </p>
          ) : (
            searchResults.groups.map(
              (group: NonNullable<typeof searchResults>["groups"][number], groupIndex: number) => (
                <div
                  key={group.entityType}
                  data-testid={`command-palette-group-${group.entityType}`}
                  className="mb-2"
                >
                  <p className="px-2 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {group.label}
                  </p>
                  <ul>
                    {group.results.map(
                      (result: (typeof group)["results"][number], resultIndex: number) => {
                        const flatIndex = flatResults.findIndex(
                          (item) =>
                            item.groupIndex === groupIndex && item.resultIndex === resultIndex,
                        );
                        const isActive = flatIndex === activeIndex;

                        return (
                          <li key={result.id}>
                            <button
                              type="button"
                              data-testid={`command-palette-result-${result.entityType}-${result.id}`}
                              className={cn(
                                "flex w-full flex-col rounded-md px-3 py-2 text-left text-sm transition-colors",
                                isActive ? "bg-muted text-foreground" : "hover:bg-muted/60",
                              )}
                              onMouseEnter={() => setActiveIndex(flatIndex)}
                              onClick={() =>
                                selectResult({
                                  groupIndex,
                                  resultIndex,
                                  entityType: result.entityType,
                                  title: result.title,
                                  subtitle: result.subtitle,
                                  href: result.href,
                                })
                              }
                            >
                              <span className="font-medium">{result.title}</span>
                              {result.subtitle && (
                                <span className="text-xs text-muted-foreground">
                                  {result.subtitle}
                                </span>
                              )}
                            </button>
                          </li>
                        );
                      },
                    )}
                  </ul>
                </div>
              ),
            )
          )}
        </div>
      </div>
    </div>
  );
}

export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return { open, setOpen };
}
