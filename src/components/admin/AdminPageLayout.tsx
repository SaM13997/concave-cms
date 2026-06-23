import type { ReactNode } from "react";
import { UserButton } from "@/components/User-button";
import { cn } from "@/lib/utils";

export type AdminPageLayoutProps = {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  /** Applied to the page content wrapper (below the header). */
  contentClassName?: string;
  contentTestId?: string;
  /** When true, header and content share one stacked column with gap-6 (no mt-8). */
  stacked?: boolean;
  showUserButton?: boolean;
  className?: string;
};

export function AdminPageHeader({
  title,
  description,
  actions,
  showUserButton = true,
}: Pick<AdminPageLayoutProps, "title" | "description" | "actions" | "showUserButton">) {
  const hasHeaderActions = Boolean(actions) || showUserButton;

  return (
    <header className="flex w-full items-center justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">{title}</h1>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {hasHeaderActions ? (
        <div className="flex shrink-0 items-center gap-2">
          {actions}
          {showUserButton ? <UserButton /> : null}
        </div>
      ) : null}
    </header>
  );
}

export function AdminPageLayout({
  title,
  description,
  actions,
  children,
  contentClassName,
  contentTestId,
  stacked = false,
  showUserButton = true,
  className,
}: AdminPageLayoutProps) {
  if (stacked) {
    return (
      <div
        className={cn(
          "mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6 text-foreground sm:px-6 lg:px-8",
          className,
        )}
      >
        <AdminPageHeader
          title={title}
          description={description}
          actions={actions}
          showUserButton={showUserButton}
        />
        <div data-testid={contentTestId} className={contentClassName}>
          {children}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex min-h-screen flex-col bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8",
        className,
      )}
    >
      <div className="mx-auto w-full max-w-4xl">
        <AdminPageHeader
          title={title}
          description={description}
          actions={actions}
          showUserButton={showUserButton}
        />
      </div>
      <div
        data-testid={contentTestId}
        className={cn("mx-auto mt-8 w-full max-w-4xl flex-1", contentClassName)}
      >
        {children}
      </div>
    </div>
  );
}
