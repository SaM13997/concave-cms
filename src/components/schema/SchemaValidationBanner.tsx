import { AlertTriangle } from "lucide-react";
import type { FieldValidationError } from "@/lib/schema/live";
import { cn } from "@/lib/utils";

type SchemaValidationBannerProps = {
  errors: FieldValidationError[];
  className?: string;
};

export function SchemaValidationBanner({ errors, className }: SchemaValidationBannerProps) {
  if (errors.length === 0) {
    return null;
  }

  const uniqueMessages = [...new Set(errors.map((error) => error.message))];

  return (
    <div
      role="alert"
      data-blocker="BE-002"
      className={cn(
        "rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive",
        className,
      )}
    >
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <div>
          <p className="font-medium">Schema validation failed</p>
          <p className="mt-1 text-destructive/90">
            Fix the issues below before saving or applying this schema.
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-destructive/90">
            {uniqueMessages.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export function getFieldError(errors: FieldValidationError[], fieldId: string): string | undefined {
  return errors.find((error) => error.fieldId === fieldId)?.message;
}
