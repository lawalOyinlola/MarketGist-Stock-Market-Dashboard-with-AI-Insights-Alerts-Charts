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
      id: (alert._id as any).toString(),
      symbol: alert.symbol,
      company: alert.company,
      alertName: alert.alertName,
      alertType: alert.alertType,
      threshold: alert.threshold,
      frequency: alert.frequency,
      lastTriggeredAt: alert.lastTriggeredAt,
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
    // Input validation
    if (!symbol || typeof symbol !== "string") {
      return {
        success: false,
        error: "Symbol is required and must be a string",
      };
    }

    if (
      typeof threshold !== "number" ||
      !Number.isFinite(threshold) ||
      threshold <= 0
    ) {
      return { success: false, error: "Threshold must be a positive number" };
    }

    if (!alertType || !["upper", "lower"].includes(alertType)) {
      return { success: false, error: "Alert type must be 'upper' or 'lower'" };
    }

    if (
      frequency &&
      !["once", "daily", "hourly", "minute"].includes(frequency)
    ) {
      return {
        success: false,
        error: "Frequency must be 'once', 'daily', 'hourly', or 'minute'",
      };
    }

    // Normalize and sanitize inputs
    const normalizedSymbol = symbol.toUpperCase().trim();
    if (!normalizedSymbol) {
      return { success: false, error: "Symbol cannot be empty" };
    }

    const sanitizedCompany =
      company && typeof company === "string"
        ? company.trim().substring(0, 100)
        : "";

    const sanitizedAlertName =
      alertName && typeof alertName === "string"
        ? alertName.trim().substring(0, 100)
        : "";

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
    const existing = await Alert.findOne({
      userId,
      symbol: normalizedSymbol,
      alertType,
      threshold,
      isActive: true,
    });

    if (existing) {
      return { success: false, error: "Similar alert already exists" };
    }

    // Create alert with race condition handling
    try {
      const alert = await Alert.create({
        userId,
        symbol: normalizedSymbol,
        company: sanitizedCompany,
        alertName: sanitizedAlertName,
        alertType,
        threshold,
        frequency,
        isActive: true,
      });

      return { success: true, alertId: alert._id.toString() };
    } catch (createError: any) {
      // Handle MongoDB duplicate key errors (race conditions)
      if (createError.code === 11000) {
        return { success: false, error: "Similar alert already exists" };
      }
      throw createError;
    }
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
    alertType?: "upper" | "lower";
    threshold?: number;
    frequency?: "once" | "daily" | "hourly" | "minute";
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    // Input validation
    if (!alertId || typeof alertId !== "string") {
      return {
        success: false,
        error: "Alert ID is required and must be a string",
      };
    }

    if (!updates || typeof updates !== "object") {
      return { success: false, error: "Updates must be an object" };
    }

    // Whitelist and validate allowed fields
    const allowedFields: Record<string, any> = {};

    if (updates.alertName !== undefined) {
      if (typeof updates.alertName !== "string") {
        return { success: false, error: "Alert name must be a string" };
      }
      allowedFields.alertName = updates.alertName.trim().substring(0, 100);
    }

    if (updates.alertType !== undefined) {
      if (!["upper", "lower"].includes(updates.alertType)) {
        return {
          success: false,
          error: "Alert type must be 'upper' or 'lower'",
        };
      }
      allowedFields.alertType = updates.alertType;
    }

    if (updates.threshold !== undefined) {
      if (typeof updates.threshold !== "number" || updates.threshold <= 0) {
        return { success: false, error: "Threshold must be a positive number" };
      }
      allowedFields.threshold = updates.threshold;
    }

    if (updates.frequency !== undefined) {
      if (!["once", "daily", "hourly", "minute"].includes(updates.frequency)) {
        return {
          success: false,
          error: "Frequency must be 'once', 'daily', 'hourly', or 'minute'",
        };
      }
      allowedFields.frequency = updates.frequency;
    }

    // Check if any valid updates were provided
    if (Object.keys(allowedFields).length === 0) {
      return { success: false, error: "No valid updates provided" };
    }

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

    // Update alert with only whitelisted fields
    const result = await Alert.updateOne(
      { _id: alertId, userId, isActive: true },
      { $set: allowedFields }
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
