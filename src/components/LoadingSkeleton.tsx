import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type LoadingSkeletonProps = {
  variant?: "page" | "table" | "cards";
  className?: string;
};

export function LoadingSkeleton({ variant = "page", className }: LoadingSkeletonProps) {
  if (variant === "table") {
    return (
      <div className={cn("space-y-3", className)} role="status" aria-busy="true">
        <span className="sr-only">Loading</span>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-4/5" />
      </div>
    );
  }

  if (variant === "cards") {
    return (
      <div className={cn("grid gap-3 sm:grid-cols-2", className)} role="status" aria-busy="true">
        <span className="sr-only">Loading</span>
        <Skeleton className="h-28 w-full rounded-lg" />
        <Skeleton className="h-28 w-full rounded-lg" />
        <Skeleton className="h-28 w-full rounded-lg" />
        <Skeleton className="h-28 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)} role="status" aria-busy="true">
      <span className="sr-only">Loading</span>
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-72 max-w-full" />
      <Skeleton className="h-40 w-full rounded-lg" />
    </div>
  );
}
