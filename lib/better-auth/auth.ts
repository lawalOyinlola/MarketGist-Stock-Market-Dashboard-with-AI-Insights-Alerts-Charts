import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { connectToDatabase } from "@/database/mongoose";
import { nextCookies } from "better-auth/next-js";

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
      enabled: true,
      disableSignUp: false,
      requireEmailVerification: false,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      autoSignIn: true,
    },
    plugins: [nextCookies()],
  });

  return authInstance;
};

export const auth = await getAuth();
