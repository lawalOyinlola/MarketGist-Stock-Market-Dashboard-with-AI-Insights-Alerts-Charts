import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const InputField = ({
  name,
  label,
  placeholder,
  type = "text",
  register,
  error,
  validation,
  disabled,
  value,
  ...props
}: FormInputProps) => {
  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor={name} className="form-label">
          {label}
        </Label>
      )}
      <Input
        type={type}
        id={name}
        placeholder={placeholder}
        disabled={disabled}
        value={value}
        className={cn("form-input", {
          "opacity-50 cursor-not-allowed": disabled,
        })}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
        {...props}
        {...register(name, validation)}
      />

      {error && (
        <p id={`${name}-error`} role="alert" className="text-sm text-red-500">
          {error.message}
        </p>
      )}
    </div>
  );
};
export default InputField;
