"use client";

import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import InputField from "@/components/forms/InputField";
import FooterLink from "@/components/forms/FooterLink";
import { signInWithEmail } from "@/lib/actions/auth.actions";
import { toast } from "sonner";
// import { signInEmail } from "better-auth/api";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";

const SignIn = () => {
  const router = useRouter();

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
      if (result.success) router.push("/");
      toast.success("Sign in successful!", {
        description: "redirecting...",
      });
    } catch (e) {
      console.error(e);
      toast.error("Sign in failed", {
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

        <InputField
          name="password"
          label="Password"
          placeholder="Enter your password"
          type="password"
          register={register}
          error={errors.password}
          validation={{ required: "Password is required", minLength: 8 }}
        />

        <Button
          type="submit"
          disabled={isSubmitting}
          className="yellow-btn w-full mt-5"
        >
          {isSubmitting && <Spinner />}
          {isSubmitting ? "Signing In" : "Sign In"}
        </Button>

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
