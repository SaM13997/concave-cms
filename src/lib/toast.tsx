import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { ToastEventPayload } from "../../convex/lib/eventPayloads";

type ToastItem = ToastEventPayload & { id: string };

type ToastContextValue = {
  toasts: ToastItem[];
  showToast: (payload: ToastEventPayload) => void;
  dismissToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (payload: ToastEventPayload) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const toast: ToastItem = { ...payload, id };
      setToasts((current) => [...current, toast]);

      const duration = payload.durationMs ?? 4000;
      window.setTimeout(() => {
        dismissToast(id);
      }, duration);
    },
    [dismissToast],
  );

  const value = useMemo(
    () => ({
      toasts,
      showToast,
      dismissToast,
    }),
    [toasts, showToast, dismissToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        data-testid="toast-container"
        className="pointer-events-none fixed right-4 top-4 z-[100] flex w-full max-w-sm flex-col gap-2"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            data-testid={`toast-${toast.type}`}
            className={cn(
              "pointer-events-auto rounded-lg border px-4 py-3 shadow-lg backdrop-blur-sm",
              toast.type === "success" && "border-emerald-500/30 bg-emerald-950/90 text-emerald-50",
              toast.type === "error" && "border-red-500/30 bg-red-950/90 text-red-50",
              toast.type === "info" && "border-sky-500/30 bg-sky-950/90 text-sky-50",
            )}
          >
            <p className="text-sm font-medium">{toast.title}</p>
            {toast.message && <p className="mt-1 text-xs opacity-90">{toast.message}</p>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
