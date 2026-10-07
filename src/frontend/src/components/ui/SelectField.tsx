import * as SelectPrimitive from "@radix-ui/react-select";

import { Icon } from "./Icon";

const emptyValue = "__empty-selection__";

export interface SelectOption {
  disabled?: boolean;
  label: string;
  value: string;
}

interface SelectFieldProps {
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
  className?: string;
  disabled?: boolean;
  id: string;
  name?: string;
  onBlur?: () => void;
  onCloseAutoFocus?: (event: Event) => void;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
  value: string;
}

function fromRadixValue(value: string) {
  return value === emptyValue ? "" : value;
}

function toRadixValue(value: string) {
  return value === "" ? emptyValue : value;
}

export function SelectField({
  "aria-describedby": describedBy,
  "aria-invalid": invalid,
  className = "",
  disabled,
  id,
  name,
  onBlur,
  onCloseAutoFocus,
  onValueChange,
  options,
  placeholder,
  required,
  value,
}: SelectFieldProps) {
  return (
    <SelectPrimitive.Root
      disabled={disabled}
      name={name}
      onValueChange={(nextValue) => onValueChange(fromRadixValue(nextValue))}
      required={required}
      value={toRadixValue(value)}
    >
      <SelectPrimitive.Trigger
        aria-describedby={describedBy}
        aria-invalid={invalid}
        className={`ui-field inline-flex items-center justify-between gap-3 text-left ${className}`}
        data-value={value}
        id={id}
        onBlur={onBlur}
      >
        <span className="ui-select-value">
          <SelectPrimitive.Value placeholder={placeholder} />
        </span>
        <SelectPrimitive.Icon className="shrink-0" asChild>
          <Icon name="chevron-down" size={19} />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          className="z-50 max-h-[min(22rem,var(--radix-select-content-available-height))] w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-xl border border-border bg-surface-raised p-1.5 text-text shadow-lg shadow-shadow"
          collisionPadding={12}
          onCloseAutoFocus={onCloseAutoFocus}
          position="popper"
          sideOffset={6}
        >
          <SelectPrimitive.ScrollUpButton className="flex h-11 items-center justify-center text-text-muted">
            <Icon className="rotate-180" name="chevron-down" size={18} />
          </SelectPrimitive.ScrollUpButton>
          <SelectPrimitive.Viewport>
            {options.map((option) => (
              <SelectPrimitive.Item
                className="ui-select-option relative flex min-h-12 cursor-default select-none items-center break-words rounded-lg border-b border-border py-2.5 pl-3 pr-10 text-base last:border-b-0 data-[disabled]:pointer-events-none data-[disabled]:bg-disabled-surface data-[disabled]:text-disabled-text data-[highlighted]:bg-surface-subtle data-[state=checked]:bg-surface-subtle data-[state=checked]:font-bold"
                data-value={option.value}
                disabled={option.disabled}
                key={`${option.value}-${option.label}`}
                value={toRadixValue(option.value)}
              >
                <SelectPrimitive.ItemText>
                  {option.label}
                </SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator
                  className="absolute right-3 font-bold"
                  aria-hidden="true"
                >
                  ✓
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
          <SelectPrimitive.ScrollDownButton className="flex h-11 items-center justify-center text-text-muted">
            <Icon name="chevron-down" size={18} />
          </SelectPrimitive.ScrollDownButton>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
