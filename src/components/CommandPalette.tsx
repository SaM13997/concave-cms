import { useRouter } from "@tanstack/react-router";
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
import {
  filterMockSearch,
  getSearchGroupLabel,
  groupSearchResults,
  type SearchResultGroup,
} from "@/lib/mock/search";

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

  const groupedResults = useMemo(() => {
    return groupSearchResults(filterMockSearch(query));
  }, [query]);

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
      title="Command palette"
      description="Search content, schema, and media"
      data-blocker="BE-007"
    >
      <CommandInput
        placeholder="Search content, schema, media..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
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
                    <span className="truncate">{result.title}</span>
                    {result.subtitle ? (
                      <span className="truncate text-xs text-muted-foreground">
                        {result.subtitle}
                      </span>
                    ) : null}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          );
        })}
      </CommandList>
      <div className="border-t px-3 py-2 text-xs text-muted-foreground">
        <CommandShortcut className="ml-0">Esc</CommandShortcut> close ·{" "}
        <CommandShortcut className="ml-0">↑↓</CommandShortcut> navigate ·{" "}
        <CommandShortcut className="ml-0">Enter</CommandShortcut> open
      </div>
    </CommandDialog>
  );
}
