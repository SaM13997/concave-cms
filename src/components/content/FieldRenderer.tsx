import { ImageIcon, Link2 } from "lucide-react";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ContentField, ContentFieldErrors } from "@/lib/content/live";
import { cn } from "@/lib/utils";

type FieldRendererProps = {
  fields: ContentField[];
  values: Record<string, unknown>;
  errors?: ContentFieldErrors;
  referenceOptions?: Record<string, Array<{ id: string; label: string }>>;
  onChange: (name: string, value: unknown) => void;
  disabled?: boolean;
};

function RichTextPlaceholder({
  id,
  label,
  value,
  error,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  error?: string;
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
          Rich text editor (HTML for now)
        </p>
        <textarea
          id={id}
          value={value}
          disabled={disabled}
          rows={6}
          onChange={(event) => onChange(event.target.value)}
          className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
          placeholder="<p>Write content...</p>"
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

function ImagePickerInput({
  id,
  label,
  value,
  error,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  error?: string;
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
            Media uploads are still separate, but you can paste an asset key or URL here.
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
            Insert placeholder asset
          </button>
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

function ReferencePicker({
  id,
  label,
  referenceType,
  value,
  options,
  error,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  referenceType: string;
  value: string;
  options: Array<{ id: string; label: string }>;
  error?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="rounded-md border border-dashed border-border bg-muted/20 p-3">
        <div className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link2 className="size-3.5" aria-hidden />
          Reference to {referenceType}
        </div>
        <select
          id={id}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
        >
          <option value="">{options.length > 0 ? "Select..." : "No entries available yet"}</option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

export function FieldRenderer({
  fields,
  values,
  errors = {},
  referenceOptions = {},
  onChange,
  disabled,
}: FieldRendererProps) {
  return (
    <div className="space-y-6">
      {fields.map((field) => {
        const rawValue = values[field.name];
        const error = errors[field.name];
        const stringValue =
          typeof rawValue === "string" ? rawValue : rawValue == null ? "" : String(rawValue);
        const checkboxValue = Boolean(rawValue);

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
                  required={field.required}
                  aria-invalid={Boolean(error)}
                  onChange={(event) => onChange(field.name, event.target.value)}
                />
                {error && <p className="text-sm text-destructive">{error}</p>}
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
                  aria-invalid={Boolean(error)}
                  onChange={(event) => onChange(field.name, event.target.value)}
                  className="w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                />
                {error && <p className="text-sm text-destructive">{error}</p>}
              </Field>
            );

          case "richtext":
            return (
              <RichTextPlaceholder
                key={field.id}
                id={field.id}
                label={field.label}
                value={stringValue}
                error={error}
                disabled={disabled}
                onChange={(value) => onChange(field.name, value)}
              />
            );

          case "image":
            return (
              <ImagePickerInput
                key={field.id}
                id={field.id}
                label={field.label}
                value={stringValue}
                error={error}
                disabled={disabled}
                onChange={(value) => onChange(field.name, value)}
              />
            );

          case "reference":
            return (
              <ReferencePicker
                key={field.id}
                id={field.id}
                label={field.label}
                referenceType={field.referenceType ?? "entry"}
                options={referenceOptions[field.name] ?? []}
                value={stringValue}
                error={error}
                disabled={disabled}
                onChange={(value) => onChange(field.name, value)}
              />
            );

          case "number":
            return (
              <Field key={field.id}>
                <FieldLabel htmlFor={field.id}>{field.label}</FieldLabel>
                <Input
                  id={field.id}
                  type="number"
                  value={stringValue}
                  disabled={disabled}
                  aria-invalid={Boolean(error)}
                  onChange={(event) => onChange(field.name, event.target.value)}
                />
                {error && <p className="text-sm text-destructive">{error}</p>}
              </Field>
            );

          case "boolean":
            return (
              <Field key={field.id}>
                <label className="flex items-start gap-3 rounded-md border border-border bg-muted/20 px-3 py-3">
                  <input
                    id={field.id}
                    type="checkbox"
                    checked={checkboxValue}
                    disabled={disabled}
                    onChange={(event) => onChange(field.name, event.target.checked)}
                    className="mt-1 size-4 rounded border-input"
                  />
                  <span className="space-y-1">
                    <span className="block text-sm font-medium">{field.label}</span>
                    <span className="block text-xs text-muted-foreground">
                      Toggle this value on or off.
                    </span>
                    {error && <span className="block text-sm text-destructive">{error}</span>}
                  </span>
                </label>
              </Field>
            );

          case "date":
            return (
              <Field key={field.id}>
                <FieldLabel htmlFor={field.id}>{field.label}</FieldLabel>
                <Input
                  id={field.id}
                  type="date"
                  value={stringValue}
                  disabled={disabled}
                  aria-invalid={Boolean(error)}
                  onChange={(event) => onChange(field.name, event.target.value)}
                />
                {error && <p className="text-sm text-destructive">{error}</p>}
              </Field>
            );

          case "select":
            return (
              <Field key={field.id}>
                <FieldLabel htmlFor={field.id}>{field.label}</FieldLabel>
                <select
                  id={field.id}
                  value={stringValue}
                  disabled={disabled}
                  aria-invalid={Boolean(error)}
                  onChange={(event) => onChange(field.name, event.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                >
                  <option value="">Select...</option>
                  {(field.options ?? []).map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                {error && <p className="text-sm text-destructive">{error}</p>}
              </Field>
            );

          case "json":
            return (
              <Field key={field.id}>
                <FieldLabel htmlFor={field.id}>{field.label}</FieldLabel>
                <textarea
                  id={field.id}
                  value={stringValue}
                  disabled={disabled}
                  rows={8}
                  aria-invalid={Boolean(error)}
                  onChange={(event) => onChange(field.name, event.target.value)}
                  className="w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 font-mono text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                  placeholder='{"key":"value"}'
                />
                <FieldDescription>Stored as JSON on the entry.</FieldDescription>
                {error && <p className="text-sm text-destructive">{error}</p>}
              </Field>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}
