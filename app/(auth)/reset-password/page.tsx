"use client";

import { useState, useEffect, Suspense } from "react";
import { useForm } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import InputGroupField from "@/components/forms/InputGroupField";
import { InputGroupAddon, InputGroupButton } from "@/components/ui/input-group";
import FooterLink from "@/components/forms/FooterLink";
import { resetPasswordWithToken } from "@/lib/actions/auth.actions";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { EyeIcon, EyeOffIcon } from "lucide-react";

const ResetPasswordContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryToken = searchParams.get("token");
  const error = searchParams.get("error");
  const [token, setToken] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isValidatingToken, setIsValidatingToken] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // Check if there's an error in the URL (from better-auth redirect)
    if (error === "INVALID_TOKEN") {
      toast.error("Invalid or expired link", {
        description: "Please request a new password reset link.",
      });
      router.push("/forgot-password");
      return;
    }

    // Extract token from query parameter (better-auth will redirect here with the token)
    const finalToken = queryToken;

    if (!finalToken) {
      setIsValidatingToken(false);
      toast.error("Invalid reset link", {
        description: "Please request a new password reset.",
      });
      router.push("/forgot-password");
    } else {
      setToken(finalToken);
      setIsValidatingToken(false);
    }
  }, [queryToken, error, router]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
    mode: "onBlur",
  });

  const password = watch("password");

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) return;

    try {
      const result = await resetPasswordWithToken({
        token,
        password: data.password,
      });

      if (result.success) {
        toast.success("Password reset successful!", {
          description: "Redirecting to sign in...",
        });
        setIsRedirecting(true);
        setTimeout(() => {
          router.push("/sign-in");
        }, 1500);
      } else {
        toast.error("Password reset failed", {
          description: result.error ?? "Please try again.",
        });
      }
    } catch (e) {
      console.error(e);
      toast.error("Password reset failed", {
        description: e instanceof Error ? e.message : "Please try again.",
      });
    }
  };

  if (isValidatingToken || !token) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Spinner />
      </div>
    );
  }

  return (
    <>
      <h1 className="form-title">Reset Password</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <InputGroupField
          name="password"
          label="New Password"
          placeholder="Enter your new password"
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
              type="button"
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

        <InputGroupField
          name="confirmPassword"
          label="Confirm New Password"
          placeholder="Confirm your new password"
          type={showConfirmPassword ? "text" : "password"}
          register={register}
          error={errors.confirmPassword}
          validation={{
            required: "Please confirm your password",
            validate: (value: string) =>
              value === password || "Passwords do not match",
          }}
        >
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className="input-group-addon"
              aria-label="Toggle password visibility"
              title={showConfirmPassword ? "Hide password" : "Show password"}
              aria-pressed={showConfirmPassword}
            >
              {showConfirmPassword ? (
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
          {isSubmitting || isRedirecting ? "Resetting..." : "Reset Password"}
        </Button>

        <FooterLink
          text="Remember your password?"
          linkText="Sign in"
          href="/sign-in"
        />
      </form>
    </>
  );
};

const ResetPassword = () => {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[200px]">
          <Spinner className="size-12" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
};

export default ResetPassword;
