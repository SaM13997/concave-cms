import { ImageIcon, Link2 } from "lucide-react";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SchemaField } from "@/lib/mock/content";
import { getReferenceOptions } from "@/lib/mock/content";
import { cn } from "@/lib/utils";

type FieldRendererProps = {
  fields: SchemaField[];
  values: Record<string, string>;
  onChange: (name: string, value: string) => void;
  disabled?: boolean;
};

function RichTextPlaceholder({
  id,
  label,
  value,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div
        className={cn(
          "rounded-md border border-dashed border-border bg-muted/30 p-4",
          disabled && "opacity-60",
        )}
      >
        <p className="mb-2 text-xs font-medium text-muted-foreground">
          Rich text editor (placeholder)
        </p>
        <textarea
          id={id}
          value={value}
          disabled={disabled}
          rows={6}
          onChange={(event) => onChange(event.target.value)}
          className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
          placeholder="<p>Write content…</p>"
        />
      </div>
    </div>
  );
}

function ImagePickerMock({
  id,
  label,
  value,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex flex-col gap-3 rounded-md border border-dashed border-border bg-muted/20 p-4 sm:flex-row sm:items-center">
        <div className="flex size-16 shrink-0 items-center justify-center rounded-md bg-muted">
          <ImageIcon className="size-6 text-muted-foreground" aria-hidden />
        </div>
        <div className="flex-1 space-y-2">
          <p className="text-xs text-muted-foreground">
            Media library picker (mock) — BE-010 blocks real uploads
          </p>
          <Input
            id={id}
            value={value}
            disabled={disabled}
            placeholder="media/asset-id.jpg"
            onChange={(event) => onChange(event.target.value)}
          />
          <button
            type="button"
            disabled={disabled}
            className="text-xs text-primary underline-offset-4 hover:underline disabled:opacity-50"
            onClick={() => onChange("media/placeholder.jpg")}
          >
            Select from library (mock)
          </button>
        </div>
      </div>
    </div>
  );
}

function ReferencePickerMock({
  id,
  label,
  referenceType,
  value,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  referenceType: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const options = getReferenceOptions(referenceType);

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="rounded-md border border-dashed border-border bg-muted/20 p-3">
        <div className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link2 className="size-3.5" aria-hidden />
          Reference to {referenceType} (mock)
        </div>
        <select
          id={id}
          value={value}
          disabled={disabled}
          data-blocker="BE-003"
          title="BLOCKER(BE-003): Reference resolution requires Phase 4 backend"
          onChange={(event) => onChange(event.target.value)}
          className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
        >
          <option value="">Select…</option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export function FieldRenderer({ fields, values, onChange, disabled }: FieldRendererProps) {
  return (
    <div className="space-y-6">
      {fields.map((field) => {
        const rawValue = values[field.name];
        const stringValue = typeof rawValue === "string" ? rawValue : "";

        switch (field.type) {
          case "text":
            return (
              <Field key={field.id}>
                <FieldLabel htmlFor={field.id}>
                  {field.label}
                  {field.required && <span className="text-destructive"> *</span>}
                </FieldLabel>
                <Input
                  id={field.id}
                  value={stringValue}
                  disabled={disabled}
                  placeholder={field.placeholder}
                  required={field.required}
                  onChange={(event) => onChange(field.name, event.target.value)}
                />
              </Field>
            );

          case "textarea":
            return (
              <Field key={field.id}>
                <FieldLabel htmlFor={field.id}>{field.label}</FieldLabel>
                <textarea
                  id={field.id}
                  value={stringValue}
                  disabled={disabled}
                  rows={4}
                  placeholder={field.placeholder}
                  onChange={(event) => onChange(field.name, event.target.value)}
                  className="w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                />
                {field.placeholder && <FieldDescription>{field.placeholder}</FieldDescription>}
              </Field>
            );

          case "richText":
            return (
              <RichTextPlaceholder
                key={field.id}
                id={field.id}
                label={field.label}
                value={stringValue}
                disabled={disabled}
                onChange={(value) => onChange(field.name, value)}
              />
            );

          case "image":
            return (
              <ImagePickerMock
                key={field.id}
                id={field.id}
                label={field.label}
                value={stringValue}
                disabled={disabled}
                onChange={(value) => onChange(field.name, value)}
              />
            );

          case "reference":
            return (
              <ReferencePickerMock
                key={field.id}
                id={field.id}
                label={field.label}
                referenceType={field.referenceType ?? "author"}
                value={stringValue}
                disabled={disabled}
                onChange={(value) => onChange(field.name, value)}
              />
            );

          default:
            return null;
        }
      })}
    </div>
  );
}
