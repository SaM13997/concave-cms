import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useMyRole } from "@/hooks/use-my-role";

type GoTarget = "home" | "content" | "media" | "schema" | "audit" | "settings";

const GO_PATHS: Record<GoTarget, string> = {
  home: "/",
  content: "/content",
  media: "/media",
  schema: "/schema",
  audit: "/audit",
  settings: "/settings",
};

export function useGlobalKeyboardShortcuts() {
  const navigate = useNavigate();
  const { hasPermission } = useMyRole();

  useEffect(() => {
    let goMode = false;
    let goTimer: number | null = null;

    const clearGoMode = () => {
      goMode = false;
      if (goTimer !== null) {
        window.clearTimeout(goTimer);
        goTimer = null;
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName.toLowerCase();
      const isEditable =
        tag === "input" || tag === "textarea" || tag === "select" || target?.isContentEditable;

      if (isEditable || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      if (event.key === "g") {
        goMode = true;
        if (goTimer !== null) {
          window.clearTimeout(goTimer);
        }
        goTimer = window.setTimeout(() => {
          goMode = false;
          goTimer = null;
        }, 1500);
        return;
      }

      if (!goMode) {
        return;
      }

      const destination: GoTarget | null =
        event.key === "h"
          ? "home"
          : event.key === "c"
            ? "content"
            : event.key === "m"
              ? "media"
              : event.key === "s"
                ? "schema"
                : event.key === "a"
                  ? "audit"
                  : event.key === ","
                    ? "settings"
                    : null;

      if (!destination) {
        return;
      }

      event.preventDefault();
      clearGoMode();

      if (
        (destination === "schema" || destination === "audit" || destination === "settings") &&
        !hasPermission("schema:read")
      ) {
        return;
      }
      if (
        (destination === "content" || destination === "media") &&
        !hasPermission("content:read")
      ) {
        return;
      }

      void navigate({ to: GO_PATHS[destination] });
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      clearGoMode();
    };
  }, [navigate, hasPermission]);
}

export function useListKeyboardNavigation<T extends { id: string }>(
  items: T[],
  selectedId: string | null,
  onSelect: (id: string) => void,
  enabled = true,
) {
  useEffect(() => {
    if (!enabled || items.length === 0) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select" || target?.isContentEditable) {
        return;
      }

      if (
        event.key !== "ArrowDown" &&
        event.key !== "ArrowUp" &&
        event.key !== "j" &&
        event.key !== "k"
      ) {
        return;
      }

      event.preventDefault();
      const currentIndex = selectedId ? items.findIndex((item) => item.id === selectedId) : -1;

      const delta = event.key === "ArrowDown" || event.key === "j" ? 1 : -1;
      const nextIndex =
        currentIndex === -1
          ? delta > 0
            ? 0
            : items.length - 1
          : (currentIndex + delta + items.length) % items.length;

      const next = items[nextIndex];
      if (next) {
        onSelect(next.id);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [items, selectedId, onSelect, enabled]);
}
