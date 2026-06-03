import { Input } from "@/components/ui/input";

type FormFieldProps = {
  label: string;
  name: string;
  placeholder?: string;
  type?: string;
  defaultValue?: string;
  maxLength?: number;
};

export function FormField({
  label,
  name,
  placeholder,
  type = "text",
  defaultValue,
  maxLength,
}: FormFieldProps) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium">{label}</span>
      <Input
        name={name}
        placeholder={placeholder ?? label}
        type={type}
        defaultValue={defaultValue}
        maxLength={maxLength}
      />
    </label>
  );
}

type TextAreaFieldProps = {
  label: string;
  name: string;
  placeholder?: string;
  defaultValue?: string;
};

export function TextAreaField({
  label,
  name,
  placeholder,
  defaultValue,
}: TextAreaFieldProps) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium">{label}</span>
      <textarea
        name={name}
        placeholder={placeholder ?? label}
        defaultValue={defaultValue}
        className="min-h-28 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </label>
  );
}

type SelectFieldProps = {
  label: string;
  name: string;
  options: string[];
  defaultValue?: string;
};

export function SelectField({
  label,
  name,
  options,
  defaultValue = "",
}: SelectFieldProps) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue}
        className="h-11 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value="" disabled>
          Select {label.toLowerCase()}
        </option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
