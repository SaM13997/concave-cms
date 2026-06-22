import { useRouter } from "@tanstack/react-router";
import { ArrowUpRight, Database, FileText, Images } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import { api, useQuery } from "@/lib/convex/hooks";
import { getSearchGroupLabel, groupSearchResults, type SearchResultGroup } from "@/lib/search/live";

const groupOrder: SearchResultGroup[] = ["content", "schema", "media"];

type CommandPaletteProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function CommandPalette({ open: controlledOpen, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const [query, setQuery] = useState("");

  const open = controlledOpen ?? internalOpen;
  const searchResults =
    useQuery(
      api.search.globalSearch,
      open && query.trim() ? { query: query.trim(), limit: 24 } : "skip",
    ) ?? [];

  const setOpen = useCallback(
    (next: boolean) => {
      if (onOpenChange) {
        onOpenChange(next);
      } else {
        setInternalOpen(next);
      }
    },
    [onOpenChange],
  );

  const groupedResults = useMemo(() => groupSearchResults(searchResults), [searchResults]);
  const totalResults = searchResults.length;

  const handleSelect = useCallback(
    (href: string) => {
      setOpen(false);
      setQuery("");
      router.history.push(href);
    },
    [router, setOpen],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(!open);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, setOpen]);

  useEffect(() => {
    if (!open) {
      setQuery("");
    }
  }, [open]);

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Command center"
      description="Search content, schema, and media"
      className="max-w-3xl overflow-hidden rounded-[1.8rem] border-border bg-[linear-gradient(180deg,oklch(1_0_0),oklch(0.985_0.006_120))] p-0 shadow-[0_30px_80px_-38px_oklch(0.28_0.02_145/0.35)]"
    >
      <div className="border-b border-border/80 px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="app-kicker">Command center</p>
            <h2 className="mt-3 text-xl font-semibold text-foreground">
              Jump straight to the right surface.
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="rounded-full bg-secondary px-2.5 py-1 font-medium text-secondary-foreground">
              {query ? `${totalResults} results` : "Live search"}
            </span>
          </div>
        </div>
      </div>

      <CommandInput
        placeholder="Search content, schema, media..."
        value={query}
        onValueChange={setQuery}
      />

      {!query ? (
        <div className="grid gap-3 border-b border-border/80 px-4 py-4 sm:grid-cols-3 sm:px-5">
          {[
            {
              icon: Database,
              label: "Schema",
              note: "Collections, relationships, and field guardrails",
            },
            {
              icon: FileText,
              label: "Content",
              note: "Drafts, published entries, and preview states",
            },
            {
              icon: Images,
              label: "Media",
              note: "Assets, tags, upload provenance, and formats",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="app-panel-soft rounded-[1.25rem] px-4 py-4">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-white shadow-sm">
                  <Icon className="size-4 text-foreground" aria-hidden="true" />
                </div>
                <p className="mt-4 text-sm font-semibold text-foreground">{item.label}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.note}</p>
              </div>
            );
          })}
        </div>
      ) : null}

      <CommandList>
        <CommandEmpty>
          {query
            ? "No live results found."
            : "Start typing to search live content, schema, and media."}
        </CommandEmpty>
        {groupOrder.map((group) => {
          const results = groupedResults[group];
          if (results.length === 0) {
            return null;
          }

          return (
            <CommandGroup key={group} heading={getSearchGroupLabel(group)}>
              {results.map((result) => (
                <CommandItem
                  key={result.id}
                  value={`${result.title} ${result.subtitle ?? ""}`}
                  onSelect={() => handleSelect(result.href)}
                >
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-medium">{result.title}</span>
                    {result.subtitle ? (
                      <span className="truncate text-xs text-muted-foreground">
                        {result.subtitle}
                      </span>
                    ) : null}
                  </div>
                  <ArrowUpRight className="size-4 text-muted-foreground" aria-hidden="true" />
                </CommandItem>
              ))}
            </CommandGroup>
          );
        })}
      </CommandList>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-border/80 px-4 py-3 text-xs text-muted-foreground sm:px-5">
        <CommandShortcut className="ml-0">Esc</CommandShortcut> close
        <CommandShortcut className="ml-0">Up/Down</CommandShortcut> navigate
        <CommandShortcut className="ml-0">Enter</CommandShortcut> open
      </div>
    </CommandDialog>
  );
}
