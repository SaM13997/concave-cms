import { FIELD_TYPE_LABELS, FIELD_TYPES, type SchemaFieldType } from "@/lib/mock/schema";
import { cn } from "@/lib/utils";

type FieldTypePickerProps = {
  value: SchemaFieldType;
  onChange: (value: SchemaFieldType) => void;
  disabled?: boolean;
  id?: string;
  className?: string;
};

export function FieldTypePicker({
  value,
  onChange,
  disabled = false,
  id,
  className,
}: FieldTypePickerProps) {
  return (
    <select
      id={id}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value as SchemaFieldType)}
      className={cn(
        "h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none",
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    >
      {FIELD_TYPES.map((type) => (
        <option key={type} value={type}>
          {FIELD_TYPE_LABELS[type]}
        </option>
      ))}
    </select>
  );
}
