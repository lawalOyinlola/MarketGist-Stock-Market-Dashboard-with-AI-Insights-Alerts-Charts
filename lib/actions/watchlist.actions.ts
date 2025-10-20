"use server";

import { connectToDatabase } from "@/database/mongoose";
import { Watchlist } from "@/database/models/watchlist.model";

export async function getWatchlistSymbolsByEmail(
  email: string
): Promise<string[]> {
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

    const items = await Watchlist.find({ userId }, { symbol: 1 }).lean();
    return items.map((i) => String(i.symbol));
  } catch (err) {
    console.error("getWatchlistSymbolsByEmail error:", err);
    return [];
  }
}



export async function addToWatchlist(
  symbol: string,
  company: string
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

    // Check if already in watchlist
    const normalized = symbol.toUpperCase().trim();
    const existing = await Watchlist.findOne({ userId, symbol: normalized });

    if (existing) {
      return { success: false, error: "Stock already in watchlist" };
    }

    // Add to watchlist
    try {
      await Watchlist.create({
        userId,
        symbol: symbol.toUpperCase(),
        company: company?.trim?.() || company,
        addedAt: new Date(),
      });
    } catch (e: any) {
      if (e?.code === 11000) {
        return { success: false, error: "Stock already in watchlist" };
      }
      throw e;
    }

    return { success: true };
  } catch (error) {
    console.error("addToWatchlist error:", error);
    return { success: false, error: "Failed to add to watchlist" };
  }
}

export async function removeFromWatchlist(
  symbol: string
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

    // Remove from watchlist
    const result = await Watchlist.deleteOne({
      userId,
      symbol: symbol.toUpperCase(),
    });

    if (result.deletedCount === 0) {
      return { success: false, error: "Stock not found in watchlist" };
    }

    return { success: true };
  } catch (error) {
    console.error("removeFromWatchlist error:", error);
    return { success: false, error: "Failed to remove from watchlist" };
  }
}
