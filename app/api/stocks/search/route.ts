import { NextRequest, NextResponse } from "next/server";
import { searchStocks } from "@/lib/actions/finnhub.actions";
import { getWatchlistSymbolsByEmail } from "@/lib/actions/watchlist.actions";
import { getAuth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    // Get search query from URL params
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || undefined;

    // Fetch stock data (user-agnostic, cached)
    const stocks = await searchStocks(query);

    // Try to get user session for watchlist status (optional)
    let watchlistSymbols: string[] = [];
    try {
      const auth = await getAuth();
      const session = await auth.api.getSession({ headers: await headers() });

      if (session?.user?.email) {
        // Get user's watchlist symbols
        watchlistSymbols = await getWatchlistSymbolsByEmail(session.user.email);
      }
    } catch (authError) {
      // If authentication fails, continue without watchlist status
      console.log(
        "Authentication failed for search, continuing without watchlist status"
      );
    }

    // Combine stock data with user's watchlist status (if available)
    const stocksWithWatchlistStatus = stocks.map((stock) => ({
      ...stock,
      isInWatchlist: watchlistSymbols.includes(stock.symbol),
    }));

    return NextResponse.json(stocksWithWatchlistStatus);
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stocks" },
      { status: 500 }
    );
  }
}
