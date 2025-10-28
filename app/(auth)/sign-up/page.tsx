"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import {
  INVESTMENT_GOALS,
  PREFERRED_INDUSTRIES,
  RISK_TOLERANCE_OPTIONS,
} from "@/lib/constants";
import { signUpWithEmail } from "@/lib/actions/auth.actions";
import { Button } from "@/components/ui/button";
import InputField from "@/components/forms/InputField";
import InputGroupField from "@/components/forms/InputGroupField";
import { InputGroupAddon, InputGroupButton } from "@/components/ui/input-group";
import SelectField from "@/components/forms/SelectField";
import { CountrySelectField } from "@/components/forms/CountrySelectField";
import FooterLink from "@/components/forms/FooterLink";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { EyeIcon, EyeOffIcon } from "lucide-react";

const SignUp = () => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormData>({
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      country: "NG",
      investmentGoals: "Growth",
      riskTolerance: "Medium",
      preferredIndustry: "Technology",
    },
    mode: "onBlur",
  });

  const onSubmit = async (data: SignUpFormData) => {
    try {
      const result = await signUpWithEmail(data);

      if (result.success) {
        toast.success("Sign up successful", {
          description: "Welcome aboard! Redirecting...",
        });
        setIsRedirecting(true);
        return router.push("/");
      }
      toast.error("Sign up failed", {
        description: result.error ?? "Failed to create an account.",
      });
    } catch (e) {
      console.error(e);
      toast.error("Sign up failed", {
        description:
          e instanceof Error ? e.message : "Failed to create an account.",
      });
    }
  };

  return (
    <>
      <h1 className="form-title">Sign Up & Personalize</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <InputField
          name="fullName"
          label="Full Name"
          placeholder="John Doe"
          register={register}
          error={errors.fullName}
          validation={{
            required: "Full name is required",
            minLength: {
              value: 2,
              message: "Full name must be at least 2 characters long",
            },
          }}
        />

        <InputField
          name="email"
          label="Email"
          placeholder="oyinlolalawal1705@gmail.com"
          register={register}
          error={errors.email}
          validation={{
            required: "Email address is required",
            pattern: {
              value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
              message: "Please enter a valid email address",
            },
          }}
        />

        <InputGroupField
          name="password"
          label="Password"
          placeholder="Enter a strong password"
          type={showPassword ? "text" : "password"}
          register={register}
          error={errors.password}
          validation={{
            required: "Password is required",
            minLength: {
              value: 8,
              message: "Password must be at least 8 characters long",
            },
          }}
        >
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              onClick={() => setShowPassword((prev) => !prev)}
              className="input-group-addon"
              aria-label="Toggle password visibility"
              title={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
            >
              {showPassword ? (
                <EyeIcon className="size-4" />
              ) : (
                <EyeOffIcon className="size-4" />
              )}
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroupField>

        <CountrySelectField
          name="country"
          label="Country"
          control={control}
          error={errors.country}
          required
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SelectField
            name="investmentGoals"
            label="Investment Goals"
            placeholder="Select your investment goal"
            options={INVESTMENT_GOALS}
            control={control}
            error={errors.investmentGoals}
            required
          />

          <SelectField
            name="riskTolerance"
            label="Risk Tolerance"
            placeholder="Select your risk level"
            options={RISK_TOLERANCE_OPTIONS}
            control={control}
            error={errors.riskTolerance}
            required
          />
        </div>

        <SelectField
          name="preferredIndustry"
          label="Preferred Industry"
          placeholder="Select your preferred industry"
          options={PREFERRED_INDUSTRIES}
          control={control}
          error={errors.preferredIndustry}
          required
        />

        <Button
          type="submit"
          disabled={isSubmitting || isRedirecting}
          className="auth-btn w-full mt-5"
        >
          {isSubmitting && <Spinner />}
          {isSubmitting || isRedirecting
            ? "Creating Account"
            : "Start Your Investing Journey"}
        </Button>

        <FooterLink
          text="Already have an account?"
          linkText="Sign in"
          href="/sign-in"
        />
      </form>
    </>
  );
};
export default SignUp;
