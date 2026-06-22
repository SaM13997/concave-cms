import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbsProps = {
  items: BreadcrumbItem[];
  className?: string;
};

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <nav
      data-testid="breadcrumbs"
      aria-label="Breadcrumb"
      className={cn("flex flex-wrap items-center gap-1 text-sm text-muted-foreground", className)}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const key = item.href ?? item.label;
        return (
          <span key={key} className="inline-flex items-center gap-1">
            {index > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />}
            {item.href && !isLast ? (
              <Link
                to={item.href}
                data-testid={`breadcrumb-link-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                className="transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            ) : (
              <span
                data-testid={
                  isLast
                    ? "breadcrumb-current"
                    : `breadcrumb-${item.label.toLowerCase().replace(/\s+/g, "-")}`
                }
                className={cn(isLast && "font-medium text-foreground")}
                aria-current={isLast ? "page" : undefined}
              >
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
