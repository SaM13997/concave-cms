import { useMutation, useQuery } from "convex/react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "../../../convex/_generated/api";

type SchemaField = {
  slug: string;
  name: string;
  type: string;
  required: boolean;
  config: Record<string, unknown>;
};

type RichTextValue = { format: "html"; html: string };

type FieldEditorProps = {
  field: SchemaField;
  value: unknown;
  onChange: (value: unknown) => void;
};

function RichTextEditor({ field, value, onChange }: FieldEditorProps) {
  const richText = (value as RichTextValue | undefined) ?? { format: "html", html: "" };

  return (
    <div data-testid={`content-field-${field.slug}`}>
      <Label htmlFor={`field-${field.slug}`}>
        {field.name}
        {field.required && <span className="text-destructive"> *</span>}
      </Label>
      <textarea
        id={`field-${field.slug}`}
        data-testid={`content-field-input-${field.slug}`}
        className="mt-1 min-h-24 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        value={richText.html}
        onChange={(e) => onChange({ format: "html", html: e.target.value })}
        placeholder={`Enter ${field.name.toLowerCase()}`}
      />
    </div>
  );
}

function ReferencePicker({ field, value, onChange }: FieldEditorProps) {
  const referenceTo = typeof field.config.referenceTo === "string" ? field.config.referenceTo : "";
  const options = useQuery(
    api.content.listReferenceOptions,
    referenceTo ? { contentType: referenceTo } : "skip",
  );
  const selectedId = typeof value === "string" ? value : "";

  return (
    <div data-testid={`content-field-${field.slug}`}>
      <Label htmlFor={`field-${field.slug}`}>
        {field.name}
        {field.required && <span className="text-destructive"> *</span>}
      </Label>
      <select
        id={`field-${field.slug}`}
        data-testid={`content-field-input-${field.slug}`}
        className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        value={selectedId}
        onChange={(e) => onChange(e.target.value || undefined)}
      >
        <option value="">— Select —</option>
        {options?.map((opt) => (
          <option key={opt._id} value={opt._id}>
            {opt.title}
          </option>
        ))}
      </select>
    </div>
  );
}

function ImagePicker({ field, value, onChange }: FieldEditorProps) {
  const generateUploadUrl = useMutation(api.media.generateUploadUrl);
  const createMediaAsset = useMutation(api.media.createMediaAsset);
  const mediaAssets = useQuery(api.media.listMediaAssets, {});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const selectedId = typeof value === "string" ? value : "";
  const selectedAsset = mediaAssets?.find((a) => a._id === selectedId);

  const handleUpload = async (file: File) => {
    setUploading(true);
    setUploadError(null);
    try {
      const uploadUrl = await generateUploadUrl({});
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!response.ok) {
        throw new Error("Upload failed");
      }
      const { storageId } = (await response.json()) as { storageId: string };
      const asset = await createMediaAsset({
        storageId,
        filename: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
      });
      onChange(asset._id);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div data-testid={`content-field-${field.slug}`}>
      <Label>
        {field.name}
        {field.required && <span className="text-destructive"> *</span>}
      </Label>
      <div className="mt-1 space-y-2">
        {selectedAsset?.url && (
          <img
            src={selectedAsset.url}
            alt={selectedAsset.alt ?? selectedAsset.filename}
            className="max-h-32 rounded-md border border-border object-cover"
            data-testid={`content-field-preview-${field.slug}`}
          />
        )}
        <div className="flex flex-wrap gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            data-testid={`content-field-upload-${field.slug}`}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                void handleUpload(file);
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid={`content-field-upload-button-${field.slug}`}
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? "Uploading..." : "Upload image"}
          </Button>
          <select
            data-testid={`content-field-input-${field.slug}`}
            className="rounded-md border border-border bg-background px-2 py-1 text-sm"
            value={selectedId}
            onChange={(e) => onChange(e.target.value || undefined)}
          >
            <option value="">— Select existing —</option>
            {mediaAssets?.map((asset) => (
              <option key={asset._id} value={asset._id}>
                {asset.filename}
              </option>
            ))}
          </select>
        </div>
        {uploadError && (
          <p className="text-xs text-destructive" data-testid={`content-field-error-${field.slug}`}>
            {uploadError}
          </p>
        )}
      </div>
    </div>
  );
}

function SchemaFieldEditor({ field, value, onChange }: FieldEditorProps) {
  switch (field.type) {
    case "richtext":
      return <RichTextEditor field={field} value={value} onChange={onChange} />;
    case "reference":
      return <ReferencePicker field={field} value={value} onChange={onChange} />;
    case "image":
      return <ImagePicker field={field} value={value} onChange={onChange} />;
    case "boolean":
      return (
        <div data-testid={`content-field-${field.slug}`} className="flex items-center gap-2">
          <input
            id={`field-${field.slug}`}
            type="checkbox"
            data-testid={`content-field-input-${field.slug}`}
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
          />
          <Label htmlFor={`field-${field.slug}`}>{field.name}</Label>
        </div>
      );
    case "number":
      return (
        <div data-testid={`content-field-${field.slug}`}>
          <Label htmlFor={`field-${field.slug}`}>{field.name}</Label>
          <Input
            id={`field-${field.slug}`}
            type="number"
            data-testid={`content-field-input-${field.slug}`}
            value={typeof value === "number" ? value : ""}
            onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
          />
        </div>
      );
    case "select": {
      const options = Array.isArray(field.config.options)
        ? field.config.options.filter((o): o is string => typeof o === "string")
        : [];
      return (
        <div data-testid={`content-field-${field.slug}`}>
          <Label htmlFor={`field-${field.slug}`}>{field.name}</Label>
          <select
            id={`field-${field.slug}`}
            data-testid={`content-field-input-${field.slug}`}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value || undefined)}
          >
            <option value="">— Select —</option>
            {options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      );
    }
    case "json":
      return (
        <div data-testid={`content-field-${field.slug}`}>
          <Label htmlFor={`field-${field.slug}`}>{field.name}</Label>
          <textarea
            id={`field-${field.slug}`}
            data-testid={`content-field-input-${field.slug}`}
            className="mt-1 min-h-20 w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm"
            value={
              typeof value === "object" && value !== null ? JSON.stringify(value, null, 2) : "{}"
            }
            onChange={(e) => {
              try {
                onChange(JSON.parse(e.target.value) as Record<string, unknown>);
              } catch {
                // keep typing
              }
            }}
          />
        </div>
      );
    default:
      return (
        <div data-testid={`content-field-${field.slug}`}>
          <Label htmlFor={`field-${field.slug}`}>
            {field.name}
            {field.required && <span className="text-destructive"> *</span>}
          </Label>
          <Input
            id={`field-${field.slug}`}
            data-testid={`content-field-input-${field.slug}`}
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      );
  }
}

type ContentEntryEditorProps = {
  fields: SchemaField[];
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
};

export function ContentEntryEditor({ fields, data, onChange }: ContentEntryEditorProps) {
  return (
    <div data-testid="content-schema-fields" className="space-y-4">
      {fields.map((field) => (
        <SchemaFieldEditor
          key={field.slug}
          field={field}
          value={data[field.slug]}
          onChange={(value) => onChange({ ...data, [field.slug]: value })}
        />
      ))}
    </div>
  );
}

export type { SchemaField, RichTextValue };
