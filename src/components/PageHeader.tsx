import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";

export type PageBreadcrumb = {
  href?: string;
  label: string;
};

type PageHeaderProps = {
  title: string;
  description?: string;
  breadcrumbs?: PageBreadcrumb[];
  actions?: React.ReactNode;
  className?: string;
  eyebrow?: string;
};

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  className,
  eyebrow,
}: PageHeaderProps) {
  return (
    <div
      className={cn("flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between", className)}
    >
      <div className="space-y-2">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbs.map((crumb, index) => {
                const isLast = index === breadcrumbs.length - 1;

                return (
                  <BreadcrumbItem key={`${crumb.label}-${index}`}>
                    {isLast || !crumb.href ? (
                      <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
                    )}
                    {!isLast && <BreadcrumbSeparator />}
                  </BreadcrumbItem>
                );
              })}
            </BreadcrumbList>
          </Breadcrumb>
        )}
        <div>
          {eyebrow ? <p className="app-kicker mb-3">{eyebrow}</p> : null}
          <h1 className="max-w-4xl text-[clamp(2rem,3vw,3.25rem)] font-semibold leading-[0.95] text-foreground">
            {title}
          </h1>
          {description ? (
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-[0.95rem]">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
