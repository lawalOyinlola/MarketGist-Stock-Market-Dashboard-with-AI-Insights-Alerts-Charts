"use server";

import { connectToDatabase } from "@/database/mongoose";
import { Alert } from "@/database/models/alert.model";

export async function getAlertsByEmail(email: string): Promise<AlertData[]> {
  if (!email) return [];

  try {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error("MongoDB connection not found");

    // Better Auth stores users in the "user" collection
    const user = await db
      .collection("user")
      .findOne<{ _id?: unknown; id?: string; email?: string }>({ email });

    if (!user) return [];

    const userId =
      (user.id as string) ??
      (user._id as { toHexString?: () => string })?.toHexString?.() ??
      (user._id as { toString?: () => string })?.toString?.() ??
      "";

    if (!userId) return [];

    const alerts = await Alert.find({ userId, isActive: true }).lean();
    return alerts.map((alert) => ({
      id: alert._id.toString(),
      symbol: alert.symbol,
      company: alert.company,
      alertName: alert.alertName,
      alertType: alert.alertType,
      threshold: alert.threshold,
      frequency: alert.frequency,
    }));
  } catch (err) {
    console.error("getAlertsByEmail error:", err);
    return [];
  }
}

export async function createAlert(
  symbol: string,
  company: string,
  alertName: string,
  alertType: "upper" | "lower",
  threshold: number,
  frequency: "once" | "daily" | "hourly" | "minute" = "daily"
): Promise<{ success: boolean; error?: string; alertId?: string }> {
  try {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error("MongoDB connection not found");

    // Get current user from auth
    const { getAuth } = await import("@/lib/better-auth/auth");
    const { headers } = await import("next/headers");
    const auth = await getAuth();
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return { success: false, error: "User not authenticated" };
    }

    const userId = session.user.id;

    // Check if similar alert already exists
    const normalized = symbol.toUpperCase().trim();
    const existing = await Alert.findOne({
      userId,
      symbol: normalized,
      alertType,
      threshold,
      isActive: true,
    });

    if (existing) {
      return { success: false, error: "Similar alert already exists" };
    }

    // Create alert
    const alert = await Alert.create({
      userId,
      symbol: normalized,
      company: company?.trim?.() || company,
      alertName: alertName?.trim?.() || alertName,
      alertType,
      threshold,
      frequency,
      isActive: true,
    });

    return { success: true, alertId: alert._id.toString() };
  } catch (error) {
    console.error("createAlert error:", error);
    return { success: false, error: "Failed to create alert" };
  }
}

export async function removeAlert(
  alertId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error("MongoDB connection not found");

    // Get current user from auth
    const { getAuth } = await import("@/lib/better-auth/auth");
    const { headers } = await import("next/headers");
    const auth = await getAuth();
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return { success: false, error: "User not authenticated" };
    }

    const userId = session.user.id;

    // Remove alert (soft delete by setting isActive to false)
    const result = await Alert.updateOne(
      { _id: alertId, userId },
      { isActive: false }
    );

    if (result.modifiedCount === 0) {
      return { success: false, error: "Alert not found" };
    }

    return { success: true };
  } catch (error) {
    console.error("removeAlert error:", error);
    return { success: false, error: "Failed to remove alert" };
  }
}

export async function updateAlert(
  alertId: string,
  updates: {
    alertName?: string;
    threshold?: number;
    frequency?: "once" | "daily" | "hourly" | "minute";
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error("MongoDB connection not found");

    // Get current user from auth
    const { getAuth } = await import("@/lib/better-auth/auth");
    const { headers } = await import("next/headers");
    const auth = await getAuth();
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return { success: false, error: "User not authenticated" };
    }

    const userId = session.user.id;

    // Update alert
    const result = await Alert.updateOne(
      { _id: alertId, userId, isActive: true },
      { $set: updates }
    );

    if (result.modifiedCount === 0) {
      return { success: false, error: "Alert not found" };
    }

    return { success: true };
  } catch (error) {
    console.error("updateAlert error:", error);
    return { success: false, error: "Failed to update alert" };
  }
}

