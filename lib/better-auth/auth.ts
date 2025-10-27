import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { connectToDatabase } from "@/database/mongoose";
import { nextCookies } from "better-auth/next-js";
import { transporter } from "@/lib/nodemailer";
import { PASSWORD_RESET_EMAIL_TEMPLATE } from "@/lib/nodemailer/templates";

let authInstance: ReturnType<typeof betterAuth> | null = null;

export const getAuth = async () => {
  if (authInstance) return authInstance;

  const mongoose = await connectToDatabase();
  const db = mongoose.connection.db;

  if (!db) throw new Error("MongoDB connection not found");

  const secret = process.env.BETTER_AUTH_SECRET;
  const baseURL = process.env.BETTER_AUTH_URL;

  if (!secret || !baseURL) {
    throw new Error("BETTER_AUTH_SECRET and BETTER_AUTH_URL must be set");
  }

  authInstance = betterAuth({
    database: mongodbAdapter(db as Parameters<typeof mongodbAdapter>[0]),
    secret,
    baseURL,
    emailAndPassword: {
      resetPasswordTokenExpiresIn: 3600, // 1 hour in seconds
      enabled: true,
      disableSignUp: false,
      requireEmailVerification: false,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      autoSignIn: true,
      sendResetPassword: async ({ user, url, token }, request) => {
        try {
          // Construct the direct reset password URL with token as query parameter
          const baseURL =
            process.env.BETTER_AUTH_URL || "http://localhost:3000";
          const resetUrl = `${baseURL}/reset-password?token=${token}`;

          // Use the professional email template
          const htmlTemplate = PASSWORD_RESET_EMAIL_TEMPLATE.replace(
            /\{\{resetUrl\}\}/g,
            resetUrl
          );

          await transporter.sendMail({
            from: `"Marketgist" <${process.env.NODEMAILER_EMAIL}>`,
            to: user.email,
            subject: "Reset Your Password - Marketgist",
            html: htmlTemplate,
            text: `Reset your password by clicking this link: ${resetUrl}`,
          });
        } catch (error) {
          console.error("Failed to send password reset email:", error);
          throw error;
        }
      },
    },
    plugins: [nextCookies()],
  });

  return authInstance;
};

export const auth = await getAuth();
