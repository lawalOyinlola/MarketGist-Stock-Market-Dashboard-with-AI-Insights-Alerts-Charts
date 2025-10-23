import React from "react";
import {
  InputGroup,
  InputGroupInput,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { cn } from "@/lib/utils";

const InputGroupField = ({
  name,
  label,
  placeholder,
  type = "text",
  mode = "input",
  register,
  error,
  validation,
  disabled,
  value,
  className,
  children,
}: InputGroupFieldProps) => {
  const inputProps = {
    id: name,
    placeholder,
    disabled,
    value,
    className: cn(
      "form-input",
      { "opacity-50 cursor-not-allowed": disabled },
      error && "border-red-500 focus:border-red-500"
    ),
    "aria-invalid": !!error,
    "aria-describedby": error ? `${name}-error` : undefined,
    ...(register ? register(name, validation) : {}),
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label htmlFor={name} className="form-label">
          {label}
        </label>
      )}
      <InputGroup className={cn("w-full", error && "border-red-500")}>
        {children}
        {mode === "input" ? (
          <InputGroupInput type={type} {...inputProps} />
        ) : (
          <InputGroupTextarea {...inputProps} />
        )}
      </InputGroup>
      {error && <p className="text-sm text-red-500">{error.message}</p>}
    </div>
  );
};

export default InputGroupField;
