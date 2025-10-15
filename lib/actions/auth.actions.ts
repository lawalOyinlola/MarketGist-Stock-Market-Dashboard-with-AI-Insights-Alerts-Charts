"use server";

import { auth } from "@/lib/better-auth/auth";
import { inngest } from "@/lib/inngest/client";
import { headers } from "next/headers";
import { toast } from "sonner";

export const signUpWithEmail = async ({
  email,
  password,
  fullName,
  country,
  investmentGoals,
  riskTolerance,
  preferredIndustry,
}: SignUpFormData) => {
  try {
    // Validate required fields
    if (!email || !password || !fullName) {
      return {
        success: false,
        error: "Email, password, and full name are required",
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]@[^\s@]\.[^\s@]$/;
    if (!emailRegex.test(email)) {
      return {
        success: false,
        error: "Invalid email format",
      };
    }

    // Validate password strength (example: minimum 8 characters)
    if (password.length < 8) {
      return {
        success: false,
        error: "Password must be at least 8 characters",
      };
    }

    const response = await auth.api.signUpEmail({
      body: { email, password, name: fullName },
    });

    if (response) {
      try {
        await inngest.send({
          name: "app/user.created",
          data: {
            email,
            name: fullName,
            country,
            investmentGoals,
            riskTolerance,
            preferredIndustry,
          },
        });
      } catch (eventError) {
        console.error("Failed to send welcome email event:", eventError);
        // User is created but email won't be sent - could add to a retry queue
      }
    }

    return { success: true, data: response };
  } catch (e) {
    console.error("Sign up failed:", e);
    const errorMessage = e instanceof Error ? e.message : "Sign up failed";

    toast.error(
      errorMessage.includes("already exists")
        ? "An account with this email already exists"
        : "Sign up failed. Please try again."
    );

    return {
      success: false,
      error: errorMessage.includes("already exists")
        ? "An account with this email already exists"
        : "Sign up failed. Please try again.",
    };
  }
};

export const signInWithEmail = async ({ email, password }: SignInFormData) => {
  try {
    if (!email || !password) {
      return { success: false, error: "Email and password are required" };
    }

    const response = await auth.api.signInEmail({ body: { email, password } });

    return { success: true, data: response };
  } catch (e) {
    console.error("Sign in failed", e);
    const errorMessage = e instanceof Error ? e.message : "Sign in failed";

    toast.error(
      errorMessage.includes("Invalid credentials") ||
        errorMessage.includes("not found")
        ? "Invalid email or password"
        : "Sign in failed. Please try again."
    );

    return {
      success: false,
      error:
        errorMessage.includes("Invalid credentials") ||
        errorMessage.includes("not found")
          ? "Invalid email or password"
          : "Sign in failed. Please try again.",
    };
  }
};

export const signOut = async () => {
  try {
    await auth.api.signOut({ headers: await headers() });
    return { success: true };
  } catch (e) {
    console.error("Sign out failed", e);
    return { success: false, error: "Sign out failed" };
  }
};
