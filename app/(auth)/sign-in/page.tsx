"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import InputField from "@/components/forms/InputField";
import InputGroupField from "@/components/forms/InputGroupField";
import { InputGroupAddon, InputGroupButton } from "@/components/ui/input-group";
import FooterLink from "@/components/forms/FooterLink";
import { signInWithEmail } from "@/lib/actions/auth.actions";
import { toast } from "sonner";
// import { signInEmail } from "better-auth/api";
import { Spinner } from "@/components/ui/spinner";
import { EyeIcon, EyeOffIcon } from "lucide-react";

const SignIn = () => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormData>({
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onBlur",
  });

  const onSubmit = async (data: SignInFormData) => {
    try {
      const result = await signInWithEmail(data);

      if (result.success) {
        toast.success("Sign in successful!", { description: "Redirecting..." });
        setIsRedirecting(true);
        return router.push("/");
      }
      toast.error("Sign in failed!", {
        description: result.error ?? "Invalid email or password.",
      });
    } catch (e) {
      console.error(e);
      toast.error("Sign in failed!", {
        description: e instanceof Error ? e.message : "Failed to sign in.",
      });
    }
  };

  return (
    <>
      <h1 className="form-title">Welcome back</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <InputField
          name="email"
          label="Email"
          placeholder="example@email.com"
          register={register}
          error={errors.email}
          validation={{
            required: "Email is required",
            pattern: {
              value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
              message: "Please enter a valid email address",
            },
          }}
        />

        <InputGroupField
          name="password"
          label="Password"
          placeholder="Enter your password"
          type={showPassword ? "text" : "password"}
          register={register}
          error={errors.password}
          validation={{ required: "Password is required", minLength: 8 }}
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

        <Button
          type="submit"
          disabled={isSubmitting || isRedirecting}
          className="auth-btn mt-5"
        >
          {isSubmitting && <Spinner />}
          {isSubmitting || isRedirecting ? "Signing In" : "Sign In"}
        </Button>

        <div className="flex justify-end mt-2">
          <a
            href="/forgot-password"
            className="text-sm text-gray-400 hover:text-app-color transition-colors"
          >
            Forgot password?
          </a>
        </div>

        <FooterLink
          text="Don't have an account?"
          linkText="Create an account"
          href="/sign-up"
        />
      </form>
    </>
  );
};
export default SignIn;
