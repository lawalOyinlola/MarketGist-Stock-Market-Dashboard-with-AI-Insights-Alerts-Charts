"use server";

import { auth } from "@/lib/better-auth/auth";
import { inngest } from "@/lib/inngest/client";
import { headers } from "next/headers";
import { connectToDatabase } from "@/database/mongoose";
import { Watchlist } from "@/database/models/watchlist.model";
import { Alert } from "@/database/models/alert.model";

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
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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
        // Migrate guest data to new user account
        await migrateGuestData(email);

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

    if (response) {
      try {
        // Migrate guest data to authenticated user account
        await migrateGuestData(email);
      } catch (migrationError) {
        console.error("Failed to migrate guest data:", migrationError);
        // Don't fail sign-in if migration fails
      }
    }

    return { success: true, data: response };
  } catch (e) {
    console.error("Sign in failed", e);
    const errorMessage = e instanceof Error ? e.message : "Sign in failed";

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

export const requestPasswordReset = async ({
  email,
}: ForgotPasswordFormData) => {
  try {
    if (!email) {
      return { success: false, error: "Email is required" };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        success: false,
        error: "Invalid email format",
      };
    }

    // Use better-auth's requestPasswordReset API
    // We construct our own URL in sendResetPassword, so we don't need redirectTo
    const response = await auth.api.requestPasswordReset({
      body: { email },
    });

    return { success: true, data: response };
  } catch (e) {
    console.error("Password reset request failed", e);
    const errorMessage =
      e instanceof Error ? e.message : "Password reset request failed";

    return {
      success: false,
      error:
        errorMessage.includes("not found") || errorMessage.includes("invalid")
          ? "No account found with this email address"
          : "Failed to send password reset email. Please try again.",
    };
  }
};

export const resetPasswordWithToken = async ({
  token,
  password,
}: ResetPasswordWithTokenData) => {
  try {
    if (!token || !password) {
      return { success: false, error: "Token and password are required" };
    }

    // Validate password strength
    if (password.length < 8) {
      return {
        success: false,
        error: "Password must be at least 8 characters",
      };
    }

    // Use better-auth's resetPassword API
    const response = await auth.api.resetPassword({
      body: { token, newPassword: password },
    });

    return { success: true, data: response };
  } catch (e) {
    console.error("Password reset failed", e);
    const errorMessage =
      e instanceof Error ? e.message : "Password reset failed";

    return {
      success: false,
      error:
        errorMessage.includes("INVALID_TOKEN") ||
        errorMessage.includes("expired") ||
        errorMessage.includes("invalid token")
          ? "Invalid or expired reset link. Please request a new one."
          : "Failed to reset password. Please try again.",
    };
  }
};

/**
 * Migrates guest user data (watchlist and alerts) to a new authenticated user account.
 * Only migrates if guest data exists for the provided email.
 * Called when user signs up or signs in with the same email used as a guest.
 */
async function migrateGuestData(email: string) {
  try {
    // Get the authenticated user's ID
    const { getAuth } = await import("@/lib/better-auth/auth");
    const auth = await getAuth();
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      console.log("No authenticated user found, skipping migration");
      return;
    }

    const newUserId = session.user.id;

    await connectToDatabase();

    // Check if guest data exists for this email before migrating
    const watchlistCount = await Watchlist.countDocuments({ userId: email });
    const alertsCount = await Alert.countDocuments({ userId: email });

    if (watchlistCount === 0 && alertsCount === 0) {
      console.log(`No guest data found for ${email}, skipping migration`);
      return;
    }

    // Migrate watchlist items
    const watchlistResult = await Watchlist.updateMany(
      { userId: email }, // Find by guest email
      { $set: { userId: newUserId } } // Update to new user ID
    );

    // Migrate alerts
    const alertsResult = await Alert.updateMany(
      { userId: email }, // Find by guest email
      { $set: { userId: newUserId } } // Update to new user ID
    );

    console.log(
      `Migrated ${watchlistResult.modifiedCount} watchlist items and ${alertsResult.modifiedCount} alerts for ${email}`
    );
  } catch (error) {
    console.error("Error migrating guest data:", error);
    // Don't throw error - migration failure shouldn't prevent signup
  }
}
