"use client";

import { useForm } from "react-hook-form";
import InputGroupField from "../forms/InputGroupField";
import { InputGroupAddon, InputGroupButton } from "../ui/input-group";
import { Button } from "../ui/button";

// Example component showing InputGroupField usage
const InputGroupFieldExample = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = (data: any) => {
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
      <h3 className="text-lg font-semibold">InputGroupField Examples</h3>

      {/* Price Input with Dollar Sign */}
      <InputGroupField
        name="price"
        label="Price"
        placeholder="0.00"
        type="number"
        register={register}
        error={errors.price}
        validation={{
          required: "Price is required",
          min: { value: 0, message: "Price must be positive" },
        }}
      >
        <InputGroupAddon>$</InputGroupAddon>
      </InputGroupField>

      {/* Email Input with @ Symbol */}
      <InputGroupField
        name="email"
        label="Email"
        placeholder="username"
        type="email"
        register={register}
        error={errors.email}
        validation={{
          required: "Email is required",
          pattern: {
            value: /^\S+@\S+$/i,
            message: "Invalid email address",
          },
        }}
      >
        <InputGroupAddon>@</InputGroupAddon>
        <InputGroupAddon>company.com</InputGroupAddon>
      </InputGroupField>

      {/* Textarea with Label */}
      <InputGroupField
        name="description"
        label="Description"
        placeholder="Enter description..."
        mode="textarea"
        register={register}
        error={errors.description}
        validation={{
          required: "Description is required",
          minLength: {
            value: 10,
            message: "Description must be at least 10 characters",
          },
        }}
      >
        <InputGroupAddon>📝</InputGroupAddon>
      </InputGroupField>

      {/* Password with Toggle Button */}
      <InputGroupField
        name="password"
        label="Password"
        placeholder="Enter password"
        type="password"
        register={register}
        error={errors.password}
        validation={{
          required: "Password is required",
          minLength: {
            value: 8,
            message: "Password must be at least 8 characters",
          },
        }}
      >
        <InputGroupAddon>🔒</InputGroupAddon>
        <InputGroupButton>
          <Button type="button" size="sm" variant="ghost">
            Show
          </Button>
        </InputGroupButton>
      </InputGroupField>

      <Button type="submit" className="w-full">
        Submit
      </Button>
    </form>
  );
};

export default InputGroupFieldExample;
